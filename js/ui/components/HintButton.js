// HintButton.js — p5 instance mode
export class HintButton {
  constructor(p, label, x, y, callback, customClass = '', backLabel = '') {
    this.p = p;
    this.isFlipped = false;

    // 创建容器 div
    this.container = p.createDiv('');
    this.container.position(x, y);
    this.container.addClass('hint-notebook-button');
    if (customClass) {
      this.container.addClass(customClass);
    }

    // 翻转容器
    this.flipper = p.createDiv('');
    this.flipper.addClass('flipper');
    this.container.child(this.flipper);

    // 正面
    this.front = p.createDiv(label);
    this.front.addClass('front');
    this.flipper.child(this.front);

    // 背面
    this.back = p.createDiv(backLabel);
    this.back.addClass('back');
    this.flipper.child(this.back);

    this.container.mousePressed(() => {
      this.isFlipped = !this.isFlipped;
      this.container.toggleClass('is-flipped');

      if (callback) {
        callback(this.isFlipped);
      }
    });
  }

  setBackText(text) {
    this.back.html(text);
  }

  setFrontText(text) {
    this.front.elt.textContent = text;
  }

  remove() {
    this.container.remove();
  }
}
