// LevelInfo.js — 关卡信息悬浮展示组件
// 在 FollowImage 两侧显示关卡信息，鼠标悬浮到关卡按钮时触发
import { t } from "../../i18n.js";
import { Assets } from "../../AssetsManager.js";

export class LevelInfo {
  /**
   * @param {p5} p - p5 实例
   * @param {number} centerX - FollowImage 圆心 x（用于定位左右面板）
   * @param {number} centerY - FollowImage 圆心 y
   * @param {number} circleRadius - FollowImage 圆的半径
   */
  constructor(p, centerX, centerY, circleRadius) {
    this.p = p;
    this.centerX = centerX;
    this.centerY = centerY;
    this.circleRadius = circleRadius;

    this._activeLevelNum = null; // 当前悬浮的关卡编号，null 表示无
    this._alpha = 0; // 淡入淡出透明度 0–255
    this._fadeSpeed = 15;

    // 面板尺寸
    this._panelW = p.width * 0.16;
    this._panelH = p.height * 0.1;
    this._gap = circleRadius + p.width * 0.02; // 面板与圆心的间距
  }

  /** 设置当前悬浮的关卡编号（1-4），null 表示无悬浮 */
  setActiveLevel(levelNum) {
    this._activeLevelNum = levelNum;
  }

  update() {
    // 淡入/淡出
    if (this._activeLevelNum !== null) {
      this._alpha = this.p.min(this._alpha + this._fadeSpeed, 255);
    } else {
      this._alpha = this.p.max(this._alpha - this._fadeSpeed, 0);
    }
  }

  draw() {
    if (this._alpha <= 0) return;

    const p = this.p;
    const levelNum = this._activeLevelNum ?? this._lastDrawnLevel;
    if (!levelNum) return;
    this._lastDrawnLevel = levelNum;

    const leftKey = `level${levelNum}_info_left`;
    const rightKey = `level${levelNum}_info_right`;
    const leftText = t(leftKey);
    const rightText = t(rightKey);

    const alpha = this._alpha;

    p.push();

    // ── 左侧面板（标题模式：小抬头 + 大标题） ──
    const lx = this.centerX - this._gap - this._panelW;
    const ly = this.centerY - this._panelH / 2;
    this._drawTitlePanel(
      p,
      lx,
      ly,
      this._panelW,
      this._panelH,
      leftText,
      alpha,
    );

    // ── 右侧面板（难度模式：小抬头 + 大⭐） ──
    const rx = this.centerX + this._gap;
    const ry = this.centerY - this._panelH / 2;
    this._drawTitlePanel(
      p,
      rx,
      ry,
      this._panelW,
      this._panelH,
      rightText,
      alpha,
    );

    p.pop();
  }

  /** @private 绘制标题面板（小抬头 + 大标题） */
  _drawTitlePanel(p, x, y, w, h, text, alpha) {
    p.push();
    // 背景
    p.fill(60, 20, 80, alpha * 0.3);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(x, y, w, h, 8);

    const lines = text.split("\n");
    const subtitle = lines[0] || "";
    const title = lines.slice(1).join("\n") || "";

    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);

    // 小抬头（顶部）
    p.stroke(255, 255, 255, alpha * 0.3);
    p.strokeWeight(1);
    p.fill(255, 255, 255, alpha * 0.7);
    p.textSize(p.width * 0.009);
    p.text(subtitle, x + w / 2, y + h * 0.28);

    // 大标题
    p.stroke(255, 255, 255, alpha * 0.5);
    p.strokeWeight(1.5);
    p.fill(255, 255, 255, alpha);
    p.textSize(p.width * 0.02);
    p.text(title, x + w / 2, y + h * 0.65);

    p.pop();
  }

  /** @private 绘制普通信息面板 */
  _drawPanel(p, x, y, w, h, text, alpha) {
    p.push();
    // 深紫色低透明度背景，无边框
    p.fill(60, 20, 80, alpha * 0.3);
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(x, y, w, h, 8);

    // 白色文字 + 白色描边
    p.stroke(255, 255, 255, alpha * 0.5);
    p.strokeWeight(1.5);
    p.fill(255, 255, 255, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(p.width * 0.012);
    const tw = w * 0.85;
    const th = h * 0.85;
    p.text(text, x + (w - tw) / 2, y + (h - th) / 2, tw, th);
    p.pop();
  }
}
