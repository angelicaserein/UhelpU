import { GamePageBase } from "../GamePageBase.js";

export class GamePageLevel5 extends GamePageBase {
  constructor(switcher, p) {
    super(switcher, p, 5, "hint_level5", "demo2_level5", { showButtons: false });
  }
}