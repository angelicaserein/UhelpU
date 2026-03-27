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
   * 传送到最近的已激活存档点（按键触发）
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

    const checkpoint = this.findNearestActivatedCheckpoint(player);
    if (!checkpoint) return;

    player.x = checkpoint.x;
    player.y = checkpoint.y;
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
