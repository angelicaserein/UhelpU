import { Player, Ground, Wall } from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { MapEditor } from "../../develop-mode/MapEditor.js";

export class Level10 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    this._player = new Player(50, 450, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // ── 开发模式：地图编辑器（按 M 开关） ──
    this._mapEditor = new MapEditor(this);
  }

  // 提供 _getCameraX 让 MapEditor 可以劫持并注入摄像机偏移
  _getCameraX(_p) {
    return 0;
  }

  clearLevel(p = this.p, eventBus = this.eventBus) {
    if (this._mapEditor) this._mapEditor.destroy();
    super.clearLevel(p, eventBus);
  }

  draw(p = this.p) {
    const cameraX = this._getCameraX(p);
    p.push();
    p.translate(-cameraX, 0);
    const sortedEntities = Array.from(this.entities).sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
    );
    for (const entity of sortedEntities) entity.draw(p);
    p.pop();

    if (this.recordSystem && typeof this.recordSystem.draw === "function") {
      this.recordSystem.draw(p);
    }

    // ── 开发模式：编辑器叠加绘制 ──
    if (this._mapEditor) this._mapEditor.draw(p);
  }
}
