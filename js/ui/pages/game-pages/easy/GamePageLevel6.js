import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel6 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 6, "easy_hint_level6", "easy_level6", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
