import { Player, Ground, Wall, Portal } from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { MapEditor } from "../../develop-mode/MapEditor.js";

export class Level5 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(-100, 0, 120, 768));
    this.entities.add(new Wall(1346, 0, 120, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    const portal = new Portal(1200, 80, 50, 50);
    portal.openPortal();
    this.entities.add(portal);

    this._player = new Player(50, 450, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // ── 开发模式：地图编辑器（按 M 开关） ──
    this._mapEditor = new MapEditor(this);
  }

  clearLevel(p = this.p, eventBus = this.eventBus) {
    if (this._mapEditor) this._mapEditor.destroy();
    super.clearLevel(p, eventBus);
  }

  draw(p = this.p) {
    super.draw(p);

    // ── 开发模式：编辑器叠加绘制 ──
    if (this._mapEditor) this._mapEditor.draw(p);
  }
}
