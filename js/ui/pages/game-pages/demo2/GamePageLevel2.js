import { GamePageBase } from "../GamePageBase.js";

export class GamePageLevel2 extends GamePageBase {
  constructor(switcher, p) {
    super(switcher, p, 2, "d2_hint_level2", "demo2_level2", { showButtons: false });
  }
}
