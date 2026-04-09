import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { BackButton } from "../../components/BackButton.js";
import { HintButton } from "../../components/HintButton.js";
import { WindowPause } from "../../windows/WindowPause.js";
import { WindowSetting } from "../../windows/WindowSetting.js";
import { WindowHint } from "../../windows/WindowHint.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";
import { i18n } from "../../../i18n.js";

/**
 * Shared base for all in-game UI pages.
 * Provides: back button, pause button, pause/setting/hint windows, ESC key handler.
 *
 * Subclasses may override:
 *   _onHint()       — called when the Hint button inside WindowPause is pressed
 *   _pauseGame()    — extend with super._pauseGame() to add level-specific pause logic
 *   _resumeGame()   — extend with super._resumeGame() to add level-specific resume logic
 */
export class GamePageBaseDemo2 extends PageBase {
  constructor(switcher, p, hintLevel, hintKey, levelIndex, options = {}) {
    super(switcher);
    this._p = p;
    this._isPaused = false;
    this._levelIndex = levelIndex || `level${hintLevel}`;
    const showButtons = options.showButtons !== false;

    // 收集页面上的可导航按钮（会在子类中由 addElement 添加）
    this._pageNavButtons = [];

    if (showButtons) {
      const backBtn = new BackButton(p, () => {
        this._resumeGame();
        this.switcher.eventBus &&
          this.switcher.eventBus.publish(EventTypes.RETURN_LEVEL_CHOICE);
      });
      this.addElement(backBtn);

      // 添加到导航列表（带回调）
      this._pageNavButtons.push({
        btn: backBtn.btn,
        callback:
          backBtn.btn._onMousePressed ||
          (() => {
            this._resumeGame();
            this.switcher.eventBus &&
              this.switcher.eventBus.publish(EventTypes.RETURN_LEVEL_CHOICE);
          }),
      });

      // Pause button
      const pauseBtn = new ButtonBase(
        p,
        "⏸",
        0.95 * p.width,
        0.03 * p.height,
        () => {
          this._togglePause();
        },
        "pause-button",
      );
      pauseBtn.btn.style("width", 0.03 * p.width + "px");
      pauseBtn.btn.style("height", 0.055 * p.height + "px");
      this.addElement(pauseBtn);

      // 添加到导航列表
      this._pageNavButtons.push({
        btn: pauseBtn.btn,
        callback: () => this._togglePause(),
      });
    }

    // Pause window
    this._windowPause = new WindowPause(p, {
      onResume: () => this._resumeGame(),
      onSetting: () => this._windowSetting.open(),
      onHint: () => this._onHint(),
      onRestartLevel: () => {
        this._resumeGame();
        this.switcher.eventBus &&
          this.switcher.eventBus.publish(
            EventTypes.LOAD_LEVEL,
            this._levelIndex,
          );
      },
      onBackLevelChoice: () => {
        this._resumeGame();
        this.switcher.eventBus &&
          this.switcher.eventBus.publish(EventTypes.RETURN_LEVEL_CHOICE);
      },
      onBackMenu: () => {
        this._resumeGame();
        this.switcher.eventBus &&
          this.switcher.eventBus.publish(EventTypes.UNLOAD_LEVEL);
        this.switcher.main.staticSwitcher.showMainMenu(p);
      },
    });

    // Setting window
    const settingX = Math.round(p.width - 320 - 24);
    const settingY = Math.round(p.height * 0.16);
    this._windowSetting = new WindowSetting(p, settingX, settingY);
    this._windowSetting.onBGMChange = (value) =>
      AudioManager.setBGMVolume(value);
    this._windowSetting.onSFXChange = (value) =>
      AudioManager.setSFXVolume(value);
    this._windowSetting.setBGMVolume(AudioManager.getBGMVolume());
    this._windowSetting.setSFXVolume(AudioManager.getSFXVolume());

    // Hint window
    const hintX = 24;
    const hintY = Math.round(p.height * 0.16);
    this._windowHint = new WindowHint(p, hintLevel, hintKey, hintX, hintY);

    // ESC key handler（独立于 showButtons，始终启用）
    this._onKeyDown = (e) => {
      if (e.code === "Escape") this._togglePause();
    };
    document.addEventListener("keydown", this._onKeyDown);

    // 注册页面的键盘导航按钮
    if (this._pageNavButtons.length > 0) {
      this.registerNavButtons(this._pageNavButtons, {
        layout: "vertical",
        onEsc: null, // ESC 由全局处理，不需要特殊处理
      });
    }
  }

