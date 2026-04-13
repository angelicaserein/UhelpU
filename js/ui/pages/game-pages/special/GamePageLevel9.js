import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel9 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 9, "special_hint_level9", "special_level9", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
