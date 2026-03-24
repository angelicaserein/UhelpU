import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { FollowImage } from "../../components/FollowImage.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from '../../../AudioManager.js';
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageLevelChoice extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
    this.follower = null;
  }

  enter() {
    const p = this.p;

    AudioManager.playBGM('levelChoice');

    // 返回按钮
    const backBtn = new ButtonBase(p, '◀', 0.02 * p.width, 0.03 * p.height, () => {
      this.switcher.showMainMenu(p);
    }, 'back-button');
    backBtn.btn.style('width', 0.040 * p.width + 'px');
    backBtn.btn.style('height', 0.065 * p.height + 'px');
    this.addElement(backBtn);

    // Level 1 按钮
    const level1Btn = new ButtonBase(p, ' ', 0.125 * p.width, 0.441 * p.height, () => {
      this.eventBus.publish(EventTypes.LOAD_LEVEL, "level1");
    }, 'level1-button');
    level1Btn.btn.style('width', 0.050 * p.width + 'px');
    level1Btn.btn.style('height', 0.048 * p.height + 'px');
    this.addElement(level1Btn);

    // Level 2 按钮
    const level2Btn = new ButtonBase(p, ' ', 0.3 * p.width, 0.441 * p.height, () => {
      this.eventBus.publish(EventTypes.LOAD_LEVEL, "level2");
    }, 'level2-button');
    level2Btn.btn.style('width', 0.051 * p.width + 'px');
    level2Btn.btn.style('height', 0.048 * p.height + 'px');
    this.addElement(level2Btn);

    // Level 3 按钮
    const level3Btn = new ButtonBase(p, ' ', 0.477 * p.width, 0.441 * p.height, () => {
      this.eventBus.publish(EventTypes.LOAD_LEVEL, "level3");
    }, 'level3-button');
    level3Btn.btn.style('width', 0.049 * p.width + 'px');
    level3Btn.btn.style('height', 0.048 * p.height + 'px');
    this.addElement(level3Btn);

    // 跟随鼠标的动图
    this.follower = new FollowImage(
      p,
      Assets.followerImg2,
      p.width * 0.5,
      p.height * 0.115,
      0.04 * p.width,
      60
    );
  }

  update() {
    if (this.follower) this.follower.update();
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageLevelChoice) {
      p.image(Assets.bgImageLevelChoice, 0, 0, p.width, p.height);
    } else {
      p.background(200, 255, 200);
    }
    if (this.follower) this.follower.draw();
  }
}
