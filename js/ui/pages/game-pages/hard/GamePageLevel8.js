import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel8 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 8, "hard_hint_level8", "hard_level8", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
