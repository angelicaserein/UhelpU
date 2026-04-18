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
    this._overlayPath = null;
    this._isVisible = false;
    this._visibleRects = [];
    this._handleResize = () => this._updateViewport();
  }

  /**
   * 创建黑幕层
   * @param {HTMLElement} container - 容器元素（通常是 canvas 父容器）
   */
  create(container) {
    if (this.overlay) return;

    this.overlay = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    this.overlay.setAttribute("class", "tutorial-overlay");
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.style.position = "fixed";
    this.overlay.style.top = "0";
    this.overlay.style.left = "0";
    this.overlay.style.width = "100%";
    this.overlay.style.height = "100%";
    this.overlay.style.zIndex = TutorialOverlay.Z_INDEX;
    this.overlay.style.display = "none";
    this.overlay.style.pointerEvents = "none"; // 不拦截鼠标事件

    this._overlayPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    this._overlayPath.setAttribute("fill", "rgba(0, 0, 0, 0.85)");
    this._overlayPath.setAttribute("fill-rule", "evenodd");

    this.overlay.appendChild(this._overlayPath);
    this._updateViewport();
    window.addEventListener("resize", this._handleResize);

    document.body.appendChild(this.overlay);
  }

  /**
   * 销毁黑幕层
   */
  destroy() {
    if (this.overlay) {
      window.removeEventListener("resize", this._handleResize);
      this.overlay.remove();
      this.overlay = null;
    }
    this._overlayPath = null;
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

    this._visibleRects = this._normalizeVisibleRects(visibleRects);
    this._updatePath();

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
    this._updatePath();
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
    this._visibleRects = this._normalizeVisibleRects(visibleRects);
    if (this._isVisible) {
      this._updatePath();
    }
  }

  /**
   * 内部：同步 SVG 视口尺寸
   */
  _updateViewport() {
    if (!this.overlay) {
      return;
    }

    const viewportWidth = Math.max(
      window.innerWidth,
      document.documentElement?.clientWidth || 0,
    );
    const viewportHeight = Math.max(
      window.innerHeight,
      document.documentElement?.clientHeight || 0,
    );

    this.overlay.setAttribute(
      "viewBox",
      `0 0 ${viewportWidth} ${viewportHeight}`,
    );
    this.overlay.setAttribute("width", String(viewportWidth));
    this.overlay.setAttribute("height", String(viewportHeight));

    if (this._isVisible) {
      this._updatePath();
    }
  }

  /**
   * 内部：更新 SVG 路径。
   * 第一段是整屏黑幕，后面的矩形路径会通过 evenodd 填充规则被挖空。
   */
  _updatePath() {
    if (!this._overlayPath || !this.overlay) {
      return;
    }

    const viewBox = (this.overlay.getAttribute("viewBox") || "0 0 0 0")
      .split(" ")
      .map((value) => Number(value) || 0);
    const viewportWidth = viewBox[2] || window.innerWidth;
    const viewportHeight = viewBox[3] || window.innerHeight;

    const pathParts = [`M0 0 H${viewportWidth} V${viewportHeight} H0 Z`];

    for (const rect of this._visibleRects) {
      const x = rect.x;
      const y = rect.y;
      const width = rect.width;
      const height = rect.height;
      pathParts.push(`M${x} ${y} H${x + width} V${y + height} H${x} Z`);
    }

    this._overlayPath.setAttribute("d", pathParts.join(" "));
  }

  /**
   * 内部：归一化矩形配置
   */
  _normalizeVisibleRects(visibleRects) {
    if (!Array.isArray(visibleRects)) {
      return [];
    }

    return visibleRects
      .map((rect) => {
        if (!rect) return null;

        const x = Number(rect.x) || 0;
        const y = Number(rect.y) || 0;
        const width = Number(rect.width ?? rect.w) || 0;
        const height = Number(rect.height ?? rect.h) || 0;

        if (width <= 0 || height <= 0) {
          return null;
        }

        return { x, y, width, height };
      })
      .filter(Boolean);
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
