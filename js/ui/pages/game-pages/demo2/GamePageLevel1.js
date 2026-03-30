import { GamePageBase } from "../GamePageBase.js";

export class GamePageLevel1 extends GamePageBase {
  constructor(switcher, p) {
    super(switcher, p, 1, "d2_hint_level1", "demo2_level1", { showButtons: false });
  }
}
