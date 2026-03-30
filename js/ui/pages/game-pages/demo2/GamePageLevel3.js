import { GamePageBase } from "../GamePageBase.js";

export class GamePageLevel3 extends GamePageBase {
  constructor(switcher, p) {
    super(switcher, p, 3, "hint_level3", "demo2_level3", { showButtons: false });
  }
}