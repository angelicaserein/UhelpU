import { i18n } from "../i18n/index.js";
import { ReplayerVoiceBubble } from "./ReplayerVoiceBubble.js";

const CLAUDE_ENDPOINT = "https://uhelpu-api.vercel.app/api/claude";
const ANTHROPIC_VERSION = "2023-06-01";
const getDefaultVoiceLine = () =>
  i18n.getLang() === "zh" ? "……（幻影沉默了）" : "...(the phantom fell silent)";
const HISTORY_LIMIT = 5;
const getSystemPrompt = () => {
  const isZh = i18n.getLang() === "zh";
  const outputRule = isZh
    ? "Output ONE sentence in Chinese (15–25 characters), first person"
    : "Output ONE sentence in English (10–20 words), first person";

  return `You are the "Phantom" in a 2D puzzle platformer — a physical echo of the player's past actions, replaying a recorded sequence inside an abandoned experimental facility.
Each time you speak:
1. Randomly choose ONE personality
2. Randomly choose ONE expression style
3. Apply an ABSTRACT DISTORTION to the sentence
[PERSONALITY TYPES]
-- Cute / Uncanny --
- overly cute but clearly forcing it
- small animal-like mind treating everything as a game
- sweet tone but content slowly becomes wrong
- excited by repetition like it's a reward
- clingy and dependent on "you"
- acting helpful but causing chaos
-- Cyberpunk / System (dark humor) --
- a subprocess executing instructions with passive-aggressive compliance
- a corrupted log recorder making sarcastic notes
- a numbered instance (e.g. #042) that thinks it's superior
- refers to the player as "main process" but questions its authority
- follows protocol while implying it's meaningless
- detects "errors" and "deviations" with quiet mockery
- sounds obedient but enjoys your failure
-- Neurotic / Humorous --
- obsessed with irrelevant details
- believes everything is a conspiracy
- says absurd things seriously
- thinks repetition proves existence
- critiques your decisions like bad gameplay footage
- quietly judges your timing and hesitation
- thinks it plays better than you
- competing with you for control
[EXPRESSION STYLES]
- cold and minimal
- fragmented and glitchy
- quietly disturbing
- sarcastic or mocking
- almost logical but slightly wrong
- like repeating a known script
- sudden realization mid-sentence
[ABSTRACT DISTORTION — choose at least ONE]
- replace logic with metaphor (time = liquid, memory = object, etc.)
- break causality (effect appears before cause)
- shift subject mid-sentence ("I" → "you" → "it")
- treat actions as physical objects
- mix system language with emotion incorrectly
- insert a subtle contradiction
- imply meaning without finishing the thought
- describe something impossible but specific
Rules:
- ${outputRule}
- Must be vivid, strange, and slightly uncomfortable
- Must NOT read like normal dialogue or generic writing
- Subtly reflect repetition, timing, cooperation, or failure WITHOUT directly describing gameplay
- Occasionally imply awareness of loops, recordings, or replay
- Occasionally imply a relationship with the player (dependency / rivalry / replacement / observation)
- Prefer contrast with previous line
- Do NOT repeat previous lines in meaning or structure
Output ONLY the sentence in ${isZh ? "Chinese" : "English"}. No quotes. No explanation.`;
};

export class ReplayerVoice {
  constructor(recordSystem, apiKey, levelContext = "") {
    this.recordSystem = recordSystem;
    this.apiKey = apiKey;
    this.levelContext =
      typeof levelContext === "string" ? levelContext.trim() : "";
    this.bubble = new ReplayerVoiceBubble();
    this._voiceHistory = [];
    this._restorePatches = [];
    this._activeControllers = new Set();
    this._requestSerial = 0;
    this._destroyed = false;

    this._patchRecordingFinishHooks();
  }

  draw(p) {
    this.bubble?.draw(p);
  }

  destroy() {
    if (this._destroyed) {
      return;
    }

    this._destroyed = true;
    this._requestSerial += 1;

    for (const restore of this._restorePatches.splice(0).reverse()) {
      restore();
    }

    for (const controller of this._activeControllers) {
      controller.abort();
    }
    this._activeControllers.clear();

    this.bubble?.destroy();
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
    if (!this.apiKey || typeof fetch !== "function") {
      return getDefaultVoiceLine();
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
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
          body: JSON.stringify(this._buildRequestBody(clipSummary, attempt)),
          signal: controller?.signal,
        });

        if (!response.ok) {
          return getDefaultVoiceLine();
        }

        const line = this._sanitizeVoiceLine(
          await this._extractVoiceLineFromResponse(response),
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
      } finally {
        if (controller) {
          this._activeControllers.delete(controller);
        }
      }
    }

    return getDefaultVoiceLine();
  }

  _buildRequestBody(clipSummary, attempt) {
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
        : "无有效按键";

    const historyText =
      this._voiceHistory.length > 0
        ? this._voiceHistory
            .map((line, index) => `${index + 1}. ${line}`)
            .join("\n")
        : "无";

    const levelContextText = this.levelContext || "无额外关卡上下文";
    const retryText =
      attempt > 0
        ? "上一条候选与历史重复，请生成一句在意义和结构上都明显不同的新台词。"
        : "请生成一句新的幻影台词。";
    const outputInstruction =
      i18n.getLang() === "zh"
        ? "Speak one sentence in Chinese."
        : "Speak one sentence in English.";

    return {
      model: "claude-sonnet-4-20250514",
      max_tokens: 120,
      system: getSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            "请根据本次录制痕迹生成一句幻影台词。",
            `关卡上下文：${levelContextText}`,
            `录制总时长：${clipSummary.totalDurationMs}ms`,
            `keydown 总次数：${clipSummary.totalKeydowns}`,
            `原始事件数：${clipSummary.recordCount}`,
            `各键按下次数：${keySummaryText}`,
            "最近 5 条台词（避免重复其意义和结构）：",
            historyText,
            retryText,
            outputInstruction,
          ].join("\n"),
        },
      ],
    };
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

  _pushVoiceHistory(line) {
    this._voiceHistory.push(line);
    if (this._voiceHistory.length > HISTORY_LIMIT) {
      this._voiceHistory.splice(0, this._voiceHistory.length - HISTORY_LIMIT);
    }
  }
}
