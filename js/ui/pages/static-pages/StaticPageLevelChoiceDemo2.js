import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { BackButton } from "../../components/BackButton.js";
import { FollowImage } from "../../components/FollowImage.js";
import { LevelInfo } from "../../components/LevelInfo.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageLevelChoiceDemo2 extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
    this.follower = null;
    this.levelInfo = null;
  }

  enter() {
    super.enter();

    const p = this.p;

    AudioManager.playBGM("levelChoice");

    const backBtn = new BackButton(p, () => this.switcher.showWorldSelect(p));
    this.addElement(backBtn);

    // demo2 关卡按钮配置 — 上排 1-5，下排 6-10
    const topRowConfigs = [
      { num: 1, x: 0.125, w: 0.05, cls: "level1-button" },
      { num: 2, x: 0.3, w: 0.051, cls: "level2-button" },
      { num: 3, x: 0.477, w: 0.049, cls: "level3-button" },
      { num: 4, x: 0.654, w: 0.049, cls: "level4-button" },
      { num: 5, x: 0.828, w: 0.049, cls: "level5-button" },
    ];
    const bottomRowConfigs = [
      { num: 6, x: 0.143, w: 0.05, cls: "level6-button" },
      { num: 7, x: 0.328, w: 0.051, cls: "level7-button" },
      { num: 8, x: 0.504, w: 0.049, cls: "level8-button" },
      { num: 9, x: 0.669, w: 0.049, cls: "level9-button" },
      { num: 10, x: 0.832, w: 0.049, cls: "level10-button" },
    ];

    const topRowY = 0.441;
    const bottomRowY = 0.815;

    const levelBtns = [];
    for (const cfg of topRowConfigs) {
      const btn = new ButtonBase(
        p,
        " ",
        cfg.x * p.width,
        topRowY * p.height,
        () => {
          this.eventBus.publish(EventTypes.LOAD_LEVEL, `demo2_level${cfg.num}`);
        },
        cfg.cls,
      );
      btn.btn.style("width", cfg.w * p.width + "px");
      btn.btn.style("height", 0.048 * p.height + "px");
      btn.btn.mouseOver(() => this.levelInfo?.setActiveLevel(cfg.num));
      btn.btn.mouseOut(() => this.levelInfo?.setActiveLevel(null));
      this.addElement(btn);
      levelBtns.push({
        btn: btn.btn,
        callback: () => {
          this.eventBus.publish(EventTypes.LOAD_LEVEL, `demo2_level${cfg.num}`);
        },
      });
    }

    for (const cfg of bottomRowConfigs) {
      const btn = new ButtonBase(
        p,
        " ",
        cfg.x * p.width,
        bottomRowY * p.height,
        () => {
          this.eventBus.publish(EventTypes.LOAD_LEVEL, `demo2_level${cfg.num}`);
        },
        cfg.cls,
      );
      btn.btn.style("width", cfg.w * p.width + "px");
      btn.btn.style("height", 0.048 * p.height + "px");
      btn.btn.mouseOver(() => this.levelInfo?.setActiveLevel(cfg.num));
      btn.btn.mouseOut(() => this.levelInfo?.setActiveLevel(null));
      this.addElement(btn);
      levelBtns.push({
        btn: btn.btn,
        callback: () => {
          this.eventBus.publish(EventTypes.LOAD_LEVEL, `demo2_level${cfg.num}`);
        },
      });
    }

    // 注册键盘导航（BackButton + 10个关卡按钮，网格布局）
    this.registerNavButtons(
      [
        {
          btn: backBtn.btn,
          callback: () => this.switcher.showWorldSelect(p),
        },
        ...levelBtns,
      ],
      {
        layout: "grid",
        cols: 5,
        rows: 2,
      },
    );

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

    // 关卡信息悬浮面板
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
