import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { WindowPause } from "../../windows/WindowPause.js";
import { WindowSetting } from "../../windows/WindowSetting.js";
import { WindowHint } from "../../windows/WindowHint.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

/**
 * Shared base for all in-game UI pages.
 * Provides: back button, pause button, pause/setting/hint windows, ESC key handler.
 *
 * Subclasses may override:
 *   _onHint()       — called when the Hint button inside WindowPause is pressed
 *   _pauseGame()    — extend with super._pauseGame() to add level-specific pause logic
 *   _resumeGame()   — extend with super._resumeGame() to add level-specific resume logic
 */
export class GamePageBase extends PageBase {
    constructor(switcher, p, hintLevel, hintKey) {
        super(switcher);
        this._p = p;
        this._isPaused = false;

        // Back button
        const backBtn = new ButtonBase(p, "◀", 0.02 * p.width, 0.03 * p.height, () => {
            this._resumeGame();
            this.switcher.eventBus && this.switcher.eventBus.publish(EventTypes.RETURN_LEVEL_CHOICE);
        }, "back-button");
        backBtn.btn.style("width", 0.030 * p.width + "px");
        backBtn.btn.style("height", 0.055 * p.height + "px");
        this.addElement(backBtn);

        // Pause button
        const pauseBtn = new ButtonBase(p, "⏸", 0.95 * p.width, 0.03 * p.height, () => {
            this._togglePause();
        }, "pause-button");
        pauseBtn.btn.style("width", 0.030 * p.width + "px");
        pauseBtn.btn.style("height", 0.055 * p.height + "px");
        this.addElement(pauseBtn);

        // Pause window
        this._windowPause = new WindowPause(p, {
            onResume: () => this._resumeGame(),
            onSetting: () => this._windowSetting.open(),
            onHint: () => this._onHint(),
            onBackLevelChoice: () => {
                this._resumeGame();
                this.switcher.eventBus && this.switcher.eventBus.publish(EventTypes.RETURN_LEVEL_CHOICE);
            },
            onBackMenu: () => {
                this._resumeGame();
                this.switcher.eventBus && this.switcher.eventBus.publish(EventTypes.UNLOAD_LEVEL);
                this.switcher.main.staticSwitcher.showMainMenu(p);
            },
        });

        // Setting window
        const settingX = Math.round(p.width - 320 - 24);
        const settingY = Math.round(p.height * 0.16);
        this._windowSetting = new WindowSetting(p, settingX, settingY);
        this._windowSetting.onBGMChange = (value) => AudioManager.setBGMVolume(value);
        this._windowSetting.onSFXChange = (value) => AudioManager.setSFXVolume(value);
        this._windowSetting.setBGMVolume(AudioManager.getBGMVolume());
        this._windowSetting.setSFXVolume(AudioManager.getSFXVolume());

        // Hint window
        const hintX = 24;
        const hintY = Math.round(p.height * 0.16);
        this._windowHint = new WindowHint(p, hintLevel, hintKey, hintX, hintY);

        // ESC key handler
        this._onKeyDown = (e) => {
            if (e.code === "Escape") this._togglePause();
        };
        document.addEventListener("keydown", this._onKeyDown);
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
        this.switcher.eventBus && this.switcher.eventBus.publish(EventTypes.PAUSE_GAME);
        this._windowPause.open();
    }

    _resumeGame() {
        this._isPaused = false;
        this.switcher.eventBus && this.switcher.eventBus.publish(EventTypes.RESUME_GAME);
        this._windowPause.close();
        this._windowSetting.close();
        this._windowHint.close();
    }

    update() {
        // Game logic driven by main.js levelManager.update()
    }

    draw() {
        // Game rendering driven by main.js levelManager.update()
    }

    exit() {
        document.body.classList.remove("game-paused");
        document.removeEventListener("keydown", this._onKeyDown);
        if (this._windowHint) this._windowHint.remove();
        if (this._windowSetting) this._windowSetting.remove();
        if (this._windowPause) this._windowPause.remove();
        super.exit();
    }
}
