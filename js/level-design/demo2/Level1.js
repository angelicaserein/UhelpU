import { Player, Ground, Wall, Portal } from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";

export class Level1 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);

    // ── 背景 ──────────────────────────────────────────────────
    // this.bgAssetKey = "bgImageLevel1"; // 需要时取消注释并设置对应资源 key

    // ── 边界墙壁 ──────────────────────────────────────────────
    const wallThickness = 20;
    this.entities.add(new Wall(0, 0, wallThickness, p.height));
    this.entities.add(
      new Wall(p.width - wallThickness, 0, wallThickness, p.height),
    );

    // ── 地面 ──────────────────────────────────────────────────
    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── 传送门（默认解锁） ────────────────────────────────────
    const portalSize = 50;
    const portalX = p.width - wallThickness - portalSize;
    const portal = new Portal(portalX, 80, portalSize, portalSize);
    portal.openPortal();
    this.entities.add(portal);

    // ── 玩家 ──────────────────────────────────────────────────
    const player = new Player(50, 450, 40, 40);
    player.createListeners();
    this.entities.add(player);

    // ── 系统初始化（录制 / 物理 / 碰撞） ─────────────────────
    this.initSystems(player);
  }
}
