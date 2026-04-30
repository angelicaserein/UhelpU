/**
 * @fileoverview Single source of truth mapping every levelIndex string to its
 * Level class and GamePage class.
 * 将每个关卡索引字符串映射到对应关卡类和游戏页面类的唯一权威来源。
 *
 * Both LevelManager and SwitcherGamePage consume this registry, so adding a
 * new level or changing which class handles it only requires one edit here.
 * LevelManager 和 SwitcherGamePage 均使用此注册表，新增关卡或修改处理类只需在此处编辑一次。
 *
 * Entry shape: { LevelClass, PageClass }
 *   LevelClass — the Level subclass to instantiate (receives p, eventBus)
 *   关卡类 — 要实例化的 Level 子类（接收 p 和 eventBus 参数）
 *   PageClass  — the GamePage subclass to instantiate (receives switcher, p)
 *   页面类 — 要实例化的 GamePage 子类（接收 switcher 和 p 参数）
 */

// ── Level classes ──────────────────────────────────────────────────────────
// 关卡类导入 ────────────────────────────────────────────────────────────────
import { Level1 } from "./level-design/demo1/Level1.js";
import { Level2 } from "./level-design/demo1/Level2.js";
import { Level3 } from "./level-design/demo1/Level3.js";
import { Level4 } from "./level-design/demo1/Level4.js";
import { Level5 } from "./level-design/demo1/Level5.js";
import { Level6 } from "./level-design/demo1/Level6.js";
import { Level7 } from "./level-design/demo1/Level7.js";
import { Level8 } from "./level-design/demo1/Level8.js";
import { Level9 } from "./level-design/demo1/Level9.js";
import { Level10 } from "./level-design/demo1/Level10.js";

import { Level1 as Demo2Level1 } from "./level-design/demo2/Level1.js";
import { Level2 as Demo2Level2 } from "./level-design/demo2/Level2.js";
import { Level3 as Demo2Level3 } from "./level-design/demo2/Level3.js";
import { Level4 as Demo2Level4 } from "./level-design/demo2/Level4.js";
import { Level5 as Demo2Level5 } from "./level-design/demo2/Level5.js";
import { Level6 as Demo2Level6 } from "./level-design/demo2/Level6.js";
import { Level7 as Demo2Level7 } from "./level-design/demo2/Level7.js";
import { Level8 as Demo2Level8 } from "./level-design/demo2/Level8.js";
import { Level9 as Demo2Level9 } from "./level-design/demo2/Level9.js";
import { Level10 as Demo2Level10 } from "./level-design/demo2/Level10.js";

import { Level1 as EasyLevel1 } from "./level-design/easy/Level1.js";
import { Level2 as EasyLevel2 } from "./level-design/easy/Level2.js";
import { Level3 as EasyLevel3 } from "./level-design/easy/Level3.js";
import { Level4 as EasyLevel4 } from "./level-design/easy/Level4.js";
import { Level5 as EasyLevel5 } from "./level-design/easy/Level5.js";
import { Level6 as EasyLevel6 } from "./level-design/easy/Level6.js";
import { Level7 as EasyLevel7 } from "./level-design/easy/Level7.js";
import { Level8 as EasyLevel8 } from "./level-design/easy/Level8.js";
import { Level9 as EasyLevel9 } from "./level-design/easy/Level9.js";
import { Level10 as EasyLevel10 } from "./level-design/easy/Level10.js";

import { Level1 as HardLevel1 } from "./level-design/hard/Level1.js";
import { Level2 as HardLevel2 } from "./level-design/hard/Level2.js";
import { Level3 as HardLevel3 } from "./level-design/hard/Level3.js";
import { Level4 as HardLevel4 } from "./level-design/hard/Level4.js";
import { Level5 as HardLevel5 } from "./level-design/hard/Level5.js";
import { Level6 as HardLevel6 } from "./level-design/hard/Level6.js";
import { Level7 as HardLevel7 } from "./level-design/hard/Level7.js";
import { Level8 as HardLevel8 } from "./level-design/hard/Level8.js";
import { Level9 as HardLevel9 } from "./level-design/hard/Level9.js";
import { Level10 as HardLevel10 } from "./level-design/hard/Level10.js";

