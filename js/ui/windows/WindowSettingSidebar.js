// WindowSettingSidebar.js 鈥?璁剧疆椤典晶杈规爮鎮诞绐?
import { WindowSidebarBase } from "./WindowSidebarBase.js";
import { i18n, t } from "../../i18n.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";

export class WindowSettingSidebar extends WindowSidebarBase {
  constructor(p, x, y, width, height) {
    super(p, t("win_title"), x, y, width, height, {
      closable: false,
      extraClasses: ["window-setting-sidebar"],
    });

    this._keyBindLabels = {};
    this._keyBindButtons = {};
    this._keyBindResets = {};
    this._sectionButtons = {};
    this._sectionPanels = {};
    this._activeSection = null;
    this._listeningFor = null;

    try {
      this._keyBindingManager = KeyBindingManager.getInstance();
    } catch (err) {
      console.error(
        "[WindowSettingSidebar] Failed to initialize KeyBindingManager:",
        err,
      );
      this._keyBindingManager = null;
    }

    this._buildContent();

    this._i18nHandler = () => this._refreshLabels();
    i18n.onChange(this._i18nHandler);

    if (this._keyBindingManager) {
      this._keyBindHandler = (intent, newKeyCode) =>
        this._onKeyBindChange(intent, newKeyCode);
      this._keyBindingManager.onChange(this._keyBindHandler);
    }
  }

  _buildContent() {
    const soundPanel = this._createSectionPanel("sound");
    this._buildSoundSection(soundPanel);

    const languagePanel = this._createSectionPanel("language");
    this._buildLanguageSection(languagePanel);

    if (this._keyBindingManager) {
      const keybindPanel = this._createSectionPanel("keybind");
      this._buildKeybindSection(keybindPanel);
    }

    const creditsPanel = this._createSectionPanel("credits");
    this._buildCreditsSection(creditsPanel);

    this._createSectionButton("sound", t("win_sound"));
    this._createSectionButton("language", t("win_language"));
    if (this._keyBindingManager) {
      this._createSectionButton("keybind", t("win_keybind"));
    }
    this._createSectionButton("credits", t("win_credits"));

    this._setActiveSection("sound");
  }

  _createSectionPanel(sectionKey) {
    const panel = this.p.createDiv("");
    panel.addClass("window-sidebar-panel");
    panel.parent(this.panelArea);
    this._sectionPanels[sectionKey] = panel;
    return panel;
  }

  _createSectionButton(sectionKey, text) {
    const btn = this.p.createButton(text);
    btn.addClass("window-sidebar-tab");
    btn.parent(this.navArea);
    btn.mousePressed(() => this._setActiveSection(sectionKey));
    this._sectionButtons[sectionKey] = btn;
  }

  _setActiveSection(sectionKey) {
    this._activeSection = sectionKey;

    for (const [key, btn] of Object.entries(this._sectionButtons)) {
      if (key === sectionKey) {
        btn.addClass("active");
      } else {
        btn.removeClass("active");
      }
    }

    for (const [key, panel] of Object.entries(this._sectionPanels)) {
      if (key === sectionKey) {
        panel.style("display", "block");
        panel.addClass("active");
      } else {
        panel.style("display", "none");
        panel.removeClass("active");
      }
    }
  }

