import { Level1 } from "./demo1/Level1.js";
import { Level2 } from "./demo1/Level2.js";
import { Level3 } from "./demo1/Level3.js";
import { Level4 } from "./demo1/Level4.js";
import { Level5 } from "./demo1/Level5.js";
import { Level6 } from "./demo1/Level6.js";
import { Level7 } from "./demo1/Level7.js";
import { Level8 } from "./demo1/Level8.js";
import { Level9 } from "./demo1/Level9.js";
import { Level10 } from "./demo1/Level10.js";
import { Level1 as Demo2Level1 } from "./demo2/Level1.js";
import { Level2 as Demo2Level2 } from "./demo2/Level2.js";
import { Level3 as Demo2Level3 } from "./demo2/Level3.js";
import { Level4 as Demo2Level4 } from "./demo2/Level4.js";
import { Level5 as Demo2Level5 } from "./demo2/Level5.js";
import { Level6 as Demo2Level6 } from "./demo2/Level6.js";
import { Level7 as Demo2Level7 } from "./demo2/Level7.js";
import { Level8 as Demo2Level8 } from "./demo2/Level8.js";
import { Level9 as Demo2Level9 } from "./demo2/Level9.js";
import { Level10 as Demo2Level10 } from "./demo2/Level10.js";
import { setGamePaused, isGamePaused } from "../game-runtime/GamePauseState.js";
import { EventTypes } from "../event-system/EventTypes.js";
import { Assets } from "../AssetsManager.js";
import { t } from "../i18n.js";
import { CheckpointSystem } from "./CheckpointSystem.js";

export class LevelManager {
  constructor(p, eventBus) {
    this.p = p;
    this.eventBus = eventBus;
    this.levelMap = {
      level1: Level1,
      level2: Level2,
      level3: Level3,
      level4: Level4,
      level5: Level5,
      level6: Level6,
      level7: Level7,
      level8: Level8,
      level9: Level9,
      level10: Level10,
      demo2_level1: Demo2Level1,
      demo2_level2: Demo2Level2,
      demo2_level3: Demo2Level3,
      demo2_level4: Demo2Level4,
      demo2_level5: Demo2Level5,
      demo2_level6: Demo2Level6,
      demo2_level7: Demo2Level7,
      demo2_level8: Demo2Level8,
      demo2_level9: Demo2Level9,
      demo2_level10: Demo2Level10,
    };
    this.level = null;
    this.currentLevelIndex = null;
    this.cameraNudgeX = 0;
    this.maxCameraNudgeX = 60;
    this.cameraNudgeLerp = 0.02;
    this.bgParallaxFactor = 1.8;
    this.levelTitleOverlay = {
      active: false,
      startedAtMs: 0,
      totalDurationMs: 3500,
      fadeStartMs: 1800,
      titleKey: "",
    };

    // 存档点系统
    this._checkpointSystem = new CheckpointSystem(() => this.level);
  }

  startLevelTitleOverlay(levelIndex, p = this.p) {
    const num = String(levelIndex || "").replace("level", "");
    const key = "level" + num + "_title";
    this.levelTitleOverlay.active = true;
    this.levelTitleOverlay.startedAtMs = p?.millis
      ? p.millis()
      : performance.now();
    this.levelTitleOverlay.titleKey = key;
  }

  drawLevelTitleOverlay(p = this.p) {
    const overlay = this.levelTitleOverlay;
    if (!overlay.active || !overlay.titleKey) return;

    const nowMs = p?.millis ? p.millis() : performance.now();
    const elapsed = nowMs - overlay.startedAtMs;
    if (elapsed >= overlay.totalDurationMs) {
      overlay.active = false;
      return;
    }

    let alphaRate = 1;
    if (elapsed > overlay.fadeStartMs) {
      const fadeDuration = Math.max(
        1,
        overlay.totalDurationMs - overlay.fadeStartMs,
      );
      alphaRate = 1 - (elapsed - overlay.fadeStartMs) / fadeDuration;
    }
    alphaRate = Math.max(0, Math.min(1, alphaRate));

    const centerY = p.height * 0.28;
    const bandH = Math.max(46, p.height * 0.072);
    const coreBandW = p.width * 0.54;
    const sideFadeOuterW = p.width * 0.3;
    const sideFadeInnerExtendW = p.width * 0.08;
    const sideFadeW = sideFadeOuterW + sideFadeInnerExtendW;
    const bandY = centerY - bandH * 0.5;
    const coreBandX = (p.width - coreBandW) * 0.5;
    const leftOuterX = coreBandX - sideFadeOuterW;
    const rightOuterX = coreBandX + coreBandW + sideFadeOuterW - 1;

    p.push();
    p.resetMatrix();
    p.noStroke();

    // Keep top/bottom edges crisp; only keep left/right side gradients.
    for (let i = 0; i < sideFadeW; i++) {
      const t = i / Math.max(1, sideFadeW - 1);
      const a = (1 - t) * 108 * alphaRate;
      p.fill(255, 255, 255, a);

      // Keep outer edges fixed; grow only inward.
      p.rect(leftOuterX + i, bandY, 1, bandH, 0);
      p.rect(rightOuterX - i, bandY, 1, bandH, 0);
    }

    const titleText = t(overlay.titleKey);
    p.fill(255, 255, 255, 248 * alphaRate);
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) {
      p.textFont(Assets.customFont);
    }
    p.textStyle(p.BOLD);
    p.textSize(Math.max(26, Math.floor(p.width * 0.03)));
    p.text(titleText, p.width * 0.5, centerY);

