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

    if (tile) {
      p.push();
      p.translate(this.x, this.y + h);
      p.scale(1, -1);
      const tw = tile.width;
      const th = tile.height;
      for (let ty = 0; ty < h; ty += th) {
        for (let tx = 0; tx < w; tx += tw) {
          const tileDrawW = Math.min(tw, w - tx);
          const tileDrawH = Math.min(th, h - ty);
          p.image(
            tile,
            tx,
            ty,
            tileDrawW,
            tileDrawH,
            0,
            0,
            tileDrawW,
            tileDrawH,
          );
        }
      }
      p.pop();
    } else {
      p.fill(55, 55, 60);
      p.stroke(25, 25, 30);
      p.strokeWeight(2);
      p.rect(this.x, this.y, w, h);
    }
  }
}
