import { GameEntity } from "../base/GameEntity.js";
import { MovementComponent } from "../../physics-system/MovementComponent.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";

export class Box extends GameEntity {
  constructor(x, y, w = 40, h = 40) {
    super(x, y);
    this.type = "box";
    this.zIndex = 5;
    this._startX = x;
    this._startY = y;

    // Physics
    this.movementComponent = new MovementComponent(0, 0, 0, -0.5); // gravity in accY (negative for upright axis)
    this.collider = new RectangleCollider(ColliderType.DYNAMIC, w, h);

    // State tracking
    this.prevX = x;
    this.prevY = y;
    this.blockedXLastFrame = false;
    this.headBlockedThisFrame = false;
  }

  inLevelReset() {
    this.x = this._startX;
    this.y = this._startY;
    this.movementComponent.velX = 0;
    this.movementComponent.velY = 0;
  }

  draw(p) {
    const w = this.collider.w;
    const h = this.collider.h;
    const tile = Assets.tileImage_box;

    if (tile) {
      p.push();
      p.translate(this.x, this.y + h);
      p.scale(1, -1);
      p.image(tile, 0, 0, w, h);
      p.pop();
      return;
    }

    // Fallback: gray box
    p.fill(150, 150, 150);
    p.noStroke();
    p.rect(this.x, this.y, w, h);
  }
}
