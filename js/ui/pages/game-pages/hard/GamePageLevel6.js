import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel6 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 6, "hard_hint_level6", "hard_level6", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
