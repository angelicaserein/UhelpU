import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel5 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 5, "easy_hint_level5", "easy_level5", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
