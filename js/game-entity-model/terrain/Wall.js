import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import {
  ColliderShape,
  ColliderType,
} from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";

export class Wall extends GameEntity {
  constructor(x, y, w, h) {
    super(x, y);
    this.type = "wall";
    this.zIndex = -10;
    this.movementComponent = null;
    this.collider = new RectangleCollider(ColliderType.STATIC, w, h);
  }

  draw(p) {
    const w = this.collider.w;
    const h = this.collider.h;
    const tile = Assets.tileImage_wall;
    let drawX = this.x;
    let drawW = w;

    // 侧墙做可视延申，镜头轻微拉动时不会漏出边缘缝隙
    const overdraw = 96;
    if (this.x <= 1) {
      drawX -= overdraw;
      drawW += overdraw;
    }
    if (this.x + w >= p.width - 1) {
      drawW += overdraw;
    }

    if (tile) {
      p.image(tile, drawX, this.y, drawW, h);
    } else {
      p.fill(55, 55, 60);
      p.stroke(25, 25, 30);
      p.strokeWeight(2);
      p.rect(drawX, this.y, drawW, h);
    }
  }
}
