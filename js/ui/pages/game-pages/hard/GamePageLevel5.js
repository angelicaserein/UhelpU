import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel5 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 5, "hard_hint_level5", "hard_level5", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
