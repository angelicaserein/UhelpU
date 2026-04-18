/**
 * @fileoverview Stores the velocity and acceleration state for a game entity.
 * Consumed by the physics system each frame to compute the entity's next position.
 */

/**
 * Data component holding the 2-D motion state of an entity.
 * All values are in pixels-per-frame (velocity) or pixels-per-frame² (acceleration).
 * The y-axis is inverted at render time: positive velY moves the entity upward on screen.
 */
export class MovementComponent {
    /**
     * @param {number} velX - Horizontal velocity (positive = right).
     * @param {number} velY - Vertical velocity (positive = up in screen space after y-flip).
     * @param {number} accX - Horizontal acceleration applied each frame.
     * @param {number} accY - Vertical acceleration (gravity is applied here as a negative value).
     */
    constructor(velX, velY, accX, accY) {
        this.velX = velX;
        this.velY = velY;
        this.accX = accX;
        this.accY = accY;
    }
}
