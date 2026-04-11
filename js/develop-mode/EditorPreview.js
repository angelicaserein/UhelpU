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
  PLATFORM_DEFAULTS,
  SPIKE_DEFAULTS,
  WALL_DEFAULTS,
  WIRE_PORTAL_DEFAULTS,
  BTN_SPIKE_DEFAULTS,
  BTN_PLATFORM_DEFAULTS,
  NPC_SIZE,
  SIGNBOARD_SIZE,
  CHECKPOINT_SIZE,
  ENEMY_DEFAULTS,
  TELEPORT_POINT_SIZE,
  BOX_DEFAULTS,
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
  update(
    screenMX,
    screenMY,
    canvasH,
    cameraX,
    tool,
    groundW,
    groundH,
    insideToolbar,
  ) {
    if (insideToolbar || tool === EntityTool.SPAWN) {
      this.visible = false;
      return;
    }

    // 屏幕 → 世界坐标（Y 轴翻转）
    const worldX = screenMX + cameraX;
    const worldY = canvasH - screenMY;

    if (tool === EntityTool.GROUND) {
      this.previewW = groundW;
      this.previewH = groundH;
    } else if (tool === EntityTool.PLATFORM) {
      this.previewW = PLATFORM_DEFAULTS.width;
      this.previewH = PLATFORM_DEFAULTS.height;
    } else if (tool === EntityTool.SPIKE) {
      this.previewW = SPIKE_DEFAULTS.width;
      this.previewH = SPIKE_DEFAULTS.height;
    } else if (tool === EntityTool.WALL) {
      this.previewW = WALL_DEFAULTS.width;
      this.previewH = WALL_DEFAULTS.height;
    } else if (tool === EntityTool.WIRE_PORTAL) {
    } else if (tool === EntityTool.BOX) {
      this.previewW = BOX_DEFAULTS.width;
      this.previewH = BOX_DEFAULTS.height;
    } else if (tool === EntityTool.WIRE_PORTAL) {
      this.previewW = WIRE_PORTAL_DEFAULTS.buttonWidth;
      this.previewH = WIRE_PORTAL_DEFAULTS.buttonHeight;
    } else if (tool === EntityTool.BTN_SPIKE) {
      this.previewW = BTN_SPIKE_DEFAULTS.buttonWidth;
      this.previewH = BTN_SPIKE_DEFAULTS.buttonHeight;
    } else if (tool === EntityTool.BTN_PLATFORM) {
      this.previewW = BTN_PLATFORM_DEFAULTS.buttonWidth;
      this.previewH = BTN_PLATFORM_DEFAULTS.buttonHeight;
    } else if (tool === EntityTool.NPC) {
      this.previewW = NPC_SIZE.width;
      this.previewH = NPC_SIZE.height;
    } else if (tool === EntityTool.SIGNBOARD) {
      this.previewW = SIGNBOARD_SIZE.width;
      this.previewH = SIGNBOARD_SIZE.height;
    } else if (tool === EntityTool.CHECKPOINT) {
      this.previewW = CHECKPOINT_SIZE.width;
      this.previewH = CHECKPOINT_SIZE.height;
    } else if (tool === EntityTool.TELEPORT_POINT) {
      this.previewW = TELEPORT_POINT_SIZE.width;
      this.previewH = TELEPORT_POINT_SIZE.height;
    } else if (tool === EntityTool.ENEMY) {
      this.previewW = ENEMY_DEFAULTS.width;
      this.previewH = ENEMY_DEFAULTS.height;
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
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(120, 200, 120, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.PLATFORM) {
      p.stroke(180, 180, 100, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(180, 180, 100, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.SPIKE) {
      p.stroke(220, 80, 80, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(220, 80, 80, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.WALL) {
      p.stroke(140, 140, 160, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(140, 140, 160, PREVIEW_ALPHA * 0.4);
    } else if (tool === EntityTool.BOX) {
      p.stroke(200, 140, 100, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(200, 140, 100, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.WIRE_PORTAL) {
      // 按钮预览（紫色）
      p.stroke(180, 100, 240, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(180, 100, 240, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);

      // 传送门预览（偏移位置）
      const portalX = this.previewX + WIRE_PORTAL_DEFAULTS.offsetX;
      const portalY = this.previewY;
      const portalW = WIRE_PORTAL_DEFAULTS.portalWidth;
      const portalH = WIRE_PORTAL_DEFAULTS.portalHeight;
      p.stroke(180, 100, 240, PREVIEW_ALPHA);
      this._dashedRect(p, portalX, portalY, portalW, portalH, 8);
      p.noStroke();
      p.fill(180, 100, 240, PREVIEW_ALPHA * 0.3);
      p.rect(portalX, portalY, portalW, portalH);

      // 连接线
      p.stroke(180, 100, 240, PREVIEW_ALPHA * 0.6);
      p.strokeWeight(1);
      this._dashedLine(
        p,
        this.previewX + this.previewW / 2,
        this.previewY + this.previewH,
        portalX + portalW / 2,
        portalY + portalH,
        6,
      );
      p.strokeWeight(2);
    } else if (tool === EntityTool.BTN_SPIKE) {
      // 按钮预览（橙色）
      p.stroke(240, 160, 30, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(240, 160, 30, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);

      // 地刺预览（偏移位置）
      const spikeX = this.previewX + BTN_SPIKE_DEFAULTS.offsetX;
      const spikeY = this.previewY;
      const spikeW = BTN_SPIKE_DEFAULTS.spikeWidth;
      const spikeH = BTN_SPIKE_DEFAULTS.spikeHeight;
      p.stroke(240, 160, 30, PREVIEW_ALPHA);
      this._dashedRect(p, spikeX, spikeY, spikeW, spikeH, 8);
      p.noStroke();
      p.fill(240, 160, 30, PREVIEW_ALPHA * 0.3);
      p.rect(spikeX, spikeY, spikeW, spikeH);

      // 连接线
      p.stroke(240, 160, 30, PREVIEW_ALPHA * 0.6);
      p.strokeWeight(1);
      this._dashedLine(
        p,
        this.previewX + this.previewW / 2,
        this.previewY + this.previewH,
        spikeX + spikeW / 2,
        spikeY + spikeH,
        6,
      );
      p.strokeWeight(2);
    } else if (tool === EntityTool.BTN_PLATFORM) {
      // 按钮预览（青绿色）
      p.stroke(60, 180, 140, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(60, 180, 140, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);

      // 平台预览（偏移位置）
      const platX = this.previewX + BTN_PLATFORM_DEFAULTS.offsetX;
      const platY = this.previewY;
      const platW = BTN_PLATFORM_DEFAULTS.platformWidth;
      const platH = BTN_PLATFORM_DEFAULTS.platformHeight;
      p.stroke(60, 180, 140, PREVIEW_ALPHA);
      this._dashedRect(p, platX, platY, platW, platH, 8);
      p.noStroke();
      p.fill(60, 180, 140, PREVIEW_ALPHA * 0.3);
      p.rect(platX, platY, platW, platH);

      // 连接线
      p.stroke(60, 180, 140, PREVIEW_ALPHA * 0.6);
      p.strokeWeight(1);
      this._dashedLine(
        p,
        this.previewX + this.previewW / 2,
        this.previewY + this.previewH,
        platX + platW / 2,
        platY + platH,
        6,
      );
      p.strokeWeight(2);
    } else if (tool === EntityTool.NPC) {
      p.stroke(60, 200, 220, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(60, 200, 220, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.SIGNBOARD) {
      p.stroke(200, 160, 80, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(200, 160, 80, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.CHECKPOINT) {
      p.stroke(200, 80, 180, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(200, 80, 180, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.TELEPORT_POINT) {
      p.stroke(100, 180, 255, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(100, 180, 255, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.ENEMY) {
      p.stroke(100, 200, 100, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(100, 200, 100, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else {
      p.stroke(100, 160, 255, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
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
