import { isGamePaused } from "../game-runtime/GamePauseState.js";

/**
 * 传送点系统 —— 管理所有传送点的序号和数字键导航
 */
export class TeleportPointSystem {
  /**
   * @param {() => import("./BaseLevel.js").BaseLevel | null} getLevel - 获取当前关卡的函数
   */
  constructor(getLevel) {
    this._getLevel = getLevel;
    this._teleportPoints = []; // 按顺序存储的 TeleportPoint 列表
    this._teleportPointMap = new Map(); // TeleportPoint 到序号的映射

    this._onNumKeyDown = (e) => {
      if (isGamePaused()) return;

      // 检查是否按下了数字键 (1-9)
      const keyCode = e.code;
      if (keyCode.startsWith("Digit")) {
        const digit = parseInt(keyCode.replace("Digit", ""), 10);
        if (digit >= 1 && digit <= 9) {
          this.teleportToPointByNumber(digit);
        }
      }
      // 也支持小键盘数字键
      else if (keyCode.startsWith("Numpad")) {
        const digit = parseInt(keyCode.replace("Numpad", ""), 10);
        if (digit >= 1 && digit <= 9) {
          this.teleportToPointByNumber(digit);
        }
      }
    };
    document.addEventListener("keydown", this._onNumKeyDown);
  }

  /**
   * 注册关卡中的所有传送点并分配序号
   * @param {Array} entities - 关卡中的所有实体集合（Set 或 Array）
   */
  registerTeleportPoints(entities) {
    this._teleportPoints = [];
    this._teleportPointMap.clear();

    let index = 1;
    for (const entity of entities) {
      if (entity.type === "teleportpoint") {
        entity._teleportPointIndex = index;
        this._teleportPoints.push(entity);
        this._teleportPointMap.set(entity, index);
        index++;
      }
    }
  }

  /**
   * 根据序号传送到对应的传送点
   * @param {number} pointNumber - 传送点序号（1-9）
   */
  teleportToPointByNumber(pointNumber) {
    const level = this._getLevel();
    if (!level) return;

    let player = null;
    for (const entity of level.entities) {
      if (entity.type === "player") {
        player = entity;
        break;
      }
    }
    if (!player || (player.deathState && player.deathState.isDead)) return;

    // 找到对应序号的激活传送点
    for (const tp of this._teleportPoints) {
      if (tp._teleportPointIndex === pointNumber && tp.activated) {
        player.x = tp.x;
        player.y = tp.y;
        if (player.movementComponent) {
          player.movementComponent.velX = 0;
          player.movementComponent.velY = 0;
        }
        if (player.controllerManager) {
          player.controllerManager.resetInputState();
        }
        return;
      }
    }
  }

  /**
   * 获取传送点的序号
   * @param {object} teleportPoint
   * @returns {number|null}
   */
  getTeleportPointIndex(teleportPoint) {
    return this._teleportPointMap.get(teleportPoint) || null;
  }

  /**
   * 移除事件监听器
   */
  destroy() {
    document.removeEventListener("keydown", this._onNumKeyDown);
  }
}
