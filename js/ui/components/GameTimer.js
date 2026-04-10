/**
 * GameTimer.js
 * UI计时显示组件 - 使用 DOM 元素而不是 p5.js 绘制
 * 这样能确保显示在最上面，不会被游戏场景挡住
 */

export class GameTimer {
  /**
   * @param {p5.Sketch} p - p5.js 实例
   * @param {Object} config - 配置对象
   * @param {number} [config.x] - x坐标（默认：右上角）
   * @param {number} [config.y] - y坐标（默认：顶部）
   * @param {number} [config.fontSize] - 字体大小（默认：28）
   * @param {Array<number>} [config.color] - RGB颜色数组（默认：[255, 255, 255]）
   * @param {boolean} [config.enableTimer] - 是否显示（默认：true）
   */
  constructor(p, config = {}) {
    this.p = p;
    this.visible = config.enableTimer !== false;
    this.currentTime = "00:00";

    console.log("[GameTimer] Constructor called, visible:", this.visible);

    // 创建 DOM 元素
    this.element = document.createElement("div");
    this.element.id = "game-timer";
    this.element.textContent = this.currentTime;
    this.element.style.cssText = `
      position: fixed;
      right: 20px;
      top: 20px;
      font-size: ${config.fontSize || 32}px;
      font-weight: bold;
      color: #ffffff;
      background: rgba(0, 0, 0, 0.5);
      padding: 10px 20px;
      border-radius: 8px;
      border: 2px solid #FFB33B;
      font-family: "Courier New", monospace;
      z-index: 9999;
      display: ${this.visible ? "block" : "none"};
    `;

    console.log("[GameTimer] Element created:", this.element);
    console.log("[GameTimer] document.body:", document.body);

    if (document.body) {
      document.body.appendChild(this.element);
      console.log("[GameTimer] ✓ Element appended to body");
    } else {
      console.error("[GameTimer] ✗ document.body is null!");
    }

    console.log(
      "[GameTimer] Final element in DOM:",
      document.getElementById("game-timer"),
    );
  }

  /**
   * 绘制（对于 DOM 版本，这个方法没有实际作用，但保留接口兼容性）
   */
  draw(p) {
    // DOM版本不需要 p5.js 绘制
  }

  /**
   * 更新显示的时间
   * @param {number} elapsedSeconds - 已用时间（秒）
   */
  update(elapsedSeconds) {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = Math.floor(elapsedSeconds % 60);
    this.currentTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (this.element) {
      this.element.textContent = this.currentTime;
    }
  }

  /**
   * 重置时间显示
   */
  reset() {
    this.currentTime = "00:00";
    if (this.element) {
      this.element.textContent = this.currentTime;
    }
  }

  /**
   * 设置可见性
   * @param {boolean} visible
   */
  setVisible(visible) {
    this.visible = visible;
    if (this.element) {
      this.element.style.display = visible ? "block" : "none";
    }
  }

  /**
   * 获取当前显示的时间字符串
   * @returns {string}
   */
  getDisplayedTime() {
    return this.currentTime;
  }

  /**
   * 清理 - 移除 DOM 元素
   */
  cleanup() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
      console.log("[GameTimer] Cleaned up DOM element");
    }
  }
}
