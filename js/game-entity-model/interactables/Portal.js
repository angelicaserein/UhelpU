import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import {
  ColliderShape,
  ColliderType,
} from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";

export class Portal extends GameEntity {
  static DEFAULT_SIZE = 50;

  constructor(x, y, w = Portal.DEFAULT_SIZE, h = Portal.DEFAULT_SIZE) {
    super(x, y);
    this.type = "portal";
    this.movementComponent = null;
    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);
    this.isOpen = false;
    this._frame = 0;
  }
  openPortal() {
    this.isOpen = true;
  }
  update() {
    this._frame++;
  }
  draw(p) {
    p.push();
    const w = this.collider.w;
    const h = this.collider.h;

    // 先绘制 边框（不受变换影响）
    if (this.isOpen) {
      const breathingAlpha = p.sin(this._frame * 0.05) * 80 + 120;

      p.strokeWeight(3);
      p.stroke(100, 180, 255, breathingAlpha);
      p.noFill();
      p.rect(this.x, this.y, w, h, 5);

      p.strokeWeight(1);
      p.stroke(150, 200, 255, breathingAlpha * 0.5);
      p.rect(this.x - 3, this.y - 3, w + 6, h + 6, 5);
    }

    // 再绘制贴图（在独立的变换空间中）
    const sprite = this.isOpen
      ? Assets.tileImage_doorOpen
      : Assets.tileImage_doorClose;
    if (sprite) {
      p.push();
      p.translate(this.x, this.y + h);
      p.scale(1, -1);
      p.image(sprite, 0, 0, w, h);
      p.pop();
    } else {
      p.fill(100, 150, 200);
      p.noStroke();
      p.rect(this.x, this.y, w, h);
    }

    p.pop();
  }
}
