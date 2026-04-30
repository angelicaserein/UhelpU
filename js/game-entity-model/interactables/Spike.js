import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import {
  ColliderShape,
  ColliderType,
} from "../../collision-system/enumerator.js";

export class Spike extends GameEntity {
  constructor(x, y, w, h, options = {}) {
    super(x, y);
    this.type = "spike";
    this.zIndex = -20;
    this.movementComponent = null;
    // Shrink collider proportionally so it is slightly smaller than the visual tile
    // 缩小判定范围比例，使其比视觉贴图稍小
    const colliderScale = 0.8;
    this.collider = new RectangleCollider(
      ColliderType.TRIGGER,
      w * colliderScale,
      h * colliderScale,
    );
    this.color = options.color || null;
  }

  draw(p) {
    const c = this.color || [100];
    p.fill(...c);
    p.noStroke();
    const spikeW = 20;
    const spikeH = this.collider.h;
    // y-axis upward: triangle tip points up
    // y轴向上：三角形尖端朝上
    for (let i = 0; i < this.collider.w; i += spikeW) {
      p.triangle(
        this.x + i,
        this.y,
        this.x + i + spikeW / 2,
        this.y + spikeH,
        this.x + i + spikeW,
        this.y,
      );
    }
  }
}