  _buildSoundSection(parent) {
    this._soundHeader = this.p.createDiv(t("win_sound"));
    this._soundHeader.addClass("window-section-title");
    this._soundHeader.parent(parent);

    const bgmRow = this._createSliderRow(
      parent,
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

    const sfxRow = this._createSliderRow(
      parent,
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
  }

  _buildLanguageSection(parent) {
    this._langHeader = this.p.createDiv(t("win_language"));
    this._langHeader.addClass("window-section-title");
    this._langHeader.parent(parent);

    const langRow = this.p.createDiv("");
    langRow.addClass("window-lang-row");
    langRow.parent(parent);

    this._langSelect = this.p.createSelect();
    this._langSelect.option("English", "en");
    this._langSelect.option("简体中文", "zh");
    this._langSelect.addClass("window-select");
    this._langSelect.parent(langRow);
    this._langSelect.selected(i18n.getLang());

    this._langSelect.changed(() => {
      const lang = this._langSelect.value();
      i18n.setLang(lang);
      if (this.onLanguageChange) this.onLanguageChange(lang);
    });
  }

  _buildKeybindSection(parent) {
    this._keyBindHeader = this.p.createDiv(t("win_keybind"));
    this._keyBindHeader.addClass("window-section-title");
    this._keyBindHeader.parent(parent);

    const config = this._keyBindingManager.getConfig();
    for (const intent of this._getIntentOrder()) {
      if (!config[intent]) continue;
      const keyCode = config[intent];
      this._createKeyBindRow(parent, intent, keyCode);
    }
  }

  _buildCreditsSection(parent) {
    this._creditsHeader = this.p.createDiv(t("win_credits"));
    this._creditsHeader.addClass("window-section-title");
    this._creditsHeader.parent(parent);

    this._creditsContent = this.p.createDiv(t("win_credits_content"));
    this._creditsContent.addClass("window-credits-text");
    this._creditsContent.parent(parent);
  }

  _getIntentOrder() {
    return [
      "jump",
      "moveLeft",
      "moveRight",
      "interaction",
      "record",
      "replay",
      "teleportCheckpoint",
    ];
  }

  _refreshLabels() {
    this.setTitle(t("win_title"));
    this._soundHeader.html(t("win_sound"));
    this._bgmLabel.html(t("win_bgm"));
    this._sfxLabel.html(t("win_sfx"));
    this._langHeader.html(t("win_language"));
    this._langSelect.selected(i18n.getLang());

    if (this._keyBindHeader) this._keyBindHeader.html(t("win_keybind"));
    if (this._sectionButtons.sound)
      this._sectionButtons.sound.html(t("win_sound"));
    if (this._sectionButtons.language)
      this._sectionButtons.language.html(t("win_language"));
    if (this._sectionButtons.keybind)
      this._sectionButtons.keybind.html(t("win_keybind"));
    if (this._sectionButtons.credits)
      this._sectionButtons.credits.html(t("win_credits"));
    if (this._creditsHeader) this._creditsHeader.html(t("win_credits"));
    if (this._creditsContent)
      this._creditsContent.html(t("win_credits_content"));

    for (const [intent, labelEl] of Object.entries(this._keyBindLabels)) {
      labelEl.html(this._getIntentLabel(intent));
    }
    for (const resetBtn of Object.values(this._keyBindResets)) {
      resetBtn.elt.title = t("keybind_reset_title");
    }
  }

  _createSliderRow(parent, label, min, max, defaultVal, onChange) {
    const row = this.p.createDiv("");
    row.addClass("window-slider-row");
    row.parent(parent);

    const labelEl = this.p.createSpan(label);
    labelEl.addClass("window-label");
    labelEl.parent(row);

    const slider = this.p.createSlider(min, max, defaultVal, 1);
    slider.addClass("window-slider");
    slider.parent(row);

    const valueDisplay = this.p.createSpan(defaultVal + "%");
    valueDisplay.addClass("window-slider-value");
    valueDisplay.parent(row);

    slider.input(() => {
      const val = slider.value();
      valueDisplay.html(val + "%");
      if (onChange) onChange(val);
    });

    return { slider, labelEl, valueDisplay };
  }

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

  _createKeyBindRow(parent, intent, keyCode) {
    const row = this.p.createDiv("");
    row.addClass("window-keybind-row");
    row.parent(parent);

    const labelEl = this.p.createSpan(this._getIntentLabel(intent));
    labelEl.addClass("window-label");
    labelEl.parent(row);
    this._keyBindLabels[intent] = labelEl;

    const button = this.p.createButton(this._getKeyLabel(keyCode));
    button.addClass("window-keybind-btn");
    button.parent(row);
    this._keyBindButtons[intent] = button;
    button.mousePressed(() => this._startListeningForKey(intent, button));

    const resetBtn = this.p.createButton("↩");
    resetBtn.addClass("window-keybind-reset");
    resetBtn.elt.title = t("keybind_reset_title");
    resetBtn.parent(row);
    this._keyBindResets[intent] = resetBtn;

    resetBtn.mousePressed(() => {
      this._keyBindingManager.reset();
    });
  }

  _getIntentLabel(intent) {
    const keyMap = {
      jump: t("keybind_jump"),
      moveLeft: t("keybind_moveLeft"),
      moveRight: t("keybind_moveRight"),
      interaction: t("keybind_interaction"),
      record: t("keybind_record"),
      replay: t("keybind_replay"),
      teleportCheckpoint: t("keybind_teleportCheckpoint"),
    };
    return keyMap[intent] || intent;
  }

  _getKeyLabel(keyCode) {
    const mapping = {
      KeyW: "W",
      KeyA: "A",
      KeyD: "D",
      KeyS: "S",
      KeyC: "C",
      KeyE: "E",
      KeyR: "R",
      KeyB: "B",
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

  _startListeningForKey(intent, button) {
    if (this._listeningFor !== null) {
      this._stopListeningForKey();
    }

    this._listeningFor = intent;
    button.html("[...]");
    button.addClass("window-keybind-btn-listening");

    this._tempKeydownHandler = (event) => {
      event.preventDefault();
      const newKeyCode = event.code;

      const existingIntent = this._keyBindingManager.getIntentByKey(newKeyCode);
      if (existingIntent && existingIntent !== intent) {
        const msg = t("keybind_conflict")
          .replace("{KEY}", this._getKeyLabel(newKeyCode))
          .replace("{ACTION}", this._getIntentLabel(existingIntent));
        alert(msg);
        this._stopListeningForKey();
        return;
      }

      this._keyBindingManager.rebind(intent, newKeyCode);
      this._stopListeningForKey();
    };

    window.addEventListener("keydown", this._tempKeydownHandler, true);
  }

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

  _onKeyBindChange(intent, newKeyCode) {
    if (intent === null) {
      const config = this._keyBindingManager.getConfig();
      for (const i of this._getIntentOrder()) {
        const keyCode = config[i];
        if (!keyCode) continue;
        const button = this._keyBindButtons[i];
        if (button) button.html(this._getKeyLabel(keyCode));
      }
    } else if (intent && this._keyBindButtons[intent]) {
      this._keyBindButtons[intent].html(this._getKeyLabel(newKeyCode));
    }
  }

  remove() {
    i18n.offChange(this._i18nHandler);
    if (this._keyBindingManager && this._keyBindHandler) {
      this._keyBindingManager.offChange(this._keyBindHandler);
    }

    if (this._listeningFor !== null) {
      this._stopListeningForKey();
    }

    super.remove();
  }
}
