/**
 * @fileoverview Visual particle-effect base class for characters.
 * @fileoverview 角色粒子特效基类。
 *
 * Owns the state and rendering logic for three shared effects used by both
 * Player and Replayer:
 * 拥有玩家和重放者共用的三种效果的状态和渲染逻辑：
 *   1. Trail particles  — emitted while moving on ground or in air
 *   1. 拖尾粒子    — 在地面或空中移动时发射
 *   2. Jump ring/burst  — spawned the moment a character leaves the ground
 *   2. 跳跃圈/爆炸 — 角色离地瞬间生成
 *   3. Zzz idle bubbles — floated upward after the idle animation starts
 *   3. Zzz 待机气泡 — 待机动画开始后向上浮动
 *
 * CharacterEffects sits between GameEntity and Character in the inheritance
 * chain, so all `this._*` state and methods are available on any subclass
 * without indirection.
 * CharacterEffects 位于 GameEntity 和 Character 之间的继承链中，
 * 所有 `this._*` 状态和方法均可在任意子类中直接使用。
 */

import { GameEntity } from "./GameEntity.js";

export class CharacterEffects extends GameEntity {
  constructor(x, y) {
    super(x, y);

    // Trail particle state
    // 拖尾粒子状态
    this._trailParticles = [];
    this._trailEmitAccumulator = 0;
    this._trailFacing = 1;

    // Jump ring / burst state
    // 跳跃圈/爆炸状态
    this._jumpRingEffects = [];
    this._jumpBurstParticles = [];
    this._wasOnGround = true;

    // Zzz idle bubble state
    // Zzz 待机气泡状态
    this._zzzBubbles = [];
    this._zzzLastEmitMs = 0;
    this._zzzEmitIndex = 0;
    this._zzzEmitIntervalMs = 650;
  }

  // ── Trail particles ───────────────────────────────────────────
  // ── 拖尾粒子 ──────────────────────────────────────────────

  _updateTrailParticles(p, drawX, drawY, shouldEmit, velX) {
    for (let i = this._trailParticles.length - 1; i >= 0; i--) {
      const particle = this._trailParticles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1;
      if (particle.life <= 0) {
        this._trailParticles.splice(i, 1);
      }
    }

    if (!shouldEmit) return;

    this._trailEmitAccumulator += Math.max(Math.abs(velX) * 0.2, 0.6);
    while (this._trailEmitAccumulator >= 1) {
      this._trailEmitAccumulator -= 1;
      const spawnX =
        velX >= 0
          ? drawX - p.random(1, 4)
          : drawX + this.collider.w + p.random(1, 4);
      const spawnY = drawY + p.random(1, 4);
      const size = p.random(2, 4);
      const life = Math.floor(p.random(10, 18));
      this._trailParticles.push({
        x: spawnX,
        y: spawnY,
        vx: p.random(-0.25, 0.25),
        vy: p.random(-0.12, 0.12),
        size,
        life,
        maxLife: life,
      });
    }
  }

  /**
   * @param {boolean} [isGhost=false]  true for Replayer ghost rendering (lower alpha)
   * @param {boolean} [isGhost=false]  Replayer 幽灵渲染时为 true（较低透明度）
   */
  _drawTrailParticles(p, isGhost = false) {
    p.push();
    p.noStroke();
    const baseAlpha = isGhost ? 100 : 210;
    for (const particle of this._trailParticles) {
      const alpha = Math.floor((particle.life / particle.maxLife) * baseAlpha);
      const blend = (particle.maxLife - particle.life) / particle.maxLife;
      const g = Math.floor(210 + (250 - 210) * blend);
      const b = Math.floor(230 + (200 - 230) * blend);
      p.fill(255, g, b, alpha);
      p.rect(particle.x, particle.y, particle.size, particle.size);
    }
    p.pop();
  }

  // ── Jump ring / burst effects ─────────────────────────────────
  // ── 跳跃圈/爆炸效果 ──────────────────────────────────────────

