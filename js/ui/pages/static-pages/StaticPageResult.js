import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { t } from '../../../i18n.js';
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from '../../../AudioManager.js';
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageResult extends PageBase {
  constructor(result, levelIndex, switcher, p, eventBus) {
    super(switcher);
    this.result = result;
    this.levelIndex = levelIndex;
    this.p = p;
    this.eventBus = eventBus;

    const levelNum = parseInt(this.levelIndex.replace("level", ""), 10);

    const backBtn = new ButtonBase(p, t('btn_back_menu'), p.width/2 - 60, p.height/2 + 50, () => {
      this.switcher.staticSwitcher.showMainMenu(p);
    }, 'back-button');
    backBtn.btn.style('font-size', '20px');
    this.addElement(backBtn);

    const restartBtn = new ButtonBase(p, t('btn_restart'), p.width/2 - 60, p.height/2 + 106, () => {
      this.eventBus.publish(EventTypes.LOAD_LEVEL, `level${levelNum}`);
    }, 'restart-button');
    restartBtn.btn.style('font-size', '20px');
    this.addElement(restartBtn);
  }

  enter() {
    AudioManager.playBGM('gameOver');
  }

  draw() {
    const p = this.p;
    // dark red-to-black background for game over
    for (let y = 0; y < p.height; y++) {
      const t = y / p.height;
      const r = p.lerp(120, 20, t);
      const g = p.lerp(20, 10, t);
      const b = p.lerp(20, 10, t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
    p.noStroke();

    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);

    p.fill(200, 30, 30, 70);
    p.textSize(78);
    p.text(t('result_lose'), p.width/2 + 3, p.height/4 + 3);

    p.fill(255, 100, 100);
    p.textSize(76);
    p.text(t('result_lose'), p.width/2, p.height/4);

    const levelNum = parseInt(this.levelIndex.replace("level", ""), 10);
    p.fill(255, 180, 180, 180);
    p.textSize(20);
    p.text(`- Level ${levelNum} -`, p.width/2, p.height/4 + 68);
  }
}