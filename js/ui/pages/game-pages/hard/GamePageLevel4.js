import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel4 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 4, "hard_hint_level4", "hard_level4", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
