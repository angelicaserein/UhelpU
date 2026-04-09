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

    const { legacyDemo1Btn, legacyDemo2Btn } = this._createLegacyDemoPanel();
    this._createMemorialLinks();

    // 世界按钮配置（主区域难度入口）
    const worlds = [
      {
        cls: "world-button world-button-2 world-mode-button",
        label: t("world_easy"),
        action: () => this.switcher.showLevelChoiceEasy(p),
      },
      {
        cls: "world-button world-button-2 world-mode-button",
        label: t("world_difficult"),
        action: () => this.switcher.showLevelChoiceDemo2(p),
      },
    ];

    const btnY = 0.42 * p.height;
    const btnW = 0.23 * p.width;
    const btnH = 0.35 * p.height;
    const btnGap = 0.03 * p.width;
    const totalBtnsWidth = worlds.length * btnW + (worlds.length - 1) * btnGap;
    const startX = (p.width - totalBtnsWidth) / 2;

    const worldBtns = [];
    for (const [index, w] of worlds.entries()) {
      const btnX = startX + index * (btnW + btnGap);
      const btn = new ButtonBase(
        p,
        w.label,
        btnX,
        btnY,
        () => {
          w.action();
        },
        w.cls,
      );
      btn.btn.style("width", btnW + "px");
      btn.btn.style("height", btnH + "px");
      this.addElement(btn);
      worldBtns.push({
        btn: btn.btn,
        callback: () => w.action(),
      });
    }

    // 注册键盘导航（BackButton + 迭代版本按钮 + 主区域难度按钮）
    this.registerNavButtons(
      [
        {
          btn: backBtn.btn,
          callback: () => this.switcher.showMainMenu(p),
        },
        {
          btn: legacyDemo1Btn,
          callback: () => this.switcher.showOpeningSceneDemo1(p),
        },
        {
          btn: legacyDemo2Btn,
          callback: () => this.switcher.showLevelChoiceDemo2(p),
        },
        ...worldBtns,
      ],
      {
        layout: "horizontal",
        onEsc: () => this.switcher.showLanguageChoice(p),
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

  _createMemorialLinks() {
    const p = this.p;
    const panelWidth = 340;
    const panelX = p.width - panelWidth - 28;
    const panelY = 28;

    const panel = p.createDiv("");
    panel.addClass("world-memorial-panel");
    panel.style("width", panelWidth + "px");
    panel.position(panelX, panelY);

    const title = p.createDiv(t("world_memorial_title"));
    title.addClass("world-memorial-title");
    title.parent(panel);

    const oldDemoLink = p.createA(
      "https://lsironman789.github.io/Demo1-copy/Demo1/",
      t("world_memorial_earliest"),
      "_blank",
    );
    oldDemoLink.attribute("rel", "noopener noreferrer");
    oldDemoLink.addClass("world-memorial-link");
    oldDemoLink.parent(panel);

    const lavaIdeaLink = p.createA(
      "https://lsironman789.github.io/lava-level/lava/",
      t("world_memorial_discarded"),
      "_blank",
    );
    lavaIdeaLink.attribute("rel", "noopener noreferrer");
    lavaIdeaLink.addClass("world-memorial-link");
    lavaIdeaLink.parent(panel);

    this.addElement(panel);
  }

  _createLegacyDemoPanel() {
    const p = this.p;
    const panelWidth = 220;
    const memorialPanelX = p.width - 340 - 28;
    const panelX = memorialPanelX - panelWidth - 12;
    const panelY = 28;

    const panel = p.createDiv("");
    panel.addClass("world-memorial-panel");
    panel.style("width", panelWidth + "px");
    panel.position(panelX, panelY);

    const title = p.createDiv(t("world_legacy_title"));
    title.addClass("world-memorial-title");
    title.parent(panel);

    const legacyDemo1Btn = p.createButton(t("world_legacy_demo1"));
    legacyDemo1Btn.addClass("world-memorial-link");
    legacyDemo1Btn.addClass("world-memorial-link-button");
    legacyDemo1Btn.parent(panel);
    legacyDemo1Btn.mousePressed(() => {
      AudioManager.playSFX("click");
      this.switcher.showOpeningSceneDemo1(p);
    });

    const legacyDemo2Btn = p.createButton(t("world_legacy_demo2"));
    legacyDemo2Btn.addClass("world-memorial-link");
    legacyDemo2Btn.addClass("world-memorial-link-button");
    legacyDemo2Btn.parent(panel);
    legacyDemo2Btn.mousePressed(() => {
      AudioManager.playSFX("click");
      this.switcher.showLevelChoiceDemo2(p);
    });

    this.addElement(panel);
    this.addElement(legacyDemo1Btn);
    this.addElement(legacyDemo2Btn);

    return { legacyDemo1Btn, legacyDemo2Btn };
  }
}
