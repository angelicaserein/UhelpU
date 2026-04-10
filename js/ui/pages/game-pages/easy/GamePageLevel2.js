import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel2 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 2, "easy_hint_level2", "easy_level2", {
      showButtons: false,
    });
  }
}
