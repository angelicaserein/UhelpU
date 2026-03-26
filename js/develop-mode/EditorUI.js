/**
 * EditorUI — 编辑器底部工具栏 UI
 *
 * 负责：
 *   - 绘制底部工具栏（Ground / Portal 按钮、当前状态提示、保存按钮）
 *   - Ground 宽度/高度滑块
 *   - 处理工具栏区域的鼠标点击
 *
 * 所有绘制和坐标均在 **屏幕空间**（p5 原始坐标，未翻转）执行。
 */

import {
  EntityTool,
  TOOLBAR_HEIGHT,
  GROUND_DEFAULTS,
} from "./EditorConfig.js";

// ── 内部布局常量 ──────────────────────────────────────────────
const BTN_W = 110;
const BTN_H = 36;
const BTN_GAP = 14;
const BTN_Y_OFFSET = 12; // 按钮距工具栏顶部

const SLIDER_W = 160;
const SLIDER_H = 8;
const SLIDER_HANDLE = 14;
const SLIDER_LABEL_OFFSET = 16;

const SAVE_BTN_W = 90;
const SAVE_BTN_H = 36;

export class EditorUI {
  /**
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  constructor(canvasWidth, canvasHeight) {
    this._cw = canvasWidth;
    this._ch = canvasHeight;

    /** 当前选中的工具 */
    this.activeTool = EntityTool.GROUND;

    /** Ground 当前宽度/高度 */
    this.groundWidth = GROUND_DEFAULTS.width;
    this.groundHeight = GROUND_DEFAULTS.height;

    /** 保存按钮点击回调（由 MapEditor 注入） */
    this.onSave = null;

    /** toast 提示 */
    this._toast = null; // { text, endTime }

    // ── 预计算按钮矩形 ──────────────────────────────────────
    const toolbarTop = this._ch - TOOLBAR_HEIGHT;
    const startX = 20;

