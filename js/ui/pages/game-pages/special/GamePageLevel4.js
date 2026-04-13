import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel4 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 4, "special_hint_level4", "special_level4", {
      showButtons: false,
    });

    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
