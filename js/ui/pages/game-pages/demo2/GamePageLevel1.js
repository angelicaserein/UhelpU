import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel1 extends GamePageBaseDemo2 {
  constructor(switcher, p, levelIndex) {
    const actualLevelIndex = levelIndex || "demo2_level1";
    super(switcher, p, 1, "d2_hint_level1", actualLevelIndex, { showButtons: false });
  }
}