    this._btnGround = {
      x: startX,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnPortal = {
      x: startX + BTN_W + BTN_GAP,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };

    // 滑块 — 位于两个按钮右侧
    const sliderStartX = this._btnPortal.x + BTN_W + 30;
    const sliderRow1Y = toolbarTop + BTN_Y_OFFSET + 6;
    const sliderRow2Y = sliderRow1Y + 34;

    this._sliderWidth = {
      x: sliderStartX + 60,
      y: sliderRow1Y,
      w: SLIDER_W,
      h: SLIDER_H,
      label: "宽度",
      min: GROUND_DEFAULTS.minWidth,
      max: GROUND_DEFAULTS.maxWidth,
      _dragging: false,
    };
    this._sliderHeight = {
      x: sliderStartX + 60,
      y: sliderRow2Y,
      w: SLIDER_W,
      h: SLIDER_H,
      label: "高度",
      min: GROUND_DEFAULTS.minHeight,
      max: GROUND_DEFAULTS.maxHeight,
      _dragging: false,
    };

    // 保存按钮 — 右侧
    this._btnSave = {
      x: this._cw - SAVE_BTN_W - 20,
      y: toolbarTop + BTN_Y_OFFSET,
      w: SAVE_BTN_W,
      h: BTN_H,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 绘制
  // ══════════════════════════════════════════════════════════════

  draw(p) {
    p.push();
    p.resetMatrix(); // 回到屏幕空间

    const toolbarTop = this._ch - TOOLBAR_HEIGHT;

    // 工具栏背景
    p.fill(30, 30, 35, 220);
    p.noStroke();
    p.rect(0, toolbarTop, this._cw, TOOLBAR_HEIGHT);
    p.stroke(80);
    p.strokeWeight(1);
    p.line(0, toolbarTop, this._cw, toolbarTop);

    // Ground 按钮
    this._drawButton(
      p,
      this._btnGround,
      "Ground",
      this.activeTool === EntityTool.GROUND,
    );
    // Portal 按钮
    this._drawButton(
      p,
      this._btnPortal,
      "Portal",
      this.activeTool === EntityTool.PORTAL,
    );

    // 状态提示
    const statusX = this._btnPortal.x + BTN_W + 30;
    const statusY = toolbarTop + TOOLBAR_HEIGHT - 10;
    p.fill(200);
    p.noStroke();
    p.textSize(13);
    p.textAlign(p.LEFT, p.BOTTOM);
    const toolLabel =
      this.activeTool === EntityTool.GROUND ? "平台 (Ground)" : "传送门 (Portal)";
    p.text(`正在放置：${toolLabel}`, statusX, statusY);

    // 滑块 — 仅 Ground 模式显示
    if (this.activeTool === EntityTool.GROUND) {
      this._drawSlider(p, this._sliderWidth, this.groundWidth);
      this._drawSlider(p, this._sliderHeight, this.groundHeight);
    }

    // 保存按钮
    this._drawButton(p, this._btnSave, "💾 保存", false, [60, 180, 100]);

    // toast
    if (this._toast && Date.now() < this._toast.endTime) {
      this._drawToast(p, this._toast.text);
    } else {
      this._toast = null;
    }

    p.pop();
  }

  _drawButton(p, rect, label, active, baseColor) {
    const hover = this._insideRect(p.mouseX, p.mouseY, rect);
    if (active) {
      p.fill(70, 140, 220);
    } else if (baseColor) {
      p.fill(
        hover ? baseColor[0] + 30 : baseColor[0],
        hover ? baseColor[1] + 30 : baseColor[1],
        hover ? baseColor[2] + 30 : baseColor[2],
      );
    } else {
      p.fill(hover ? 75 : 55, hover ? 75 : 55, hover ? 80 : 60);
    }
    p.stroke(100);
    p.strokeWeight(1);
    p.rect(rect.x, rect.y, rect.w, rect.h, 6);
    p.fill(240);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  _drawSlider(p, slider, value) {
    // label
    p.fill(180);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(slider.label, slider.x - 8, slider.y + slider.h / 2);

    // track
    p.fill(60);
    p.noStroke();
    p.rect(slider.x, slider.y, slider.w, slider.h, 4);

    // filled portion
    const ratio = (value - slider.min) / (slider.max - slider.min);
    p.fill(70, 140, 220);
    p.rect(slider.x, slider.y, slider.w * ratio, slider.h, 4);

    // handle
    const hx = slider.x + slider.w * ratio;
    const hy = slider.y + slider.h / 2;
    p.fill(slider._dragging ? 255 : 220);
    p.stroke(100);
    p.ellipse(hx, hy, SLIDER_HANDLE, SLIDER_HANDLE);

    // value text
    p.fill(180);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(Math.round(value), slider.x + slider.w + 10, slider.y + slider.h / 2);
  }

  _drawToast(p, text) {
    const tw = p.textWidth(text) + 40;
    const th = 34;
    const tx = (this._cw - tw) / 2;
    const ty = this._ch - TOOLBAR_HEIGHT - 50;
    p.fill(40, 40, 45, 230);
    p.stroke(80, 180, 120);
    p.strokeWeight(1);
    p.rect(tx, ty, tw, th, 8);
    p.fill(120, 230, 150);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(text, tx + tw / 2, ty + th / 2);
  }

  // ══════════════════════════════════════════════════════════════
  // 交互
  // ══════════════════════════════════════════════════════════════

  /** 鼠标按下事件（屏幕坐标）。返回 true 表示事件被工具栏消费。 */
  handleMousePressed(mx, my) {
    // Ground 按钮
    if (this._insideRect(mx, my, this._btnGround)) {
      this.activeTool = EntityTool.GROUND;
      return true;
    }
    // Portal 按钮
    if (this._insideRect(mx, my, this._btnPortal)) {
      this.activeTool = EntityTool.PORTAL;
      return true;
    }
    // 保存按钮
    if (this._insideRect(mx, my, this._btnSave)) {
      if (this.onSave) this.onSave();
      return true;
    }
    // 滑块
    if (this.activeTool === EntityTool.GROUND) {
      if (this._hitSlider(mx, my, this._sliderWidth)) {
        this._sliderWidth._dragging = true;
        this._updateSliderValue(mx, this._sliderWidth, "groundWidth");
        return true;
      }
      if (this._hitSlider(mx, my, this._sliderHeight)) {
        this._sliderHeight._dragging = true;
        this._updateSliderValue(mx, this._sliderHeight, "groundHeight");
        return true;
      }
    }
    // 点击在工具栏区域内 → 消费事件但不做动作
    if (my >= this._ch - TOOLBAR_HEIGHT) return true;
    return false;
  }

  /** 鼠标拖拽（屏幕坐标） */
  handleMouseDragged(mx, _my) {
    if (this._sliderWidth._dragging) {
      this._updateSliderValue(mx, this._sliderWidth, "groundWidth");
      return true;
    }
    if (this._sliderHeight._dragging) {
      this._updateSliderValue(mx, this._sliderHeight, "groundHeight");
      return true;
    }
    return false;
  }

  /** 鼠标释放 */
  handleMouseReleased() {
    this._sliderWidth._dragging = false;
    this._sliderHeight._dragging = false;
  }

  /** 显示 toast 提示 */
  showToast(text, durationMs = 2000) {
    this._toast = { text, endTime: Date.now() + durationMs };
  }

  /** 鼠标是否在工具栏区域内 */
  isInsideToolbar(mx, my) {
    return my >= this._ch - TOOLBAR_HEIGHT;
  }

  // ── 内部工具方法 ──────────────────────────────────────────

  _insideRect(mx, my, rect) {
    return (
      mx >= rect.x &&
      mx <= rect.x + rect.w &&
      my >= rect.y &&
      my <= rect.y + rect.h
    );
  }

  _hitSlider(mx, my, slider) {
    const margin = 10;
    return (
      mx >= slider.x - margin &&
      mx <= slider.x + slider.w + margin &&
      my >= slider.y - margin &&
      my <= slider.y + slider.h + margin
    );
  }

  _updateSliderValue(mx, slider, prop) {
    const ratio = Math.max(0, Math.min(1, (mx - slider.x) / slider.w));
    const raw = slider.min + ratio * (slider.max - slider.min);
    this[prop] = Math.round(raw / 10) * 10; // snap to 10
  }
}
