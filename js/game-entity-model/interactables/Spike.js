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
    this.movementComponent = null;
    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);
    this.color = options.color || null;
  }

  draw(p) {
    const c = this.color || [100];
    p.fill(...c);
    p.noStroke();
    const spikeW = 20;
    const spikeH = this.collider.h;
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
