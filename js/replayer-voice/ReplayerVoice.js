import { i18n, t } from "../i18n/index.js";
import { ReplayerVoiceBubble } from "./ReplayerVoiceBubble.js";

const CLAUDE_ENDPOINT = "https://uhelpu-api.vercel.app/api/claude";
const ANTHROPIC_VERSION = "2023-06-01";
const CHAT_STYLE_ID = "replayer-voice-chat-style";
const getDefaultVoiceLine = () => t("ai_voice_default_line");
const getDefaultChatReply = () => t("ai_voice_default_reply");
const HISTORY_LIMIT = 5;
const CHAT_HISTORY_LIMIT = 24;

export class ReplayerVoice {
  constructor(recordSystem, apiKey, levelContext = "") {
    this.recordSystem = recordSystem;
    this.apiKey = apiKey;
    this.levelContext =
      typeof levelContext === "string" ? levelContext.trim() : "";
    this.bubble = new ReplayerVoiceBubble({
      labelText: t("ai_voice_label"),
      onOpenChat: () => this.openChat(),
    });
    this._voiceHistory = [];
    this._chatHistory = [];
    this._restorePatches = [];
    this._activeControllers = new Set();
    this._requestSerial = 0;
    this._chatRequestSerial = 0;
    this._destroyed = false;
    this._p = null;
    this._systemPrompt = "";
    this._canvasElement = null;
    this._chatOverlay = null;
    this._chatElements = null;
    this._isChatSending = false;
    this._boundCanvasPointerDown = (event) => {
      this._handleCanvasPointerDown(event);
    };
    this._handleLanguageChange = () => {
      this.bubble?.setLabelText(t("ai_voice_label"));
      this._loadSystemPrompt();
      this._renderChatHistory();
    };

    this._loadSystemPrompt();
    i18n.onChange(this._handleLanguageChange);
    this._patchRecordingFinishHooks();
  }

  draw(p) {
    this._p = p || null;
    if (p?.canvas) {
      this._bindCanvas(p.canvas);
    }

    const isHovered = this.bubble?.updateInteraction(p);
    if (p?.canvas) {
      p.canvas.style.cursor = isHovered ? "pointer" : "";
    }

    this.bubble?.draw(p);
  }

  openChat() {
    if (this._destroyed || typeof document === "undefined") {
      return;
    }

    this._ensureChatWindow();
    this.bubble?.setHovered(false);

    if (this._chatOverlay) {
      this._chatOverlay.style.display = "flex";
    }

    this._renderChatHistory();
    this._syncSendButtonState();

    if (this._chatElements?.input) {
      this._chatElements.input.focus();
    }
  }

  destroy() {
    if (this._destroyed) {
      return;
    }

    this._destroyed = true;
    this._requestSerial += 1;
    i18n.offChange(this._handleLanguageChange);

    for (const restore of this._restorePatches.splice(0).reverse()) {
      restore();
    }

    for (const controller of this._activeControllers) {
      controller.abort();
    }
    this._activeControllers.clear();

    this._unbindCanvas();
    this._removeChatWindow();
    this._p = null;

    this.bubble?.destroy();
  }

  async _loadSystemPrompt() {
    const lang = i18n.getLang();
    const file =
      lang === "zh"
        ? "assets/text/phantom_prompt_zh.txt"
        : "assets/text/phantom_prompt_en.txt";
    this._systemPrompt = "";

    try {
      const res = await fetch(file);
      if (res.ok) {
        this._systemPrompt = await res.text();
      }
    } catch {
      // Silently fail, use empty string | 静默失败，使用空字符串
    }
  }

  _patchRecordingFinishHooks() {
    const recordingActions = this.recordSystem?.actions?.Recording;
    if (!recordingActions) {
      return;
    }

    this._patchRecordingAction(recordingActions, "record");
    this._patchRecordingAction(recordingActions, "RecordTimeout");
  }

