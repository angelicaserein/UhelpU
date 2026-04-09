import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel2 extends GamePageBaseDemo2 {
  constructor(switcher, p, levelIndex) {
    const actualLevelIndex = levelIndex || "demo2_level2";
    super(switcher, p, 2, "d2_hint_level2", actualLevelIndex, { showButtons: false });
  }
}

