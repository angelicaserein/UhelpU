import "./i18n/i18nDemo1.js"; // 注册 Demo1 关卡专属文案
import "./i18n/i18nDemo2.js"; // 注册 Demo2 关卡专属文案
import "./i18n/i18nEasy.js"; // 注册 Easy 模式关卡专属文案
import "./i18n/i18nHard.js"; // 注册 Hard 模式关卡专属文案
import "./i18n/i18nSpecial.js"; // 注册 Special 模式关卡专属文案
import { SwitcherMain } from "./switchers/SwitcherMain.js";
import { EventBus } from "./event-system/EventBus.js";
import { EventTypes } from "./event-system/EventTypes.js";
import { LevelManager } from "./level-design/LevelManager.js";
import { UserLevel } from "./user-levels/LevelParser.js";
import { StaticPageResultDemo1 } from "./ui/pages/static-pages/StaticPageResultDemo1.js";
import { StaticPageResultDemo2 } from "./ui/pages/static-pages/StaticPageResultDemo2.js";
import { StaticPageWinDemo1 } from "./ui/pages/static-pages/StaticPageWinDemo1.js";
import { StaticPageWinDemo2 } from "./ui/pages/static-pages/StaticPageWinDemo2.js";
import { StaticPageWinEasy } from "./ui/pages/static-pages/StaticPageWinEasy.js";
import { AudioManager } from "./AudioManager.js";

export class AppCoordinator {
  constructor(p) {
    this.p = p;
    this.eventBus = new EventBus();
    this.switcher = new SwitcherMain(p, this.eventBus);
    this.levelManager = new LevelManager(p, this.eventBus);
    this._pendingLevelReload = null;
    this._pendingTimerSnapshot = null;
    this._currentLevelType = null; // "normal" or "user"
    this._currentUserLevelId = null;
  }

  init() {
    this.bindEvents();
    this.switcher.staticSwitcher.showMainMenu(this.p, this.eventBus);
  }

