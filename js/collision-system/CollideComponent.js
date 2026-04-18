/**
 * @fileoverview Collider components used by the collision detection system.
 * Each game entity that participates in collision should be given a collider
 * (e.g. RectangleCollider) describing its shape and behaviour type.
 */

import { ColliderShape, ColliderType } from "./enumerator.js";

/**
 * Abstract base collider — holds the type (STATIC / DYNAMIC) and shape.
 * Do not instantiate directly; use a concrete subclass such as RectangleCollider.
 */
class ColliderComponent {
    /**
     * @param {ColliderType}  colliderType  - Whether this entity is STATIC (immovable) or DYNAMIC (movable).
     * @param {ColliderShape} colliderShape - The geometric shape used for collision tests.
     */
    constructor(colliderType, colliderShape) {
        this.colliderType = colliderType;
        this.colliderShape = colliderShape;
    }
}

/**
 * Axis-aligned rectangular collider — the only collider shape currently in use.
 * Width and height are in pixels and should match the entity's visual size.
 */
export class RectangleCollider extends ColliderComponent {
    /**
     * @param {ColliderType} colliderType - STATIC for terrain/platforms, DYNAMIC for the player/boxes.
     * @param {number}       w            - Collider width in pixels.
     * @param {number}       h            - Collider height in pixels.
     */
    constructor(colliderType, w, h) {
        super(colliderType, ColliderShape.RECTANGLE);
        this.w = w;
        this.h = h;
    }
}