  _patchRecordingAction(recordingActions, actionKey) {
    const originalAction = recordingActions[actionKey];
    if (typeof originalAction !== "function") {
      return;
    }

    const voice = this;
    function patchedRecordingAction(...args) {
      const result = originalAction.call(this, ...args);
      voice._handleRecordingFinished(this).catch(() => {});
      return result;
    }

    recordingActions[actionKey] = patchedRecordingAction;
    this._restorePatches.push(() => {
      if (recordingActions[actionKey] === patchedRecordingAction) {
        recordingActions[actionKey] = originalAction;
      }
    });
  }

  async _handleRecordingFinished(recordSystem) {
    if (this._destroyed) {
      return;
    }

    const clipSummary = this._analyzeClip(recordSystem);
    const requestSerial = ++this._requestSerial;
    const line = await this._requestVoiceLine(clipSummary);

    if (this._destroyed || requestSerial !== this._requestSerial) {
      return;
    }

    this.bubble?.showBubble(line);
  }

  _analyzeClip(recordSystem) {
    const clip = recordSystem?.clip;
    const records =
      typeof clip?.getRecords === "function"
        ? clip.getRecords()
        : Array.isArray(clip?.records)
          ? clip.records
          : [];

    let totalDurationMs = 0;
    const keydownCounts = {};

    for (const record of records) {
      const eventTime = Number(record?.time);
      if (Number.isFinite(eventTime)) {
        totalDurationMs = Math.max(totalDurationMs, eventTime);
      }

      if (record?.keyType !== "keydown" || !record?.code) {
        continue;
      }

      keydownCounts[record.code] = (keydownCounts[record.code] || 0) + 1;
    }

    const timedDuration =
      Number.isFinite(recordSystem?.recordStartTime) &&
      Number.isFinite(recordSystem?.recordEndTime) &&
      recordSystem.recordStartTime >= 0 &&
      recordSystem.recordEndTime >= recordSystem.recordStartTime
        ? Math.round(recordSystem.recordEndTime - recordSystem.recordStartTime)
        : null;

    const totalKeydowns = Object.values(keydownCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      totalDurationMs: Math.max(
        0,
        timedDuration ?? Math.round(totalDurationMs),
      ),
      totalKeydowns,
      keydownCounts,
      recordCount: records.length,
    };
  }

  async _requestVoiceLine(clipSummary) {
    if (!this._canRequestClaude()) {
      return getDefaultVoiceLine();
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const line = this._sanitizeVoiceLine(
          await this._requestClaudeText(
            this._buildVoiceRequestBody(clipSummary, attempt),
          ),
        );

        if (!line) {
          continue;
        }

        if (this._voiceHistory.includes(line)) {
          continue;
        }

        this._pushVoiceHistory(line);
        return line;
      } catch {
        return getDefaultVoiceLine();
      }
    }

