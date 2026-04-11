import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel2 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    console.log("[GamePageLevel2] Constructor called");
    super(switcher, p, 2, "easy_hint_level2", "easy_level2", {
      showButtons: false,
    });

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }

  draw() {
    super.draw();
  }
}
