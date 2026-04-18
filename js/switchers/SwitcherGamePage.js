import { SwitcherBase } from "./SwitcherBase.js";
import { EventTypes } from "../event-system/EventTypes.js";
import { LEVEL_REGISTRY } from "../level-registry.js";

export class SwitcherGamePage extends SwitcherBase {
  constructor(mainSwitcher, eventBus) {
    super(mainSwitcher);
    this.eventBus = eventBus;

    // Build page map from the central registry — single source of truth.
    this._pageMap = Object.fromEntries(
      Object.entries(LEVEL_REGISTRY).map(([id, { PageClass }]) => [id, PageClass])
    );
  }

  createLevelPage(levelIndex, p) {
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
