import {
  Player,
  Ground,
  Wall,
  Portal,
  Button,
  Platform,
  NPCDemo2,
  SignboardDemo2,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";

export class Level1 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));

    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Platform ───────────────────────────────────────────────
    this.entities.add(new Platform(970, 80, 400, 50));

    // ── NPC ────────────────────────────────────────────────────
    this.entities.add(
      new NPCDemo2(400, 80, 40, 40, {
        getPlayer: () => this._player,
        eventBus: this.eventBus,
        npcId: "easy_level1_npc",
        dialogueLines: ["d2_npc_level1_line1", "easy_npc1_line2"],
        exhaustedLine: "easy_npc1_exhausted",
      }),
    );

    // ── Signboard ──────────────────────────────────────────────
    this.entities.add(
      new SignboardDemo2(480, 80, 100, 65, () => this._player, this.eventBus, {
        textKey: "d2_signboard_level1_front",
      }),
    );

    // ── BtnWirePortalSystem ────────────────────────────────────
    const wpBtn_0 = new Button(1040, 130, 34, 16);
    const wpPortal_0 = new Portal(1220, 130, 50, 50);
    wpPortal_0.openPortal();
    this._wpSys_0 = new BtnWirePortalSystem({
      button: wpBtn_0,
      portal: wpPortal_0,
    });
    this.entities.add(wpBtn_0);
    this.entities.add(wpPortal_0);

    this._player = new Player(50, 450, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
  }

  updatePhysics() {
    super.updatePhysics();
    this._wpSys_0.update();
  }
}