import { Level1 as SpecialLevel1 } from "./level-design/special/Level1.js";
import { Level2 as SpecialLevel2 } from "./level-design/special/Level2.js";
import { Level3 as SpecialLevel3 } from "./level-design/special/Level3.js";
import { Level4 as SpecialLevel4 } from "./level-design/special/Level4.js";
import { Level5 as SpecialLevel5 } from "./level-design/special/Level5.js";
import { Level6 as SpecialLevel6 } from "./level-design/special/Level6.js";
import { Level7 as SpecialLevel7 } from "./level-design/special/Level7.js";
import { Level8 as SpecialLevel8 } from "./level-design/special/Level8.js";
import { Level9 as SpecialLevel9 } from "./level-design/special/Level9.js";
import { Level10 as SpecialLevel10 } from "./level-design/special/Level10.js";

// User-created level editor
// 用户自制关卡编辑器
import { LevelEmpty10Room } from "./user-levels/LevelEmpty10Room.js";

// ── GamePage classes ───────────────────────────────────────────────────────
// 游戏页面类导入 ───────────────────────────────────────────────────────────
// demo1: Level1 and Level3 have real subclasses; the rest use the base class directly.
// demo1：Level1 和 Level3 有专属子类，其余关卡直接使用基类。
import { GamePageLevel1 as Demo1GamePageLevel1 } from "./ui/pages/game-pages/demo1/GamePageLevel1.js";
import { GamePageLevel3 as Demo1GamePageLevel3 } from "./ui/pages/game-pages/demo1/GamePageLevel3.js";
import { GamePageBaseDemo1 } from "./ui/pages/game-pages/GamePageBaseDemo1.js";

// demo2: all levels use the base class directly (each subclass only defaults the levelIndex arg).
// demo2：所有关卡直接使用基类（每个子类仅设置 levelIndex 默认参数）。
import { GamePageBaseDemo2 } from "./ui/pages/game-pages/GamePageBaseDemo2.js";

// easy: Level1 has a real subclass (Tutorial integration); the rest use a factory below.
// easy：Level1 有专属子类（集成教程），其余关卡通过下方工厂函数创建。
import { GamePageLevel1 as EasyGamePageLevel1 } from "./ui/pages/game-pages/easy/GamePageLevel1.js";

/**
 * Factory helpers — create a GamePageBase subclass instance with the correct
 * constructor arguments for each mode, avoiding 40+ identical shell files.
 * 工厂辅助函数 — 为每种模式创建带有正确构造函数参数的 GamePageBase 子类实例，避免编写 40+ 个相同的壳文件。
 *
 * @param {*} BaseClass
 * @param {number} levelNum
 * @param {string} hintKey
 * @param {string} levelIndex   full levelIndex string (e.g. "easy_level2")
 * @param {boolean} applyTimer  whether to call applyEasyStyle on the timer
 */
function makePageFactory(
  BaseClass,
  levelNum,
  hintKey,
  levelIndex,
  applyTimer = false,
) {
  return class extends BaseClass {
    constructor(switcher, p) {
      if (BaseClass === GamePageBaseDemo1) {
        super(switcher, p, levelNum, hintKey);
      } else {
        super(switcher, p, levelNum, hintKey, levelIndex, {
          showButtons: false,
        });
      }
      if (applyTimer && this._gameTimer) {
        this._gameTimer.applyEasyStyle(p.canvas);
      }
    }
  };
}

// ── Registry ───────────────────────────────────────────────────────────────
// 关卡注册表 ────────────────────────────────────────────────────────────────

