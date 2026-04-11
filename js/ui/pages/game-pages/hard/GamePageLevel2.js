import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel2 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 2, "hard_hint_level2", "hard_level2", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
