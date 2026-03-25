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
    // color: { unpressed: [r,g,b], pressed: [r,g,b] }
    this.color = options.color || null;
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
      const c = this.color?.pressed || [50, 255, 50];
      p.fill(...c);
      p.rect(this.x, this.y, this.collider.w, this.collider.h / 2);
    } else {
      const c = this.color?.unpressed || [255, 50, 50];
      p.fill(...c);
      p.rect(this.x, this.y, this.collider.w, this.collider.h);
    }
  }
}
