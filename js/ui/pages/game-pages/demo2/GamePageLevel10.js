import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel10 extends GamePageBaseDemo2 {
  constructor(switcher, p, levelIndex) {
    const actualLevelIndex = levelIndex || "demo2_level10";
    super(switcher, p, 10, "d2_hint_level10", actualLevelIndex, { showButtons: false });
  }
}
