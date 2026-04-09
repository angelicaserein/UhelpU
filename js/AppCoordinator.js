import "./i18nDemo1.js"; // 注册 Demo1 关卡专属文案
import "./i18nDemo2.js"; // 注册 Demo2 关卡专属文案
import "./i18nEasy.js"; // 注册 Easy 模式关卡专属文案
import { SwitcherMain } from "./switchers/SwitcherMain.js";
import { EventBus } from "./event-system/EventBus.js";
import { EventTypes } from "./event-system/EventTypes.js";
import { LevelManager } from "./level-design/LevelManager.js";
import { StaticPageResultDemo1 } from "./ui/pages/static-pages/StaticPageResultDemo1.js";
import { StaticPageResultDemo2 } from "./ui/pages/static-pages/StaticPageResultDemo2.js";
import { StaticPageWinDemo1 } from "./ui/pages/static-pages/StaticPageWinDemo1.js";
import { StaticPageWinDemo2 } from "./ui/pages/static-pages/StaticPageWinDemo2.js";
import { AudioManager } from "./AudioManager.js";

export class AppCoordinator {
  constructor(p) {
    this.p = p;
    this.eventBus = new EventBus();
    this.switcher = new SwitcherMain(p, this.eventBus);
    this.levelManager = new LevelManager(p, this.eventBus);
  }

  init() {
    this.bindEvents();
    this.switcher.staticSwitcher.showMainMenu(this.p, this.eventBus);
  }

  bindEvents() {
    this.eventBus.subscribe(EventTypes.LOAD_LEVEL, (levelIndex) => {
      console.log("[AppCoordinator.LOAD_LEVEL] Event received with levelIndex:", levelIndex);
      this.switcher.clearOverlay(this.p);
      if (this.levelManager.level) {
        this.levelManager.setPaused(false);
        this.levelManager.unloadLevel(this.p, this.eventBus);
        this.switcher.gameSwitcher.runtimeLevelManager = null;
      }

      this.playLevelBgm(levelIndex);

      console.log("[AppCoordinator.LOAD_LEVEL] Calling loadLevel with:", levelIndex);
      this.levelManager.loadLevel(levelIndex, this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = this.levelManager;

      const gamePage = this.switcher.gameSwitcher.createLevelPage(
        levelIndex,
        this.p,
      );
      this.switcher.switchToGame(gamePage, this.p);
    });

    this.eventBus.subscribe(EventTypes.UNLOAD_LEVEL, () => {
      this.switcher.clearOverlay(this.p);
      this.levelManager.setPaused(false);
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;
      this.switcher.staticSwitcher.showMainMenu(this.p, this.eventBus);
    });

    this.eventBus.subscribe(EventTypes.RETURN_LEVEL_CHOICE, () => {
      const levelIndex = this.levelManager.currentLevelIndex;
      const isDemo2 =
        typeof levelIndex === "string" && levelIndex.startsWith("demo2_");
      const isEasy =
        typeof levelIndex === "string" && levelIndex.startsWith("easy_");

      this.switcher.clearOverlay(this.p);
      this.levelManager.setPaused(false);
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;

      if (isDemo2) {
        this.switcher.staticSwitcher.showLevelChoiceDemo2(this.p);
      } else if (isEasy) {
        this.switcher.staticSwitcher.showLevelChoiceEasy(this.p);
      } else if (typeof levelIndex === "string") {
        this.switcher.staticSwitcher.showLevelChoice(this.p);
      } else {
        this.switcher.staticSwitcher.showWorldSelect(this.p);
      }
    });

    this.eventBus.subscribe(EventTypes.AUTO_RESULT, (result) => {
      const levelIndex = this.levelManager.currentLevelIndex;

      const isDemo2 = levelIndex.startsWith("demo2_") || levelIndex.startsWith("easy_");

      if (result === "autoResult1") {
        this.levelManager.unloadLevel(this.p, this.eventBus);
        this.switcher.gameSwitcher.runtimeLevelManager = null;
        const WinPage = isDemo2 ? StaticPageWinDemo2 : StaticPageWinDemo1;
        const winPage = new WinPage(
          levelIndex,
          this.switcher,
          this.p,
          this.eventBus,
        );
        this.switcher.switchToStatic(winPage, this.p);
        return;
      }

      // Lose: pause game and show overlay on top of the game
      this.levelManager.setPaused(true);
      const ResultPage = isDemo2
        ? StaticPageResultDemo2
        : StaticPageResultDemo1;
      const resultPage = new ResultPage(
        result,
        levelIndex,
        this.switcher,
        this.p,
        this.eventBus,
      );
      this.switcher.setOverlay(resultPage, this.p);
    });

    this.eventBus.subscribe("activateDevMode", () => {
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

  playLevelBgm(levelIndex) {
    const normalizedLevelIndex =
      typeof levelIndex === "string" && levelIndex.startsWith("easy_")
        ? levelIndex.replace("easy_", "")
        : levelIndex;

    if (normalizedLevelIndex === "level1") {
      AudioManager.playBGM("level1");
      return;
    }
    if (normalizedLevelIndex === "level2") {
      AudioManager.playBGM("level2");
      return;
    }
    if (normalizedLevelIndex === "level3") {
      AudioManager.playBGM("level3");
      return;
    }
    if (normalizedLevelIndex === "level4") {
      AudioManager.playBGM("level4");
      return;
    }
    if (normalizedLevelIndex === "level5") {
      AudioManager.playBGM("level5");
      return;
    }
    if (normalizedLevelIndex === "level6") {
      AudioManager.playBGM("level6");
      return;
    }
    if (normalizedLevelIndex === "level7") {
      AudioManager.playBGM("level7");
      return;
    }
    if (normalizedLevelIndex === "level8") {
      AudioManager.playBGM("level8");
      return;
    }
    if (normalizedLevelIndex === "level9") {
      AudioManager.playBGM("level9");
      return;
    }
    if (normalizedLevelIndex === "level10") {
      AudioManager.playBGM("level10");
      return;
    }
    AudioManager.stopBGM();
  }

  updateFrame() {
    this.switcher.update(this.p);
    this.switcher.draw(this.p);
    this.levelManager.update(this.p, this.eventBus);
    // Draw overlay after level rendering (game over, etc.)
    if (this.switcher.overlay) {
      this.p.push();
      this.p.resetMatrix();
      this.switcher.overlay.draw();
      this.p.pop();
    }
  }
}
