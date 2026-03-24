// WindowSetting.js — 设置悬浮窗
// 包含：BGM 音量、SFX 音量、语言切换、按键设置
import { WindowBase } from "./WindowBase.js";
import { i18n, t } from "../../i18n.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";

export class WindowSetting extends WindowBase {
  /**
   * @param {p5}    p - p5 实例
   * @param {number} x - 初始横坐标（默认居中）
   * @param {number} y - 初始纵坐标（默认居中）
   */
  constructor(p, x, y) {
    const w = 320;
    const defaultX = x ?? Math.round((p.width - w) / 2);
    const defaultY = y ?? Math.round(p.height * 0.15);
    super(p, t("win_title"), defaultX, defaultY, w);
    this.container.addClass("window-setting-top");

    console.log(
      "[WindowSetting] Constructor called, contentArea:",
      this.contentArea,
    );

    // KeyBindingManager 单例（安全初始化）
    try {
      this._keyBindingManager = KeyBindingManager.getInstance();
      console.log(
        "[WindowSetting] KeyBindingManager loaded:",
        this._keyBindingManager.getConfig(),
      );
    } catch (err) {
      console.error(
        "[WindowSetting] Failed to initialize KeyBindingManager:",
        err,
      );
      this._keyBindingManager = null;
    }

    // 按键绑定UI元素（供刷新文字时使用）
    this._keyBindLabels = {}; // { "jump": labelEl, "moveLeft": labelEl, ... }
    this._keyBindButtons = {}; // { "jump": buttonEl, "moveLeft": buttonEl, ... }
    this._keyBindResets = {}; // { "jump": resetBtnEl, ... }

    // 当前正在等待的按键输入（null 表示不在监听）
    this._listeningFor = null;

    console.log("[WindowSetting] About to call _buildContent()");
    try {
      this._buildContent();
      console.log("[WindowSetting] _buildContent() completed successfully");
    } catch (err) {
      console.error("[WindowSetting] _buildContent() failed:", err);
    }

    // 语言切换时刷新窗口内所有可见文字
    this._i18nHandler = () => this._refreshLabels();
    i18n.onChange(this._i18nHandler);

    // 按键绑定变更时刷新UI（仅当 KeyBindingManager 可用时）
    if (this._keyBindingManager) {
      this._keyBindHandler = (intent, newKeyCode) =>
        this._onKeyBindChange(intent, newKeyCode);
      this._keyBindingManager.onChange(this._keyBindHandler);
    }
  }

  open() {
    super.open();
    this.container.style("z-index", "2147483647");
  }

  // ─── 内容构建 ──────────────────────────────────────────────────────────────

  _buildContent() {
    const p = this.p;
    const area = this.contentArea;

    console.log("[WindowSetting._buildContent] Starting, contentArea:", area);

    try {
      // ── 音量区域 ────────────────────────────────────────────────────────────

      this._soundHeader = p.createDiv(t("win_sound"));
      this._soundHeader.addClass("window-section-title");
      this._soundHeader.parent(area);
      console.log("[WindowSetting._buildContent] Added sound header");

      // BGM 音量
      const bgmRow = this._createSliderRow(
        area,
        t("win_bgm"),
        0,
        100,
        70,
        (val) => {
          if (this.onBGMChange) this.onBGMChange(val / 100);
        },
      );
      this._bgmSlider = bgmRow.slider;
      this._bgmLabel = bgmRow.labelEl;
      this._bgmValue = bgmRow.valueDisplay;
      console.log("[WindowSetting._buildContent] Added BGM slider");

      // SFX 音量
      const sfxRow = this._createSliderRow(
        area,
        t("win_sfx"),
        0,
        100,
        70,
        (val) => {
          if (this.onSFXChange) this.onSFXChange(val / 100);
        },
      );
      this._sfxSlider = sfxRow.slider;
      this._sfxLabel = sfxRow.labelEl;
      this._sfxValue = sfxRow.valueDisplay;
      console.log("[WindowSetting._buildContent] Added SFX slider");

      // ── 语言区域 ────────────────────────────────────────────────────────────

      this._langHeader = p.createDiv(t("win_language"));
      this._langHeader.addClass("window-section-title");
      this._langHeader.parent(area);

      const langRow = p.createDiv("");
      langRow.addClass("window-lang-row");
      langRow.parent(area);

      this._langSelect = p.createSelect();
      this._langSelect.option("English", "en");
      this._langSelect.option("中文", "zh");
      this._langSelect.addClass("window-select");
      this._langSelect.parent(langRow);
      this._langSelect.selected(i18n.getLang());

      this._langSelect.changed(() => {
        const lang = this._langSelect.value();
        i18n.setLang(lang); // 触发 onChange -> _refreshLabels
        if (this.onLanguageChange) this.onLanguageChange(lang);
      });
      console.log("[WindowSetting._buildContent] Added language selector");

      // ── 按键绑定区域 ──────────────────────────────────────────────────────

      if (this._keyBindingManager) {
        this._keyBindHeader = p.createDiv(t("win_keybind"));
        this._keyBindHeader.addClass("window-section-title");
        this._keyBindHeader.parent(area);
        console.log("[WindowSetting._buildContent] Added keybind header");

        // 为每个意图创建按键设置行
        const config = this._keyBindingManager.getConfig();
        const intents = this._getIntentOrder().filter(
          (intent) => !!config[intent],
        );
        console.log("[WindowSetting._buildContent] Display intents:", intents);

        for (const intent of intents) {
          const keyCode = config[intent];
          console.log(
            `[WindowSetting._buildContent] Creating keybind row for "${intent}" -> "${keyCode}"`,
          );
          this._createKeyBindRow(area, intent, keyCode);
        }
        console.log(
          `[WindowSetting._buildContent] Completed creating ${intents.length} keybind rows`,
        );
      } else {
        console.warn(
          "[WindowSetting._buildContent] KeyBindingManager not available, skipping keybind UI",
        );
      }
    } catch (err) {
      console.error("[WindowSetting._buildContent] ERROR:", err);
      throw err;
    }
  }

