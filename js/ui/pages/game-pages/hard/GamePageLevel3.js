import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel3 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 3, "hard_hint_level3", "hard_level3", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
