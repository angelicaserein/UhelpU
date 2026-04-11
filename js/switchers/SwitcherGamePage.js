import { SwitcherBase } from "./SwitcherBase.js";
import { GamePageLevel1 } from "../ui/pages/game-pages/demo1/GamePageLevel1.js";
import { GamePageLevel2 } from "../ui/pages/game-pages/demo1/GamePageLevel2.js";
import { GamePageLevel3 } from "../ui/pages/game-pages/demo1/GamePageLevel3.js";
import { GamePageLevel4 } from "../ui/pages/game-pages/demo1/GamePageLevel4.js";
import { GamePageLevel5 } from "../ui/pages/game-pages/demo1/GamePageLevel5.js";
import { GamePageLevel6 } from "../ui/pages/game-pages/demo1/GamePageLevel6.js";
import { GamePageLevel7 } from "../ui/pages/game-pages/demo1/GamePageLevel7.js";
import { GamePageLevel8 } from "../ui/pages/game-pages/demo1/GamePageLevel8.js";
import { GamePageLevel9 } from "../ui/pages/game-pages/demo1/GamePageLevel9.js";
import { GamePageLevel10 } from "../ui/pages/game-pages/demo1/GamePageLevel10.js";
import { GamePageLevel1 as Demo2GamePageLevel1 } from "../ui/pages/game-pages/demo2/GamePageLevel1.js";
import { GamePageLevel2 as Demo2GamePageLevel2 } from "../ui/pages/game-pages/demo2/GamePageLevel2.js";
import { GamePageLevel3 as Demo2GamePageLevel3 } from "../ui/pages/game-pages/demo2/GamePageLevel3.js";
import { GamePageLevel4 as Demo2GamePageLevel4 } from "../ui/pages/game-pages/demo2/GamePageLevel4.js";
import { GamePageLevel5 as Demo2GamePageLevel5 } from "../ui/pages/game-pages/demo2/GamePageLevel5.js";
import { GamePageLevel6 as Demo2GamePageLevel6 } from "../ui/pages/game-pages/demo2/GamePageLevel6.js";
import { GamePageLevel7 as Demo2GamePageLevel7 } from "../ui/pages/game-pages/demo2/GamePageLevel7.js";
import { GamePageLevel8 as Demo2GamePageLevel8 } from "../ui/pages/game-pages/demo2/GamePageLevel8.js";
import { GamePageLevel9 as Demo2GamePageLevel9 } from "../ui/pages/game-pages/demo2/GamePageLevel9.js";
import { GamePageLevel10 as Demo2GamePageLevel10 } from "../ui/pages/game-pages/demo2/GamePageLevel10.js";
import { GamePageLevel1 as EasyGamePageLevel1 } from "../ui/pages/game-pages/easy/GamePageLevel1.js";
import { GamePageLevel2 as EasyGamePageLevel2 } from "../ui/pages/game-pages/easy/GamePageLevel2.js";
import { GamePageLevel3 as EasyGamePageLevel3 } from "../ui/pages/game-pages/easy/GamePageLevel3.js";
import { GamePageLevel4 as EasyGamePageLevel4 } from "../ui/pages/game-pages/easy/GamePageLevel4.js";
import { GamePageLevel5 as EasyGamePageLevel5 } from "../ui/pages/game-pages/easy/GamePageLevel5.js";
import { GamePageLevel6 as EasyGamePageLevel6 } from "../ui/pages/game-pages/easy/GamePageLevel6.js";
import { GamePageLevel7 as EasyGamePageLevel7 } from "../ui/pages/game-pages/easy/GamePageLevel7.js";
import { GamePageLevel8 as EasyGamePageLevel8 } from "../ui/pages/game-pages/easy/GamePageLevel8.js";
import { GamePageLevel9 as EasyGamePageLevel9 } from "../ui/pages/game-pages/easy/GamePageLevel9.js";
import { GamePageLevel10 as EasyGamePageLevel10 } from "../ui/pages/game-pages/easy/GamePageLevel10.js";
import { GamePageLevel1 as HardGamePageLevel1 } from "../ui/pages/game-pages/hard/GamePageLevel1.js";
import { GamePageLevel2 as HardGamePageLevel2 } from "../ui/pages/game-pages/hard/GamePageLevel2.js";
import { GamePageLevel3 as HardGamePageLevel3 } from "../ui/pages/game-pages/hard/GamePageLevel3.js";
import { GamePageLevel4 as HardGamePageLevel4 } from "../ui/pages/game-pages/hard/GamePageLevel4.js";
import { GamePageLevel5 as HardGamePageLevel5 } from "../ui/pages/game-pages/hard/GamePageLevel5.js";
import { GamePageLevel6 as HardGamePageLevel6 } from "../ui/pages/game-pages/hard/GamePageLevel6.js";
import { GamePageLevel7 as HardGamePageLevel7 } from "../ui/pages/game-pages/hard/GamePageLevel7.js";
import { GamePageLevel8 as HardGamePageLevel8 } from "../ui/pages/game-pages/hard/GamePageLevel8.js";
import { GamePageLevel9 as HardGamePageLevel9 } from "../ui/pages/game-pages/hard/GamePageLevel9.js";
import { GamePageLevel10 as HardGamePageLevel10 } from "../ui/pages/game-pages/hard/GamePageLevel10.js";

export class SwitcherGamePage extends SwitcherBase {
  constructor(mainSwitcher, eventBus) {
    super(mainSwitcher);
    this.eventBus = eventBus;

    // levelIndex string → GamePage class
    this._pageMap = {
      level1: GamePageLevel1,
      level2: GamePageLevel2,
      level3: GamePageLevel3,
      level4: GamePageLevel4,
      level5: GamePageLevel5,
      level6: GamePageLevel6,
      level7: GamePageLevel7,
      level8: GamePageLevel8,
      level9: GamePageLevel9,
      level10: GamePageLevel10,
      demo2_level1: Demo2GamePageLevel1,
      demo2_level2: Demo2GamePageLevel2,
      demo2_level3: Demo2GamePageLevel3,
      demo2_level4: Demo2GamePageLevel4,
      demo2_level5: Demo2GamePageLevel5,
      demo2_level6: Demo2GamePageLevel6,
      demo2_level7: Demo2GamePageLevel7,
      demo2_level8: Demo2GamePageLevel8,
      demo2_level9: Demo2GamePageLevel9,
      demo2_level10: Demo2GamePageLevel10,
      easy_level1: EasyGamePageLevel1,
      easy_level2: EasyGamePageLevel2,
      easy_level3: EasyGamePageLevel3,
      easy_level4: EasyGamePageLevel4,
      easy_level5: EasyGamePageLevel5,
      easy_level6: EasyGamePageLevel6,
      easy_level7: EasyGamePageLevel7,
      easy_level8: EasyGamePageLevel8,
      easy_level9: EasyGamePageLevel9,
      easy_level10: EasyGamePageLevel10,
      hard_level1: HardGamePageLevel1,
      hard_level2: HardGamePageLevel2,
      hard_level3: HardGamePageLevel3,
      hard_level4: HardGamePageLevel4,
      hard_level5: HardGamePageLevel5,
      hard_level6: HardGamePageLevel6,
      hard_level7: HardGamePageLevel7,
      hard_level8: HardGamePageLevel8,
      hard_level9: HardGamePageLevel9,
      hard_level10: HardGamePageLevel10,
    };
  }

  createLevelPage(levelIndex, p) {
    const PageClass = this._pageMap[levelIndex];
    if (!PageClass) {
      throw new Error(`Unknown level page: ${levelIndex}`);
    }
    return new PageClass(this, p);
  }
}
