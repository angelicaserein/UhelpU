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

      console.log("[PortalTransition] AUTO_RESULT triggered:", result, "level:", levelIndex);

      if (result === "autoResult1") {
        // Win - start portal EXIT transition with player position
        const player = this.levelManager.level?.getPlayer();
        console.log("[PortalTransition] Player position:", player ? {x: player.x, y: player.y} : "not found");

        if (player) {
          const maxRadius = Math.max(this.p.width, this.p.height) * 0.7;
          this.portalTransition.startExit(player.x + player.collider.w / 2,
                                          this.p.height - (player.y + player.collider.h / 2),
                                          maxRadius);
          console.log("[PortalTransition] Started EXIT at:", {
            x: player.x + player.collider.w / 2,
            y: this.p.height - (player.y + player.collider.h / 2),
            radius: maxRadius
          });
        } else {
          this.portalTransition.startExit(this.p.width / 2, this.p.height / 2, 600);
          console.log("[PortalTransition] Started EXIT (fallback)");
        }
        this.levelManager.portalTransition = this.portalTransition;
        this._transitionLevelIndex = levelIndex;
        return;
      }

      // Lose: pause game and show overlay
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
    // Maps for BGM by level
    const bgmMap = {
      level1: "level1", level2: "level2", level3: "level3", level4: "level4",
      level5: "level5", level6: "level6", level7: "level7", level8: "level8",
      level9: "level9", level10: "level10",
      demo2_level1: "level1", demo2_level2: "level2", demo2_level3: "level3",
      demo2_level4: "level4", demo2_level5: "level5", demo2_level6: "level6",
      demo2_level7: "level7", demo2_level8: "level8", demo2_level9: "level9",
      demo2_level10: "level10",
    };

    if (bgmMap[levelIndex]) {
      AudioManager.playBGM(bgmMap[levelIndex]);
    } else {
      AudioManager.stopBGM();
    }
  }

  updateFrame() {
    // Update portal transition
    if (this.portalTransition.isActive) {
      const phase = this.portalTransition.update();

      if (!this._transitionDebugLogged) {
        console.log("[Portal] Transition started, mode:", this.portalTransition.mode);
        this._transitionDebugLogged = true;
      }

      if (this.portalTransition.isActive) {
        console.log("[Portal] Mode:", this.portalTransition.mode, "Radius:", this.portalTransition.vignetteRadius, "Center:", this.portalTransition.vignetteCenter);
      }

      // When EXIT transition completes (vignette shrunk to point, screen all black)
      if (this.portalTransition.mode === 'exit' && phase === 'done' && !this._exitTransitionDone) {
        console.log("[Portal] EXIT phase completed, loading next level");
        this._exitTransitionDone = true;

        const levelIndex = this._transitionLevelIndex;
        const levelNum = parseInt(levelIndex.replace(/.*level/, ""), 10);
        const isDemo2 = levelIndex.startsWith("demo2_");
        const levelPrefix = isDemo2 ? "demo2_level" : "level";
        const TOTAL_LEVELS = 10;

        // Determine next level or return to level choice
        let nextLevelIndex;
        if (levelNum < TOTAL_LEVELS) {
          nextLevelIndex = `${levelPrefix}${levelNum + 1}`;
        } else {
          // Last level - return to level choice
          console.log("[Portal] Last level, returning to level choice");
          this.switcher.clearOverlay(this.p);
          this.portalTransition = new PortalTransition();
          this._exitTransitionDone = false;
          this._transitionDebugLogged = false;
          this.switcher.staticSwitcher.showWorldSelect(this.p);
          return;
        }

        console.log("[Portal] Loading next level:", nextLevelIndex);

        // UNLOAD old level, LOAD new level
        this.switcher.clearOverlay(this.p);
        this.levelManager.unloadLevel(this.p, this.eventBus);
        this.switcher.gameSwitcher.runtimeLevelManager = null;

        this.playLevelBgm(nextLevelIndex);
        this.levelManager.loadLevel(nextLevelIndex, this.p, this.eventBus);
        this.switcher.gameSwitcher.runtimeLevelManager = this.levelManager;

        const gamePage = this.switcher.gameSwitcher.createLevelPage(nextLevelIndex, this.p);
        this.switcher.switchToGame(gamePage, this.p);

        // START ENTER transition: vignette expands from player spawn point
        const newPlayer = this.levelManager.level?.getPlayer();
        if (newPlayer) {
          const maxRadius = Math.max(this.p.width, this.p.height) * 0.8;
          // Convert game coordinates to screen coordinates for vignette center
          const screenX = newPlayer.x + newPlayer.collider.w / 2;
          const screenY = this.p.height - (newPlayer.y + newPlayer.collider.h / 2);

          console.log("[Portal] Starting ENTER transition at:", {x: screenX, y: screenY});
          this.portalTransition.startEnter(screenX, screenY, maxRadius);
          this.levelManager.portalTransition = this.portalTransition;
        }
      }

      // When ENTER transition completes (vignette expanded to full screen)
      if (this.portalTransition.mode === 'enter' && phase === 'done') {
        console.log("[Portal] ENTER phase completed");
        this.portalTransition = new PortalTransition();
        this.levelManager.portalTransition = null;
        this._exitTransitionDone = false;
        this._transitionDebugLogged = false;
      }
    }

    this.switcher.update(this.p);
    this.switcher.draw(this.p);
    this.levelManager.update(this.p, this.eventBus);

    // Draw overlay after level rendering
    if (this.switcher.overlay) {
      this.p.push();
      this.p.resetMatrix();
      this.switcher.overlay.draw();
      this.p.pop();
    }

    // Draw vignette mask on top (in screen coordinates)
    if (this.portalTransition.isActive) {
      this.p.push();
      this.p.resetMatrix();
      this.portalTransition.drawOverlay(this.p, this.p.width, this.p.height);
      this.p.pop();
    }
  }
}