  // Override in subclasses that need extra behaviour when hint is pressed
  _onHint() {
    this._windowHint.open();
  }

  _togglePause() {
    if (this._windowPause.isVisible) {
      this._resumeGame();
    } else {
      this._pauseGame();
    }
  }

  _pauseGame() {
    this._isPaused = true;
    this.switcher.eventBus &&
      this.switcher.eventBus.publish(EventTypes.PAUSE_GAME);
    this._windowPause.open();
  }

  _resumeGame() {
    this._isPaused = false;
    this.switcher.eventBus &&
      this.switcher.eventBus.publish(EventTypes.RESUME_GAME);
    this._windowPause.close();
    this._windowSetting.close();
    this._windowHint.close();
    this._setSceneHintInteractive(true);
  }

  update() {
    // Game logic driven by main.js levelManager.update()
  }

  draw() {
    // Game rendering driven by main.js levelManager.update()
  }

  // ── Signboard-hint shared system ───────────────────────────

  /**
   * Set up signboard → HintButton interaction.
   * Call in subclass constructor after super() to enable signboard hint.
   * @param {object} config
   * @param {object} config.frontTextPaths - { en: "path", zh: "path" }
   * @param {object} config.backTextPaths  - { en: "path", zh: "path" }
   * @param {object} [config.size]         - Optional size overrides
   * @param {number} [config.size.width]   - Fixed width in px (default: auto)
   * @param {number} [config.size.height]  - Fixed height in px (default: auto)
   * @param {number} [config.size.minW]    - Min width in px (default: 240)
   * @param {number} [config.size.maxW]    - Max width in px (default: 520)
   * @param {number} [config.size.minH]    - Min height in px (default: 180)
   * @param {number} [config.size.maxH]    - Max height in px (default: 380)
   */
  _setupSignboardHint({ frontTextPaths, backTextPaths, size }) {
    this._sceneHintBtn = null;
    this._sceneHintFrontText = null;
    this._sceneHintBackText = null;
    this._sceneHintFrontTextPaths = frontTextPaths;
    this._sceneHintBackTextPaths = backTextPaths;
    this._sceneHintSize = size || {};
    this._signboardHintEnabled = true;

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
        EventTypes.SIGNBOARD_INTERACTED,
        this._onSignboardInteracted,
      );
      this.switcher.eventBus.subscribe(
        EventTypes.SIGNBOARD_OUT_OF_RANGE,
        this._onSignboardOutOfRange,
      );
    }

    this._onSceneHintLangChange = () => {
      this._loadSceneHintFrontText();
      this._loadSceneHintBackText();
    };

    i18n.onChange(this._onSceneHintLangChange);

    this._loadSceneHintFrontText();
    this._loadSceneHintBackText();
  }

  _showSceneHintButton() {
    if (this._sceneHintBtn) return;

    const p = this._p;
    const sz = this._sceneHintSize || {};
    const margin = 16;
    const groundHeight = 80;
    const maxBottomY = p.height - groundHeight;
    const minW = sz.minW ?? 240;
    const maxW = sz.maxW ?? 520;
    const minH = sz.minH ?? 180;
    const maxH = sz.maxH ?? 380;
    const sceneHintW =
      sz.width ?? Math.min(maxW, Math.max(minW, p.width - margin * 2));
    const maxSceneHintH = Math.max(minH, maxBottomY - margin);
    const sceneHintH =
      sz.height ?? Math.min(maxH, Math.max(minH, maxSceneHintH));
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
      "",
      sceneHintX,
      sceneHintY,
      () => {},
      "scene-hint-notebook",
      "",
    );
    sceneHintBtn.front.html(
      this._sceneHintFrontText ||
        this._formatHintHtml(
          "Notice\n---\nA mysterious signboard...\n---\nClick to flip!",
        ),
    );
    sceneHintBtn.back.html(
      this._sceneHintBackText ||
        this._formatHintHtml("...\n---\n按 ESC 或右上角暂停，内有 Hint"),
    );

    sceneHintBtn.container.style("width", `${sceneHintW}px`);
    sceneHintBtn.container.style("height", `${sceneHintH}px`);
    sceneHintBtn.container.position(sceneHintX, sceneHintY);

    this._sceneHintBtn = sceneHintBtn;
    this._onSceneHintButtonCreated(sceneHintBtn);
    this._setSceneHintInteractive(!this._isPaused);
    this.addElement(sceneHintBtn);
  }

  /** Override in subclass to customize HintButton after creation (e.g. add extra buttons). */
  _onSceneHintButtonCreated(_btn) {}

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

  _formatHintHtml(raw) {
    if (!raw) return "";
    const sections = raw.split(/^---$/m).map((s) => s.trim());
    const title = sections[0] || "";
    const body = sections[1] || "";
    const footer = sections[2] || "";
    let html = "";
    if (title)
      html += `<div class="scene-hint-title">${this._esc(title)}</div>`;
    if (body) html += `<div class="scene-hint-body">${this._esc(body)}</div>`;
    if (footer)
      html += `<div class="scene-hint-footer">${this._esc(footer)}</div>`;
    return html;
  }

  _esc(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }

  async _loadSceneHintFrontText() {
    if (!this._sceneHintFrontTextPaths) return;
    const lang = i18n.getLang() || "en";
    const primaryPath =
      this._sceneHintFrontTextPaths[lang] || this._sceneHintFrontTextPaths.en;
    const fallbackPath = this._sceneHintFrontTextPaths.en;

    try {
      let response = await fetch(primaryPath);
      if (!response.ok && primaryPath !== fallbackPath) {
        response = await fetch(fallbackPath);
      }
      if (!response.ok) return;

      const raw = await response.text();
      this._sceneHintFrontText = this._formatHintHtml(raw);
      if (this._sceneHintBtn) {
        this._sceneHintBtn.front.html(this._sceneHintFrontText);
      }
    } catch {
      // Ignore load failure
    }
  }

  async _loadSceneHintBackText() {
    if (!this._sceneHintBackTextPaths) return;
    const lang = i18n.getLang() || "en";
    const primaryPath =
      this._sceneHintBackTextPaths[lang] || this._sceneHintBackTextPaths.en;
    const fallbackPath = this._sceneHintBackTextPaths.en;

    try {
      let response = await fetch(primaryPath);
      if (!response.ok && primaryPath !== fallbackPath) {
        response = await fetch(fallbackPath);
      }
      if (!response.ok) return;

      const raw = await response.text();
      this._sceneHintBackText = this._formatHintHtml(raw);
      if (this._sceneHintBtn) {
        this._sceneHintBtn.back.html(this._sceneHintBackText);
      }
    } catch {
      // Ignore load failure
    }
  }

  _cleanupSignboardHint() {
    this._hideSceneHintButton();
    if (this.switcher.eventBus && this._onSignboardInteracted) {
      this.switcher.eventBus.unsubscribe(
        EventTypes.SIGNBOARD_INTERACTED,
        this._onSignboardInteracted,
      );
      this.switcher.eventBus.unsubscribe(
        EventTypes.SIGNBOARD_OUT_OF_RANGE,
        this._onSignboardOutOfRange,
      );
    }
    if (this._onSceneHintLangChange) {
      i18n.offChange(this._onSceneHintLangChange);
    }
  }

  exit() {
    document.body.classList.remove("game-paused");
    document.removeEventListener("keydown", this._onKeyDown);
    this._cleanupSignboardHint();
    if (this._windowHint) this._windowHint.remove();
    if (this._windowSetting) this._windowSetting.remove();
    if (this._windowPause) this._windowPause.remove();
    super.exit();
  }
}
