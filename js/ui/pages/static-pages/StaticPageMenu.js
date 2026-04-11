import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { FollowImage } from "../../components/FollowImage.js";
import { Assets } from "../../../AssetsManager.js";
import { t } from "../../../i18n.js";
import { AudioManager } from "../../../AudioManager.js";

export class StaticPageMenu extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
    this._subtitle = null;
    this._startBtn = null;
    this._settingsBtn = null;
    this._achievesBtn = null;
  }

  enter() {
    super.enter();

    const p = this.p;

    AudioManager.playBGM("menu");

    const subtitle = p.createDiv(t("menu_subtitle"));
    subtitle.addClass("menu-subtitle");
    subtitle.position(0.5 * p.width, 0.45 * p.height);
    this.addElement(subtitle);
    this._subtitle = subtitle;

    // PLAY 按钮 → 进入语言选择
    const startBtn = new ButtonBase(
      p,
      t("btn_play"),
      0.456 * p.width,
      0.794 * p.height,
      () => {
        this.switcher.showLanguageChoice(p);
      },
      "start-button",
    );
    startBtn.btn.style("width", 0.088 * p.width + "px");
    startBtn.btn.style("height", 0.155 * p.height + "px");
    this.addElement(startBtn);
    this._startBtn = startBtn;

    // SETTINGS 按钮
    const settingsBtn = new ButtonBase(
      p,
      t("btn_settings"),
      0.358 * p.width,
      0.814 * p.height,
      () => {
        this.switcher.showSettings(p);
      },
      "settings-button",
    );
    settingsBtn.btn.style("width", 0.06 * p.width + "px");
    settingsBtn.btn.style("height", 0.11 * p.height + "px");
    this.addElement(settingsBtn);
    this._settingsBtn = settingsBtn;

    // Achieves 按钮
    const achievesBtn = new ButtonBase(
      p,
      t("btn_achieves"),
      0.583 * p.width,
      0.816 * p.height,
      () => {
        this.switcher.showAchieves(p);
      },
      "achieves-button",
    );
    achievesBtn.btn.style("width", 0.06 * p.width + "px");
    achievesBtn.btn.style("height", 0.11 * p.height + "px");
    this.addElement(achievesBtn);
    this._achievesBtn = achievesBtn;

    // 注册键盘导航（水平排列 - 按视觉顺序从左到右，Play是默认焦点）
    this.registerNavButtons(
      [
        {
          btn: settingsBtn.btn, // Settings（索引0 - 左）
          callback: () => {
            this.switcher.showSettings(p);
          },
        },
        {
          btn: startBtn.btn, // Play （索引1 - 中间 - 默认焦点）
          callback: () => {
            this.switcher.showLanguageChoice(p);
          },
        },
        {
          btn: achievesBtn.btn, // Achieves（索引2 - 右）
          callback: () => {
            this.switcher.showAchieves(p);
          },
        },
      ],
      {
        layout: "horizontal",
        initialFocus: 1, // Play 按钮是默认焦点
      },
    );

    // 跟随鼠标的动图
    this.follower = new FollowImage(
      p,
      Assets.followerImg1,
      p.width * 0.5,
      p.height * 0.113,
      0.04 * p.width,
      60,
    );

    // M 键快捷进入 Hard Level10 开发者模式
    this._onDevModeKey = (e) => {
      if (e.key === "m" || e.key === "M") {
        document.removeEventListener("keydown", this._onDevModeKey);
        this._onDevModeKey = null;
        this.eventBus.publish("loadLevel", "hard_level10");
        this.eventBus.publish("activateDevMode");
      }
    };
    document.addEventListener("keydown", this._onDevModeKey);
  }

  _onLanguageChange(lang) {
    if (this._subtitle) {
      this._subtitle.html(t("menu_subtitle"));
    }
    if (this._startBtn && this._startBtn.btn) {
      this._startBtn.btn.html(t("btn_play"));
    }
    if (this._settingsBtn && this._settingsBtn.btn) {
      this._settingsBtn.btn.html(t("btn_settings"));
    }
    if (this._achievesBtn && this._achievesBtn.btn) {
      this._achievesBtn.btn.html(t("btn_achieves"));
    }
  }

  exit() {
    if (this._onDevModeKey) {
      document.removeEventListener("keydown", this._onDevModeKey);
      this._onDevModeKey = null;
    }
    super.exit();
  }

  update() {
    if (this.follower) this.follower.update();
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageMenu) {
      p.image(Assets.bgImageMenu, 0, 0, p.width, p.height);
    } else {
      p.background(200, 255, 200);
    }
    if (this.follower) this.follower.draw();
  }
}
