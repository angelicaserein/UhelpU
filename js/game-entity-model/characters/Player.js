import { Character } from "../base/Character.js";
import { MovementComponent } from "../../physics-system/MovementComponent.js";
import { ControllerManager } from "../../character-control-system/ControllerManager.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";

function getPlayerSprite(velX, velY, isOnGround) {
  if (!isOnGround) {
    if (velY > 0) {
      if (velX > 0) return Assets.playerImg_upRight;
      if (velX < 0) return Assets.playerImg_upLeft;
      return Assets.playerImg_up;
    }
    return null; // keep last sprite while falling
  }
  if (velX > 0) return Assets.playerImg_right;
  if (velX < 0) return Assets.playerImg_left;
  return null; // keep last sprite while idle
}

export class Player extends Character {
  constructor(x, y, w, h) {
    super(x, y);
    this.type = "player";
    this._startX = x;
    this._startY = y;
    this.movementComponent = new MovementComponent(0, 0, 0, 0);
    this.controllerManager = new ControllerManager(
      "BasicMode",
      this.movementComponent,
    );
    this.controllerManager.owner = this;
    this.collider = new RectangleCollider(ColliderType.DYNAMIC, w, h);

    // Player-only landing dust particles
    this._landingDustParticles = [];
    this._prevVelY = 0;
  }

  // ── Landing dust (Player-only) ────────────────────────────────

  _spawnLandingDust(p, drawX, drawY, impactVelY) {
    const count = Math.floor(Math.min(Math.abs(impactVelY) * 1.6, 14));
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const speed = p.random(1.2, 3.0);
      const angle = p.random(0.05, 0.38);
      const life = Math.floor(p.random(12, 22));
      const spawnX =
        side < 0
          ? drawX - p.random(2, 6)
          : drawX + this.collider.w + p.random(2, 6);
      this._landingDustParticles.push({
        x: spawnX,
        y: drawY + p.random(0, 4),
        vx: Math.cos(angle) * speed * side,
        vy: Math.sin(angle) * speed * 0.3,
        size: p.random(3, 6),
        life,
        maxLife: life,
      });
    }
  }

  _updateLandingDust() {
    for (let i = this._landingDustParticles.length - 1; i >= 0; i--) {
      const d = this._landingDustParticles[i];
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= 0.88;
      d.vy *= 0.82;
      d.life -= 1;
      if (d.life <= 0) {
        this._landingDustParticles.splice(i, 1);
      }
    }
  }

  _drawLandingDust(p) {
    if (this._landingDustParticles.length === 0) return;
    p.push();
    p.noStroke();
    for (const d of this._landingDustParticles) {
      const t = d.life / d.maxLife;
      const alpha = Math.floor(t * 160);
      p.fill(195, 178, 155, alpha);
      p.circle(d.x, d.y, d.size * t + 1);
    }
    p.pop();
  }

  // ── Draw ──────────────────────────────────────────────────────

  draw(p) {
    if (this.deathState && this.deathState.isDead) {
      this._trailParticles = [];
      this._trailEmitAccumulator = 0;
      this._jumpRingEffects = [];
      this._jumpBurstParticles = [];
      this._landingDustParticles = [];
      this._wasOnGround = true;
      const deadSprite = Assets.playerImg_dead;
      if (deadSprite) {
        p.push();
        p.translate(this.x, this.y + this.collider.h);
        p.scale(1, -1);
        p.image(deadSprite, 0, 0, this.collider.w, this.collider.h);
        p.pop();
        return;
      }
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
      this._spawnJumpRing(p, this.x, this.y);
    }
    if (!this._wasOnGround && isOnGround && this._prevVelY < -1.5) {
      this._spawnLandingDust(p, this.x, this.y, this._prevVelY);
    }
    this._prevVelY = this.movementComponent.velY;
    this._updateJumpEffects();
    this._updateLandingDust();

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
      this.x,
      this.y,
      (isOnGround && isMoving) || isAirTrail,
      emitVelX,
    );
    this._drawTrailParticles(p);
    this._drawJumpEffects(p);
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
      const idleElapsed = p.millis() - this._idleStartMs;
      if (
        Array.isArray(Assets.playerIdleImgs) &&
        Assets.playerIdleImgs.length >= 6
      ) {
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
          sprite = Assets.playerIdleImgs[frameNumber - 1] || null;
        }
      }
    } else {
      this._idleStartMs = null;
    }

    if (!sprite) {
      sprite = getPlayerSprite(
        this.movementComponent.velX,
        this.movementComponent.velY,
        isOnGround,
      );
    }
    if (sprite) this._lastSprite = sprite;
    sprite = this._lastSprite || Assets.playerImg_right;

    if (sprite) {
      p.push();
      p.translate(this.x, this.y + this.collider.h);
      p.scale(1, -1);
      p.image(sprite, 0, 0, this.collider.w, this.collider.h);
      p.pop();
    } else {
      p.fill(100, 200, 255);
      p.rect(this.x, this.y, this.collider.w, this.collider.h);
    }

    // Landing dust drawn after sprite so it appears at the character's sides
    this._drawLandingDust(p);
  }
}
