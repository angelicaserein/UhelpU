import {
  Player,
  Ground,
  Wall,
  Portal,
  Button,
  TextPrompt,
} from "../game-entity-model/index.js";
import { BaseLevel } from "./BaseLevel.js";
import { WireRenderer } from "./WireRenderer.js";
import { WindowPrompt } from "../ui/windows/WindowPrompt.js";
import { AchievementToast } from "../achievement system/AchievementToast.js";
import { AchievementData } from "../achievement system/AchievementData.js";

export class Level2 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageLevel2";
    const wallThickness = 20;
    this.entities.add(new Wall(0, 0, wallThickness, p.height));
    this.entities.add(
      new Wall(p.width - wallThickness, 0, wallThickness, p.height),
    );
    // 底部地面
    this.entities.add(new Ground(0, 0, p.width, 80));

    // 高台
    const platformX = 700;
    const platformW = 600;
    const platformH = 330;
    const platformSurface = 80 + platformH; // 360
    this.entities.add(new Ground(platformX, 80, platformW, platformH, true));
    // 高台左边的阶梯平台（浮空）
    this.entities.add(new Ground(300, 120, 100, 30, true)); // 第一级阶梯
    this.entities.add(new Ground(420, 230, 230, 30, true)); // 第二级阶梯
    // 按钮和门都放在高台表面
    this._button1 = new Button(platformX + 300, platformSurface, 20, 5); // 右按钮
    this._button2 = new Button(platformX + 80, platformSurface, 20, 5); // 左按钮
    this._portal = new Portal(
      platformX + platformW - 125,
      platformSurface,
      50,
      50,
    );

    this.entities.add(this._portal);
    this.entities.add(this._button1);
    this.entities.add(this._button2);

    this._jumpPromptCount = 0;
    this._jumpHintWindow = new WindowPrompt(p, "level2_jump_hint_window", {
      width: 420,
      fontSize: 17,
    });
    this._achievementToast = new AchievementToast(p);

    this.entities.add(
      new TextPrompt(450, 70, this, {
        // 每个参数分别是 x, y, 关卡实例
        textKey: "level2_jump_higher_prompt",
        onTrigger: () => {
          this._jumpPromptCount++;
          if (this._jumpPromptCount === 3) {
            this._jumpHintWindow.open();
            this._achievementToast.show("achievement_unlocked");
            AchievementData.unlock("perseverance");
          }
        },
      }),
    );

    const player = new Player(50, 450, 40, 40);
    player.createListeners();
    this.entities.add(player);

    this.initSystems(player);

    this._wireRenderer = new WireRenderer({
      button1: this._button1,
      button2: this._button2,
      portal: this._portal,
      entities: this.entities,
    });
  }

  updateCollision(_p = this.p, eventBus = this.eventBus) {
    this.collisionSystem.collisionEntry(eventBus);
    this._wireRenderer.update();
  }

  draw(p = this.p) {
    // Spikes first, then ground (ground covers spike bases)
    for (const entity of this.entities) {
      if (entity.type === "spike") entity.draw(p);
    }
    for (const entity of this.entities) {
      if (entity.type === "ground") entity.draw(p);
    }

    // Wires drawn below other entities (portal, player on top)
    this._wireRenderer.draw(p);

    for (const entity of this.entities) {
      if (entity.type !== "spike" && entity.type !== "ground") {
        entity.draw(p);
      }
    }

    if (this.recordSystem.draw) this.recordSystem.draw(p);

    this._button1.releaseButton();
    this._button2.releaseButton();
  }

  clearLevel() {
    if (this._jumpHintWindow) {
      this._jumpHintWindow.remove();
      this._jumpHintWindow = null;
    }
    if (this._achievementToast) {
      this._achievementToast.remove();
      this._achievementToast = null;
    }
    super.clearLevel();
  }
}
