import { AudioManager } from "../../AudioManager.js";

export class ButtonBase {
  constructor(p, label, x, y, callback, customClass = "") {
    this.btn = p.createButton(label);
    this.btn.style("visibility", "hidden");
    if (x !== undefined && y !== undefined) {
      this.btn.position(x, y);
    }
    this.btn.addClass("my-button");
    if (customClass) {
      this.btn.addClass(customClass);
    }
    requestAnimationFrame(() => {
      this.btn.style("visibility", "visible");
    });

    // 存储原始回调
    this._callback = callback;

    // 鼠标点击处理
    this.btn.mousePressed(() => {
      AudioManager.playSFX("click");
      this._callback();
    });

    // 鼠标悬停效果（为键盘焦点铺垫）
    this.btn.mouseOver(() => {
      this.btn.addClass("mouse-hover");
    });
    this.btn.mouseOut(() => {
      this.btn.removeClass("mouse-hover");
    });
  }

  // 更新位置
  setPosition(x, y) {
    this.btn.position(x, y);
  }

  // 更新文本
  setLabel(text) {
    this.btn.html(text);
  }

  // 禁用
  disable() {
    this.btn.attribute("disabled", true);
    this.btn.addClass("disabled");
  }

  // 启用
  enable() {
    this.btn.removeAttribute("disabled");
    this.btn.removeClass("disabled");
  }

  // 移除 DOM 元素
  remove() {
    this.btn.remove();
  }
}
