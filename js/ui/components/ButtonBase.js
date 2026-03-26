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
    // 使用箭头函数保留 this 上下文
    this.btn.mousePressed(() => {
      AudioManager.playSFX("click");
      callback();
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