  bindEvents() {
    this.eventBus.subscribe(EventTypes.LOAD_LEVEL, (loadRequest) => {
      // Check if this is a user-created level
      if (loadRequest?.levelType === "user" || this._currentLevelType === "user") {
        const levelId = loadRequest?.levelId || this._currentUserLevelId;
        window.getUserLevel(levelId)
          .then((levelJSON) => {
            try {
              const levelData = JSON.parse(levelJSON);
              const userLevel = new UserLevel(this.p, this.eventBus, levelData);

              this._pendingTimerSnapshot = null;
              this.switcher.clearOverlay(this.p);
              if (this.levelManager.level) {
                this.levelManager.setPaused(false);
                this.levelManager.unloadLevel(this.p, this.eventBus);
                this.switcher.gameSwitcher.runtimeLevelManager = null;
              }

              this.levelManager.loadLevelInstance(userLevel, this.p);
              this.switcher.gameSwitcher.runtimeLevelManager = this.levelManager;

              this._currentLevelType = "user";
              this._currentUserLevelId = levelId;

              const gamePage = this.switcher.gameSwitcher.createLevelPage(
                "user",
                this.p,
              );
              this.switcher.switchToGame(gamePage, this.p);
            } catch (error) {
              console.error("[AppCoordinator] Failed to parse user level:", error);
              alert("关卡数据错误，加载失败");
            }
          })
          .catch((error) => {
            console.error("[AppCoordinator] Failed to load user level:", error);
            alert("关卡加载失败，请检查网络");
          });
        return;
      }

      // Original built-in level loading
      const { levelIndex, startCheckpoint, preserveTimer } =
        this._normalizeLoadLevelRequest(loadRequest);
      console.log(
        "[AppCoordinator.LOAD_LEVEL] Event received with payload:",
        loadRequest,
      );
      if (!levelIndex) {
        console.warn(
          "[AppCoordinator.LOAD_LEVEL] Missing levelIndex in payload",
        );
        return;
      }
      this._pendingTimerSnapshot = preserveTimer
        ? this._captureActiveGamePageTimerSnapshot()
        : null;
      this.switcher.clearOverlay(this.p);
      if (this.levelManager.level) {
        this.levelManager.setPaused(false);
        this.levelManager.unloadLevel(this.p, this.eventBus);
        this.switcher.gameSwitcher.runtimeLevelManager = null;
      }

      this.playLevelBgm(levelIndex);

      console.log("[AppCoordinator.LOAD_LEVEL] Calling loadLevel with:", {
        levelIndex,
        startCheckpoint,
      });
      this.levelManager.loadLevel(levelIndex, this.p, this.eventBus, {
        startCheckpoint,
      });
      this.switcher.gameSwitcher.runtimeLevelManager = this.levelManager;

      this._currentLevelType = "normal";
      this._currentUserLevelId = null;

      const gamePage = this.switcher.gameSwitcher.createLevelPage(
        levelIndex,
        this.p,
      );
      if (this._pendingTimerSnapshot) {
        gamePage?.restoreTimerSnapshot?.(this._pendingTimerSnapshot);
        this._pendingTimerSnapshot = null;
      }
      this.switcher.switchToGame(gamePage, this.p);
    });

    this.eventBus.subscribe(EventTypes.UNLOAD_LEVEL, () => {
      this._pendingTimerSnapshot = null;
      this.switcher.clearOverlay(this.p);
      this.levelManager.setPaused(false);
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;
      this.switcher.staticSwitcher.showMainMenu(this.p, this.eventBus);
    });

    this.eventBus.subscribe(EventTypes.RETURN_LEVEL_CHOICE, () => {
      // Handle user-created levels
      if (this._currentLevelType === "user") {
        this.switcher.clearOverlay(this.p);
        if (this.levelManager.level) {
          this.levelManager.setPaused(false);
          this.levelManager.unloadLevel(this.p, this.eventBus);
          this.switcher.gameSwitcher.runtimeLevelManager = null;
        }
        this._currentLevelType = null;
        this._currentUserLevelId = null;
        this.switcher.staticSwitcher.showUserLevelList(this.p);
        return;
      }

      this._pendingTimerSnapshot = null;
      const levelIndex = this.levelManager.currentLevelIndex;
      const mode = this._getLevelMode(levelIndex);

      this.switcher.clearOverlay(this.p);
      this.levelManager.setPaused(false);
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;

      const choiceScreens = {
        demo2:   () => this.switcher.staticSwitcher.showLevelChoiceDemo2(this.p),
        easy:    () => this.switcher.staticSwitcher.showLevelChoiceEasy(this.p),
        hard:    () => this.switcher.staticSwitcher.showLevelChoiceHard(this.p),
        special: () => this.switcher.staticSwitcher.showLevelChoiceSpecial(this.p),
        demo1:   () => this.switcher.staticSwitcher.showLevelChoice(this.p),
      };
      (choiceScreens[mode] ?? (() => this.switcher.staticSwitcher.showWorldSelect(this.p)))();
    });

    this.eventBus.subscribe(EventTypes.AUTO_RESULT, (result) => {
      const levelIndex = this.levelManager.currentLevelIndex;
      const mode = this._getLevelMode(levelIndex);

      if (result === "autoResult1") {
        this._pendingTimerSnapshot = null;
        this.levelManager.unloadLevel(this.p, this.eventBus);
        this.switcher.gameSwitcher.runtimeLevelManager = null;

        // Map difficulty mode to its win-screen class.
        const winPageMap = {
          demo1:   StaticPageWinDemo1,
          demo2:   StaticPageWinDemo2,
          easy:    StaticPageWinEasy,
          hard:    StaticPageWinEasy,
          special: StaticPageWinEasy,
        };
        const WinPage = winPageMap[mode] ?? StaticPageWinDemo1;
        const winPage = new WinPage(levelIndex, this.switcher, this.p, this.eventBus);
        this.switcher.switchToStatic(winPage, this.p);
        return;
      }

      // Lose: pause game and show overlay on top of the game.
      // demo1 uses its own result page; all other modes share Demo2's result page.

      // Handle user-created levels death reload
      if (this._currentLevelType === "user") {
        this.levelManager.setPaused(true);
        const resultPage = new StaticPageResultDemo2(result, "user_level", this.switcher, this.p, this.eventBus);
        this.switcher.setOverlay(resultPage, this.p);
        return;
      }

      this.levelManager.setPaused(true);
      const ResultPage = mode === "demo1" ? StaticPageResultDemo1 : StaticPageResultDemo2;
      const resultPage = new ResultPage(result, levelIndex, this.switcher, this.p, this.eventBus);
      this.switcher.setOverlay(resultPage, this.p);
    });

    this.eventBus.subscribe(EventTypes.ACTIVATE_DEV_MODE, () => {
      const level = this.levelManager.level;
      if (level && level._mapEditor) {
        level._mapEditor.activate();
      }
    });

    this.eventBus.subscribe(EventTypes.PAUSE_GAME, () => {
      this.levelManager.setPaused(true);
    });

    this.eventBus.subscribe(EventTypes.RESUME_GAME, () => {
      this.levelManager.setPaused(false);
    });
  }

