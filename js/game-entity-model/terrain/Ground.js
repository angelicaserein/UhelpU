import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import {
  ColliderShape,
  ColliderType,
} from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";

export class Ground extends GameEntity {
  constructor(x, y, w, h, isPlatform = false) {
    super(x, y);
    this.type = "ground";
    this.movementComponent = null;
    this.collider = new RectangleCollider(ColliderType.STATIC, w, h);
    this.isPlatform = isPlatform;
  }

  draw(p) {
    const w = this.collider.w;
    const h = this.collider.h;
    const tile = this.isPlatform
      ? Assets.tileImage_platform
      : Assets.tileImage_ground;
    let drawX = this.x;
    let drawW = w;

    // 地面做可视延申，镜头轻微拉动时仍显示贴图而不是空白边缘
    if (!this.isPlatform && w >= p.width - 2) {
      const overdraw = 96;
      drawX -= overdraw;
      drawW += overdraw * 2;
    }

    if (tile) {
      // y轴翻转环境下绘制贴图：先翻回正常方向再平铺
      p.push();
      p.translate(drawX, this.y + h);
      p.scale(1, -1);
      // 用贴图平铺整个区域
      const tw = tile.width;
      const th = tile.height;
      for (let ty = 0; ty < h; ty += th) {
        for (let tx = 0; tx < drawW; tx += tw) {
          const tileDrawW = Math.min(tw, drawW - tx);
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
      p.noStroke();
      p.rect(drawX, this.y, drawW, h);
    }
  }
}
