import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { t } from "../../../i18n.js";
import { AudioManager } from "../../../AudioManager.js";

export class StaticPageWorldSelect extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
  }

  enter() {
    super.enter();

    const p = this.p;

    AudioManager.playBGM("levelChoice");

    const backBtn = new BackButton(p, () => this.switcher.showMainMenu(p));
    this.addElement(backBtn);

    // 世界按钮配置
    const worlds = [
      {
        num: 1,
        x: 0.18,
        label: t("world_1"),
        action: () => this.switcher.showLevelChoiceDemo2(p),
      },
      {
        num: 2,
        x: 0.44,
        label: t("world_2"),
        action: () => this.switcher.showLevelChoice(p),
      },
      {
        num: 3,
        x: 0.7,
        label: t("world_3"),
        action: () => this.switcher.showOpeningSceneDemo1(p),
      },
    ];

    const btnY = 0.42 * p.height;
    const btnW = 0.2 * p.width;
    const btnH = 0.35 * p.height;

    const worldBtns = [];
    for (const w of worlds) {
      const btn = new ButtonBase(
        p,
        w.label,
        w.x * p.width,
        btnY,
        () => {
          w.action();
        },
        `world-button world-button-${w.num}`,
      );
      btn.btn.style("width", btnW + "px");
      btn.btn.style("height", btnH + "px");
      this.addElement(btn);
      worldBtns.push({
        btn: btn.btn,
        callback: () => w.action(),
      });
    }

    // 注册键盘导航（BackButton + 3个世界按钮）
    this.registerNavButtons(
      [
        {
          btn: backBtn.btn,
          callback: () => this.switcher.showMainMenu(p),
        },
        ...worldBtns,
      ],
      {
        layout: "horizontal",
      },
    );
  }

  update() {}

  draw() {
    const p = this.p;
    p.background(30, 15, 50);
    if (Assets.bgImageWorldSelect) {
      p.image(Assets.bgImageWorldSelect, 0, 0, p.width, p.height);
    }
  }
}
