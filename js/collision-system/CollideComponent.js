import { ColliderShape, ColliderType } from "./enumerator.js";

class ColliderComponent {
    constructor(colliderType, colliderShape) {
        this.colliderType = colliderType;
        this.colliderShape = colliderShape;
    }

}

export class RectangleCollider extends ColliderComponent {
    constructor(colliderType, w, h) {
        super(colliderType, ColliderShape.RECTANGLE);
        this.w = w;
        this.h = h;
    }
}