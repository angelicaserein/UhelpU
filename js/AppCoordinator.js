import "./i18nDemo1.js"; // 注册 Demo1 关卡专属文案
import "./i18nDemo2.js"; // 注册 Demo2 关卡专属文案
import { SwitcherMain } from "./switchers/SwitcherMain.js";
import { EventBus } from "./event-system/EventBus.js";
import { EventTypes } from "./event-system/EventTypes.js";
import { LevelManager } from "./level-design/LevelManager.js";
import { StaticPageResultDemo1 } from "./ui/pages/static-pages/StaticPageResultDemo1.js";
import { StaticPageResultDemo2 } from "./ui/pages/static-pages/StaticPageResultDemo2.js";
import { StaticPageWinDemo1 } from "./ui/pages/static-pages/StaticPageWinDemo1.js";
import { StaticPageWinDemo2 } from "./ui/pages/static-pages/StaticPageWinDemo2.js";
import { AudioManager } from "./AudioManager.js";
import { PortalTransition } from "./ui/effects/PortalTransition.js";

export class AppCoordinator {
  constructor(p) {
    this.p = p;
    this.eventBus = new EventBus();
    this.switcher = new SwitcherMain(p, this.eventBus);
    this.levelManager = new LevelManager(p, this.eventBus);
    this.portalTransition = new PortalTransition();
    this._exitTransitionShown = false;
  }

  init() {
    this.bindEvents();
    this.switcher.staticSwitcher.showMainMenu(this.p, this.eventBus);
  }

  bindEvents() {
    this.eventBus.subscribe(EventTypes.LOAD_LEVEL, (levelIndex) => {
      this.switcher.clearOverlay(this.p);
      if (this.levelManager.level) {
        this.levelManager.setPaused(false);
        this.levelManager.unloadLevel(this.p, this.eventBus);
        this.switcher.gameSwitcher.runtimeLevelManager = null;
      }

      this.playLevelBgm(levelIndex);

      this.levelManager.loadLevel(levelIndex, this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = this.levelManager;

      const gamePage = this.switcher.gameSwitcher.createLevelPage(
        levelIndex,
        this.p,
      );
      this.switcher.switchToGame(gamePage, this.p);

      // If exiting from a win transition, start the enter transition
      if (this._exitTransitionShown) {
        this._exitTransitionShown = false;
        const player = this.levelManager.level?.getPlayer();
        if (player) {
          this.portalTransition.startEnter(player.x, player.y);
          this.levelManager.portalTransition = this.portalTransition;
        }
      }
    });

    this.eventBus.subscribe(EventTypes.UNLOAD_LEVEL, () => {
      this.switcher.clearOverlay(this.p);
      this.levelManager.setPaused(false);
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;
      this.switcher.staticSwitcher.showMainMenu(this.p, this.eventBus);
    });

    this.eventBus.subscribe(EventTypes.RETURN_LEVEL_CHOICE, () => {
      this.switcher.clearOverlay(this.p);
      this.levelManager.setPaused(false);
      this.levelManager.unloadLevel(this.p, this.eventBus);
      this.switcher.gameSwitcher.runtimeLevelManager = null;
      this.switcher.staticSwitcher.showWorldSelect(this.p);
    });

    this.eventBus.subscribe(EventTypes.AUTO_RESULT, (result) => {
      const levelIndex = this.levelManager.currentLevelIndex;

      const isDemo2 = levelIndex.startsWith("demo2_");

      if (result === "autoResult1") {
        // Win - start portal transition with player position
        const player = this.levelManager.level?.getPlayer();
        if (player) {
          const maxRadius = Math.max(this.p.width, this.p.height) * 0.7;
          this.portalTransition.startExit(player.x, player.y, maxRadius);
        } else {
          // Fallback if player not found
          this.portalTransition.startExit(this.p.width / 2, this.p.height / 2, 600);
        }
        this.levelManager.portalTransition = this.portalTransition;
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
    if (levelIndex === "level4") {
      AudioManager.playBGM("level4");
      return;
    }
    if (levelIndex === "level5") {
      AudioManager.playBGM("level5");
      return;
    }
    if (levelIndex === "level6") {
      AudioManager.playBGM("level6");
      return;
    }
    if (levelIndex === "level7") {
      AudioManager.playBGM("level7");
      return;
    }
    if (levelIndex === "level8") {
      AudioManager.playBGM("level8");
      return;
    }
    if (levelIndex === "level9") {
      AudioManager.playBGM("level9");
      return;
    }
    if (levelIndex === "level10") {
      AudioManager.playBGM("level10");
      return;
    }
    AudioManager.stopBGM();
  }

  updateFrame() {
    // Update portal transition if active
    if (this.portalTransition.isActive) {
      const phase = this.portalTransition.update();

      // When exit transition is done (fade_out complete), unload level and show win screen
      if (this.portalTransition.mode === 'exit' && phase === 'done' && !this._exitTransitionShown) {
        this._exitTransitionShown = true;
        const levelIndex = this.levelManager.currentLevelIndex;
        const isDemo2 = levelIndex.startsWith("demo2_");

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
      }

      // When enter transition is done, reset transition for next level
      if (this.portalTransition.mode === 'enter' && phase === 'done') {
        this.portalTransition = new PortalTransition();
        this._enterTransitionDone = false;
      }
    }

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