  /**
   * Returns the difficulty mode for a levelIndex string.
   * @param {string} levelIndex
   * @returns {"demo1"|"demo2"|"easy"|"hard"|"special"|"unknown"}
   */
  _getLevelMode(levelIndex) {
    if (typeof levelIndex !== "string") return "unknown";
    if (levelIndex.startsWith("demo2_"))   return "demo2";
    if (levelIndex.startsWith("easy_"))    return "easy";
    if (levelIndex.startsWith("hard_"))    return "hard";
    if (levelIndex.startsWith("special_")) return "special";
    return "demo1";
  }

  _normalizeLoadLevelRequest(loadRequest) {
    if (typeof loadRequest === "string") {
      return {
        levelIndex: loadRequest,
        startCheckpoint: null,
        preserveTimer: false,
      };
    }

    if (loadRequest && typeof loadRequest === "object") {
      return {
        levelIndex: loadRequest.levelIndex ?? null,
        startCheckpoint: loadRequest.startCheckpoint ?? null,
        preserveTimer: loadRequest.preserveTimer === true,
      };
    }

    return {
      levelIndex: null,
      startCheckpoint: null,
      preserveTimer: false,
    };
  }

  _captureActiveGamePageTimerSnapshot() {
    return (
      this.switcher?.gameSwitcher?.currentPage?.captureTimerSnapshot?.() ?? null
    );
  }

  _flushPendingLevelReload() {
    if (!this._pendingLevelReload) {
      return;
    }

    const pendingLoadRequest = this._pendingLevelReload;
    this._pendingLevelReload = null;
    this.eventBus.publish(EventTypes.LOAD_LEVEL, pendingLoadRequest);
  }

  /**
   * Play the BGM track for a given level. easy/hard/special share the same
   * tracks as demo1 (strip the prefix). demo2 has no BGM (stopBGM).
   * @param {string} levelIndex
   */
  playLevelBgm(levelIndex) {
    // Strip easy/hard/special prefix to get the base track key (e.g. "level3").
    // demo2 levels don't match this pattern, so they fall through to stopBGM.
    const match = String(levelIndex).match(/^(?:easy_|hard_|special_)?(level\d+)$/);
    if (match) {
      AudioManager.playBGM(match[1]);
    } else {
      AudioManager.stopBGM();
    }
  }

  updateFrame() {
    this._flushPendingLevelReload();
    this.switcher.update(this.p);
    this.switcher.draw(this.p);
    this.levelManager.update(this.p, this.eventBus);

    const deathReloadRequest = this.levelManager.consumePendingDeathReload();
    if (deathReloadRequest) {
      this._pendingLevelReload = deathReloadRequest;
    }

    // Draw overlay after level rendering (game over, etc.)
    if (this.switcher.overlay) {
      this.p.push();
      this.p.resetMatrix();
      this.switcher.overlay.draw();
      this.p.pop();
    }
  }
}
