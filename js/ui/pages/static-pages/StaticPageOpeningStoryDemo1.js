import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { BackButton } from "../../components/BackButton.js";
import { HintButton } from "../../components/HintButton.js";
import { ScrollTextModule } from "../../components/ScrollTextModule.js";
import { Assets } from "../../../AssetsManager.js";
import { i18n, t } from "../../../i18n.js";
import { AudioManager } from "../../../AudioManager.js";

export class StaticPageOpeningStoryDemo1 extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
    this.scrollModule = null;
    this._hintBtn = null;

    // 语言切换时更新笔记本按钮内容
    this._i18nHandler = () => {
      if (this._hintBtn) {
        this._hintBtn.front.html(`
          <div class="hint-face-content">
            <img class="hint-face-image" src="assets/images/bg/follower1.png" alt="follower1" />
            <div class="hint-face-text">${t("notebook_front")}</div>
          </div>
        `);
        this._hintBtn.back.html(`
          <div class="hint-face-content">
            <img class="hint-face-image" src="assets/images/bg/follower2.png" alt="follower2" />
            <div class="hint-face-text">${t("notebook_back")}</div>
          </div>
        `);
      }
    };
    i18n.onChange(this._i18nHandler);
  }

  enter() {
    super.enter();

    const p = this.p;

    AudioManager.playBGM("openingStory");

    // 返回按钮 → 回到世界选择
    const backBtn = new BackButton(p, () => this.switcher.showWorldSelect(p));
    this.addElement(backBtn);

    // 跳过按钮 → 进入 Demo1 关卡选择
    const hintBtn = new ButtonBase(
      p,
      t("btn_skip"),
      0.2 * p.width,
      0.03 * p.height,
      () => {
        this.switcher.showLevelChoice(p);
      },
      "hint-button",
    );
    hintBtn.btn.style("width", 0.6 * p.width + "px");
    hintBtn.btn.style("height", 0.055 * p.height + "px");
    this.addElement(hintBtn);

    // 提示翻页按钮（仅点击才翻页）
    const hintBtnFlip = new HintButton(
      p,
      "",
      0.55 * p.width,
      0.25 * p.height,
      () => {
        console.log("提示翻页按钮点击");
      },
      "my-custom-class",
    );
    hintBtnFlip.front.html(`
      <div class="hint-face-content">
        <img class="hint-face-image" src="assets/images/bg/follower1.png" alt="follower1" />
        <div class="hint-face-text">${t("notebook_front")}</div>
      </div>
    `);
    hintBtnFlip.back.html(`
      <div class="hint-face-content">
        <img class="hint-face-image" src="assets/images/bg/follower2.png" alt="follower2" />
        <div class="hint-face-text">${t("notebook_back")}</div>
      </div>
    `);
    this._hintBtn = hintBtnFlip;
    this.addElement(hintBtnFlip);

    // 滚动字幕（根据当前语言选择对应文本）
    const storyTexts =
      i18n.getLang() === "zh"
        ? Assets.storyTexts_zh || [t("story_loading")]
        : Assets.storyTexts_en || [t("story_loading")];
    this.scrollModule = new ScrollTextModule(
      p,
      storyTexts,
      () => {
        // 滚动结束 → 进入 Demo1 关卡选择
        this.switcher.showLevelChoice(p);
      },
      {
        speed: 1.5,
        fadeHeight: 100,
        scrollRect: {
          x: 0.1 * p.width,
          y: 0.25 * p.height,
          w: 0.33 * p.width,
          h: 0.66 * p.height,
        },
      },
    );

    // 监听 Enter 键跳过 → 进入 Demo1 关卡选择
    this._keyHandler = (e) => {
      if (e.key === "Enter") {
        this.switcher.showLevelChoice(p);
      }
    };
    window.addEventListener("keydown", this._keyHandler);
  }

  exit() {
    i18n.offChange(this._i18nHandler);
    if (this._keyHandler) {
      window.removeEventListener("keydown", this._keyHandler);
      this._keyHandler = null;
    }
    super.exit();
  }

  update() {
    if (this.scrollModule) this.scrollModule.update();
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageOpeningScene) {
      p.image(Assets.bgImageOpeningScene, 0, 0, p.width, p.height);
    } else {
      p.background(200, 255, 200);
    }
    if (this.scrollModule) this.scrollModule.draw();
  }
}
