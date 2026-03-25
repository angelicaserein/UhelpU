// AchievementToast.js — 成就解锁提示（画布底部中央，DOM 实现）
// 风格与关卡标题横幅保持一致（白色渐变光带）
// z-index 高于 WindowPrompt(9999)，不会被遮挡
// 用法：new AchievementToast(p).show("achievement_unlocked")

import { i18n, t } from "../i18n.js";

export class AchievementToast {
  /**
   * @param {p5} p - p5 实例
   * @param {Object} options
   *   - duration: 显示时长(ms)，默认 5500
   */
  constructor(p, options = {}) {
    this.p = p;
    this.duration = options.duration ?? 5500;
    this._timer = null;
    this._container = null;
    this._textEl = null;
    this._currentKey = null;
    this._i18nHandler = null;
  }

  /** 触发成就提示 */
  show(textKey) {
    this._removeToast();
    this._currentKey = textKey;

    const p = this.p;
    const canvas = p.canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // 外层定位容器：覆盖画布区域
    this._container = p.createDiv("");
    this._container.addClass("achievement-toast-anchor");
    this._container.position(rect.left, rect.top);
    this._container.style("width", rect.width + "px");
    this._container.style("height", rect.height + "px");

    // 光带横幅
    const band = p.createDiv("");
    band.addClass("achievement-toast-band");
    band.parent(this._container);

    // 文字
    this._textEl = p.createSpan("🏆  " + t(textKey));
    this._textEl.addClass("achievement-toast-label");
    this._textEl.parent(band);

    // 语言切换监听
    this._i18nHandler = () => {
      if (this._textEl) this._textEl.html("🏆  " + t(this._currentKey));
    };
    i18n.onChange(this._i18nHandler);

    // 触发滑入动画
    requestAnimationFrame(() => {
      if (band) band.addClass("achievement-toast-band-visible");
    });

    // 定时淡出
    this._timer = setTimeout(() => this._fadeOut(), this.duration);
  }

  _fadeOut() {
    if (!this._container) return;
    // 找到 band 子元素，移除 visible 类触发淡出
    const bandEl = this._container.elt.querySelector(".achievement-toast-band");
    if (bandEl) bandEl.classList.remove("achievement-toast-band-visible");
    setTimeout(() => this._removeToast(), 600);
  }

  _removeToast() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._i18nHandler) {
      i18n.offChange(this._i18nHandler);
      this._i18nHandler = null;
    }
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
    this._textEl = null;
    this._currentKey = null;
  }

  /** 清理资源（关卡切换时调用） */
  remove() {
    this._removeToast();
  }
}
