export class PageBase {
  constructor(switcher) {
    this.switcher = switcher;   // 指向所属的子切换器
    this.elements = [];          // 存储页面中创建的 DOM 元素（必须有 remove 方法）
  }

  // 添加元素到清理列表
  addElement(el) {
    this.elements.push(el);
    return el;
  }

  // 进入页面时调用
  enter() {}

  // 每帧更新
  update() {}

  // 每帧绘制 canvas 内容
  draw() {}

  // 退出页面时清理资源
  exit() {
    this.cleanup();
  }

  // 清理所有 DOM 元素
  cleanup() {
    this.elements.forEach(el => {
      if (el && typeof el.remove === 'function') {
        el.remove();
      }
    });
    this.elements = [];
  }
}