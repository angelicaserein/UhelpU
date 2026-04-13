import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel1 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 1, "special_hint_level1", "special_level1", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
