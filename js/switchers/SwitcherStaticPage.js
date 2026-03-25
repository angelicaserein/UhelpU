import { SwitcherBase } from "./SwitcherBase.js";
import { StaticPageMenu } from "../ui/pages/static-pages/StaticPageMenu.js";
import { StaticPageResult } from "../ui/pages/static-pages/StaticPageResult.js";
import { StaticPageSetting } from "../ui/pages/static-pages/StaticPageSetting.js";
import { StaticPageAchieves } from "../ui/pages/static-pages/StaticPageAchieves.js";
import { StaticPageOpeningStory } from "../ui/pages/static-pages/StaticPageOpeningStory.js";
import { StaticPageLevelChoice } from "../ui/pages/static-pages/StaticPageLevelChoice.js";

export class SwitcherStaticPage extends SwitcherBase {
  constructor(mainSwitcher, p) {
    super(mainSwitcher);
    this.p = p;
    this.eventBus = null;
  }

  showMainMenu(p = this.p, eventBus) {
    if (eventBus) this.eventBus = eventBus;
    const mainMenu = new StaticPageMenu(this, p, this.eventBus);
    this.main.switchToStatic(mainMenu, p);
  }

  showSettings(p = this.p) {
    const page = new StaticPageSetting(this, p);
    this.main.switchToStatic(page, p);
  }

  showAchieves(p = this.p) {
    const page = new StaticPageAchieves(this, p);
    this.main.switchToStatic(page, p);
  }

  showOpeningScene(p = this.p) {
    const page = new StaticPageOpeningStory(this, p);
    this.main.switchToStatic(page, p);
  }

  showLevelChoice(p = this.p) {
    const page = new StaticPageLevelChoice(this, p, this.eventBus);
    this.main.switchToStatic(page, p);
  }
}
