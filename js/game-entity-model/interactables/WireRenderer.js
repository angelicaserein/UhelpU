import { GameEntity } from "../base/GameEntity.js";

/**
 * 虚拟实体 - 用于代理 BtnWirePortalSystem 的绘制
 * 通过 zIndex 的方式让电线参与实体的 z 轴排序
 * 确保电线在角色下方（zIndex 为负数）
 */
export class WireRenderer extends GameEntity {
  /**
   * @param {object} wireSystem - BtnWirePortalSystem 实例
   * @param {number} [zIndex=-30] - 绘制层级（负数确保在角色下方）
   */
  constructor(wireSystem, zIndex = -30) {
    super(0, 0);
    this.type = "wirerenderer";
    this.zIndex = zIndex;
    this.movementComponent = null;
    this.collider = null;
    this._wireSystem = wireSystem;
  }

  update(_p) {
    // 虚拟实体不需要物理更新
  }

  draw(p) {
    this._wireSystem.draw(p);
  }
}
