import { GamePageBaseDemo1 } from "../GamePageBaseDemo1.js";
import { WindowPrompt } from "../../../windows/WindowPrompt.js";
import { WindowPromptPause } from "../../../windows/WindowPromptPause.js";
import { AudioManager } from "../../../../AudioManager.js";
import { t } from "../../../../i18n.js";
import {
  markLevel1RecordHudOpened,
  resetLevel1PromptState,
} from "../../../../level-design/demo1/Level1PromptState.js";

export class GamePageLevel1 extends GamePageBaseDemo1 {
  constructor(switcher, p) {
    super(switcher, p, 1, "hint_level1");

    this._isRecordHudUnlocked = true;
    this._isModuleInstalled = false;

    // First-record prompt (pauses game)
    this._firstRecordPrompt = new WindowPromptPause(p, "first_record_prompt", {
      width: 420,
      padding: 36,
      fontSize: 17,
    });

    // Module installation prompt 鈥?recording unlocks when this is dismissed
    this._moduleInstallationPrompt = new WindowPrompt(
      p,
      "module_installation_complete",
      {
        width: 400,
        padding: 40,
        fontSize: 18,
        onClose: () => this._unlockRecordHud(),
      },
    );

    // Use shared signboard-hint system
    this._setupSignboardHint({
      frontTextPaths: {
        zh: "assets/text/signboard_hint_level1_front_zh.txt",
        en: "assets/text/signboard_hint_level1_front_en.txt",
      },
      backTextPaths: {
        zh: "assets/text/signboard_hint_level1_back_zh.txt",
        en: "assets/text/signboard_hint_level1_back_en.txt",
      },
    });

    resetLevel1PromptState();
    markLevel1RecordHudOpened();
    this._applyRecordHudVisibility();
    this._applyRecordDisabledState();
    this._hookFirstRecordPrompt();
  }

  // 鈹€鈹€ Overrides 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  _onHint() {
    this._windowHint.open();
  }

  _pauseGame() {
    document.body.classList.add("game-paused");
    this._setSceneHintInteractive(false);
    super._pauseGame();
  }

  _resumeGame() {
    document.body.classList.remove("game-paused");
    super._resumeGame();
  }

  /** Add module installation button to the signboard hint back side. */
  _onSceneHintButtonCreated(btn) {
    if (!this._isModuleInstalled) {
      const p = this._p;
      const moduleBtn = p.createButton(t("module_btn_label"));
      moduleBtn.addClass("hint-back-module-btn");
      moduleBtn.parent(btn.back);
      moduleBtn.mousePressed(() => {
        this._moduleInstallationPrompt.open();
        this._isModuleInstalled = true;
        this._hideSceneHintButton();
        AudioManager.playSFX("click");
      });
    }
  }

  // 鈹€鈹€ Record HUD 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  _getCurrentRecordSystem() {
    return this.switcher?.runtimeLevelManager?.level?.recordSystem || null;
  }

  _applyRecordHudVisibility() {
    const recordSystem = this._getCurrentRecordSystem();
    if (!recordSystem || typeof recordSystem.setHudVisible !== "function")
      return;
    recordSystem.setHudVisible(this._isRecordHudUnlocked);
  }

  _applyRecordDisabledState() {
    const rs = this._getCurrentRecordSystem();
    if (!rs) return;
    rs.setDisabled(!this._isRecordHudUnlocked);
  }

  _unlockRecordHud() {
    markLevel1RecordHudOpened();
    if (this._isRecordHudUnlocked) return;
    this._isRecordHudUnlocked = true;
    this._applyRecordHudVisibility();
    this._applyRecordDisabledState();
    this._hookFirstRecordPrompt();
  }

  _hookFirstRecordPrompt() {
    const rs = this._getCurrentRecordSystem();
    if (!rs) return;
    rs._onFirstRecord = this._isRecordHudUnlocked
      ? null
      : () => this._firstRecordPrompt.open();
  }

  // 鈹€鈹€ Lifecycle 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  exit() {
    console.log("GamePageLevel1 exit");
    resetLevel1PromptState();
    this._isModuleInstalled = false;
    this._isRecordHudUnlocked = false;
    if (this._firstRecordPrompt) this._firstRecordPrompt.remove();
    if (this._moduleInstallationPrompt) this._moduleInstallationPrompt.remove();
    super.exit();
  }
}

