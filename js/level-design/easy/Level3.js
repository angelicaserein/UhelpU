import {
  Player,
  Ground,
  Wall,
  Spike,
  Portal,
  NPCDemo2,
  CheckpointDemo2,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";

export class Level3 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    // ── Walls & Base Ground ────────────────────────────────
    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Spikes ────────────────────────────────────────────
    this.entities.add(new Spike(280, 80, 600, 50));
    this.entities.add(new Spike(880, 80, 480, 50));

    // ── Portal (常开) ────────────────────────────────────
    const portal = new Portal(1180, 400, 50, 50);
    portal.openPortal();
    this.entities.add(portal);

    // ── Grounds ───────────────────────────────────────────
    this.entities.add(new Ground(280, 160, 100, 40));
    this.entities.add(new Ground(480, 360, 100, 40));
    this.entities.add(new Ground(380, 250, 100, 40));
    this.entities.add(new Ground(180, 90, 100, 40));
    this.entities.add(new Ground(650, 360, 100, 40));
    this.entities.add(new Ground(820, 360, 100, 40));
    this.entities.add(new Ground(1100, 360, 200, 40));

    // ── NPC ───────────────────────────────────────────────
    this.entities.add(
      new NPCDemo2(410, 290, 40, 40, {
        getPlayer: () => this._player,
        eventBus: this.eventBus,
        npcId: "easy_level3_npc",
        dialogueLines: ["easy_level3_npc_line1", "easy_level3_npc_line2"],
        exhaustedLine: "easy_level3_npc_exhausted",
      }),
    );

    // ── Checkpoints ───────────────────────────────────────
    this.entities.add(
      new CheckpointDemo2(310, 200, 40, 70, () => this._player),
    );
    this.entities.add(
      new CheckpointDemo2(850, 400, 40, 70, () => this._player),
    );

    // ── Player ────────────────────────────────────────────
    this._player = new Player(90, 410, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
  }

  updatePhysics() {
    super.updatePhysics();
  }
}
