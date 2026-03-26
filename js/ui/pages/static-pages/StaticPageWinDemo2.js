import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { t } from "../../../i18n.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageWinDemo2 extends PageBase {
  constructor(levelIndex, switcher, p, eventBus) {
    super(switcher);
    this.levelIndex = levelIndex;
    this.p = p;
    this.eventBus = eventBus;

    const levelNum = parseInt(this.levelIndex.replace(/.*level/, ""), 10);
    const isDemo2 = this.levelIndex.startsWith("demo2_");
    const levelPrefix = isDemo2 ? "demo2_level" : "level";
    const TOTAL_LEVELS = 10;

    const btnW = 180;
    const btnH = 46;
    const btnGap = 14;
    const btnX = p.width / 2 - btnW / 2;
    const btnY0 = p.height / 2 + 50;

    const backBtn = new ButtonBase(
      p,
      t("btn_back_menu"),
      btnX,
      btnY0,
      () => {
        this.switcher.staticSwitcher.showMainMenu(p);
      },
      "win-action-button",
    );
    backBtn.btn.style("width", btnW + "px");
    backBtn.btn.style("height", btnH + "px");
    this.addElement(backBtn);

    const restartBtn = new ButtonBase(
      p,
      t("btn_restart"),
      btnX,
      btnY0 + btnH + btnGap,
      () => {
        this.eventBus.publish(EventTypes.LOAD_LEVEL, this.levelIndex);
      },
      "win-action-button",
    );
    restartBtn.btn.style("width", btnW + "px");
    restartBtn.btn.style("height", btnH + "px");
    this.addElement(restartBtn);

    if (levelNum < TOTAL_LEVELS) {
      const nextBtn = new ButtonBase(
        p,
        t("btn_next_level"),
        btnX,
        btnY0 + (btnH + btnGap) * 2,
        () => {
          this.eventBus.publish(
            EventTypes.LOAD_LEVEL,
            `${levelPrefix}${levelNum + 1}`,
          );
        },
        "win-action-button",
      );
      nextBtn.btn.style("width", btnW + "px");
      nextBtn.btn.style("height", btnH + "px");
      this.addElement(nextBtn);
    }

    // decorative star particles spawned once
    this._stars = [];
    for (let i = 0; i < 60; i++) {
      this._stars.push({
        x: p.random(p.width),
        y: p.random(p.height),
        size: p.random(2, 6),
        speedY: p.random(-0.6, -2.0),
        speedX: p.random(-0.4, 0.4),
        alpha: p.random(160, 255),
        hue: p.random(280, 320), // pink-purple range
      });
    }
  }

  enter() {
    AudioManager.playBGM("gameWin");
  }

  draw() {
    const p = this.p;

    // pink-to-purple gradient background
    for (let y = 0; y < p.height; y++) {
      const t = y / p.height;
      const r = p.lerp(255, 100, t);
      const g = p.lerp(150, 40, t);
      const b = p.lerp(200, 180, t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
    p.noStroke();

    // drift stars upward
    for (const s of this._stars) {
      s.x += s.speedX;
      s.y += s.speedY;
      if (s.y < -10) {
        s.y = p.height + 5;
        s.x = p.random(p.width);
      }
      p.fill(255, 180, 220, s.alpha);
      p.rect(s.x, s.y, s.size, s.size);
    }

    // title glow
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);

    p.fill(200, 80, 180, 60);
    p.textSize(78);
    p.text(t("result_win"), p.width / 2 + 3, p.height / 4 + 3);

    p.fill(255, 200, 240);
    p.textSize(76);
    p.text(t("result_win"), p.width / 2, p.height / 4);

    // sub-label
    p.fill(255, 200, 240, 200);
    p.textSize(20);
    const levelNum = parseInt(this.levelIndex.replace("level", ""), 10);
    p.text(`- Level ${levelNum} -`, p.width / 2, p.height / 4 + 68);
  }
}
