import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import {
  ColliderShape,
  ColliderType,
} from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";

export class Home extends GameEntity {
  constructor(x, y, w, h) {
    super(x, y);
    this.type = "home";
    this.zIndex = 0;
    this.movementComponent = null;
    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);
  }

  draw(p) {
    const sprite = Assets.tileImage_goal;
    if (sprite) {
      p.push();
      p.translate(this.x, this.y + this.collider.h);
      p.scale(1, -1);
      p.image(sprite, 0, 0, this.collider.w, this.collider.h);
      p.pop();
    } else {
      p.fill(255, 200, 200);
      p.rect(this.x, this.y, this.collider.w, this.collider.h);
    }
  }
}
