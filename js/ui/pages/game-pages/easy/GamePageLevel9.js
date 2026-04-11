import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel9 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 9, "easy_hint_level9", "easy_level9", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
