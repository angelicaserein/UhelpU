import { SwitcherBase } from "./SwitcherBase.js";
import { GamePageLevel1 } from "../ui/pages/game-pages/GamePageLevel1.js";
import { GamePageLevel2 } from "../ui/pages/game-pages/GamePageLevel2.js";
import { GamePageLevel3 } from "../ui/pages/game-pages/GamePageLevel3.js";

export class SwitcherGamePage extends SwitcherBase {
  constructor(mainSwitcher, eventBus) {
    super(mainSwitcher);
    this.eventBus = eventBus;
  }

  createLevelPage(levelNumber, p) {
    switch(levelNumber) {
      case 1: return new GamePageLevel1(this, p);
      case 2: return new GamePageLevel2(this, p);
      case 3: return new GamePageLevel3(this, p);
      default: throw new Error(`Unknown level page: ${levelNumber}`);
    }
  }
}