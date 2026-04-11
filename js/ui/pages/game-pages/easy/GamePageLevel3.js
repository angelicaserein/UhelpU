import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel3 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 3, "easy_hint_level3", "easy_level3", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
