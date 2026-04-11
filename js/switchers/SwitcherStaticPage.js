import { SwitcherBase } from "./SwitcherBase.js";
import { StaticPageMenu } from "../ui/pages/static-pages/StaticPageMenu.js";
import { StaticPageSetting } from "../ui/pages/static-pages/StaticPageSetting.js";
import { StaticPageAchieves } from "../ui/pages/static-pages/StaticPageAchieves.js";
import { StaticPageOpeningStory } from "../ui/pages/static-pages/StaticPageOpeningStory.js";
import { StaticPageOpeningStoryDemo1 } from "../ui/pages/static-pages/StaticPageOpeningStoryDemo1.js";
import { StaticPageLevelChoice } from "../ui/pages/static-pages/StaticPageLevelChoice.js";
import { StaticPageLevelChoiceDemo2 } from "../ui/pages/static-pages/StaticPageLevelChoiceDemo2.js";
import { StaticPageLevelChoiceEasy } from "../ui/pages/static-pages/StaticPageLevelChoiceEasy.js";
import { StaticPageLevelChoiceHard } from "../ui/pages/static-pages/StaticPageLevelChoiceHard.js";
import { StaticPageWorldSelect } from "../ui/pages/static-pages/StaticPageWorldSelect.js";
import { LanguageChoice } from "../ui/pages/static-pages/LanguageChoice.js";
import { NameInputPage } from "../ui/pages/static-pages/NameInputPage.js";

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

  showOpeningSceneDemo1(p = this.p) {
    const page = new StaticPageOpeningStoryDemo1(this, p);
    this.main.switchToStatic(page, p);
  }

  showLanguageChoice(p = this.p) {
    const page = new LanguageChoice(this, p);
    this.main.switchToStatic(page, p);
  }

  showNameInput(p = this.p) {
    const page = new NameInputPage(this, p);
    this.main.switchToStatic(page, p);
  }

  showWorldSelect(p = this.p) {
    const page = new StaticPageWorldSelect(this, p, this.eventBus);
    this.main.switchToStatic(page, p);
  }

  showLevelChoice(p = this.p) {
    const page = new StaticPageLevelChoice(this, p, this.eventBus);
    this.main.switchToStatic(page, p);
  }

  showLevelChoiceEasy(p = this.p) {
    const page = new StaticPageLevelChoiceEasy(this, p, this.eventBus);
    this.main.switchToStatic(page, p);
  }

  showLevelChoiceHard(p = this.p) {
    const page = new StaticPageLevelChoiceHard(this, p, this.eventBus);
    this.main.switchToStatic(page, p);
  }

  showLevelChoiceDemo2(p = this.p) {
    const page = new StaticPageLevelChoiceDemo2(this, p, this.eventBus);
    this.main.switchToStatic(page, p);
  }
}
