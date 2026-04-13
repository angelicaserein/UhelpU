import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel7 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 7, "special_hint_level7", "special_level7", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
