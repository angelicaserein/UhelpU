import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import {
  ColliderShape,
  ColliderType,
} from "../../collision-system/enumerator.js";

export class Button extends GameEntity {
  constructor(x, y, w, h, options = {}) {
    super(x, y);
    this.type = "button";
    this.movementComponent = null;
    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);
    this.isPressed = false;
    this.bindKey = options.bindKey || null;
  }
  pressButton() {
    this.isPressed = true;
  }
  releaseButton() {
    this.isPressed = false;
  }
  reset() {
    this.isPressed = false;
  }
  draw(p) {
    p.stroke(255);
    p.strokeWeight(2);
    if (this.isPressed) {
      // 踩下状态：绿色，压缩
      p.fill(50, 255, 50);
      p.rect(this.x, this.y, this.collider.w, this.collider.h / 2);
    } else {
      // 未踩下：红色
      p.fill(255, 50, 50);
      p.rect(this.x, this.y, this.collider.w, this.collider.h);
    }
  }
}
