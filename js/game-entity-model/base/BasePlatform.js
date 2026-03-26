import { GameEntity } from "./GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";

export class BasePlatform extends GameEntity {
  constructor(x, y, w, h, options = {}) {
    super(x, y);
    this.type = "platform";
    this.zIndex = -10;
    this.movementComponent = null;
    this.collider = new RectangleCollider(ColliderType.STATIC, w, h);

    this.isOneWay = options.isOneWay ?? false;
    this.isMovable = options.isMovable ?? false;
  }

  update(dt) {
    // Hook for moving platform behavior in subclasses.
  }

  draw(p) {
    const w = this.collider.w;
    const h = this.collider.h;
    const tile = Assets.tileImage_platform;

    if (tile) {
      p.push();
      p.translate(this.x, this.y + h);
      p.scale(1, -1);
      const tw = tile.width;
      const th = tile.height;
      for (let ty = 0; ty < h; ty += th) {
        for (let tx = 0; tx < w; tx += tw) {
          const drawW = Math.min(tw, w - tx);
          const drawH = Math.min(th, h - ty);
          p.image(tile, tx, ty, drawW, drawH, 0, 0, drawW, drawH);
        }
      }
      p.pop();
      return;
    }

    p.fill(80, 88, 95);
    p.noStroke();
    p.rect(this.x, this.y, w, h);
  }
}
