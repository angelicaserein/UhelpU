/**
 * @fileoverview Collider components used by the collision detection system.
 * 碰撞检测系统所使用的碰撞器组件。
 * Each game entity that participates in collision should be given a collider
 * 每个参与碰撞的游戏实体都应被赋予一个碰撞器（如 RectangleCollider），
 * (e.g. RectangleCollider) describing its shape and behaviour type.
 * 用于描述其形状和行为类型。
 */

import { ColliderShape, ColliderType } from "./enumerator.js";

/**
 * Abstract base collider — holds the type (STATIC / DYNAMIC) and shape.
 * 抽象基础碰撞器——保存类型（STATIC / DYNAMIC）和形状。
 * Do not instantiate directly; use a concrete subclass such as RectangleCollider.
 * 请勿直接实例化；请使用具体子类，如 RectangleCollider。
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
 * 轴对齐矩形碰撞器——当前唯一使用的碰撞形状。
 * Width and height are in pixels and should match the entity's visual size.
 * 宽度和高度以像素为单位，应与实体的视觉大小匹配。
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
