import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel4 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 4, "easy_hint_level4", "easy_level4", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }
}
