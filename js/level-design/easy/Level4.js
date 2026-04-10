import {
  Player,
  Ground,
  Wall,
  Platform,
  Spike,
  Button,
  Portal,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";

export class Level4 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    // ── Walls ──────────────────────────────────────────────
    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Ground ────────────────────────────────────────────
    this.entities.add(new Ground(600, 80, 620, 190));

    // ── Platform (独立) ────────────────────────────────────
    this.entities.add(new Platform(190, 80, 160, 60));

    // ── Spike ─────────────────────────────────────────────
    this.entities.add(new Spike(740, 270, 160, 20));

    // ── Portal (常开) ────────────────────────────────────
    const portal = new Portal(1270, 80, 50, 50);
    portal.openPortal();
    this.entities.add(portal);

    // ── Player ────────────────────────────────────────────
    this._player = new Player(90, 260, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    // ⚠️ 必须在 initSystems 之后创建 ButtonPlatformLinkSystem
    // 这样 this.collisionSystem 才不为空
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // ── ButtonPlatformLinkSystem 系统 0 ───────────────────
    const bpBtn_0 = new Button(280, 140, 34, 16);
    const bpPlat_0_0 = new Platform(400, 190, 120, 30);
    this._bpSys_0 = new ButtonPlatformLinkSystem(
      {
        button: bpBtn_0,
        platforms: [{ platform: bpPlat_0_0, mode: "appear" }],
      },
      this.collisionSystem,
      { startColorIndex: 0 }
    );
    this.entities.add(bpBtn_0);
    this.entities.add(bpPlat_0_0);

    // ── ButtonPlatformLinkSystem 系统 1 ───────────────────
    const bpBtn_1 = new Button(1020, 270, 50, 20);
    const bpPlat_1_0 = new Platform(1090, 270, 30, 190);
    const bpPlat_1_1 = new Platform(970, 270, 30, 190);
    const bpPlat_1_2 = new Platform(970, 460, 150, 30);
    this._bpSys_1 = new ButtonPlatformLinkSystem(
      {
        button: bpBtn_1,
        platforms: [
          { platform: bpPlat_1_0, mode: "appear" },
          { platform: bpPlat_1_1, mode: "appear" },
          { platform: bpPlat_1_2, mode: "appear" },
        ],
      },
      this.collisionSystem,
      { startColorIndex: 2 }
    );
    this.entities.add(bpBtn_1);
    this.entities.add(bpPlat_1_0);
    this.entities.add(bpPlat_1_1);
    this.entities.add(bpPlat_1_2);

    // ── ButtonPlatformLinkSystem 系统 2 ───────────────────
    const bpBtn_2 = new Button(1140, 270, 34, 16);
    const bpPlat_2_0 = new Platform(1220, 240, 150, 30);
    this._bpSys_2 = new ButtonPlatformLinkSystem(
      {
        button: bpBtn_2,
        platforms: [{ platform: bpPlat_2_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 3 }
    );
    this.entities.add(bpBtn_2);
    this.entities.add(bpPlat_2_0);

    // ── ButtonPlatformLinkSystem 系统 3 ───────────────────
    const bpBtn_3 = new Button(620, 270, 34, 16);
    const bpPlat_3_0 = new Platform(740, 300, 160, 30);
    this._bpSys_3 = new ButtonPlatformLinkSystem(
      {
        button: bpBtn_3,
        platforms: [{ platform: bpPlat_3_0, mode: "appear" }],
      },
      this.collisionSystem,
      { startColorIndex: 3 }
    );
    this.entities.add(bpBtn_3);
    this.entities.add(bpPlat_3_0);
  }

  updatePhysics() {
    super.updatePhysics();

    // 系统更新
    this._bpSys_0?.update();
    this._bpSys_1?.update();
    this._bpSys_2?.update();
    this._bpSys_3?.update();
  }

  draw(p) {
    // 先绘制所有实体（包括按钮、尖刺等）
    super.draw(p);

    // 然后绘制系统的特殊效果
    this._bpSys_0?.draw?.(p);
    this._bpSys_1?.draw?.(p);
    this._bpSys_2?.draw?.(p);
    this._bpSys_3?.draw?.(p);
  }
}