/** @type {Object.<string, {LevelClass: Function, PageClass: Function}>} */
export const LEVEL_REGISTRY = {
  // demo1 — original campaign levels
  // demo1 — 原始主线关卡
  level1: { LevelClass: Level1, PageClass: Demo1GamePageLevel1 },
  level2: {
    LevelClass: Level2,
    PageClass: makePageFactory(GamePageBaseDemo1, 2, "hint_level2"),
  },
  level3: { LevelClass: Level3, PageClass: Demo1GamePageLevel3 },
  level4: {
    LevelClass: Level4,
    PageClass: makePageFactory(GamePageBaseDemo1, 4, "hint_level4"),
  },
  level5: {
    LevelClass: Level5,
    PageClass: makePageFactory(GamePageBaseDemo1, 5, "hint_level5"),
  },
  level6: {
    LevelClass: Level6,
    PageClass: makePageFactory(GamePageBaseDemo1, 6, "hint_level6"),
  },
  level7: {
    LevelClass: Level7,
    PageClass: makePageFactory(GamePageBaseDemo1, 7, "hint_level7"),
  },
  level8: {
    LevelClass: Level8,
    PageClass: makePageFactory(GamePageBaseDemo1, 8, "hint_level8"),
  },
  level9: {
    LevelClass: Level9,
    PageClass: makePageFactory(GamePageBaseDemo1, 9, "hint_level9"),
  },
  level10: {
    LevelClass: Level10,
    PageClass: makePageFactory(GamePageBaseDemo1, 10, "hint_level10"),
  },

  // demo2 — second campaign
  // demo2 — 第二套主线关卡
  demo2_level1: {
    LevelClass: Demo2Level1,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      1,
      "d2_hint_level1",
      "demo2_level1",
    ),
  },
  demo2_level2: {
    LevelClass: Demo2Level2,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      2,
      "d2_hint_level2",
      "demo2_level2",
    ),
  },
  demo2_level3: {
    LevelClass: Demo2Level3,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      3,
      "hint_level3",
      "demo2_level3",
    ),
  },
  demo2_level4: {
    LevelClass: Demo2Level4,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      4,
      "hint_level4",
      "demo2_level4",
    ),
  },
  demo2_level5: {
    LevelClass: Demo2Level5,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      5,
      "hint_level5",
      "demo2_level5",
    ),
  },
  demo2_level6: {
    LevelClass: Demo2Level6,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      6,
      "hint_level6",
      "demo2_level6",
    ),
  },
  demo2_level7: {
    LevelClass: Demo2Level7,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      7,
      "hint_level7",
      "demo2_level7",
    ),
  },
  demo2_level8: {
    LevelClass: Demo2Level8,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      8,
      "hint_level8",
      "demo2_level8",
    ),
  },
  demo2_level9: {
    LevelClass: Demo2Level9,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      9,
      "hint_level9",
      "demo2_level9",
    ),
  },
  demo2_level10: {
    LevelClass: Demo2Level10,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      10,
      "d2_hint_level10",
      "demo2_level10",
    ),
  },

  // easy — easy difficulty mode
  // easy — 简单难度模式
  easy_level1: { LevelClass: EasyLevel1, PageClass: EasyGamePageLevel1 },
  easy_level2: {
    LevelClass: EasyLevel2,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      2,
      "easy_hint_level2",
      "easy_level2",
      true,
    ),
  },
  easy_level3: {
    LevelClass: EasyLevel3,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      3,
      "easy_hint_level3",
      "easy_level3",
      true,
    ),
  },
  easy_level4: {
    LevelClass: EasyLevel4,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      4,
      "easy_hint_level4",
      "easy_level4",
      true,
    ),
  },
  easy_level5: {
    LevelClass: EasyLevel5,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      5,
      "easy_hint_level5",
      "easy_level5",
      true,
    ),
  },
  easy_level6: {
    LevelClass: EasyLevel6,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      6,
      "easy_hint_level6",
      "easy_level6",
      true,
    ),
  },
  easy_level7: {
    LevelClass: EasyLevel7,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      7,
      "easy_hint_level7",
      "easy_level7",
      true,
    ),
  },
  easy_level8: {
    LevelClass: EasyLevel8,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      8,
      "easy_hint_level8",
      "easy_level8",
      true,
    ),
  },
  easy_level9: {
    LevelClass: EasyLevel9,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      9,
      "easy_hint_level9",
      "easy_level9",
      true,
    ),
  },
  easy_level10: {
    LevelClass: EasyLevel10,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      10,
      "easy_hint_level10",
      "easy_level10",
      true,
    ),
  },

  // hard — hard difficulty mode
  // hard — 困难难度模式
  hard_level1: {
    LevelClass: HardLevel1,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      1,
      "hard_hint_level1",
      "hard_level1",
      true,
    ),
  },
  hard_level2: {
    LevelClass: HardLevel2,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      2,
      "hard_hint_level2",
      "hard_level2",
      true,
    ),
  },
  hard_level3: {
    LevelClass: HardLevel3,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      3,
      "hard_hint_level3",
      "hard_level3",
      true,
    ),
  },
  hard_level4: {
    LevelClass: HardLevel4,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      4,
      "hard_hint_level4",
      "hard_level4",
      true,
    ),
  },
  hard_level5: {
    LevelClass: HardLevel5,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      5,
      "hard_hint_level5",
      "hard_level5",
      true,
    ),
  },
  hard_level6: {
    LevelClass: HardLevel6,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      6,
      "hard_hint_level6",
      "hard_level6",
      true,
    ),
  },
  hard_level7: {
    LevelClass: HardLevel7,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      7,
      "hard_hint_level7",
      "hard_level7",
      true,
    ),
  },
  hard_level8: {
    LevelClass: HardLevel8,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      8,
      "hard_hint_level8",
      "hard_level8",
      true,
    ),
  },
  hard_level9: {
    LevelClass: HardLevel9,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      9,
      "hard_hint_level9",
      "hard_level9",
      true,
    ),
  },
  hard_level10: {
    LevelClass: HardLevel10,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      10,
      "hard_hint_level10",
      "hard_level10",
      true,
    ),
  },

  // special — special difficulty mode
  // special — 特殊难度模式
  special_level1: {
    LevelClass: SpecialLevel1,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      1,
      "special_hint_level1",
      "special_level1",
      true,
    ),
  },
  special_level2: {
    LevelClass: SpecialLevel2,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      2,
      "special_hint_level2",
      "special_level2",
      true,
    ),
  },
  special_level3: {
    LevelClass: SpecialLevel3,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      3,
      "special_hint_level3",
      "special_level3",
      true,
    ),
  },
  special_level4: {
    LevelClass: SpecialLevel4,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      4,
      "special_hint_level4",
      "special_level4",
      true,
    ),
  },
  special_level5: {
    LevelClass: SpecialLevel5,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      5,
      "special_hint_level5",
      "special_level5",
      true,
    ),
  },
  special_level6: {
    LevelClass: SpecialLevel6,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      6,
      "special_hint_level6",
      "special_level6",
      true,
    ),
  },
  special_level7: {
    LevelClass: SpecialLevel7,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      7,
      "special_hint_level7",
      "special_level7",
      true,
    ),
  },
  special_level8: {
    LevelClass: SpecialLevel8,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      8,
      "special_hint_level8",
      "special_level8",
      true,
    ),
  },
  special_level9: {
    LevelClass: SpecialLevel9,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      9,
      "special_hint_level9",
      "special_level9",
      true,
    ),
  },
  special_level10: {
    LevelClass: SpecialLevel10,
    PageClass: makePageFactory(
      GamePageBaseDemo2,
      10,
      "special_hint_level10",
      "special_level10",
      true,
    ),
  },

  // user-created level editor
  // 用户自制关卡编辑器
  empty_editor: {
    LevelClass: LevelEmpty10Room,
    PageClass: makePageFactory(GamePageBaseDemo2, 0, "", "empty_editor", false),
  },
};
