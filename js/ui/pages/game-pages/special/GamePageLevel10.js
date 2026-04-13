import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel10 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 10, "special_hint_level10", "special_level10", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