    p.pop();
  }

  updateCameraNudge() {
    if (!this.level || typeof this.level.getPlayer !== "function") {
      this.cameraNudgeX = 0;
      return;
    }

    const player = this.level.getPlayer();
    const velX = player?.movementComponent?.velX ?? 0;
    if (Math.abs(velX) <= 0.06) {
      // 松开移动键后保持当前位置，不回弹到中心
      return;
    }

    const moveSpeed =
      player?.controllerManager?.currentControlComponent?.moveSpeed ?? 4;
    const speedRatio = Math.min(1, Math.abs(velX) / Math.max(0.001, moveSpeed));
    const targetNudge = Math.sign(velX) * this.maxCameraNudgeX * speedRatio;

    this.cameraNudgeX +=
      (targetNudge - this.cameraNudgeX) * this.cameraNudgeLerp;
  }

  loadLevel(levelIndex, p = this.p, eventBus = this.eventBus) {
    if (!this.level) {
      const LevelClass = this.levelMap[levelIndex];
      this.level = new LevelClass(p, eventBus);
      this.level.__levelIndex = levelIndex;
      this.level.__editorPersistenceKey = levelIndex;
      this.currentLevelIndex = levelIndex;
      this.cameraNudgeX = 0;
      this.startLevelTitleOverlay(levelIndex, p);
      console.log("load level: " + levelIndex);
    }
  }
  unloadLevel(p = this.p, eventBus = this.eventBus) {
    if (this.level) {
      this.level.clearLevel(p, eventBus);
      this.level = null;
      this.cameraNudgeX = 0;
      // 卸载关卡后强制清空画布，防止残留
      if (p && typeof p.clear === "function") {
        p.clear();
      } else if (p && typeof p.background === "function") {
        p.background(255);
      }
      console.log("unload level");
    }
  }
  update(p = this.p, eventBus = this.eventBus) {
    if (!this.level) {
      return;
    }

    if (!isGamePaused()) {
      this.level.updatePhysics && this.level.updatePhysics(p);
      this.level.updateCollision && this.level.updateCollision(p, eventBus);
      // 检测死亡的玩家是否超出画面
      this.checkDeadPlayerOutOfBounds(p, eventBus);
    }

    // 死亡结算等事件可能在同一帧中卸载关卡，后续不应继续访问 this.level
    if (!this.level) {
      return;
    }

    // 编辑器激活时禁用镜头微移，避免鼠标坐标与渲染位置不一致
    const editorActive = this.level?._mapEditor?.active;
    if (!editorActive) {
      this.updateCameraNudge();
    } else {
      this.cameraNudgeX = 0;
    }
    const renderNudgeX = Math.round(this.cameraNudgeX);
    this.flipY(p);
    this.level.clearCanvas &&
      this.level.clearCanvas(p, renderNudgeX, this.bgParallaxFactor);

    p.push();
    p.translate(-renderNudgeX, 0);
    this.level.draw && this.level.draw(p);
    p.pop();

    this.drawLevelTitleOverlay(p);
  }

  setPaused(paused) {
    setGamePaused(!!paused);

    if (this.level && this.level.recordSystem) {
      if (
        paused &&
        typeof this.level.recordSystem.pauseForGamePause === "function"
      ) {
        this.level.recordSystem.pauseForGamePause();
      }
      if (
        !paused &&
        typeof this.level.recordSystem.resumeFromGamePause === "function"
      ) {
        this.level.recordSystem.resumeFromGamePause();
      }
    }

    if (!paused || !this.level) return;

    for (const entity of this.level.entities || []) {
      if (
        entity.controllerManager &&
        typeof entity.controllerManager.resetInputState === "function"
      ) {
        entity.controllerManager.resetInputState();
      }
    }

    if (
      this.level.recordSystem &&
      typeof this.level.recordSystem.resetInputState === "function"
    ) {
      this.level.recordSystem.resetInputState();
    }
    if (
      this.level.recordSystem &&
      this.level.recordSystem.clip &&
      typeof this.level.recordSystem.clip.resetInputState === "function"
    ) {
      this.level.recordSystem.clip.resetInputState();
    }
  }
  flipY(p = this.p) {
    p.translate(0, p.height);
    p.scale(1, -1);
  }

  // 检查死亡的玩家是否超出画面边界
  checkDeadPlayerOutOfBounds(p = this.p, eventBus = this.eventBus) {
    if (!this.level) return;

    // 获取玩家引用
    let player = null;
    for (const entity of this.level.entities) {
      if (entity.type === "player") {
        player = entity;
        break;
      }
    }

    if (player && player.deathState && player.deathState.isDead) {
      const viewBounds =
        this.level && typeof this.level.getViewBounds === "function"
          ? this.level.getViewBounds(p)
          : { minX: 0, maxX: p.width, minY: 0, maxY: p.height };

      // 检查玩家是否超出画面（任何方向超出都算）
      if (
        player.x > viewBounds.maxX ||
        player.x + player.collider.w < viewBounds.minX ||
        player.y > viewBounds.maxY ||
        player.y + player.collider.h < viewBounds.minY
      ) {
        // 查找最近的已激活存档点
        const checkpoint =
          this._checkpointSystem.findNearestActivatedCheckpoint(player);
        if (checkpoint) {
          this._checkpointSystem.respawnPlayerAtCheckpoint(player, checkpoint);
        } else {
          // 没有存档点，发布结算事件
          eventBus && eventBus.publish(EventTypes.AUTO_RESULT, "autoResult2");
        }
      }
    }
  }
}
