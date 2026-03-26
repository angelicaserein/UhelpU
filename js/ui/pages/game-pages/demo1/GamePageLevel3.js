import { GamePageBase } from "../GamePageBase.js";

export class GamePageLevel3 extends GamePageBase {
  constructor(switcher, p) {
    super(switcher, p, 3, "hint_level3");

    this._setupSignboardHint({
      frontTextPaths: {
        en: "assets/text/signboard_hint_level3_front_en.txt",
        zh: "assets/text/signboard_hint_level3_front_zh.txt",
      },
      backTextPaths: {
        en: "assets/text/signboard_hint_level3_back_en.txt",
        zh: "assets/text/signboard_hint_level3_back_zh.txt",
      },
    });
  }
}
