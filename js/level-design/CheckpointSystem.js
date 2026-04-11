import { isGamePaused } from "../game-runtime/GamePauseState.js";
import { KeyBindingManager } from "../key-binding-system/KeyBindingManager.js";

/**
 * 存档点系统 —— 管理存档点的查找、重生、传送等逻辑
 */
export class CheckpointSystem {
  /**
   * @param {() => import("./BaseLevel.js").BaseLevel | null} getLevel - 获取当前关卡的函数
   */
  constructor(getLevel) {
    this._getLevel = getLevel;
    this._keyBindingManager = KeyBindingManager.getInstance();
    this._lastActivatedCheckpoint = null;
    this._checkpointActivationOrder = []; // 记录checkpoint激活顺序

    this._onTeleportKeyDown = (e) => {
      const teleportKey =
        this._keyBindingManager.getKeyByIntent("teleportCheckpoint");
      if (teleportKey && e.code === teleportKey) {
        this.teleportToNearestCheckpoint();
      }
    };
    document.addEventListener("keydown", this._onTeleportKeyDown);
  }

  /**
   * demo2 和 easy 关卡禁用按键传送到存档点（B 键）
   * 仅 demo1 的 CheckpointDemo1 支持 B 键，CheckpointDemo2 不支持
   * @returns {boolean}
   */
  _isTeleportEnabledForCurrentLevel() {
    const level = this._getLevel();
    if (!level) return false;

    const levelIndex = level.__levelIndex;
    if (typeof levelIndex === "string" && (levelIndex.startsWith("demo2_") || levelIndex.startsWith("easy_"))) {
      return false;
    }

    return true;
  }

  /**
   * 查找离玩家最近的已激活存档点
   * @param {object} player
   * @returns {object|null}
   */
  findNearestActivatedCheckpoint(player) {
    const level = this._getLevel();
    if (!level) return null;

    let nearest = null;
    let minDist = Infinity;
    for (const entity of level.entities) {
      if (entity.type === "checkpoint" && entity.activated) {
        const dx = entity.x - player.x;
        const dy = entity.y - player.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearest = entity;
        }
      }
    }
    return nearest;
  }

  /**
   * 查找最后激活的已激活存档点（按激活顺序）
   * @param {object} player - 不使用，保持接口一致
   * @returns {object|null}
   */
  findLastActivatedCheckpoint(player) {
    return this._lastActivatedCheckpoint;
  }

  /**
   * 记录checkpoint激活（在checkpoint激活时调用）
   * @param {object} checkpoint
   */
  recordCheckpointActivation(checkpoint) {
    if (checkpoint && checkpoint.activated) {
      this._lastActivatedCheckpoint = checkpoint;
      this._checkpointActivationOrder.push(checkpoint);
    }
  }

  /**
   * 在存档点位置重生玩家
   * @param {object} player
   * @param {object} checkpoint
   */
  respawnPlayerAtCheckpoint(player, checkpoint) {
    player.x = checkpoint.x;
    player.y = checkpoint.y;
    player.deathState.isDead = false;
    player.deathState.initialized = false;
    player.deathState.deathType = null;
    if (player.movementComponent) {
      player.movementComponent.velX = 0;
      player.movementComponent.velY = 0;
    }
    if (player.controllerManager) {
      player.controllerManager.resetInputState();
    }
  }

  /**
   * 查找当前关卡中已激活的 TeleportPoint（优先于 Checkpoint）
   * @returns {object|null}
   */
  _findActivatedTeleportPoint() {
    const level = this._getLevel();
    if (!level) return null;
    for (const entity of level.entities) {
      if (entity.type === "teleportpoint" && entity.activated) {
        return entity;
      }
    }
    return null;
  }

  /**
   * 传送到已激活的 TeleportPoint（优先）或最后激活的 Checkpoint（按键触发）
   * TeleportPoint 在所有 demo 中均可用；CheckpointDemo2（demo2/easy）的 B 键传送被禁用
   */
  teleportToNearestCheckpoint() {
    const level = this._getLevel();
    if (!level) return;
    if (isGamePaused()) return;

    let player = null;
    for (const entity of level.entities) {
      if (entity.type === "player") {
        player = entity;
        break;
      }
    }
    if (!player || (player.deathState && player.deathState.isDead)) return;

    // TeleportPoint 优先
    let target = this._findActivatedTeleportPoint();

    // 无 TeleportPoint 时回退到最后激活的 Checkpoint（仅 demo1 支持）
    if (!target && this._isTeleportEnabledForCurrentLevel()) {
      target = this.findLastActivatedCheckpoint(player);
    }

    if (!target) return;

    player.x = target.x;
    player.y = target.y;
    if (player.movementComponent) {
      player.movementComponent.velX = 0;
      player.movementComponent.velY = 0;
    }
    if (player.controllerManager) {
      player.controllerManager.resetInputState();
    }
  }

  /**
   * 移除事件监听器
   */
  destroy() {
    document.removeEventListener("keydown", this._onTeleportKeyDown);
  }
}
