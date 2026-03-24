// WindowPrompt.js - 轻量级提示浮窗
// 特点：在画布居中显示，点击关闭

import { i18n, t } from "../../i18n.js";

export class WindowPrompt {
  /**
   * @param {p5} p - p5实例
   * @param {string} contentKey - i18n内容键（待改成真正的提示框内容）
   * @param {Object} options - 可选配置
   *   - width: 浮窗宽度(px)，默认400
   *   - backgroundColor: 背景色，默认 rgba(14, 7, 22, 0.93)
   *   - padding: 内边距(px)，默认40
   *   - fontSize: 字体大小，默认18
   *   - onClose: 关闭时的回调函数
   */
  constructor(p, contentKey = "", options = {}) {
    this.p = p;
    this.contentKey = contentKey;
    this.isVisible = false;

    // 配置选项
    this.width = options.width ?? 400;
    this.backgroundColor = options.backgroundColor ?? "rgba(14, 7, 22, 0.93)";
    this.padding = options.padding ?? 40;
    this.fontSize = options.fontSize ?? 18;
    this.onClose = options.onClose ?? null;

    // 创建DOM
    this._buildDOM();

    // 监听i18n变化
    this._i18nHandler = () => this._refreshContent();
    i18n.onChange(this._i18nHandler);
  }

  // ─── DOM 构建 ──────────────────────────────────────────────────────────────

  _buildDOM() {
    const p = this.p;

    // 全屏遮罩层（相对于画布）
    this.overlay = p.createDiv("");
    this.overlay.addClass("window-prompt-overlay");
    this.overlay.style("display", "none");
    this.overlay.mousePressed(() => this.close());

    // 主容器
    this.container = p.createDiv("");
    this.container.addClass("window-prompt-container");
    this.container.parent(this.overlay);
    this.container.style("width", this.width + "px");
    this.container.style("padding", this.padding + "px");
    this.container.style("background-color", this.backgroundColor);

    // 内容文本
    this._contentEl = p.createDiv(this._getContent());
    this._contentEl.addClass("window-prompt-content");
    this._contentEl.style("font-size", this.fontSize + "px");
    this._contentEl.parent(this.container);

    // 关闭提示文本（支持i18n）
    this._tipsEl = p.createDiv(t("click_to_close"));
    this._tipsEl.addClass("window-prompt-tips");
    this._tipsEl.parent(this.container);

    // 初始隐藏
    this.overlay.hide();
  }

  // ─── 内容管理 ──────────────────────────────────────────────────────────────

  _getContent() {
    if (!this.contentKey) {
      return "这是一个占位符提示框，等会会改成真正的提示框内容。";
    }
    return t(this.contentKey);
  }

  _refreshContent() {
    if (this._contentEl) {
      this._contentEl.html(this._getContent());
    }
    if (this._tipsEl) {
      this._tipsEl.html(t("click_to_close"));
    }
  }

  setContent(contentKey) {
    this.contentKey = contentKey;
    this._refreshContent();
  }

  // ─── 位置计算 ──────────────────────────────────────────────────────────────

  _updatePosition() {
    const p = this.p;
    const canvas = p.canvas;
    if (!canvas) return;

    // 获取 canvas 相对于视口的位置
    const canvasRect = canvas.getBoundingClientRect();
    const canvasX = canvasRect.left;
    const canvasY = canvasRect.top;
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    // 计算浮窗在画布中的中心位置
    const overlayX = canvasX;
    const overlayY = canvasY;

    // 设置遮罩层覆盖画布
    this.overlay.position(overlayX, overlayY);
    this.overlay.style("width", canvasWidth + "px");
    this.overlay.style("height", canvasHeight + "px");
  }

  // ─── 显示/隐藏 ──────────────────────────────────────────────────────────────

  open() {
    this.isVisible = true;
    this._refreshContent();
    this._updatePosition();
    this.overlay.show();
    this.overlay.style("display", "flex");
  }

  close() {
    this.isVisible = false;
    this.overlay.hide();

    if (this.onClose && typeof this.onClose === "function") {
      this.onClose();
    }
  }

  toggle() {
    if (this.isVisible) {
      this.close();
    } else {
      this.open();
    }
  }

  // ─── 清理 ──────────────────────────────────────────────────────────────────

  remove() {
    i18n.offChange(this._i18nHandler);
    if (this.overlay) this.overlay.remove();
    this.container = null;
    this._contentEl = null;
    this._tipsEl = null;
  }
}
