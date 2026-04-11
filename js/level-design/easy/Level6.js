import { Player, Ground, Wall, Platform, Spike, Checkpoint, TeleportPoint, Button, Portal, WireRenderer } from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";

export class Level6 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));

    // Player
    this._player = new Player(70, 450, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    // Ground
    this.entities.add(new Ground(10, 60, 620, 300));
    this.entities.add(new Ground(740, 80, 310, 280));

    // Platform
    this.entities.add(new Platform(1170, 330, 160, 30));

    // Spike
    this.entities.add(new Spike(440, 360, 50, 20));

    // Checkpoint
    this.entities.add(new Checkpoint(230, 360, 40, 70));

    // TeleportPoint
    this.entities.add(new TeleportPoint(350, 360, 40, 70));
    this.entities.add(new TeleportPoint(870, 360, 40, 70));

    // BtnWirePortalSystem
    const wpBtn_0 = new Button(1090, 80, 34, 16);
    const wpPortal_0 = new Portal(1230, 360, 50, 50);
    const wpSys_0 = new BtnWirePortalSystem({ button: wpBtn_0, portal: wpPortal_0 });
    this.entities.add(wpBtn_0);
    this.entities.add(wpPortal_0);
    this.entities.add(new WireRenderer(wpSys_0));

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // Add BtnWirePortalSystem to update and draw
    this._wpSys_0 = wpSys_0;
  }

  updatePhysics() {
    super.updatePhysics();
    this._wpSys_0?.update();
  }

  draw(p = this.p) {
    super.draw(p);
  }
}
