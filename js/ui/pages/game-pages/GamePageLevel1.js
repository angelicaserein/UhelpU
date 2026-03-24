import { GamePageBase } from "./GamePageBase.js";
import { HintButton } from "../../components/HintButton.js";
import { WindowPrompt } from "../../windows/WindowPrompt.js";
import { AudioManager } from "../../../AudioManager.js";
import { i18n, t } from "../../../i18n.js";
import {
  markLevel1RecordHudOpened,
  resetLevel1PromptState,
} from "../../../game-runtime/Level1PromptState.js";

export class GamePageLevel1 extends GamePageBase {
  constructor(switcher, p) {
    super(switcher, p, 1, "hint_level1");

    this._isRecordHudUnlocked = false;
    this._isModuleInstalled = false;
    this._sceneHintBtn = null;
    this._sceneHintFrontText = null;
    this._sceneHintBackText = null;
    this._sceneHintTextPathMap = {
      zh: "assets/text/signboard_hint_level1_front_zh.txt",
      en: "assets/text/signboard_hint_level1_front_en.txt",
    };
    this._sceneHintBackTextPathMap = {
      zh: "assets/text/signboard_hint_level1_back_zh.txt",
      en: "assets/text/signboard_hint_level1_back_en.txt",
    };

    // Module installation prompt
    this._moduleInstallationPrompt = new WindowPrompt(
      p,
      "module_installation_complete",
      {
        width: 400,
        padding: 40,
        fontSize: 18,
      },
    );

    // Signboard event subscriptions
    this._onSignboardInteracted = () => {
      if (this._sceneHintBtn) {
        this._hideSceneHintButton();
      } else {
        this._showSceneHintButton();
      }
    };
    this._onSignboardOutOfRange = () => {
      this._hideSceneHintButton();
    };
    if (this.switcher.eventBus) {
      this.switcher.eventBus.subscribe(
        "signboardInteracted",
        this._onSignboardInteracted,
      );
      this.switcher.eventBus.subscribe(
        "signboardOutOfRange",
        this._onSignboardOutOfRange,
      );
    }

    this._onLangChange = () => {
      this._loadSceneHintFrontText();
      this._loadSceneHintBackText();
    };
    i18n.onChange(this._onLangChange);

    this._loadSceneHintFrontText();
    this._loadSceneHintBackText();
    resetLevel1PromptState();
    this._applyRecordHudVisibility();
  }

  // ── Overrides ────────────────────────────────────────────────

  _onHint() {
    this._windowHint.open();
    this._unlockRecordHud();
  }

  _pauseGame() {
    document.body.classList.add("game-paused");
    this._setSceneHintInteractive(false);
    super._pauseGame();
  }

  _resumeGame() {
    document.body.classList.remove("game-paused");
    this._setSceneHintInteractive(true);
    super._resumeGame();
  }

  // ── Record HUD ───────────────────────────────────────────────

  _getCurrentRecordSystem() {
    return this.switcher?.runtimeLevelManager?.level?.recordSystem || null;
  }

  _applyRecordHudVisibility() {
    const recordSystem = this._getCurrentRecordSystem();
    if (!recordSystem || typeof recordSystem.setHudVisible !== "function")
      return;
    recordSystem.setHudVisible(this._isRecordHudUnlocked);
  }

  _unlockRecordHud() {
    markLevel1RecordHudOpened();
    if (this._isRecordHudUnlocked) return;
    this._isRecordHudUnlocked = true;
    this._applyRecordHudVisibility();
  }

  // ── Scene hint text loading ──────────────────────────────────

  async _loadSceneHintFrontText() {
    const lang = i18n.getLang() || "en";
    const primaryPath =
      this._sceneHintTextPathMap[lang] || this._sceneHintTextPathMap.en;
    const fallbackPath = this._sceneHintTextPathMap.en;

    try {
      let response = await fetch(primaryPath);
      if (!response.ok && primaryPath !== fallbackPath) {
        response = await fetch(fallbackPath);
      }
      if (!response.ok) return;

      this._sceneHintFrontText = await response.text();
      if (this._sceneHintBtn) {
        this._sceneHintBtn.setFrontText(this._sceneHintFrontText);
      }
    } catch {
      // Ignore load failure; keep default text
    }
  }

