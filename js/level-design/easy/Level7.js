import {
  Player,
  Ground,
  Wall,
  Platform,
  Spike,
  Box,
  Button,
  Portal,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";

export class Level7 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));

    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Ground ────────────────────────────────────────────
    this.entities.add(new Ground(390, 80, 300, 160));

    // ── Platform ──────────────────────────────────────────
    this.entities.add(new Platform(510, 240, 180, 80));
    this.entities.add(new Platform(780, 290, 200, 30));

    // ── Spike ─────────────────────────────────────────────
    this.entities.add(new Spike(690, 80, 500, 20));

    // ── Box ───────────────────────────────────────────────
    this.entities.add(new Box(240, 80, 40, 40));
    this.entities.add(new Box(630, 320, 40, 40));
    this.entities.add(new Box(1040, 600, 40, 40));
    this.entities.add(new Box(1090, 600, 40, 40));

    // ── BtnWirePortalSystem ───────────────────────────────
    const wpBtn_0 = new Button(720, 80, 34, 16);
    const wpPortal_0 = new Portal(1250, 80, 50, 50);
    this.entities.add(wpBtn_0);
    this.entities.add(wpPortal_0);

    // ── Player ────────────────────────────────────────────
    this._player = new Player(70, 450, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // ── BtnWirePortalSystem (after initSystems) ───────────
    this._wpSys_0 = new BtnWirePortalSystem({
      button: wpBtn_0,
      portal: wpPortal_0,
    });

    // ── ButtonPlatformLinkSystem (after initSystems) ──────
    const bpBtn_0 = new Button(800, 320, 34, 16);
    const bpPlat_0_0 = new Platform(1000, 560, 160, 30);
    this._bpSys_0 = new ButtonPlatformLinkSystem(
      {
        button: bpBtn_0,
        platforms: [{ platform: bpPlat_0_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 0 },
    );
    this.entities.add(bpBtn_0);
    this.entities.add(bpPlat_0_0);

    const bpBtn_1 = new Button(920, 320, 34, 16);
    const bpPlat_1_0 = new Platform(1010, 570, 160, 30);
    this._bpSys_1 = new ButtonPlatformLinkSystem(
      {
        button: bpBtn_1,
        platforms: [{ platform: bpPlat_1_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 1 },
    );
    this.entities.add(bpBtn_1);
    this.entities.add(bpPlat_1_0);
  }

  updatePhysics() {
    super.updatePhysics();
    this._wpSys_0?.update();
    this._bpSys_0?.update();
    this._bpSys_1?.update();
  }

  draw(p) {
    super.draw(p);
    this._wpSys_0?.draw?.(p);
    this._bpSys_0?.draw?.(p);
    this._bpSys_1?.draw?.(p);
  }
}
