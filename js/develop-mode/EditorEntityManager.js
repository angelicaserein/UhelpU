/**
 * EditorEntityManager — 管理编辑器放置的实体列表
 *
 * 负责：
 *   - 存储用户放置的所有 Ground / Portal 记录
 *   - 在世界空间绘制已放置的实体（半透明叠加层，区别于原关卡实体）
 *   - 提供实体数据供导出
 */

import { EntityTool } from "./EditorConfig.js";

/**
 * @typedef {Object} PlacedEntity
 * @property {string} tool   — EntityTool 枚举值
 * @property {number} x      — 世界坐标 x
 * @property {number} y      — 世界坐标 y
 * @property {number} w      — 宽度
 * @property {number} h      — 高度
 */

export class EditorEntityManager {
  constructor() {
    /** @type {PlacedEntity[]} */
    this.entities = [];
  }

  /**
   * 放置一个新实体
   * @returns {PlacedEntity}
   */
  place(tool, x, y, w, h) {
    const entity = { tool, x, y, w, h };
    this.entities.push(entity);
    return entity;
  }

  /** 撤销最后一个放置（Ctrl+Z 用） */
  undoLast() {
    return this.entities.pop() ?? null;
  }

  /** 清空全部 */
  clear() {
    this.entities.length = 0;
  }

  /** 获取所有实体（只读引用） */
  getAll() {
    return this.entities;
  }

  /**
   * 在世界空间绘制所有已放置实体。
   * 调用时 p5 应处于翻转 + 摄像机平移后的世界坐标。
   */
  draw(p) {
    for (const e of this.entities) {
      p.push();
      if (e.tool === EntityTool.GROUND) {
        p.fill(80, 180, 80, 160);
        p.stroke(100, 220, 100);
        p.strokeWeight(2);
        p.rect(e.x, e.y, e.w, e.h);
        // 标签
        p.push();
        p.translate(e.x, e.y + e.h);
        p.scale(1, -1);
        p.fill(255);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`G ${e.w}×${e.h}`, 3, 3);
        p.pop();
      } else {
        p.fill(80, 130, 220, 160);
        p.stroke(100, 170, 255);
        p.strokeWeight(2);
        p.rect(e.x, e.y, e.w, e.h);
        // 标签
        p.push();
        p.translate(e.x, e.y + e.h);
        p.scale(1, -1);
        p.fill(255);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        p.text("Portal", 3, 3);
        p.pop();
      }
      p.pop();
    }
  }
}