    return getDefaultVoiceLine();
  }

  async _sendChatMessage() {
    if (this._destroyed || this._isChatSending || !this._chatElements?.input) {
      return;
    }

    const content = this._chatElements.input.value.trim();
    if (!content) {
      return;
    }

    this._chatElements.input.value = "";
    this._chatHistory.push({ role: "user", content });

    const pendingMessage = {
      role: "assistant",
      content: "",
      pending: true,
      requestSerial: ++this._chatRequestSerial,
    };
    this._chatHistory.push(pendingMessage);
    this._trimChatHistory();

    this._isChatSending = true;
    this._renderChatHistory();
    this._syncSendButtonState();

    let reply = getDefaultChatReply();

    try {
      const responseText = await this._requestClaudeText(
        this._buildChatRequestBody(),
      );
      const sanitized = this._sanitizeChatReply(responseText);
      if (sanitized) {
        reply = sanitized;
      }
    } catch {
      reply = getDefaultChatReply();
    }

    if (this._destroyed) {
      return;
    }

    const pendingIndex = this._chatHistory.findIndex(
      (entry) =>
        entry.pending && entry.requestSerial === pendingMessage.requestSerial,
    );

    if (pendingIndex >= 0) {
      this._chatHistory.splice(pendingIndex, 1, {
        role: "assistant",
        content: reply,
      });
    } else {
      this._chatHistory.push({ role: "assistant", content: reply });
    }

    this._trimChatHistory();
    this._isChatSending = false;
    this._renderChatHistory();
    this._syncSendButtonState();

    if (this._chatElements?.input) {
      this._chatElements.input.focus();
    }
  }

  _buildVoiceRequestBody(clipSummary, attempt) {
    const keySummaryEntries = Object.entries(clipSummary.keydownCounts).sort(
      ([leftKey, leftCount], [rightKey, rightCount]) => {
        if (rightCount !== leftCount) {
          return rightCount - leftCount;
        }
        return leftKey.localeCompare(rightKey);
      },
    );

    const keySummaryText =
      keySummaryEntries.length > 0
        ? keySummaryEntries
            .map(([code, count]) => `${code}:${count}`)
            .join(", ")
        : t("ai_voice_prompt_none_key_summary");

    const historyText =
      this._voiceHistory.length > 0
        ? this._voiceHistory
            .map((line, index) => `${index + 1}. ${line}`)
            .join("\n")
        : t("ai_voice_prompt_none_history");

    const levelContextText =
      this.levelContext || t("ai_voice_prompt_none_level_context");
    const retryText =
      attempt > 0 ? t("ai_voice_prompt_retry") : t("ai_voice_prompt_initial");
    const outputInstruction = t("ai_voice_prompt_output_instruction");

    return {
      model: "claude-sonnet-4-20250514",
      max_tokens: 120,
      system: this._systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            t("ai_voice_prompt_intro"),
            `${t("ai_voice_prompt_level_context")}：${levelContextText}`,
            `${t("ai_voice_prompt_total_duration")}：${clipSummary.totalDurationMs}ms`,
            `${t("ai_voice_prompt_total_keydowns")}：${clipSummary.totalKeydowns}`,
            `${t("ai_voice_prompt_record_count")}：${clipSummary.recordCount}`,
            `${t("ai_voice_prompt_key_summary")}：${keySummaryText}`,
            `${t("ai_voice_prompt_history")}：`,
            historyText,
            retryText,
            outputInstruction,
          ].join("\n"),
        },
      ],
    };
  }

  _buildChatRequestBody() {
    return {
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: this._buildChatSystemPrompt(),
      messages: this._chatHistory
        .filter((entry) => !entry.pending && typeof entry.content === "string")
        .slice(-CHAT_HISTORY_LIMIT)
        .map((entry) => ({
          role: entry.role === "assistant" ? "assistant" : "user",
          content: entry.content,
        }))
        .filter((entry) => entry.content.trim().length > 0),
    };
  }

  _buildChatSystemPrompt() {
    const promptParts = [];
    if (this._systemPrompt) {
      promptParts.push(this._systemPrompt.trim());
    }
    if (this.levelContext) {
      promptParts.push(
        `${t("ai_voice_prompt_level_context")}：${this.levelContext}`,
      );
    }
    return promptParts.join("\n\n");
  }

  async _requestClaudeText(requestBody) {
    if (!this._canRequestClaude()) {
      return "";
    }

    const controller =
      typeof AbortController === "function" ? new AbortController() : null;
    if (controller) {
      this._activeControllers.add(controller);
    }

    try {
      const response = await fetch(CLAUDE_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(requestBody),
        signal: controller?.signal,
      });

      if (!response.ok) {
        return "";
      }

      return await this._extractVoiceLineFromResponse(response);
    } finally {
      if (controller) {
        this._activeControllers.delete(controller);
      }
    }
  }

  async _extractVoiceLineFromResponse(response) {
    const rawText = await response.text();
    if (!rawText) {
      return "";
    }

    try {
      const payload = JSON.parse(rawText);
      return this._extractTextFromPayload(payload);
    } catch {
      return rawText;
    }
  }

  _extractTextFromPayload(payload) {
    if (typeof payload === "string") {
      return payload;
    }

    if (Array.isArray(payload?.content)) {
      return payload.content
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }
          if (typeof item?.text === "string") {
            return item.text;
          }
          return "";
        })
        .join(" ");
    }

    if (typeof payload?.text === "string") {
      return payload.text;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }

    if (typeof payload?.reply === "string") {
      return payload.reply;
    }

    if (typeof payload?.completion === "string") {
      return payload.completion;
    }

    if (typeof payload?.output === "string") {
      return payload.output;
    }

    if (typeof payload?.result === "string") {
      return payload.result;
    }

    if (payload?.data) {
      return this._extractTextFromPayload(payload.data);
    }

    return "";
  }

  _sanitizeVoiceLine(text) {
    if (typeof text !== "string") {
      return "";
    }

    let line = text.trim();
    if (!line) {
      return "";
    }

    const firstLine = line.split(/\r?\n/).find((item) => item.trim());
    line = (firstLine || line).trim();
    line = line.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
    line = line.replace(/^输出[:：]\s*/, "").trim();

    return line;
  }

  _sanitizeChatReply(text) {
    if (typeof text !== "string") {
      return "";
    }

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return "";
    }

    return lines
      .join("\n")
      .replace(/^输出[:：]\s*/g, "")
      .trim();
  }

  _pushVoiceHistory(line) {
    this._voiceHistory.push(line);
    if (this._voiceHistory.length > HISTORY_LIMIT) {
      this._voiceHistory.splice(0, this._voiceHistory.length - HISTORY_LIMIT);
    }
  }

  _trimChatHistory() {
    if (this._chatHistory.length > CHAT_HISTORY_LIMIT) {
      this._chatHistory.splice(
        0,
        this._chatHistory.length - CHAT_HISTORY_LIMIT,
      );
    }
  }

  _canRequestClaude() {
    return Boolean(this.apiKey) && typeof fetch === "function";
  }

  _bindCanvas(canvas) {
    if (!canvas || this._canvasElement === canvas) {
      return;
    }

    this._unbindCanvas();
    this._canvasElement = canvas;
    this._canvasElement.addEventListener(
      "pointerdown",
      this._boundCanvasPointerDown,
      true,
    );
  }

  _unbindCanvas() {
    if (!this._canvasElement) {
      return;
    }

    this._canvasElement.removeEventListener(
      "pointerdown",
      this._boundCanvasPointerDown,
      true,
    );
    this._canvasElement.style.cursor = "";
    this._canvasElement = null;
  }

  _handleCanvasPointerDown(event) {
    if (this._chatOverlay?.style.display === "flex") {
      return;
    }

    const mouseX = this._p?.mouseX;
    const mouseY = this._p?.mouseY;
    if (
      !Number.isFinite(mouseX) ||
      !Number.isFinite(mouseY) ||
      !this.bubble?.handleClick(mouseX, mouseY)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  _ensureChatWindow() {
    this._ensureChatStyles();
    if (this._chatOverlay) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "rv-chat-overlay";
    overlay.style.display = "none";

    const windowEl = document.createElement("section");
    windowEl.className = "rv-chat-window";

    const header = document.createElement("header");
    header.className = "rv-chat-header";

    const title = document.createElement("div");
    title.className = "rv-chat-title";
    title.textContent = t("ai_voice_label");

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.className = "rv-chat-export";
    exportButton.textContent = t("ai_voice_export");
    exportButton.addEventListener("click", () => this._exportChatHistory());

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "rv-chat-close";
    closeButton.textContent = "X";
    closeButton.addEventListener("click", () => this._closeChat());

    const headerActions = document.createElement("div");
    headerActions.className = "rv-chat-header-actions";
    headerActions.append(exportButton, closeButton);

    header.append(title, headerActions);

    const history = document.createElement("div");
    history.className = "rv-chat-history";

    const composer = document.createElement("div");
    composer.className = "rv-chat-composer";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "rv-chat-input";
    input.placeholder = t("ai_voice_input_placeholder");
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      event.preventDefault();
      this._sendChatMessage();
    });

    const sendButton = document.createElement("button");
    sendButton.type = "button";
    sendButton.className = "rv-chat-send";
    sendButton.textContent = t("ai_voice_send");
    sendButton.addEventListener("click", () => this._sendChatMessage());

    composer.append(input, sendButton);
    windowEl.append(header, history, composer);
    overlay.appendChild(windowEl);
    document.body.appendChild(overlay);

    this._chatOverlay = overlay;
    this._chatElements = {
      title,
      history,
      input,
      sendButton,
      exportButton,
      closeButton,
    };
  }

  _ensureChatStyles() {
    if (
      typeof document === "undefined" ||
      document.getElementById(CHAT_STYLE_ID)
    ) {
      return;
    }

    const style = document.createElement("style");
    style.id = CHAT_STYLE_ID;
    style.textContent = `
      .rv-chat-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 90;
      }

      .rv-chat-window {
        width: min(500px, calc(100vw - 32px));
        height: min(400px, calc(100vh - 32px));
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        background:
          linear-gradient(180deg, rgba(16, 22, 64, 0.96) 0%, rgba(18, 10, 44, 0.97) 100%);
        border: 3px solid #74f3ff;
        box-shadow:
          0 0 0 2px rgba(125, 231, 255, 0.18) inset,
          0 18px 48px rgba(0, 0, 0, 0.45);
        color: #e8f7ff;
        font-family: "HYPixel11", "PixelFont", "Courier New", monospace;
        image-rendering: pixelated;
      }

      .rv-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 18px 10px;
        border-bottom: 2px solid rgba(116, 243, 255, 0.5);
        background: linear-gradient(180deg, rgba(26, 18, 72, 0.92) 0%, rgba(14, 18, 52, 0.85) 100%);
      }

      .rv-chat-title {
        font-size: 24px;
        line-height: 1;
        letter-spacing: 2px;
        color: #e6fbff;
        text-shadow: 0 0 10px rgba(116, 243, 255, 0.28);
      }

      .rv-chat-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .rv-chat-export,
      .rv-chat-close,
      .rv-chat-send {
        border: 2px solid #74f3ff;
        background: #20154c;
        color: #d3fbff;
        font: inherit;
        cursor: pointer;
        transition: background 120ms ease, transform 120ms ease;
      }

      .rv-chat-export {
        min-width: 68px;
        height: 34px;
        padding: 0 10px;
        font-size: 14px;
        line-height: 1;
      }

      .rv-chat-close {
        width: 34px;
        height: 34px;
        padding: 0;
        font-size: 18px;
        line-height: 1;
      }

      .rv-chat-send {
        min-width: 88px;
        padding: 0 16px;
        height: 42px;
      }

      .rv-chat-export:hover,
      .rv-chat-close:hover,
      .rv-chat-send:hover {
        background: #2d1f67;
        transform: translateY(-1px);
      }

      .rv-chat-export:disabled,
      .rv-chat-close:disabled,
      .rv-chat-send:disabled {
        opacity: 0.55;
        cursor: default;
        transform: none;
      }

      .rv-chat-history {
        flex: 1;
        overflow-y: auto;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background:
          linear-gradient(180deg, rgba(12, 16, 44, 0.78) 0%, rgba(9, 10, 27, 0.9) 100%);
      }

      .rv-chat-history::-webkit-scrollbar {
        width: 10px;
      }

      .rv-chat-history::-webkit-scrollbar-thumb {
        background: rgba(116, 243, 255, 0.35);
      }

      .rv-chat-message {
        max-width: 78%;
        padding: 10px 12px;
        border: 2px solid rgba(116, 243, 255, 0.22);
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.5;
      }

      .rv-chat-message--user {
        align-self: flex-end;
        background: rgba(236, 243, 255, 0.9);
        color: #1b1a3b;
        border-color: rgba(232, 247, 255, 0.45);
      }

      .rv-chat-message--assistant {
        align-self: flex-start;
        background: rgba(22, 36, 66, 0.95);
        color: #74f3ff;
      }

      .rv-chat-message--pending {
        opacity: 0.82;
      }

      .rv-chat-empty {
        margin: auto;
        color: rgba(211, 251, 255, 0.72);
        text-align: center;
        line-height: 1.8;
      }

      .rv-chat-composer {
        display: flex;
        gap: 10px;
        padding: 14px 18px 18px;
        border-top: 2px solid rgba(116, 243, 255, 0.35);
        background: rgba(14, 12, 38, 0.96);
      }

      .rv-chat-input {
        flex: 1;
        min-width: 0;
        height: 42px;
        border: 2px solid rgba(116, 243, 255, 0.48);
        background: rgba(7, 11, 32, 0.96);
        color: #eefbff;
        padding: 0 12px;
        font: inherit;
        outline: none;
      }

      .rv-chat-input::placeholder {
        color: rgba(211, 251, 255, 0.45);
      }

      .rv-chat-input:focus {
        border-color: #74f3ff;
        box-shadow: 0 0 0 2px rgba(116, 243, 255, 0.15);
      }
    `;
    document.head.appendChild(style);
  }

  _renderChatHistory() {
    if (!this._chatElements?.history) {
      return;
    }

    const { history, input, sendButton, exportButton, title } =
      this._chatElements;
    history.textContent = "";

    if (title) {
      title.textContent = t("ai_voice_label");
    }
    if (input) {
      input.placeholder = t("ai_voice_input_placeholder");
    }
    if (sendButton) {
      sendButton.textContent = t("ai_voice_send");
    }
    if (exportButton) {
      exportButton.textContent = t("ai_voice_export");
    }

    if (this._chatHistory.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "rv-chat-empty";
      emptyState.textContent = t("ai_voice_empty_state");
      history.appendChild(emptyState);
      history.scrollTop = history.scrollHeight;
      return;
    }

    for (const entry of this._chatHistory) {
      const item = document.createElement("div");
      const roleClass =
        entry.role === "assistant"
          ? "rv-chat-message--assistant"
          : "rv-chat-message--user";
      item.className = `rv-chat-message ${roleClass}${entry.pending ? " rv-chat-message--pending" : ""}`;
      item.textContent = entry.pending ? t("ai_voice_pending") : entry.content;
      history.appendChild(item);
    }

    history.scrollTop = history.scrollHeight;
  }

  _syncSendButtonState() {
    if (!this._chatElements?.input || !this._chatElements?.sendButton) {
      return;
    }

    this._chatElements.input.disabled = this._isChatSending;
    this._chatElements.sendButton.disabled = this._isChatSending;
  }

  _exportChatHistory() {
    const chatHistory = Array.isArray(this._chatHistory)
      ? this._chatHistory
      : [];
    const lines = chatHistory
      .map(
        (msg) =>
          `${msg.role === "user" ? t("ai_voice_export_role_user") : t("ai_voice_export_role_assistant")}：${msg.pending ? t("ai_voice_pending") : msg.content}`,
      )
      .join("\n\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t("ai_voice_export_filename_prefix")}_${new Date().toLocaleDateString(i18n.getLang() === "zh" ? "zh-CN" : "en-CA")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _closeChat() {
    if (this._chatOverlay) {
      this._chatOverlay.style.display = "none";
    }

    this.bubble?.setHovered(false);
    if (this._canvasElement) {
      this._canvasElement.style.cursor = "";
    }
  }

  _removeChatWindow() {
    if (this._chatOverlay?.parentNode) {
      this._chatOverlay.parentNode.removeChild(this._chatOverlay);
    }

    this._chatOverlay = null;
    this._chatElements = null;
  }
}
