/**
 * EditorPreview — 鼠标悬浮预览（半透明虚线框）
 *
 * 根据当前选中工具和鼠标位置，在世界空间绘制即将放置实体的预览。
 * 坐标吸附到 GRID_SIZE 网格。
 */

import {
  EntityTool,
  GRID_SIZE,
  PORTAL_SIZE,
  PREVIEW_ALPHA,
} from "./EditorConfig.js";

export class EditorPreview {
  constructor() {
    /** 最近一次计算出的预览世界坐标与尺寸 */
    this.previewX = 0;
    this.previewY = 0;
    this.previewW = 0;
    this.previewH = 0;
    this.visible = false;
  }

  /**
   * 根据屏幕鼠标位置更新预览位置。
   *
   * @param {number} screenMX   屏幕空间鼠标 X
   * @param {number} screenMY   屏幕空间鼠标 Y
   * @param {number} canvasH    画布高度
   * @param {number} cameraX    当前摄像机 X 偏移（世界坐标）
   * @param {string} tool       当前工具类型 (EntityTool)
   * @param {number} groundW    当前 Ground 宽度（仅 Ground 模式有效）
   * @param {number} groundH    当前 Ground 高度（仅 Ground 模式有效）
   * @param {boolean} insideToolbar 鼠标是否在工具栏上
   */
  update(screenMX, screenMY, canvasH, cameraX, tool, groundW, groundH, insideToolbar) {
    if (insideToolbar) {
      this.visible = false;
      return;
    }

    // 屏幕 → 世界坐标（Y 轴翻转）
    const worldX = screenMX + cameraX;
    const worldY = canvasH - screenMY;

    if (tool === EntityTool.GROUND) {
      this.previewW = groundW;
      this.previewH = groundH;
    } else {
      this.previewW = PORTAL_SIZE.width;
      this.previewH = PORTAL_SIZE.height;
    }

    // 吸附到网格，以实体中心为锚点
    this.previewX = this._snap(worldX - this.previewW / 2);
    this.previewY = this._snap(worldY - this.previewH / 2);

    this.visible = true;
  }

  /**
   * 在世界空间绘制预览框。
   * 调用时 p5 变换应已处于翻转 + 平移后的世界坐标系。
   */
  draw(p, tool) {
    if (!this.visible) return;

    p.push();
    p.noFill();
    p.strokeWeight(2);

    if (tool === EntityTool.GROUND) {
      p.stroke(120, 200, 120, PREVIEW_ALPHA);
      // 虚线效果：用多段短线模拟
      this._dashedRect(p, this.previewX, this.previewY, this.previewW, this.previewH, 8);
      // 半透明填充
      p.noStroke();
      p.fill(120, 200, 120, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else {
      p.stroke(100, 160, 255, PREVIEW_ALPHA);
      this._dashedRect(p, this.previewX, this.previewY, this.previewW, this.previewH, 8);
      p.noStroke();
      p.fill(100, 160, 255, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    }

    // 坐标标注
    p.push();
    p.translate(this.previewX, this.previewY + this.previewH);
    p.scale(1, -1); // 翻回正常文字方向
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      `(${this.previewX}, ${this.previewY})  ${this.previewW}×${this.previewH}`,
      2,
      2,
    );
    p.pop();

    p.pop();
  }

  // ── 内部工具 ──────────────────────────────────────────────

  _snap(v) {
    return Math.round(v / GRID_SIZE) * GRID_SIZE;
  }

  /** 使用短线段模拟虚线矩形 */
  _dashedRect(p, x, y, w, h, dashLen) {
    this._dashedLine(p, x, y, x + w, y, dashLen);
    this._dashedLine(p, x + w, y, x + w, y + h, dashLen);
    this._dashedLine(p, x + w, y + h, x, y + h, dashLen);
    this._dashedLine(p, x, y + h, x, y, dashLen);
  }

  _dashedLine(p, x1, y1, x2, y2, dashLen) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(len / dashLen);
    const ux = dx / len;
    const uy = dy / len;
    for (let i = 0; i < steps; i += 2) {
      const sx = x1 + ux * dashLen * i;
      const sy = y1 + uy * dashLen * i;
      const ex = x1 + ux * dashLen * Math.min(i + 1, steps);
      const ey = y1 + uy * dashLen * Math.min(i + 1, steps);
      p.line(sx, sy, ex, ey);
    }
  }
}
