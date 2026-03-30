import { GamePageBase } from "../GamePageBase.js";

export class GamePageLevel4 extends GamePageBase {
  constructor(switcher, p) {
    super(switcher, p, 4, "hint_level4", "demo2_level4", { showButtons: false });
  }
}