  /** 切换语言后刷新窗口内所有可见文字 */
  _refreshLabels() {
    this.setTitle(t("win_title"));
    this._soundHeader.html(t("win_sound"));
    this._bgmLabel.html(t("win_bgm"));
    this._sfxLabel.html(t("win_sfx"));
    this._langHeader.html(t("win_language"));
    this._langSelect.selected(i18n.getLang());

    // 刷新按键绑定相关的标签
    if (this._keyBindHeader) this._keyBindHeader.html(t("win_keybind"));
    for (const [intent, labelEl] of Object.entries(this._keyBindLabels)) {
      labelEl.html(this._getIntentLabel(intent));
    }
    for (const resetBtn of Object.values(this._keyBindResets)) {
      resetBtn.elt.title = t("keybind_reset_title");
    }
  }

  /**
   * 创建一行 [标签] [按键显示按钮] [重置按钮] 的按键设置行
   */
  _createKeyBindRow(parent, intent, keyCode) {
    const p = this.p;

    const row = p.createDiv("");
    row.addClass("window-keybind-row");
    row.parent(parent);

    // 意图标签（如 "Jump"）
    const labelEl = p.createSpan(this._getIntentLabel(intent));
    labelEl.addClass("window-label");
    labelEl.parent(row);
    this._keyBindLabels[intent] = labelEl;

    // 按键显示按钮
    const button = p.createButton(this._getKeyLabel(keyCode));
    button.addClass("window-keybind-btn");
    button.parent(row);
    this._keyBindButtons[intent] = button;

    // 绑定点击事件：开始监听新按键
    button.mousePressed(() => {
      this._startListeningForKey(intent, button);
    });

    // 重置按钮
    const resetBtn = p.createButton("↩");
    resetBtn.addClass("window-keybind-reset");
    resetBtn.elt.title = t("keybind_reset_title");
    resetBtn.parent(row);
    this._keyBindResets[intent] = resetBtn;

    // 绑定重置事件
    resetBtn.mousePressed(() => {
      this._keyBindingManager.reset();
    });
  }

  /**
   * 获取意图的显示标签
   */
  _getIntentLabel(intent) {
    const keyMap = {
      jump: t("keybind_jump"),
      moveLeft: t("keybind_moveLeft"),
      moveRight: t("keybind_moveRight"),
      interaction: t("keybind_interaction"),
      record: t("keybind_record"),
      replay: t("keybind_replay"),
    };
    return keyMap[intent] || intent;
  }

  _getIntentOrder() {
    return ["jump", "moveLeft", "moveRight", "interaction", "record", "replay"];
  }

  /**
   * 将按键码转换为显示名称（如 'KeyW' -> 'W'）
   */
  _getKeyLabel(keyCode) {
    // KeyW -> W, KeyA -> A, Space -> Space, ArrowUp -> ↑
    const mapping = {
      KeyW: "W",
      KeyA: "A",
      KeyD: "D",
      KeyS: "S",
      KeyC: "C",
      KeyE: "E",
      KeyR: "R",
      Space: "Space",
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
      ShiftLeft: "Shift",
      ShiftRight: "Shift",
      ControlLeft: "Ctrl",
      ControlRight: "Ctrl",
      AltLeft: "Alt",
      AltRight: "Alt",
    };
    return mapping[keyCode] || keyCode;
  }