  async _loadSceneHintBackText() {
    const lang = i18n.getLang() || "en";
    const primaryPath =
      this._sceneHintBackTextPathMap[lang] || this._sceneHintBackTextPathMap.en;
    const fallbackPath = this._sceneHintBackTextPathMap.en;

    try {
      let response = await fetch(primaryPath);
      if (!response.ok && primaryPath !== fallbackPath) {
        response = await fetch(fallbackPath);
      }
      if (!response.ok) return;

      this._sceneHintBackText = await response.text();
      if (this._sceneHintBtn) {
        this._sceneHintBtn.setBackText(this._sceneHintBackText);
      }
    } catch {
      // Ignore load failure; keep default text
    }
  }

  // ── Scene hint button ────────────────────────────────────────

  _showSceneHintButton() {
    if (this._sceneHintBtn) return;

    const p = this._p;
    const margin = 16;
    const groundHeight = 80;
    const maxBottomY = p.height - groundHeight;
    const sceneHintW = Math.min(760, Math.max(240, p.width - margin * 2));
    const maxSceneHintH = Math.max(180, maxBottomY - margin);
    const sceneHintH = Math.min(560, Math.max(180, maxSceneHintH));
    const sceneHintX = Math.max(
      0,
      Math.min((p.width - sceneHintW) / 2, p.width - sceneHintW),
    );
    const maxSceneHintY = Math.max(0, maxBottomY - sceneHintH);
    const sceneHintY = Math.max(
      0,
      Math.min((p.height - sceneHintH) / 2, maxSceneHintY),
    );
    const sceneHintBtn = new HintButton(
      p,
      this._sceneHintFrontText || "发现了一个神秘的告示牌……",
      sceneHintX,
      sceneHintY,
      () => {},
      "scene-hint-notebook",
      this._sceneHintBackText || "按 ESC 或右上角暂停，内有 Hint",
    );

    sceneHintBtn.container.style("width", `${sceneHintW}px`);
    sceneHintBtn.container.style("height", `${sceneHintH}px`);
    sceneHintBtn.container.position(sceneHintX, sceneHintY);

    if (!this._isModuleInstalled) {
      const moduleBtn = p.createButton(t("module_btn_label"));
      moduleBtn.addClass("hint-back-module-btn");
      moduleBtn.parent(sceneHintBtn.back);
      moduleBtn.mousePressed(() => {
        this._moduleInstallationPrompt.open();
        this._unlockRecordHud();
        this._isModuleInstalled = true;
        this._hideSceneHintButton();
        AudioManager.playSFX("click");
      });
    }

    this._sceneHintBtn = sceneHintBtn;
    this._setSceneHintInteractive(!this._isPaused);
    this.addElement(sceneHintBtn);
  }

  _setSceneHintInteractive(enabled) {
    if (!this._sceneHintBtn) return;
    this._sceneHintBtn.container.style(
      "pointer-events",
      enabled ? "auto" : "none",
    );
    this._sceneHintBtn.container.style("z-index", enabled ? "1100" : "1");
  }

  _hideSceneHintButton() {
    if (!this._sceneHintBtn) return;
    this._sceneHintBtn.remove();
    this._sceneHintBtn = null;
  }

  // ── Lifecycle ────────────────────────────────────────────────

  exit() {
    console.log("GamePageLevel1 exit");
    resetLevel1PromptState();
    this._hideSceneHintButton();
    this._isModuleInstalled = false;
    this._isRecordHudUnlocked = false;
    if (this.switcher.eventBus) {
      this.switcher.eventBus.unsubscribe(
        "signboardInteracted",
        this._onSignboardInteracted,
      );
      this.switcher.eventBus.unsubscribe(
        "signboardOutOfRange",
        this._onSignboardOutOfRange,
      );
    }
    i18n.offChange(this._onLangChange);
    if (this._moduleInstallationPrompt) this._moduleInstallationPrompt.remove();
    super.exit(); // handles ESC listener, windows, super.exit()
  }
}
