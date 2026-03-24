import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from '../../../AudioManager.js';

export class StaticPageCredits extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
  }

  enter() {
    const p = this.p;

    AudioManager.playBGM('credits');

    // 返回按钮
    const backBtn = new ButtonBase(p, '◀', 0.02 * p.width, 0.03 * p.height, () => {
      this.switcher.showMainMenu(p);
    }, 'back-button');
    backBtn.btn.style('width', 0.030 * p.width + 'px');
    backBtn.btn.style('height', 0.055 * p.height + 'px');
    this.addElement(backBtn);
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageCredits) {
      p.image(Assets.bgImageCredits, 0, 0, p.width, p.height);
    } else {
      p.background(200, 255, 200);
    }
  }
}