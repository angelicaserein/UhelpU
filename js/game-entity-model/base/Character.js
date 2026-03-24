import { GameEntity } from "./GameEntity.js";

export class Character extends GameEntity {
    constructor(x, y) {
        super(x, y);

        // Death state
        this.deathState = {
            isDead: false,
            initialized: false,
            deathType: null,
        };

        // Sprite / idle animation state (used by both Player and Replayer)
        this._lastSprite = null;
        this._idleStartMs = null;
        this._idleDelayMs = 2000;
        this._idleFrameDurationMs = 120;
        this._idleSequence = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];

        // Particle effect state
        this._trailParticles = [];
        this._trailEmitAccumulator = 0;
        this._jumpRingEffects = [];
        this._jumpBurstParticles = [];
        this._wasOnGround = true;
        this._trailFacing = 1;
    }

    // ── Death ─────────────────────────────────────────────────────

    triggerDeath(deathType = "default") {
        if (this.deathState.isDead) return;
        this.deathState.isDead = true;
        this.deathState.deathType = deathType;
        this.deathState.initialized = false;
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

    createListeners() {
        this.controllerManager.createListeners();
    }

    clearListeners() {
        this.controllerManager.clearListeners();
    }

    clearEventListeners() {
        this.controllerManager.clearListeners();
    }

    // ── Trail particles ───────────────────────────────────────────

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
            const spawnX = velX >= 0
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
            const alpha = Math.floor((particle.life / particle.maxLife) * 230 * alphaScale);
            p.fill(255, 248, 200, alpha);
            p.rect(particle.x, particle.y, particle.size, particle.size);
        }
        p.pop();
    }
}
