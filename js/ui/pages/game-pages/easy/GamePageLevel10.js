import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel10 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 10, "easy_hint_level10", "easy_level10", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