  /**
   * 开始监听新按键输入
   */
  _startListeningForKey(intent, button) {
    if (this._listeningFor !== null) {
      // 已经在监听其他按键，先停止
      this._stopListeningForKey();
    }

    this._listeningFor = intent;
    button.html("[...]");
    button.addClass("window-keybind-btn-listening");

    // 绑定全局键盘事件监听
    this._tempKeydownHandler = (event) => {
      event.preventDefault();
      const newKeyCode = event.code;

      // 检查按键是否已被绑定
      const existingIntent = this._keyBindingManager.getIntentByKey(newKeyCode);
      if (existingIntent && existingIntent !== intent) {
        const msg = t("keybind_conflict")
          .replace("{KEY}", this._getKeyLabel(newKeyCode))
          .replace("{ACTION}", this._getIntentLabel(existingIntent));
        alert(msg);
        this._stopListeningForKey();
        return;
      }

      // 应用新的按键绑定
      this._keyBindingManager.rebind(intent, newKeyCode);
      this._stopListeningForKey();
    };

    window.addEventListener("keydown", this._tempKeydownHandler, true);
  }

  /**
   * 停止监听新按键
   */
  _stopListeningForKey() {
    if (this._listeningFor === null) return;

    window.removeEventListener("keydown", this._tempKeydownHandler, true);
    this._tempKeydownHandler = null;

    const intent = this._listeningFor;
    const button = this._keyBindButtons[intent];
    const keyCode = this._keyBindingManager.getKeyByIntent(intent);

    button.html(this._getKeyLabel(keyCode));
    button.removeClass("window-keybind-btn-listening");

    this._listeningFor = null;
  }

  /**
   * 按键绑定改变时的处理（更新所有按钮显示）
   */
  _onKeyBindChange(intent, newKeyCode) {
    if (intent === null) {
      // 完全重置，更新所有按钮
      const config = this._keyBindingManager.getConfig();
      for (const i of this._getIntentOrder()) {
        const keyCode = config[i];
        if (!keyCode) continue;
        const button = this._keyBindButtons[i];
        if (button) {
          button.html(this._getKeyLabel(keyCode));
        }
      }
    } else if (intent && this._keyBindButtons[intent]) {
      // 单个更新
      const button = this._keyBindButtons[intent];
      button.html(this._getKeyLabel(newKeyCode));
    }
  }

  /**
   * 创建一行 [标签] [滑块] [数值显示] 的组合控件
   * @returns {{ slider: p5.Element, labelEl: p5.Element }}
   */
  _createSliderRow(parent, label, min, max, defaultVal, onChange) {
    const p = this.p;

    const row = p.createDiv("");
    row.addClass("window-slider-row");
    row.parent(parent);

    const labelEl = p.createSpan(label);
    labelEl.addClass("window-label");
    labelEl.parent(row);

    const slider = p.createSlider(min, max, defaultVal, 1);
    slider.addClass("window-slider");
    slider.parent(row);

    const valueDisplay = p.createSpan(defaultVal + "%");
    valueDisplay.addClass("window-slider-value");
    valueDisplay.parent(row);

    slider.input(() => {
      const val = slider.value();
      valueDisplay.html(val + "%");
      if (onChange) onChange(val);
    });

    return { slider, labelEl, valueDisplay };
  }

  // ─── 数值读取 ──────────────────────────────────────────────────────────────

  /** 返回 BGM 音量 [0, 1] */
  getBGMVolume() {
    return this._bgmSlider.value() / 100;
  }
  getSFXVolume() {
    return this._sfxSlider.value() / 100;
  }
  getLanguage() {
    return this._langSelect.value();
  }

  // ─── 数值写入 ──────────────────────────────────────────────────────────────

  setBGMVolume(val) {
    const pct = Math.max(0, Math.min(100, Math.round(val * 100)));
    this._bgmSlider.value(pct);
    if (this._bgmValue) this._bgmValue.html(pct + "%");
  }

  setSFXVolume(val) {
    const pct = Math.max(0, Math.min(100, Math.round(val * 100)));
    this._sfxSlider.value(pct);
    if (this._sfxValue) this._sfxValue.html(pct + "%");
  }
  setLanguage(lang) {
    this._langSelect.selected(lang);
  }

  // ─── 销毁 ────────────────────────────────────────────────────────────────────

  remove() {
    // 清理事件监听
    i18n.offChange(this._i18nHandler);
    if (this._keyBindingManager && this._keyBindHandler) {
      this._keyBindingManager.offChange(this._keyBindHandler);
    }

    // 停止按键监听（如果正在进行）
    if (this._listeningFor !== null) {
      this._stopListeningForKey();
    }

    super.remove();
  }
}
