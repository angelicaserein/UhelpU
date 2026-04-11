import {
  Player,
  Ground,
  Wall,
  Platform,
  Enemy,
  Button,
  Portal,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";

export class Level5 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    // ── 系统边界
    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Ground
    this.entities.add(new Ground(550, 80, 140, 70));

    // ── Platform
    this.entities.add(new Platform(190, 80, 170, 30));
    this.entities.add(new Platform(750, 430, 380, 30));
    this.entities.add(new Platform(360, 80, 190, 130));
    this.entities.add(new Platform(750, 310, 180, 30));
    this.entities.add(new Platform(750, 210, 180, 30));
    this.entities.add(new Platform(750, 110, 180, 30));

    // ── Wall
    this.entities.add(new Wall(690, 80, 60, 380));
    this.entities.add(new Wall(1120, 80, 60, 380));

    // ── Enemy
    this.entities.add(new Enemy(222, 109.5, 40, 40, { speed: 2, direction: 1 }));
    this.entities.add(new Enemy(564, 149.5, 40, 40, { speed: 2, direction: 1 }));
    this.entities.add(new Enemy(582, 150, 40, 40, { speed: 2, direction: 1 }));
    this.entities.add(new Enemy(564, 150, 40, 40, { speed: 2, direction: 1 }));
    this.entities.add(new Enemy(596, 150, 40, 40, { speed: 2, direction: 1 }));
    this.entities.add(new Enemy(552, 150, 40, 40, { speed: 2, direction: 1 }));
    this.entities.add(new Enemy(796, 340, 40, 40, { speed: 2, direction: 1 }));
    this.entities.add(new Enemy(804, 240, 40, 40, { speed: 2, direction: 1 }));
    this.entities.add(new Enemy(806, 140, 40, 40, { speed: 2, direction: 1 }));

    // ── 玩家（在基础实体和系统初始化之前）
    this._player = new Player(50, 450, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // ── BtnWirePortalSystem（必须在 initSystems() 之后）
    const wpBtn_0 = new Button(920, 460, 34, 16);
    const wpPortal_0 = new Portal(1250, 80, 50, 50);
    // ⚠️ 不调用 openPortal() - 系统会控制打开/关闭
    this._wpSys_0 = new BtnWirePortalSystem({
      button: wpBtn_0,
      portal: wpPortal_0,
    });
    this.entities.add(wpBtn_0);
    this.entities.add(wpPortal_0);

    // ── ButtonPlatformLinkSystem（必须在 initSystems() 之后）
    const bpBtn_0 = new Button(770, 340, 40, 20);
    const bpPlat_0_0 = new Platform(1180, 430, 170, 30);
    this._bpSys_0 = new ButtonPlatformLinkSystem(
      { button: bpBtn_0, platforms: [{ platform: bpPlat_0_0, mode: "disappear" }] },
      this.collisionSystem,
      { startColorIndex: 0 },
    );
    this.entities.add(bpBtn_0);
    this.entities.add(bpPlat_0_0);

    const bpBtn_1 = new Button(820, 240, 40, 20);
    const bpPlat_1_0 = new Platform(1180, 340, 170, 30);
    this._bpSys_1 = new ButtonPlatformLinkSystem(
      { button: bpBtn_1, platforms: [{ platform: bpPlat_1_0, mode: "disappear" }] },
      this.collisionSystem,
      { startColorIndex: 1 },
    );
    this.entities.add(bpBtn_1);
    this.entities.add(bpPlat_1_0);

    const bpBtn_2 = new Button(870, 140, 40, 20);
    const bpPlat_2_0 = new Platform(1180, 250, 180, 30);
    this._bpSys_2 = new ButtonPlatformLinkSystem(
      { button: bpBtn_2, platforms: [{ platform: bpPlat_2_0, mode: "disappear" }] },
      this.collisionSystem,
      { startColorIndex: 2 },
    );
    this.entities.add(bpBtn_2);
    this.entities.add(bpPlat_2_0);
  }

  updatePhysics() {
    super.updatePhysics();

    // 系统 update
    this._wpSys_0?.update();
    this._bpSys_0?.update();
    this._bpSys_1?.update();
    this._bpSys_2?.update();
  }

  draw(p) {
    // ⚠️ 关键：必须先调用 super.draw(p) 来绘制所有实体
    super.draw(p);

    // 然后绘制系统的特殊效果
    this._wpSys_0?.draw?.(p);
    this._bpSys_0?.draw?.(p);
    this._bpSys_1?.draw?.(p);
    this._bpSys_2?.draw?.(p);
  }
}
