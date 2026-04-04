import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { AudioManager } from "../../AudioManager.js";
import { Assets } from "../../AssetsManager.js";

export class Enemy extends GameEntity {
  constructor(x, y, w, h, options = {}) {
    super(x, y);
    this.type = "enemy";
    this.zIndex = -5;

    // Collision
    this.collider = new RectangleCollider(ColliderType.STATIC, w, h);

    // Patrol behavior
    this._patrolLeft = options.patrolLeft ?? x;
    this._patrolRight = options.patrolRight ?? x + 100;
    this._speed = options.speed ?? 2;
    this._direction = 1;  // 1 = right, -1 = left

    // Appearance
    this._color = options.color ?? [150, 150, 150];

    // Death state
    this.deathState = {
      isDead: false,
      deathFrameCounter: 0,  // Frame counter for death animation
      deathDurationFrames: 18,  // ~300ms at 60fps (18 frames)
    };
  }

  update(p) {
    // Update patrol movement if not dead
    if (!this.deathState.isDead) {
      this.x += this._direction * this._speed;

      // Reverse direction at patrol boundaries
      if (this.x <= this._patrolLeft) {
        this.x = this._patrolLeft;
        this._direction = 1;
      } else if (this.x >= this._patrolRight) {
        this.x = this._patrolRight;
        this._direction = -1;
      }
    } else {
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
      const progress = Math.min(1, this.deathState.deathFrameCounter / this.deathState.deathDurationFrames);
      const scale = Math.max(0, 1 - progress);  // 1 → 0
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

  /**
   * Trigger enemy death
   */
  triggerDeath() {
    if (this.deathState.isDead) return;
    this.deathState.isDead = true;
    this.deathState.deathFrameCounter = 0;  // Reset frame counter
    AudioManager.playSFX("dead");
  }

  /**
   * Check if death animation is complete
   * @returns {boolean} true if death animation finished
   */
  isDeadAnimationComplete() {
    if (!this.deathState.isDead) {
      return false;
    }
    return this.deathState.deathFrameCounter >= this.deathState.deathDurationFrames;
  }
}
