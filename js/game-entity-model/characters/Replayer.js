import { Character } from "../base/Character.js";
import { MovementComponent } from "../../physics-system/MovementComponent.js";
import { ControllerManager } from "../../character-control-system/ControllerManager.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";

function getCloneSprite(velX, velY, isOnGround) {
  if (!isOnGround) {
    if (velY > 0) {
      if (velX > 0) return Assets.cloneImg_upRight;
      if (velX < 0) return Assets.cloneImg_upLeft;
      return Assets.cloneImg_up;
    }
    return null;
  }
  if (velX > 0) return Assets.cloneImg_right;
  if (velX < 0) return Assets.cloneImg_left;
  return null;
}

export class Replayer extends Character {
  constructor(x, y, w, h) {
    super(x, y);
    this.type = "replayer";
    this._startX = x;
    this._startY = y;
    this.isReplaying = false;
    this.movementComponent = new MovementComponent(0, 0, 0, 0);
    this.controllerManager = new ControllerManager(
      "BasicModeReplayer",
      this.movementComponent,
    );
    this.controllerManager.owner = this;
    this.collider = new RectangleCollider(ColliderType.DYNAMIC, w, h);
  }

  inLevelReset() {
    this.x = this._startX;
    this.y = this._startY;
    this.movementComponent.velX = 0;
    this.movementComponent.velY = 0;
    // Clear control state to prevent residual pressedKeys filtering next replay's keydown
    const mode = this.controllerManager.currentControlMode;
    mode.eventProcesser.clearPressedKeys();
    mode.intentResolver.resetConflictResolver();
    this._lastSprite = null;
    this._idleStartMs = null;
    this._trailParticles = [];
    this._trailEmitAccumulator = 0;
    this._jumpRingEffects = [];
    this._jumpBurstParticles = [];
    this._wasOnGround = true;
  }

  draw(p) {
    let drawX = this.x;
    let drawY = this.y;

    if (!this.isReplaying) {
      drawX = this._startX;
      drawY = this._startY;
      this.x = this._startX;
      this.y = this._startY;
      this.movementComponent.velX = 0;
      this.movementComponent.velY = 0;

      // Idle ghost rendering
      this._trailParticles = [];
      this._trailEmitAccumulator = 0;
      this._jumpRingEffects = [];
      this._jumpBurstParticles = [];
      this._idleStartMs = null;
      this._wasOnGround = true;
      const ghostSprite =
        Array.isArray(Assets.cloneIdleImgs) && Assets.cloneIdleImgs.length >= 1
          ? Assets.cloneIdleImgs[0]
          : Assets.cloneImg_right;
      this._lastSprite = ghostSprite || this._lastSprite;

      if (this._lastSprite) {
        p.push();
        p.translate(drawX, drawY + this.collider.h);
        p.scale(1, -1);
        p.tint(255, 60);
        p.image(this._lastSprite, 0, 0, this.collider.w, this.collider.h);
        p.noTint();
        p.pop();
      } else {
        p.fill(255, 200, 255, 60);
        p.rect(drawX, drawY, this.collider.w, this.collider.h);
      }
      return;
    }

    const isOnGround =
      this.controllerManager.currentControlComponent.abilityCondition[
        "isOnGround"
      ];
    if (this.movementComponent.velX > 0.05) this._trailFacing = 1;
    if (this.movementComponent.velX < -0.05) this._trailFacing = -1;

    if (
      this._wasOnGround &&
      !isOnGround &&
      this.movementComponent.velY > 0.12
    ) {
      this._spawnJumpRing(p, drawX, drawY);
    }
    this._updateJumpEffects();

    const isMoving = Math.abs(this.movementComponent.velX) > 0.08;
    const isAirTrail =
      !isOnGround &&
      (Math.abs(this.movementComponent.velY) > 0.12 ||
        Math.abs(this.movementComponent.velX) > 0.05);
    const emitVelX = isOnGround
      ? this.movementComponent.velX
      : this._trailFacing * Math.max(Math.abs(this.movementComponent.velX), 1);
    this._updateTrailParticles(
      p,
      drawX,
      drawY,
      (isOnGround && isMoving) || isAirTrail,
      emitVelX,
    );
    this._drawTrailParticles(p, false);
    this._drawJumpEffects(p, false);
    this._wasOnGround = isOnGround;

    const isIdle =
      isOnGround &&
      Math.abs(this.movementComponent.velX) < 0.01 &&
      Math.abs(this.movementComponent.velY) < 0.01;

    let sprite = null;
    if (isIdle) {
      if (this._idleStartMs === null) {
        this._idleStartMs = p.millis();
      }
      if (
        Array.isArray(Assets.cloneIdleImgs) &&
        Assets.cloneIdleImgs.length >= 6
      ) {
        const idleElapsed = p.millis() - this._idleStartMs;
        const sequenceDurationMs =
          this._idleSequence.length * this._idleFrameDurationMs;
        const cycleDurationMs = this._idleDelayMs + sequenceDurationMs;
        const elapsedInCycle = idleElapsed % cycleDurationMs;
        if (elapsedInCycle >= this._idleDelayMs) {
          const playElapsed = elapsedInCycle - this._idleDelayMs;
          const seqIndex = Math.floor(playElapsed / this._idleFrameDurationMs);
          const frameNumber =
            this._idleSequence[
              Math.min(seqIndex, this._idleSequence.length - 1)
            ];
          sprite = Assets.cloneIdleImgs[frameNumber - 1] || null;
        }
      }
    } else {
      this._idleStartMs = null;
    }

    if (!sprite) {
      sprite = this.isReplaying
        ? getCloneSprite(
            this.movementComponent.velX,
            this.movementComponent.velY,
            isOnGround,
          )
        : null;
    }
    if (sprite) this._lastSprite = sprite;
    sprite = this._lastSprite || Assets.cloneImg_right;

    if (sprite) {
      p.push();
      p.translate(drawX, drawY + this.collider.h);
      p.scale(1, -1);
      p.image(sprite, 0, 0, this.collider.w, this.collider.h);
      p.pop();
    } else {
      p.fill(255, 200, 255);
      p.rect(drawX, drawY, this.collider.w, this.collider.h);
    }
  }
}
