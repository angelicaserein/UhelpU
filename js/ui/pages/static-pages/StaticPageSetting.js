import { PageBase } from "../PageBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { WindowSettingSidebar } from "../../windows/WindowSettingSidebar.js";
import { AudioManager } from "../../../AudioManager.js";

export class StaticPageSetting extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
    this.settingSidebar = null;
  }

  enter() {
    const p = this.p;

    AudioManager.playBGM("setting");

    this.addElement(new BackButton(p, () => this.switcher.showMainMenu(p)));

    const sidebarWidth = Math.round(p.width * 0.8);
    const sidebarHeight = Math.round(p.height * 0.8);
    const sidebarX = Math.round((p.width - sidebarWidth) / 2);
    const sidebarY = Math.round((p.height - sidebarHeight) / 2);

    this.settingSidebar = new WindowSettingSidebar(
      p,
      sidebarX,
      sidebarY,
      sidebarWidth,
      sidebarHeight,
    );
    this.settingSidebar.onBGMChange = (value) =>
      AudioManager.setBGMVolume(value);
    this.settingSidebar.onSFXChange = (value) =>
      AudioManager.setSFXVolume(value);
    this.settingSidebar.setBGMVolume(AudioManager.getBGMVolume());
    this.settingSidebar.setSFXVolume(AudioManager.getSFXVolume());
    this.settingSidebar.open();
  }

  exit() {
    if (this.settingSidebar) {
      this.settingSidebar.remove();
      this.settingSidebar = null;
    }
    super.exit();
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageSettings) {
      p.image(Assets.bgImageSettings, 0, 0, p.width, p.height);
    } else {
      p.background(200, 255, 200);
    }
  }
}
