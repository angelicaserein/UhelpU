import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel7 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 7, "easy_hint_level7", "easy_level7", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
