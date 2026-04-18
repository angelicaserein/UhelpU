/**
 * @fileoverview Control parameter components for player and AI characters.
 * A ControlComponent holds tuneable movement constants (speed, jump force, gravity)
 * and per-frame ability state (coyote time, jump cooldown, ground detection).
 */

/** Abstract base — extend this to create custom control profiles. */
class ControlComponent {
    constructor() {}
}

/**
 * Standard control parameters used by the human player and replay ghost.
 * All numeric constants are in pixels-per-frame units and were tuned for the
 * game's 60 fps update loop.
 */
export class BasicControlComponent extends ControlComponent {
    constructor() {
        super();
        /** Horizontal movement speed in pixels per frame. */
        this.moveSpeed = 4;
        /** Initial vertical velocity applied when the player jumps. */
        this.jumpSpeed = 10;
        /** Downward acceleration applied every frame (negative = pulls entity down). */
        this.gravity = -0.5;

        /**
         * Runtime state updated each frame by the physics/control pipeline.
         * @property {boolean} isOnGround   - True when the entity is standing on a surface.
         * @property {boolean} wasOnGround  - Ground state from the previous frame (used for landing events).
         * @property {number}  groundVelY   - Vertical velocity of the platform the entity is standing on.
         * @property {number}  jumpCooldown - Frames remaining before the entity can jump again.
         * @property {number}  coyoteFrames - Frames left in the coyote-time window (allows jumping
         *                                    briefly after walking off a ledge).
         */
        this.abilityCondition = {
            "isOnGround": false,
            "wasOnGround": false,
            "groundVelY": 0,
            "jumpCooldown": 0,
            "coyoteFrames": 0,
        };
    }
}
