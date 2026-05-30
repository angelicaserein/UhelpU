import { Player, Ground, Wall, NPCDemo2 } from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { ReplayerVoice } from "../../replayer-voice/ReplayerVoice.js";

export class Level1 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(-100, 0, 120, 768));
    this.entities.add(new Wall(1346, 0, 120, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    this._player = new Player(200, 80, 40, 40);
    this._player.createListeners();

    this.entities.add(
      new NPCDemo2(600, 80, 40, 40, {
        getPlayer: () => this._player,
        eventBus: this.eventBus,
        npcId: "special_level1_npc",
        dialogueLines: ["special_npc1_line1"],
        maxDialogueCount: Infinity,
      }),
    );

    this.entities.add(this._player);
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    this.replayerVoice = new ReplayerVoice(
      this.recordSystem,
      "server-managed-proxy",
      "In this level, the phantom can be transported to areas the player cannot safely reach, and can interact with triggers on the player's behalf.",
    );
  }

  updatePhysics() {
    super.updatePhysics();
  }

  draw(p = this.p) {
    super.draw(p);
    this.replayerVoice?.draw(p);
  }

  clearLevel(p = this.p, eventBus = this.eventBus) {
    this.replayerVoice?.destroy();
    super.clearLevel?.(p, eventBus);
  }
}