  _spawnJumpRing(p, drawX, drawY) {
    this._jumpRingEffects.push({
      x: drawX + this.collider.w / 2,
      y: drawY + 2,
      radius: 2,
      life: 16,
      maxLife: 16,
    });

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + p.random(-0.15, 0.15);
      const speed = p.random(0.8, 1.8);
      const life = Math.floor(p.random(10, 16));
      this._jumpBurstParticles.push({
        x: drawX + this.collider.w / 2,
        y: drawY + 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6,
        size: p.random(2, 4),
        life,
        maxLife: life,
      });
    }
  }

  _updateJumpEffects() {
    for (let i = this._jumpRingEffects.length - 1; i >= 0; i--) {
      const ring = this._jumpRingEffects[i];
      ring.radius += 1.4;
      ring.life -= 1;
      if (ring.life <= 0) {
        this._jumpRingEffects.splice(i, 1);
      }
    }

    for (let i = this._jumpBurstParticles.length - 1; i >= 0; i--) {
      const particle = this._jumpBurstParticles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.02;
      particle.life -= 1;
      if (particle.life <= 0) {
        this._jumpBurstParticles.splice(i, 1);
      }
    }
  }

  /**
   * @param {boolean} [isGhost=false]  true for Replayer ghost rendering (lower alpha)
   * @param {boolean} [isGhost=false]  Replayer 幽灵渲染时为 true（较低透明度）
   */
  _drawJumpEffects(p, isGhost = false) {
    const alphaScale = isGhost ? 0.55 : 1;

    p.push();
    p.noFill();
    for (const ring of this._jumpRingEffects) {
      const alpha = Math.floor((ring.life / ring.maxLife) * 220 * alphaScale);
      p.stroke(255, 246, 196, alpha);
      p.strokeWeight(2);
      p.circle(ring.x, ring.y, ring.radius * 2);
    }
    p.pop();

    p.push();
    p.noStroke();
    for (const particle of this._jumpBurstParticles) {
      const alpha = Math.floor(
        (particle.life / particle.maxLife) * 230 * alphaScale,
      );
      p.fill(255, 248, 200, alpha);
      p.rect(particle.x, particle.y, particle.size, particle.size);
    }
    p.pop();
  }

  // ── Zzz idle bubbles ──────────────────────────────────────────
  // ── Zzz 待机气泡 ──────────────────────────────────────────────

  _updateZzzBubbles(p, spawnX, spawnY, isActive) {
    for (let i = this._zzzBubbles.length - 1; i >= 0; i--) {
      const b = this._zzzBubbles[i];
      b.y += b.vy; // y-axis is globally flipped: increasing y = visually rising | y 轴已全局翻转：y 增大 = 视觉上升
      b.x += b.vx;
      b.life -= 1;
      if (b.life <= 0) this._zzzBubbles.splice(i, 1);
    }

    if (!isActive) {
      this._zzzLastEmitMs = 0;
      this._zzzEmitIndex = 0;
      return;
    }

    const now = p.millis();
    if (this._zzzLastEmitMs === 0) this._zzzLastEmitMs = now;

    if (now - this._zzzLastEmitMs >= this._zzzEmitIntervalMs) {
      this._zzzLastEmitMs = now;
      const idx = this._zzzEmitIndex % 3;
      const sizes = [7, 10, 13];
      const offsets = [0, 4, 9];
      const life = 58;
      this._zzzBubbles.push({
        x: spawnX + offsets[idx],
        y: spawnY,
        vx: 0.22,
        vy: 0.42,
        size: sizes[idx],
        life,
        maxLife: life,
      });
      this._zzzEmitIndex++;
    }
  }

  _drawZzzBubbles(p) {
    if (this._zzzBubbles.length === 0) return;
    for (const b of this._zzzBubbles) {
      const t = b.life / b.maxLife;
      const alpha = Math.floor(t * 210);
      p.push();
      p.translate(b.x, b.y);
      p.scale(1, -1); // counteract global y-flip so the letter renders upright | 抗消全局 y 翻转，让字母显示正常
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.fill(135, 206, 235, alpha);
      p.textSize(b.size);
      p.text("z", 0, 0);
      p.pop();
    }
  }
}
