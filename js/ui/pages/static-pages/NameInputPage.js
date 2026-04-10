import { PageBase } from "../PageBase.js";
import { Assets } from "../../../AssetsManager.js";
import { i18n } from "../../../i18n.js";
import { t } from "../../../i18n.js";

export class NameInputPage extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
    this.inputElement = null;
    this.confirmButton = null;
    this._onKeyDown = null;
  }

  enter() {
    super.enter();

    const p = this.p;

    // 创建输入框容器
    const container = p.createDiv("");
    container.addClass("name-input-container");
    container.style("position", "absolute");
    container.style("top", "50%");
    container.style("left", "50%");
    container.style("transform", "translate(-50%, -50%)");
    container.style("text-align", "center");
    this.addElement(container);

    // 标题
    const title = p.createDiv(t("name_input_title") || "Enter Your Name");
    title.addClass("name-input-title");
    title.parent(container);

    // 输入框
    this.inputElement = p.createInput(window.playerName || "");
    this.inputElement.addClass("name-input-field");
    this.inputElement.attribute("maxlength", "20");
    this.inputElement.attribute(
      "placeholder",
      t("name_input_placeholder") || "Player Name",
    );
    this.inputElement.parent(container);

    // 确认按钮
    this.confirmButton = p.createButton(t("btn_confirm") || "Confirm");
    this.confirmButton.addClass("name-input-confirm-button");
    this.confirmButton.parent(container);
    this.confirmButton.mousePressed(() => {
      this._handleConfirm();
    });

    // 返回按钮
    const backButton = p.createButton(t("btn_back") || "Back");
    backButton.addClass("name-input-back-button");
    backButton.parent(container);
    backButton.mousePressed(() => {
      this.switcher.showLanguageChoice(p);
    });

    // 键盘事件：Enter 确认，ESC 返回
    this._onKeyDown = (e) => {
      if (e.code === "Enter") {
        this._handleConfirm();
      } else if (e.code === "Escape") {
        this.switcher.showLanguageChoice(p);
      }
    };
    document.addEventListener("keydown", this._onKeyDown);

    // 自动聚焦输入框
    if (this.inputElement) {
      setTimeout(() => {
        this.inputElement.elt.focus();
      }, 100);
    }
  }

  exit() {
    if (this._onKeyDown) {
      document.removeEventListener("keydown", this._onKeyDown);
    }
    super.exit();
  }

  _handleConfirm() {
    const playerName = this.inputElement.value().trim();

    if (!playerName) {
      alert(t("name_input_empty") || "Please enter a name");
      return;
    }

    // 保存玩家名字到全局变量
    window.playerName = playerName;
    console.log("[NameInputPage] Player name saved:", playerName);

    // 跳转到世界选择页面
    this.switcher.showWorldSelect(this.p);
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
    const centerY = p.height * 0.13;
    const bandH = Math.max(72, p.height * 0.115);
    const coreBandW = p.width * 0.52;
    const sideFadeW = p.width * 0.36;
    const bandY = centerY - bandH * 0.5;
    const coreBandX = (p.width - coreBandW) * 0.5;
    const leftOuterX = coreBandX - sideFadeW;
    const rightOuterX = coreBandX + coreBandW + sideFadeW - 1;

    p.push();
    p.resetMatrix();
    p.noStroke();

    // 两侧渐隐光带
    for (let i = 0; i < sideFadeW; i++) {
      const t = i / Math.max(1, sideFadeW - 1);
      p.fill(255, 255, 255, (1 - t) * 108);
      p.rect(leftOuterX + i, bandY, 1, bandH);
      p.rect(rightOuterX - i, bandY, 1, bandH);
    }

    p.fill(255, 255, 255, 248);
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);
    p.textStyle(p.BOLD);

    p.textSize(Math.floor(p.width * 0.026));
    p.text("Enter Your Player Name", p.width * 0.5, centerY - bandH * 0.2);

    p.textSize(Math.floor(p.width * 0.032));
    p.text("输 入 你 的 昵 称", p.width * 0.5, centerY + bandH * 0.22);

    p.pop();
  }
}
