import { SwitcherBase } from "./SwitcherBase.js";
import { GamePageLevel1 } from "../ui/pages/game-pages/GamePageLevel1.js";
import { GamePageLevel2 } from "../ui/pages/game-pages/GamePageLevel2.js";
import { GamePageLevel3 } from "../ui/pages/game-pages/GamePageLevel3.js";
import { GamePageLevel4 } from "../ui/pages/game-pages/GamePageLevel4.js";
import { GamePageLevel5 } from "../ui/pages/game-pages/GamePageLevel5.js";
import { GamePageLevel6 } from "../ui/pages/game-pages/GamePageLevel6.js";
import { GamePageLevel7 } from "../ui/pages/game-pages/GamePageLevel7.js";
import { GamePageLevel8 } from "../ui/pages/game-pages/GamePageLevel8.js";
import { GamePageLevel9 } from "../ui/pages/game-pages/GamePageLevel9.js";
import { GamePageLevel10 } from "../ui/pages/game-pages/GamePageLevel10.js";

export class SwitcherGamePage extends SwitcherBase {
  constructor(mainSwitcher, eventBus) {
    super(mainSwitcher);
    this.eventBus = eventBus;
  }

  createLevelPage(levelNumber, p) {
    switch (levelNumber) {
      case 1:
        return new GamePageLevel1(this, p);
      case 2:
        return new GamePageLevel2(this, p);
      case 3:
        return new GamePageLevel3(this, p);
      case 4:
        return new GamePageLevel4(this, p);
      case 5:
        return new GamePageLevel5(this, p);
      case 6:
        return new GamePageLevel6(this, p);
      case 7:
        return new GamePageLevel7(this, p);
      case 8:
        return new GamePageLevel8(this, p);
      case 9:
        return new GamePageLevel9(this, p);
      case 10:
        return new GamePageLevel10(this, p);
      default:
        throw new Error(`Unknown level page: ${levelNumber}`);
    }
  }
}
