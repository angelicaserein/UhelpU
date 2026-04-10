import {
  Player,
  Ground,
  Wall,
  Spike,
  Portal,
  Button,
  NPCDemo2,
  CheckpointDemo2,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";

export class Level2 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));

    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Spikes ────────────────────────────────────────────
    this.entities.add(new Spike(190, 80, 40, 20));
    this.entities.add(new Spike(320, 80, 40, 20));

    // ── Portal ────────────────────────────────────────────
    const portal = new Portal(1200, 80, 50, 50);
    portal.openPortal();
    this.entities.add(portal);

    // ── NPC ───────────────────────────────────────────────
    this.entities.add(
      new NPCDemo2(480, 80, 40, 40, {
        getPlayer: () => this._player,
        eventBus: this.eventBus,
        npcId: "easy_level2_npc",
        dialogueLines: ["easy_level2_npc_line1", "easy_level2_npc_line2"],
        exhaustedLine: "easy_level2_npc_exhausted",
      })
    );

    // ── Checkpoint ────────────────────────────────────────
    this.entities.add(new CheckpointDemo2(400, 80, 40, 70, () => this._player));

    // ── ButtonSpikeLinkSystem 0 ───────────────────────────
    const bsBtn_0 = new Button(550, 80, 34, 16);
    const bsSpike_0 = new Spike(640, 80, 100, 20);
    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: bsBtn_0, spikes: [bsSpike_0] },
      { startColorIndex: 0 }
    );
    this.entities.add(bsBtn_0);
    this.entities.add(bsSpike_0);

    // ── ButtonSpikeLinkSystem 1 ───────────────────────────
    const bsBtn_1 = new Button(800, 80, 34, 16);
    const bsSpike_1 = new Spike(900, 80, 200, 20);
    this._bsSys_1 = new ButtonSpikeLinkSystem(
      { button: bsBtn_1, spikes: [bsSpike_1] },
      { startColorIndex: 1 }
    );
    this.entities.add(bsBtn_1);
    this.entities.add(bsSpike_1);

    this._player = new Player(50, 450, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
  }

  updatePhysics() {
    super.updatePhysics();
    this._bsSys_0.update();
    this._bsSys_1.update();
  }
}
