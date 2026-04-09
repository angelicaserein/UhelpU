import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel1 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 1, "d2_hint_level1", "demo2_level1", { showButtons: false });
  }
}

