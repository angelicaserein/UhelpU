// WindowBase.js — 悬浮窗基类 (p5 instance mode)
// 提供可拖拽、可开关的悬浮窗框架，子类在 _buildContent() 中填充内容

import { KeyboardNavigationManager } from "../keyboard/KeyboardNavigationManager.js";

export class WindowBase {
  /**
   * @param {p5}    p      - p5 实例
   * @param {string} title - 标题栏文字
   * @param {number} x     - 初始横坐标
   * @param {number} y     - 初始纵坐标
   * @param {number} w     - 窗口宽度 (px)
   */
  constructor(p, title, x, y, w) {
    this.p = p;
    this.title = title;
    this._x = x;
    this._y = y;
    this.w = w;
    this.isVisible = false;

    this._dragging = false;
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;

    // 键盘导航支持
    this._navManager = null;
    this._navButtons = []; // 用户注册的按钮列表
    this._navOptions = {}; // 导航选项

    this._buildDOM();
    this._initDrag();
  }

  // ─── DOM 构建 ──────────────────────────────────────────────────────────────

  _buildDOM() {
    const p = this.p;

    // 主容器
    this.container = p.createDiv("");
    this.container.addClass("window-base");
    this.container.position(this._x, this._y);
    this.container.style("width", this.w + "px");

    // 标题栏
    this.titleBar = p.createDiv("");
    this.titleBar.addClass("window-titlebar");
    this.titleBar.parent(this.container);

    this._titleTextEl = p.createSpan(this.title);
    this._titleTextEl.addClass("window-title-text");
    this._titleTextEl.parent(this.titleBar);

    // 关闭按钮
    this.closeBtn = p.createButton("✕");
    this.closeBtn.addClass("window-close-btn");
    this.closeBtn.parent(this.titleBar);
    this.closeBtn.mousePressed(() => this.close());

    // 内容区域（子类向此区域添加控件）
    this.contentArea = p.createDiv("");
    this.contentArea.addClass("window-content");
    this.contentArea.parent(this.container);

    this.container.hide();
  }

  // ─── 拖拽支持 ──────────────────────────────────────────────────────────────

  _initDrag() {
    const titleEl = this.titleBar.elt;

    const onMouseDown = (e) => {
      if (e.target === this.closeBtn.elt) return;
      this._dragging = true;
      const rect = this.container.elt.getBoundingClientRect();
      this._dragOffsetX = e.clientX - rect.left;
      this._dragOffsetY = e.clientY - rect.top;
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!this._dragging) return;
      this._x = e.clientX - this._dragOffsetX;
      this._y = e.clientY - this._dragOffsetY;
      this.container.position(this._x, this._y);
    };

    const onMouseUp = () => {
      this._dragging = false;
    };

    titleEl.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    // 保存清理引用
    this._removeDragListeners = () => {
      titleEl.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }

  // ─── 公开 API ──────────────────────────────────────────────────────────────

  open() {
    this.isVisible = true;
    this.container.show();
    this._initKeyboardNav();
  }

  close() {
    this.isVisible = false;
    this.container.hide();
    this._cleanupKeyboardNav();
  }

  /**
   * 启用键盘导航（由子类在 _buildContent 后调用）
   * @param {Array} buttons - [p5Button1, p5Button2, ...] p5.Renderer 按钮对象
   *                          或 [{ btn: p5Button, callback: fn }, ...] 带回调的按钮
   * @param {Object} options - { layout: 'vertical', onEsc: callback }
   */
  enableKeyboardNavigation(buttons, options = {}) {
    // 规范化按钮格式：如果是数组中的对象，保留；如果是 p5Button，包装成 { btn, callback: null }
    this._navButtons = buttons.map((btn) => {
      if (btn && typeof btn === "object" && btn.btn) {
        return btn; // 已经是 { btn, callback?, ... } 格式
      }
      return { btn }; // 是 p5Button，包装它
    });

    this._navOptions = {
      layout: options.layout || "vertical",
      onEsc: options.onEsc || (() => this.close()),
    };
  }

  /**
   * 内部方法：初始化键盘导航（在 open 时调用）
   */
  _initKeyboardNav() {
    if (this._navButtons.length === 0 || this._navManager) return;

    // 按钮已经是正确的格式了（可能包含 callback 属性）
    this._navManager = new KeyboardNavigationManager(this._navButtons, {
      layout: this._navOptions.layout || "vertical",
      onEsc: this._navOptions.onEsc || (() => this.close()),
    });

    this._navManager.activate();
  }

  /**
   * 内部方法：清理键盘导航（在 close 时调用）
   */
  _cleanupKeyboardNav() {
    if (this._navManager) {
      this._navManager.deactivate();
      this._navManager.destroy();
      this._navManager = null;
    }
  }

  toggle() {
    this.isVisible ? this.close() : this.open();
  }

  /** 更新标题栏文字（供子类语言刷新使用） */
  setTitle(text) {
    this._titleTextEl.html(text);
  }

  /** 销毁窗口及所有事件监听 */
  remove() {
    this._cleanupKeyboardNav();
    if (this._removeDragListeners) this._removeDragListeners();
    this.container.remove();
  }
}
