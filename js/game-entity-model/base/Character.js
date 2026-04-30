import { CharacterEffects } from "./CharacterEffects.js";
import { AudioManager } from "../../AudioManager.js";

export class Character extends CharacterEffects {
  constructor(x, y) {
    super(x, y);

    // Death state
    // 死亡状态
    this.deathState = {
      isDead: false,
      initialized: false,
      deathType: null,
    };

    // Sprite / idle animation state (used by both Player and Replayer)
    // 精灵图/待机动画状态（玩家和重放者共用）
    this._lastSprite = null;
    this._idleStartMs = null;
    this._idleDelayMs = 2000;
    this._idleFrameDurationMs = 120;
    this._idleSequence = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  }

  // ── Death ─────────────────────────────────────────────────────

  triggerDeath(deathType = "default") {
    if (this.deathState.isDead) return;
    this.deathState.isDead = true;
    this.deathState.deathType = deathType;
    this.deathState.initialized = false;
    AudioManager.playSFX("dead");
  }

  initDeathEffect() {
    if (this.deathState.isDead && !this.deathState.initialized) {
      switch (this.deathState.deathType) {
        case "spike":
          this.initSpikeDeath();
          break;
        default:
          this.initSpikeDeath();
      }
      this.deathState.initialized = true;
    }
  }

  initSpikeDeath() {
    if (this.movementComponent) {
      this.movementComponent.velX = 0;
      this.movementComponent.velY = 8;
    }
  }

  // ── Listeners (delegates to ControllerManager) ────────────────
  // ── 事件监听器（委托给 ControllerManager）────────────────────

  createListeners() {
    this.controllerManager.createListeners();
  }

  clearListeners() {
    this.controllerManager.clearListeners();
  }

  /**
   * @alias clearListeners — used by replayer call sites
   * @alias clearListeners — 供重放器调用点使用
   */
  clearEventListeners() {
    this.clearListeners();
  }
}
