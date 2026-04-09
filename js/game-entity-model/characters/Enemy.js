import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { MovementComponent } from "../../physics-system/MovementComponent.js";
import { AudioManager } from "../../AudioManager.js";
import { Assets } from "../../AssetsManager.js";

export class Enemy extends GameEntity {
  constructor(x, y, w, h, options = {}) {
    super(x, y);
    this.type = "enemy";
    this.zIndex = -5;

    // Collision
    this.collider = new RectangleCollider(ColliderType.DYNAMIC, w, h);
    // Movement component for physics
    this.movementComponent = new MovementComponent(0, 0, 0, 0);

    // Patrol behavior
    this._speed = options.speed ?? 2;
    this._direction = 1; // 1 = right, -1 = left

    // Collision state for direction reversal
    this.blockedLeftThisFrame = false;
    this.blockedRightThisFrame = false;
    this.blockedBottomThisFrame = false;
    this._wasGroundedLastFrame = false;
    this._supportLeft = Number.NEGATIVE_INFINITY;
    this._supportRight = Number.POSITIVE_INFINITY;
    this._edgeTurnMargin = options.edgeTurnMargin ?? 1;

    // Previous position tracking for collision detection
    this.prevX = x;
    this.prevY = y;

    // Appearance
    this._color = options.color ?? [150, 150, 150];

    // Death state
    this.deathState = {
      isDead: false,
      deathFrameCounter: 0, // Frame counter for death animation
      deathDurationFrames: 18, // ~300ms at 60fps (18 frames)
    };
  }

  update(p) {
    // Save previous position for collision detection
    this.prevX = this.x;
    this.prevY = this.y;

    // Update patrol movement if not dead
    if (!this.deathState.isDead) {
      // Use the same gravity convention as player.
      this.movementComponent.accX = 0;
      this.movementComponent.accY = -0.5;

      // Wall hit: reverse direction.
      if (this._direction === -1 && this.blockedLeftThisFrame) {
        this._direction = 1;
      } else if (this._direction === 1 && this.blockedRightThisFrame) {
        this._direction = -1;
      }

      // Edge guard (early turn): if front foot is already near/over support edge,
      // reverse immediately instead of waiting to fully leave the platform.
      if (
        this._wasGroundedLastFrame &&
        Number.isFinite(this._supportLeft) &&
        Number.isFinite(this._supportRight)
      ) {
        const frontX =
          this._direction === 1 ? this.x + this.collider.w : this.x;

        const tooFarRight =
          this._direction === 1 &&
          frontX >= this._supportRight - this._edgeTurnMargin;
        const tooFarLeft =
          this._direction === -1 &&
          frontX <= this._supportLeft + this._edgeTurnMargin;

        if (tooFarRight || tooFarLeft) {
          this.x -= this._direction * this._speed;
          this._direction *= -1;
        }
      }

      // Edge guard: if last frame was grounded but this frame is not,
      // treat as "no road ahead" and turn around instead of walking off.
      if (this._wasGroundedLastFrame && !this.blockedBottomThisFrame) {
        this.x -= this._direction * this._speed;
        this._direction *= -1;
      }

      this.movementComponent.velX = this._direction * this._speed;

      this._wasGroundedLastFrame = this.blockedBottomThisFrame;

      // Reset collision flags for next frame
      this.blockedLeftThisFrame = false;
      this.blockedRightThisFrame = false;
      this.blockedBottomThisFrame = false;
    } else {
      // Stop movement when dead
      this.movementComponent.velX = 0;
      this.movementComponent.velY = 0;
      this.movementComponent.accX = 0;
      this.movementComponent.accY = 0;

      // Update death animation frame counter
      this.deathState.deathFrameCounter++;
    }
  }

  draw(p) {
    const drawX = this.x;
    const drawY = this.y;

    if (!this.deathState.isDead) {
      // Draw alive enemy with y-axis flip (same as Player)
      if (Assets.enemyImg) {
        p.push();
        p.translate(drawX, drawY + this.collider.h);
        p.scale(1, -1);
        p.image(Assets.enemyImg, 0, 0, this.collider.w, this.collider.h);
        p.pop();
      } else {
        // Fallback: draw placeholder rectangle
        p.fill(...this._color);
        p.noStroke();
        p.rect(drawX, drawY, this.collider.w, this.collider.h);
      }
    } else {
      // Draw death animation (scale out + fade) with y-axis flip
      const progress = Math.min(
        1,
        this.deathState.deathFrameCounter / this.deathState.deathDurationFrames,
      );
      const scale = Math.max(0, 1 - progress); // 1 �� 0
      const alpha = Math.max(0, 255 * (1 - progress));

      p.push();
      // Translate to center, then apply scale, then draw from origin
      p.translate(drawX + this.collider.w / 2, drawY + this.collider.h / 2);
      p.scale(scale);
      // Flip y-axis like Player does
      p.scale(1, -1);
      p.translate(-(this.collider.w / 2), -(this.collider.h / 2));

      if (Assets.enemyImg) {
        p.tint(255, alpha);
        p.image(Assets.enemyImg, 0, 0, this.collider.w, this.collider.h);
        p.noTint();
      } else {
        p.fill(...this._color, alpha);
        p.noStroke();
        p.rect(0, 0, this.collider.w, this.collider.h);
      }

      p.pop();
    }
  }

  triggerDeath() {
    if (this.deathState.isDead) return;
    this.deathState.isDead = true;
    this.deathState.deathFrameCounter = 0; // Reset frame counter
    AudioManager.playSFX("dead");
  }

  isDeadAnimationComplete() {
    if (!this.deathState.isDead) {
      return false;
    }
    return (
      this.deathState.deathFrameCounter >= this.deathState.deathDurationFrames
    );
  }
}
