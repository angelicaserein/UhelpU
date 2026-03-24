// WindowSidebarBase.js — 侧边栏悬浮窗基类 (p5 instance mode)

export class WindowSidebarBase {
  /**
   * @param {p5} p
   * @param {string} title
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {{ closable?: boolean, extraClasses?: string[] }} options
   */
  constructor(p, title, x, y, width, height, options = {}) {
    this.p = p;
    this.title = title;
    this._x = x;
    this._y = y;
    this._w = width;
    this._h = height;
    this.isVisible = false;

    this.options = {
      closable: false,
      extraClasses: [],
      ...options,
    };

    this._buildDOM();
  }

  _buildDOM() {
    const p = this.p;

    this.container = p.createDiv('');
    this.container.addClass('window-sidebar-base');
    for (const className of this.options.extraClasses) {
      this.container.addClass(className);
    }
    this.container.position(this._x, this._y);
    this.container.style('width', this._w + 'px');
    this.container.style('height', this._h + 'px');

    this.header = p.createDiv('');
    this.header.addClass('window-sidebar-header');
    this.header.parent(this.container);

    this._titleTextEl = p.createSpan(this.title);
    this._titleTextEl.addClass('window-sidebar-title');
    this._titleTextEl.parent(this.header);

    this.closeBtn = p.createButton('✕');
    this.closeBtn.addClass('window-sidebar-close-btn');
    this.closeBtn.parent(this.header);
    this.closeBtn.mousePressed(() => this.close());
    if (!this.options.closable) {
      this.closeBtn.hide();
    }

    this.contentRoot = p.createDiv('');
    this.contentRoot.addClass('window-sidebar-content');
    this.contentRoot.parent(this.container);

    this.navArea = p.createDiv('');
    this.navArea.addClass('window-sidebar-nav');
    this.navArea.parent(this.contentRoot);

    this.panelArea = p.createDiv('');
    this.panelArea.addClass('window-sidebar-panels');
    this.panelArea.parent(this.contentRoot);

    this.container.hide();
  }

  setTitle(text) {
    this._titleTextEl.html(text);
  }

  open() {
    this.isVisible = true;
    this.container.show();
  }

  close() {
    this.isVisible = false;
    this.container.hide();
  }

  toggle() {
    this.isVisible ? this.close() : this.open();
  }

  remove() {
    this.container.remove();
  }
}
