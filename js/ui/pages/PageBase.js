import { KeyboardNavigationManager } from "../keyboard/KeyboardNavigationManager.js";
import { i18n } from "../../i18n.js";

export class PageBase {
  constructor(switcher) {
    this.switcher = switcher; // 指向所属的子切换器
    this.elements = []; // 存储页面中创建的 DOM 元素（必须有 remove 方法）

    // 键盘导航支持
    this._navManager = null;
    this._navButtons = []; // 页面的可导航按钮列表

    // 语言变化监听
    this._i18nHandler = null;
  }

  // 添加元素到清理列表
  addElement(el) {
    this.elements.push(el);
    return el;
  }

  /**
   * 为页面注册键盘导航按钮
   * @param {Array} buttons - [{ btn: p5Button, callback: fn }, ...]
   * @param {Object} options - { layout: 'vertical', onEsc: callback, initialFocus: 0 }
   */
  registerNavButtons(buttons, options = {}) {
    this._navButtons = buttons;
    this._navOptions = {
      layout: options.layout || "vertical",
      onEsc: options.onEsc || null,
      rows: options.rows || 1,
      cols: options.cols || 1,
      enableActivationKeys: options.enableActivationKeys !== false,
      initialFocus: options.initialFocus || 0, // 默认焦点索引
    };

    // 立即启动键盘导航（不用等 _enablePageNavigation）
    if (this._navButtons.length > 0 && !this._navManager) {
      this._enablePageNavigation();
    }
  }

  /**
   * 启用页面的键盘导航（在 enter() 时调用）
   */
  _enablePageNavigation() {
    if (this._navButtons.length === 0 || this._navManager) return;

    this._navManager = new KeyboardNavigationManager(this._navButtons, {
      layout: this._navOptions.layout,
      onEsc: this._navOptions.onEsc,
      rows: this._navOptions.rows,
      cols: this._navOptions.cols,
      enableActivationKeys: this._navOptions.enableActivationKeys,
    });

    this._navManager.activate();

    // 设置初始焦点
    if (this._navOptions.initialFocus > 0) {
      this._navManager.setFocus(this._navOptions.initialFocus);
    }

    console.log(
      `[PageBase] Keyboard navigation enabled with ${this._navButtons.length} buttons`,
    );
  }

  /**
   * 禁用页面的键盘导航（在 exit() 时调用）
   */
  _disablePageNavigation() {
    if (this._navManager) {
      this._navManager.deactivate();
      this._navManager.destroy();
      this._navManager = null;
      console.log("[PageBase] Keyboard navigation disabled");
    }
  }

  // 进入页面时调用
  enter() {
    this._enablePageNavigation();

    // 注册语言变化监听
    if (!this._i18nHandler) {
      this._i18nHandler = (lang) => this._onLanguageChange(lang);
      i18n.onChange(this._i18nHandler);
    }
  }

  // 每帧更新
  update() {}

  // 每帧绘制 canvas 内容
  draw() {}

  // 退出页面时清理资源
  exit() {
    this._disablePageNavigation();

    // 移除语言变化监听
    if (this._i18nHandler) {
      i18n.offChange(this._i18nHandler);
      this._i18nHandler = null;
    }

    this.cleanup();
  }

  // 当语言改变时调用（子类可覆盖来更新页面文本）
  _onLanguageChange(lang) {
    // 默认实现：子类可以覆盖此方法
  }

  // 清理所有 DOM 元素
  cleanup() {
    this.elements.forEach((el) => {
      if (el && typeof el.remove === "function") {
        el.remove();
      }
    });
    this.elements = [];
  }
}
