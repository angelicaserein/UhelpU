import { Replayer } from "../game-entity-model/index.js";
import { Assets } from "../AssetsManager.js";
import { RecordSystem } from "../record-system/RecordSystem.js";
import { PhysicsSystem } from "../physics-system/PhysicsSystem.js";
import { CollisionSystem } from "../collision-system/CollisionSystem.js";

export class BaseLevel {
  constructor(p = null, eventBus = null) {
    this.p = p;
    this.eventBus = eventBus;
    this.entities = new Set();
    this.physicsSystem = null;
    this.collisionSystem = null;
    this.recordSystem = null;
    this.bgAssetKey = null;
  }

  /**
   * Initialise RecordSystem, PhysicsSystem and CollisionSystem for a standard level.
   * Call this after all entities have been added and the player has been created.
   * @param {Player} player
   * @param {number} [maxRecordTime=5000]
   * @param {object} [recordOptions] - extra options forwarded to RecordSystem
   */
  initSystems(player, maxRecordTime = 5000, recordOptions = {}) {
    this.recordSystem = new RecordSystem(
      player,
      maxRecordTime,
      (x, y) => this.addReplayer(x, y),
      () => this.removeReplayer(),
      recordOptions,
    );
    this.recordSystem.createListeners();
    this.physicsSystem = new PhysicsSystem(this.entities);
    this.collisionSystem = new CollisionSystem(this.entities, this.eventBus);
  }

  clearLevel() {
    if (
      this.recordSystem &&
      typeof this.recordSystem.clearAllListenersAndTimers === "function"
    ) {
      this.recordSystem.clearAllListenersAndTimers();
    }

    const player = this.getPlayer();
    if (player && typeof player.clearListeners === "function") {
      player.clearListeners();
    }

    // 调用每个实体的 onDestroy 钩子（清理监听器等资源）
    if (this.entities) {
      for (const entity of this.entities) {
        if (typeof entity.onDestroy === "function") {
          entity.onDestroy();
        }
      }
    }

    // 修复：重进关卡时清空所有实体，防止公告栏等交互范围残留
    if (this.entities && typeof this.entities.clear === "function") {
      this.entities.clear();
    }
  }

  findEntityByType(type) {
    for (const entity of this.entities) {
      if (entity.type === type) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Remove enemies that have completed their death animation.
   * Should be called in updatePhysics() to ensure proper cleanup.
   */
  cleanupDeadEnemies() {
    const entitiesToRemove = [];
    for (const entity of this.entities) {
      if (
        entity.type === "enemy" &&
        entity.isDeadAnimationComplete &&
        entity.isDeadAnimationComplete()
      ) {
        entitiesToRemove.push(entity);
      }
    }
    for (const entity of entitiesToRemove) {
      this.entities.delete(entity);
    }
  }

  getPlayer() {
    return this.findEntityByType("player");
  }

  getReplayer() {
    return this.findEntityByType("replayer");
  }

  syncSystemsEntities() {
    if (
      this.physicsSystem &&
      typeof this.physicsSystem.setEntities === "function"
    ) {
      this.physicsSystem.setEntities(this.entities);
    }
    if (
      this.collisionSystem &&
      typeof this.collisionSystem.setEntities === "function"
    ) {
      this.collisionSystem.setEntities(this.entities);
    }
  }

  addReplayer(startX, startY) {
    const ref = this.getReplayer();
    if (ref !== null) {
      return ref;
    }

    const replayer = new Replayer(startX, startY, 40, 40);
    replayer.createListeners();
    this.entities.add(replayer);
    this.syncSystemsEntities();
    return replayer;
  }

  removeReplayer() {
    const ref = this.getReplayer();
    if (ref === null) {
      return;
    }

    ref.clearEventListeners();
    this.entities.delete(ref);
    this.syncSystemsEntities();
  }

  clearCanvas(p = this.p, cameraNudgeX = 0, bgParallaxFactor = 1) {
    const bg = this.bgAssetKey ? Assets[this.bgAssetKey] : null;
    if (bg) {
      const bgOffsetX = Math.round(cameraNudgeX * bgParallaxFactor);
      p.push();
      p.translate(-bgOffsetX, 0);
      p.scale(1, -1);
      // Calculate scale to make background slightly larger than canvas while maintaining aspect ratio
      const scaleX = p.width / bg.width;
      const scaleY = p.height / bg.height;
      const scale = Math.max(scaleX, scaleY) * 1.05; // Slightly larger than canvas
      p.image(bg, 0, -p.height, bg.width * scale, bg.height * scale);
      p.pop();
      return;
    }
    p.background(220);
  }

  updatePhysics() {
    if (
      this.physicsSystem &&
      typeof this.physicsSystem.physicsEntry === "function"
    ) {
      this.physicsSystem.physicsEntry();
    }
    // [NEW] 支撑链velX传递：物理积分后、碰撞检测前传递支撑链 velX
    if (
      this.physicsSystem &&
      typeof this.physicsSystem.velXPropagationEntry === "function"
    ) {
      this.physicsSystem.velXPropagationEntry();
    }
    // 更新所有游戏实体（如 Signboard 的交互检测）
    for (const entity of this.entities) {
      if (entity.update && typeof entity.update === "function") {
        entity.update(this.p);
      }
    }
  }

  updateCollision(_p = this.p, eventBus = this.eventBus) {
    if (
      this.collisionSystem &&
      typeof this.collisionSystem.collisionEntry === "function"
    ) {
      this.collisionSystem.collisionEntry(eventBus);
    }
  }

  draw(p = this.p) {
    // 按 zIndex 排序绘制（zIndex 较小）先绘制，zIndex 较大后绘制）
    const sortedEntities = Array.from(this.entities).sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
    );
    for (const entity of sortedEntities) {
      entity.draw(p);
    }

    if (this.recordSystem && typeof this.recordSystem.draw === "function") {
      this.recordSystem.draw(p);
    }
  }
}
