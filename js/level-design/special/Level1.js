import { Level2 as HardLevel2 } from "../hard/Level2.js";
import { ReplayerVoice } from "../../replayer-voice/ReplayerVoice.js";

export class Level1 extends HardLevel2 {
  constructor(p, eventBus) {
    super(p, eventBus);
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
