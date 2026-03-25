// switchers/SwitcherMain.js
import { SwitcherStaticPage } from "./SwitcherStaticPage.js";
import { SwitcherGamePage } from "./SwitcherGamePage.js";

export class SwitcherMain {
  constructor(p, eventBus) {
    this.p = p;
    this.staticSwitcher = new SwitcherStaticPage(this, p);
    this.gameSwitcher = new SwitcherGamePage(this, eventBus);
    this.activeSwitcher = this.staticSwitcher;
    this.overlay = null;
  }

  setOverlay(page, p = this.p) {
    this.overlay = page;
    if (page && page.enter) page.enter(p);
  }

  clearOverlay(p = this.p) {
    if (this.overlay) {
      if (this.overlay.exit) this.overlay.exit(p);
      this.overlay = null;
    }
  }

  // 切换到静态页面
  switchToStatic(page, p = this.p) {
    if (this.activeSwitcher !== this.staticSwitcher) {
      if (this.gameSwitcher.currentPage) {
        this.gameSwitcher.currentPage.exit(p);
        this.gameSwitcher.currentPage = null;
      }
    }
    this.activeSwitcher = this.staticSwitcher;
    this.staticSwitcher.switchTo(page, p);
  }

  // 切换到游戏页面
  switchToGame(page, p = this.p) {
    if (this.activeSwitcher !== this.gameSwitcher) {
      if (this.staticSwitcher.currentPage) {
        this.staticSwitcher.currentPage.exit(p);
        this.staticSwitcher.currentPage = null;
      }
    }
    this.activeSwitcher = this.gameSwitcher;
    this.gameSwitcher.switchTo(page, p);
  }

  update(p = this.p) {
    if (this.activeSwitcher) {
      this.activeSwitcher.update(p);
    }
  }

  draw(p = this.p) {
    if (this.activeSwitcher) {
      this.activeSwitcher.draw(p);
    }
  }

  getActiveSwitcher() {
    return this.activeSwitcher;
  }
}
