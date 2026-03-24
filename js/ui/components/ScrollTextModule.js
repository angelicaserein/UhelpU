import { Assets } from "../../AssetsManager.js";

// ScrollTextModule.js — p5 instance mode
export class ScrollTextModule {
  /**
   * @param {p5} p - p5 实例
   * @param {string[]} lines - 字幕行数组
   * @param {function} onComplete - 滚动完成后执行的回调
   * @param {object} options - 可选配置
   */
  constructor(p, lines, onComplete, options = {}) {
    this.p = p;
    this.lines = lines;
    this.onComplete = onComplete;
    this.speed = options.speed || 1.2;
    this.fadeHeight = options.fadeHeight || 80;
    this.scrollRect = options.scrollRect || { x: 0, y: 0, w: p.width, h: p.height };

    this.scrollY = this.scrollRect.y + this.scrollRect.h;
    this.lineHeight = 40;
    this.totalHeight = lines.length * this.lineHeight;
    this.completed = false;
  }

  update() {
    if (this.completed) return;
    this.scrollY -= this.speed;
    if (this.scrollY < this.scrollRect.y - this.totalHeight - this.lineHeight) {
      this.completed = true;
      if (this.onComplete) this.onComplete();
    }
  }

  draw() {
    if (this.completed) return;
    const p = this.p;

    p.push();
    p.textSize(30);
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) {
      p.textFont(Assets.customFont);
    }

    // 裁剪到滚动区域
    p.drawingContext.save();
    p.drawingContext.beginPath();
    p.drawingContext.rect(this.scrollRect.x, this.scrollRect.y, this.scrollRect.w, this.scrollRect.h);
    p.drawingContext.clip();

    for (let i = 0; i < this.lines.length; i++) {
      let y = this.scrollY + i * this.lineHeight;
      let alpha = 255;
      let lineCenterY = y;

      if (lineCenterY < this.scrollRect.y + this.fadeHeight) {
        let dist = lineCenterY - this.scrollRect.y;
        alpha = p.map(dist, 0, this.fadeHeight, 0, 255);
        alpha = p.constrain(alpha, 0, 255);
      } else if (lineCenterY > this.scrollRect.y + this.scrollRect.h - this.fadeHeight) {
        let dist = this.scrollRect.y + this.scrollRect.h - lineCenterY;
        alpha = p.map(dist, 0, this.fadeHeight, 0, 255);
        alpha = p.constrain(alpha, 0, 255);
      }

      p.fill(255, alpha);

      if (y > this.scrollRect.y - this.lineHeight && y < this.scrollRect.y + this.scrollRect.h + this.lineHeight) {
        p.text(this.lines[i], this.scrollRect.x + this.scrollRect.w / 2, y);
      }
    }

    p.drawingContext.restore();
    p.pop();
  }
}
