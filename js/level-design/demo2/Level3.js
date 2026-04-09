import {
  Player,
  Ground,
  Wall,
  Platform,
  Portal,
  CheckpointDemo2,
  Button,
  Spike,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";

export class Level3 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    // ── 编辑器导出的实体 ───────────────────────────────────────
    //
    // 房间数量: 1
    //   Room 0: x ∈ [0, 1366)

    // 玩家出生点
    this._player = new Player(130, 430, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    // 自动墙壁（左/右边界）
    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    // Ground
    this.entities.add(new Ground(380, 80, 970, 130));
    this.entities.add(new Ground(730, 210, 160, 190));

    // Platform
    this.entities.add(new Platform(890, 480, 280, 30));

    // Checkpoint
    this.entities.add(
      new CheckpointDemo2(610, 210, 40, 70, () => this._player),
    );

    // BtnWirePortalSystem
    const wpBtn_0 = new Button(1040, 510, 34, 16);
    const wpPortal_0 = new Portal(1210, 210, 50, 50);
    this._wpSys_0 = new BtnWirePortalSystem({
      button: wpBtn_0,
      portal: wpPortal_0,
    });
    this.entities.add(wpBtn_0);
    this.entities.add(wpPortal_0);

    // ButtonSpikeLinkSystem
    const bsBtn_0 = new Button(340, 80, 34, 16);
    const bsSpike_0 = new Spike(480, 210, 100, 20);
    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: bsBtn_0, spikes: [bsSpike_0] },
      { startColorIndex: 0 },
    );

    const bsBtn_1 = new Button(1120, 210, 34, 16);
    const bsSpike_1 = new Spike(960, 210, 110, 20);
    this._bsSys_1 = new ButtonSpikeLinkSystem(
      { button: bsBtn_1, spikes: [bsSpike_1] },
      { startColorIndex: 1 },
    );

    const bsBtn_2 = new Button(680, 210, 34, 16);
    const bsSpike_2 = new Spike(760, 400, 60, 20);
    this._bsSys_2 = new ButtonSpikeLinkSystem(
      { button: bsBtn_2, spikes: [bsSpike_2] },
      { startColorIndex: 2 },
    );

    this.entities.add(bsBtn_0);
    this.entities.add(bsSpike_0);
    this.entities.add(bsBtn_1);
    this.entities.add(bsSpike_1);
    this.entities.add(bsBtn_2);
    this.entities.add(bsSpike_2);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
  }

  updatePhysics() {
    super.updatePhysics();
    this._wpSys_0.update();
    this._bsSys_0.update();
    this._bsSys_1.update();
    this._bsSys_2.update();
  }

  draw(p = this.p) {
    this._wpSys_0.draw(p);
    super.draw(p);
  }
}
