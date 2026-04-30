import { SwitcherBase } from "./SwitcherBase.js";
import { EventTypes } from "../event-system/EventTypes.js";
import { LEVEL_REGISTRY } from "../level-registry.js";
import { GamePageBaseDemo2 } from "../ui/pages/game-pages/GamePageBaseDemo2.js";

export class SwitcherGamePage extends SwitcherBase {
  constructor(mainSwitcher, eventBus) {
    super(mainSwitcher);
    this.eventBus = eventBus;

    // Build page map from the central registry — single source of truth.
    // 从中央注册表构建页面映射 — 单一真实来源。
    this._pageMap = Object.fromEntries(
      Object.entries(LEVEL_REGISTRY).map(([id, { PageClass }]) => [
        id,
        PageClass,
      ]),
    );
  }

  createLevelPage(levelIndex, p) {
    // Handle user-created levels with a generic game page
    // 使用通用游戏页面处理用户创建的关卡
    if (levelIndex === "user") {
      return new GamePageBaseDemo2(this, p, 0, "user_level", "user_level", {
        showButtons: false,
      });
    }

    const PageClass = this._pageMap[levelIndex];
    if (!PageClass) {
      throw new Error(`Unknown level page: ${levelIndex}`);
    }
    return new PageClass(this, p);
  }

  showLevelSpecial(p, n) {
    const levelNumber = Number(n);
    if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 10) {
      throw new Error(`Invalid special level number: ${n}`);
    }

    this.eventBus?.publish(
      EventTypes.LOAD_LEVEL,
      `special_level${levelNumber}`,
    );
  }
}
