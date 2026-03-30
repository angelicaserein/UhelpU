import { PageBase } from "../PageBase.js";
import { t } from "../../../i18n.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageResultDemo1 extends PageBase {
  constructor(result, levelIndex, switcher, p, eventBus) {
    super(switcher);
    this.result = result;
    this.levelIndex = levelIndex;
    this.p = p;
    this.eventBus = eventBus;

    const levelNum = parseInt(this.levelIndex.replace("level", ""), 10);

    this._onKeyDown = (e) => {
      if (e.code === "KeyR") {
        this.eventBus.publish(EventTypes.LOAD_LEVEL, `level${levelNum}`);
      }
    };
  }

  enter() {
    super.enter();

    AudioManager.playBGM("gameOver");
    document.addEventListener("keydown", this._onKeyDown);
  }

  exit() {
    document.removeEventListener("keydown", this._onKeyDown);
    super.exit();
  }

  draw() {
    const p = this.p;
    // transparent background — no fill

    p.noStroke();

    // semi-transparent banner behind "Game Over"
    const bannerH = 120;
    const bannerY = p.height / 2 - bannerH / 2;
    p.fill(0, 0, 0, 150);
    p.rect(0, bannerY, p.width, bannerH);

    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);

    // shadow
    p.fill(200, 30, 30, 70);
    p.textSize(78);
    p.text(t("result_lose"), p.width / 2 + 3, p.height / 2 - 10 + 3);

    // main text
    p.fill(255, 100, 100);
    p.textSize(76);
    p.text(t("result_lose"), p.width / 2, p.height / 2 - 10);

    const levelNum = parseInt(this.levelIndex.replace("level", ""), 10);
    p.fill(255, 180, 180, 180);
    p.textSize(20);
    p.text(`- Level ${levelNum} -`, p.width / 2, p.height / 2 + 40);

    // Breathing "Press R" hint
    const breathAlpha = 100 + 155 * (0.5 + 0.5 * p.sin(p.millis() * 0.003));
    p.fill(255, 255, 255, breathAlpha);
    p.textSize(18);
    p.text(t("result_press_r"), p.width / 2, p.height / 2 + 80);
  }
}
