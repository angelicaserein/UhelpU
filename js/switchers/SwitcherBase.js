export class SwitcherBase {
  constructor(mainSwitcher) {
    this.main = mainSwitcher;
    this.currentPage = null;
  }

  switchTo(page, p) {
    if (this.currentPage) {
      this.currentPage.exit && this.currentPage.exit(p);
    }
    this.currentPage = page;
    if (this.currentPage) {
      this.currentPage.enter && this.currentPage.enter(p);
    }
  }

  update() {
    if (this.currentPage && typeof this.currentPage.update === 'function') {
      this.currentPage.update();
    }
  }

  draw() {
    if (this.currentPage) {
      this.currentPage.draw();
    }
  }

  getCurrentPage() {
    return this.currentPage;
  }
}