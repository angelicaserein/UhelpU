import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { t } from '../../../i18n.js';
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from '../../../AudioManager.js';
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageWin extends PageBase {
  constructor(levelIndex, switcher, p, eventBus) {
    super(switcher);
    this.levelIndex = levelIndex;
    this.p = p;
    this.eventBus = eventBus;

    const levelNum = parseInt(this.levelIndex.replace("level", ""), 10);
    const TOTAL_LEVELS = 3;

    const btnY0 = p.height / 2 + 50;

    const backBtn = new ButtonBase(p, t('btn_back_menu'), p.width / 2 - 60, btnY0, () => {
      this.switcher.staticSwitcher.showMainMenu(p);
    }, 'back-button');
    backBtn.btn.style('font-size', '20px');
    this.addElement(backBtn);

    const restartBtn = new ButtonBase(p, t('btn_restart'), p.width / 2 - 60, btnY0 + 56, () => {
      this.eventBus.publish(EventTypes.LOAD_LEVEL, `level${levelNum}`);
    }, 'restart-button');
    restartBtn.btn.style('font-size', '20px');
    this.addElement(restartBtn);

    if (levelNum < TOTAL_LEVELS) {
      const nextBtn = new ButtonBase(p, t('btn_next_level'), p.width / 2 - 60, btnY0 + 112, () => {
        this.eventBus.publish("loadLevel", `level${levelNum + 1}`);
      }, 'next-button');
      nextBtn.btn.style('font-size', '20px');
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
        hue: p.random(40, 60),   // gold range
      });
    }
  }

  enter() {
    AudioManager.playBGM('gameWin');
  }

  draw() {
    const p = this.p;

    // warm gold-to-dark-purple gradient background
    for (let y = 0; y < p.height; y++) {
      const t = y / p.height;
      const r = p.lerp(255, 30, t);
      const g = p.lerp(220, 18, t);
      const b = p.lerp(80, 60, t);
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
      p.fill(255, 220 + s.hue - 50, 80, s.alpha);
      p.rect(s.x, s.y, s.size, s.size);
    }

    // title glow
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);

    p.fill(255, 200, 60, 60);
    p.textSize(78);
    p.text(t('result_win'), p.width / 2 + 3, p.height / 4 + 3);

    p.fill(255, 240, 130);
    p.textSize(76);
    p.text(t('result_win'), p.width / 2, p.height / 4);

    // sub-label
    p.fill(255, 220, 140, 200);
    p.textSize(20);
    const levelNum = parseInt(this.levelIndex.replace("level", ""), 10);
    p.text(`- Level ${levelNum} -`, p.width / 2, p.height / 4 + 68);
  }
}
