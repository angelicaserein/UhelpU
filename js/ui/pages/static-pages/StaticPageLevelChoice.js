import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { FollowImage } from "../../components/FollowImage.js";
import { LevelInfo } from "../../components/LevelInfo.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageLevelChoice extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
    this.follower = null;
    this.levelInfo = null;
  }

  enter() {
    const p = this.p;

    AudioManager.playBGM("levelChoice");

    // 返回按钮
    const backBtn = new ButtonBase(
      p,
      "◀",
      0.02 * p.width,
      0.03 * p.height,
      () => {
        this.switcher.showMainMenu(p);
      },
      "back-button",
    );
    backBtn.btn.style("width", 0.04 * p.width + "px");
    backBtn.btn.style("height", 0.065 * p.height + "px");
    this.addElement(backBtn);

    // 关卡按钮配置
    const levelConfigs = [
      { num: 1, x: 0.125, w: 0.05, cls: "level1-button" },
      { num: 2, x: 0.3, w: 0.051, cls: "level2-button" },
      { num: 3, x: 0.477, w: 0.049, cls: "level3-button" },
      { num: 4, x: 0.654, w: 0.049, cls: "level4-button" },
    ];

    for (const cfg of levelConfigs) {
      const btn = new ButtonBase(
        p,
        " ",
        cfg.x * p.width,
        0.441 * p.height,
        () => {
          this.eventBus.publish(EventTypes.LOAD_LEVEL, `level${cfg.num}`);
        },
        cfg.cls,
      );
      btn.btn.style("width", cfg.w * p.width + "px");
      btn.btn.style("height", 0.048 * p.height + "px");
      btn.btn.mouseOver(() => this.levelInfo?.setActiveLevel(cfg.num));
      btn.btn.mouseOut(() => this.levelInfo?.setActiveLevel(null));
      this.addElement(btn);
    }

    // 跟随鼠标的动图
    const followerX = p.width * 0.5;
    const followerY = p.height * 0.115;
    const followerR = 0.04 * p.width;
    this.follower = new FollowImage(
      p,
      Assets.followerImg2,
      followerX,
      followerY,
      followerR,
      60,
    );

    // 关卡信息悬浮面板（FollowImage 左右两侧）
    this.levelInfo = new LevelInfo(
      p,
      followerX,
      followerY + 15,
      followerR + 150,
    );
  }

  update() {
    if (this.follower) this.follower.update();
    if (this.levelInfo) this.levelInfo.update();
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageLevelChoice) {
      p.image(Assets.bgImageLevelChoice, 0, 0, p.width, p.height);
    } else {
      p.background(200, 255, 200);
    }
    if (this.levelInfo) this.levelInfo.draw();
    if (this.follower) this.follower.draw();
  }
}
