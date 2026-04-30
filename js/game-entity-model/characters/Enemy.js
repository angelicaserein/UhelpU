import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { MovementComponent } from "../../physics-system/MovementComponent.js";
import { Assets } from "../../AssetsManager.js";

export class Enemy extends GameEntity {
  constructor(x, y, w, h, options = {}) {
    super(x, y);
    this.type = "enemy";
    this.zIndex = -5;

    // Collision
    // 碰撞
    this.collider = new RectangleCollider(ColliderType.DYNAMIC, w, h);
    // Movement component for physics
    // 用于物理计算的移动组件
    this.movementComponent = new MovementComponent(0, 0, 0, 0);

    // Patrol behavior
    // 巡逻行为
    this._speed = options.speed ?? 2;
    this._direction = 1; // 1 = right, -1 = left | 1 = 右，-1 = 左

    // Collision state for direction reversal
    // 用于方向反转的碰撞状态
    this.blockedLeftThisFrame = false;
    this.blockedRightThisFrame = false;
    this.blockedBottomThisFrame = false;
    this._wasGroundedLastFrame = false;
    this._supportLeft = Number.NEGATIVE_INFINITY;
    this._supportRight = Number.POSITIVE_INFINITY;
    this._edgeTurnMargin = options.edgeTurnMargin ?? 1;

    // Previous position tracking for collision detection
    // 用于碰撞检测的上一帧位置追踪
    this.prevX = x;
    this.prevY = y;

    // Appearance
    // 外观
    this._color = options.color ?? [150, 150, 150];

    // Death state
    // 死亡状态
    this.deathState = {
      isDead: false,
      deathFrameCounter: 0, // Frame counter for death animation | 死亡动画帧计数器
      deathDurationFrames: 18, // ~300ms at 60fps (18 frames) | 约 300ms（60fps 下 18 帧）
    };
  }

  update(p) {
    // Save previous position for collision detection
    // 保存上一帧位置用于碰撞检测
    this.prevX = this.x;
    this.prevY = this.y;

    // Update patrol movement if not dead
    // 未死亡时更新巡逻移动
    if (!this.deathState.isDead) {
      // Use the same gravity convention as player.
      // 使用与玩家相同的重力约定
      this.movementComponent.accX = 0;
      this.movementComponent.accY = -0.5;

      // Wall hit: reverse direction.
      // 碰墙：反转方向
      if (this._direction === -1 && this.blockedLeftThisFrame) {
        this._direction = 1;
      } else if (this._direction === 1 && this.blockedRightThisFrame) {
        this._direction = -1;
      }

      const hasSupportAhead =
        !this._wasGroundedLastFrame ||
        !this.worldCollisionSystem ||
        this.worldCollisionSystem.hasWalkableSupportAhead(
          this,
          this._direction,
          {
            probeDistance: this._speed + this._edgeTurnMargin,
            maxStepDown: this.collider.h / 2,
          },
        );

      if (this._wasGroundedLastFrame && !hasSupportAhead) {
        this.x -= this._direction * this._speed;
        this._direction *= -1;
      }

      this.movementComponent.velX = this._direction * this._speed;

      this._wasGroundedLastFrame = this.blockedBottomThisFrame;

      // Reset collision flags for next frame
      // 重置下一帧的碰撞标志
      this.blockedLeftThisFrame = false;
      this.blockedRightThisFrame = false;
      this.blockedBottomThisFrame = false;
      this._supportLeft = Number.NEGATIVE_INFINITY;
      this._supportRight = Number.POSITIVE_INFINITY;
    } else {
      // Stop movement when dead
      // 死亡时停止移动
      this.movementComponent.velX = 0;
      this.movementComponent.velY = 0;
      this.movementComponent.accX = 0;
      this.movementComponent.accY = 0;

      // Update death animation frame counter
      // 更新死亡动画帧计数器
      this.deathState.deathFrameCounter++;
    }
  }

  draw(p) {
    const drawX = this.x;
    const drawY = this.y;

    if (!this.deathState.isDead) {
      // Draw alive enemy with y-axis flip (same as Player)
      // 绘制存活敌人（与玩家一样翻转 y 轴）
      if (Assets.enemyImg) {
        p.push();
        p.translate(drawX, drawY + this.collider.h);
        p.scale(1, -1);
        p.image(Assets.enemyImg, 0, 0, this.collider.w, this.collider.h);
        p.pop();
      } else {
        // Fallback: draw placeholder rectangle
        // 回退：绘制占位矩形
        p.fill(...this._color);
        p.noStroke();
        p.rect(drawX, drawY, this.collider.w, this.collider.h);
      }
    } else {
      // Draw death animation (scale out + fade) with y-axis flip
      // 绘制死亡动画（缩小+淡出）并翻转 y 轴
      const progress = Math.min(
        1,
        this.deathState.deathFrameCounter / this.deathState.deathDurationFrames,
      );
      const scale = Math.max(0, 1 - progress); // 1 �� 0
      const alpha = Math.max(0, 255 * (1 - progress));

      p.push();
      // Translate to center, then apply scale, then draw from origin
      // 平移到中心，施加缩放，然后从原点绘制
      p.translate(drawX + this.collider.w / 2, drawY + this.collider.h / 2);
      p.scale(scale);
      // Flip y-axis like Player does
      // 像玩家一样翻转 y 轴
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
    this.deathState.deathFrameCounter = 0; // Reset frame counter | 重置帧计数器
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
