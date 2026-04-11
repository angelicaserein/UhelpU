import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel8 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 8, "easy_hint_level8", "easy_level8", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
