import { PageBase } from "../PageBase.js";
import { Assets } from "../../../AssetsManager.js";
import { i18n } from "../../../i18n.js";

function makePanel(text, hint) {
  return (
    `<div class="lang-frame-inner">` +
    `<div class="lang-fog"></div>` +
    `<div class="lang-panel-text">${text}</div>` +
    `<div class="lang-panel-hint">${hint}</div>` +
    `</div>`
  );
}

export class LanguageChoice extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
  }

  enter() {
    const p = this.p;

    // 左侧：英语
    const enPanel = p.createDiv(makePanel("ENGLISH", "Click to select"));
    enPanel.addClass("language-panel lang-panel-left");
    enPanel.mouseClicked(() => {
      i18n.setLang("en");
      this.switcher.showWorldSelect(p);
    });
    this.addElement(enPanel);

    // 右侧：中文
    const zhPanel = p.createDiv(makePanel("中　文", "点击选择"));
    zhPanel.addClass("language-panel lang-panel-right");
    zhPanel.mouseClicked(() => {
      i18n.setLang("zh");
      this.switcher.showWorldSelect(p);
    });
    this.addElement(zhPanel);

    // 注册键盘导航（支持 Left/Right 箭键选择语言）
    this.registerNavButtons(
      [
        {
          btn: enPanel,
          callback: () => {
            i18n.setLang("en");
            this.switcher.showWorldSelect(p);
          },
        },
        {
          btn: zhPanel,
          callback: () => {
            i18n.setLang("zh");
            this.switcher.showWorldSelect(p);
          },
        },
      ],
      {
        layout: "horizontal",
      },
    );

    // 底部呼吸灯提示条
    const hint = p.createDiv(
      `<div class="lang-hint-text">` +
      `You can change the language anytime in Settings.` +
      `<br>` +
      `可以在设置界面随时调整语言。` +
      `</div>`
    );
    hint.addClass("lang-hint-bar");
    this.addElement(hint);
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageLanguageChoice) {
      p.image(Assets.bgImageLanguageChoice, 0, 0, p.width, p.height);
    } else {
      p.background(20, 10, 40);
    }
    this._drawTitleBanner(p);
  }

  _drawTitleBanner(p) {
    const centerY   = p.height * 0.13;
    const bandH     = Math.max(72, p.height * 0.115);
    const coreBandW = p.width * 0.52;
    const sideFadeW = p.width * 0.36;
    const bandY     = centerY - bandH * 0.5;
    const coreBandX = (p.width - coreBandW) * 0.5;
    const leftOuterX  = coreBandX - sideFadeW;
    const rightOuterX = coreBandX + coreBandW + sideFadeW - 1;

    p.push();
    p.resetMatrix();
    p.noStroke();

    // 两侧渐隐光带
    for (let i = 0; i < sideFadeW; i++) {
      const t = i / Math.max(1, sideFadeW - 1);
      p.fill(255, 255, 255, (1 - t) * 108);
      p.rect(leftOuterX + i,  bandY, 1, bandH);
      p.rect(rightOuterX - i, bandY, 1, bandH);
    }

    p.fill(255, 255, 255, 248);
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);
    p.textStyle(p.BOLD);

    // 英文行
    p.textSize(Math.floor(p.width * 0.026));
    p.text("Please Select Language", p.width * 0.5, centerY - bandH * 0.2);

    // 中文行（稍大）
    p.textSize(Math.floor(p.width * 0.032));
    p.text("请 选 择 语 言", p.width * 0.5, centerY + bandH * 0.22);

    p.pop();
  }
}
