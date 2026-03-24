import { SwitcherMain } from "./switchers/SwitcherMain.js";
import { EventBus } from "./event-system/EventBus.js";
import { EventTypes } from "./event-system/EventTypes.js";
import { LevelManager } from "./level-design/LevelManager.js";
import { StaticPageResult } from "./ui/pages/static-pages/StaticPageResult.js";
import { StaticPageWin } from "./ui/pages/static-pages/StaticPageWin.js";
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
      this.playLevelBgm(levelIndex);

      this.levelManager.loadLevel(levelIndex, this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = this.levelManager;

      const levelNum = parseInt(String(levelIndex).replace("level", ""), 10);
      const gamePage = this.switcher.gameSwitcher.createLevelPage(
        levelNum,
        this.p,
      );
      this.switcher.switchToGame(gamePage, this.p);
    });

    this.eventBus.subscribe(EventTypes.UNLOAD_LEVEL, () => {
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;
      this.switcher.staticSwitcher.showMainMenu(this.p, this.eventBus);
    });

    this.eventBus.subscribe(EventTypes.RETURN_LEVEL_CHOICE, () => {
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;
      this.switcher.staticSwitcher.showLevelChoice(this.p);
    });

    this.eventBus.subscribe(EventTypes.AUTO_RESULT, (result) => {
      const levelIndex = this.levelManager.currentLevelIndex;
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;

      if (result === "autoResult1") {
        const winPage = new StaticPageWin(
          levelIndex,
          this.switcher,
          this.p,
          this.eventBus,
        );
        this.switcher.switchToStatic(winPage, this.p);
        return;
      }

      const resultPage = new StaticPageResult(
        result,
        levelIndex,
        this.switcher,
        this.p,
        this.eventBus,
      );
      this.switcher.switchToStatic(resultPage, this.p);
    });

    this.eventBus.subscribe(EventTypes.PAUSE_GAME, () => {
      this.levelManager.setPaused(true);
    });

    this.eventBus.subscribe(EventTypes.RESUME_GAME, () => {
      this.levelManager.setPaused(false);
    });
  }

  playLevelBgm(levelIndex) {
    if (levelIndex === "level1") {
      AudioManager.playBGM("level1");
      return;
    }
    if (levelIndex === "level2") {
      AudioManager.playBGM("level2");
      return;
    }
    if (levelIndex === "level3") {
      AudioManager.playBGM("level3");
      return;
    }
    AudioManager.stopBGM();
  }

  updateFrame() {
    this.switcher.update(this.p);
    this.switcher.draw(this.p);
    this.levelManager.update(this.p, this.eventBus);
  }
}
