import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel1 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 1, "easy_hint_level1", "easy_level1", { showButtons: false });
  }
}
