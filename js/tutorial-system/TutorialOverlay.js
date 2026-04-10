// js/tutorial-system/TutorialOverlay.js — 教学系统黑幕层管理

/**
 * TutorialOverlay - 管理半透明黑幕层
 * - 支持全屏黑幕
 * - 支持部分透明区域（使用 clip-path）
 * - 自动处理 z-index 分层
 */
export class TutorialOverlay {
  static Z_INDEX = 5000; // 在 GamePage (1000+) 之上，在 WindowBase (2147483646) 之下

  constructor() {
    this.overlay = null;
    this._isVisible = false;
    this._visibleRects = [];
  }

  /**
   * 创建黑幕层
   * @param {HTMLElement} container - 容器元素（通常是 canvas 父容器）
   */
  create(container) {
    if (this.overlay) return;

    this.overlay = document.createElement("div");
    this.overlay.className = "tutorial-overlay";
    this.overlay.style.position = "fixed";
    this.overlay.style.top = "0";
    this.overlay.style.left = "0";
    this.overlay.style.width = "100%";
    this.overlay.style.height = "100%";
    this.overlay.style.background = "rgba(0, 0, 0, 0.85)";
    this.overlay.style.zIndex = TutorialOverlay.Z_INDEX;
    this.overlay.style.display = "none";
    this.overlay.style.pointerEvents = "none"; // 不拦截鼠标事件

    document.body.appendChild(this.overlay);
  }

  /**
   * 销毁黑幕层
   */
  destroy() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this._isVisible = false;
    this._visibleRects = [];
  }

  /**
   * 显示黑幕（全屏或部分透明）
   * @param {Array<{x: number, y: number, w: number, h: number}>} visibleRects
   *   - 不被遮挡的矩形区域（屏幕坐标）
   *   - 如果为空或不传入，则为全屏黑幕
   */
  show(visibleRects = []) {
    if (!this.overlay) return;

    this._visibleRects = visibleRects || [];

    if (this._visibleRects.length === 0) {
      // 全屏黑幕，不需要 clip-path
      this.overlay.style.clipPath = "none";
    } else {
      // 部分透明区域 —— 使用 clip-path 创建透明窗口
      this._updateClipPath();
    }

    this.overlay.style.display = "block";
    this._isVisible = true;
  }

  /**
   * 隐藏黑幕
   */
  hide() {
    if (!this.overlay) return;
    this.overlay.style.display = "none";
    this._isVisible = false;
    this._visibleRects = [];
  }

  /**
   * 检查黑幕是否可见
   */
  isVisible() {
    return this._isVisible;
  }

  /**
   * 更新可见区域（黑幕显示状态下）
   * @param {Array<{x, y, w, h}>} visibleRects - 新的可见矩形列表
   */
  updateVisibleRects(visibleRects) {
    this._visibleRects = visibleRects || [];
    if (this._isVisible) {
      if (this._visibleRects.length === 0) {
        this.overlay.style.clipPath = "none";
      } else {
        this._updateClipPath();
      }
    }
  }

  /**
   * 内部：更新 clip-path
   * 创建一个多边形，四个角是不可见区域，中间的矩形是可见区域
   */
  _updateClipPath() {
    if (this._visibleRects.length === 0) {
      this.overlay.style.clipPath = "none";
      return;
    }

    // 构建 polygon clip-path
    // 整个外框是 (0, 0) 到 (100%, 100%)，多个"洞"是可见区域
    let clipPathParts = ["polygon("];

    // 外框（从top-left顺时针）
    clipPathParts.push("0% 0%, 100% 0%, 100% 100%, 0% 100%");

    // 对于每个可见矩形，创建一个透明区域
    // clip-path 的奇偶填充规则会让这些区域变透明
    for (const rect of this._visibleRects) {
      const x = rect.x;
      const y = rect.y;
      const width = rect.width || rect.w || 0;
      const height = rect.height || rect.h || 0;

      const x1 = x;
      const y1 = y;
      const x2 = x + width;
      const y2 = y + height;

      // 添加矩形四个角（顺时针）
      clipPathParts.push(
        `, ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px`
      );
    }

    clipPathParts.push(")");
    const clipPathStr = clipPathParts.join("");

    // 使用 fill-rule: evenodd 来实现"洞"效果
    this.overlay.style.clipPath = clipPathStr;
  }

  /**
   * 获取当前可见矩形列表（用于测试或调试）
   */
  getVisibleRects() {
    return [...this._visibleRects];
  }

  /**
   * 清除所有可见区域（变为全屏黑幕）
   */
  clearVisibleRects() {
    this.updateVisibleRects([]);
  }
}
