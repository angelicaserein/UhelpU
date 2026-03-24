/**
 * Base class for all game entities.
 * Every entity placed in a Level's entity set should extend this class.
 *
 * Lifecycle contract:
 *   update(p)   — called once per frame before collision (game logic, animation timers)
 *   draw(p)     — called once per frame after collision (pure rendering, no state mutation)
 *   onDestroy() — called when the entity is removed from the level (clean up listeners, timers)
 */
export class GameEntity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.zIndex = 0;  // lower values drawn first (background), higher drawn last (foreground)
    }

    /** Per-frame logic update. Override in subclasses. */
    update(_p) {}

    /** Per-frame rendering. Override in subclasses. Must NOT mutate game state. */
    draw(_p) {}

    /** Cleanup hook called when entity is removed from the level. */
    onDestroy() {}
}
