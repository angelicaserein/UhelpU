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
    this._teleportPoints = []; // 存储所有 TeleportPoint
    this._teleportPointMap = new Map(); // TeleportPoint 到序号的映射
    this._activatedOrder = []; // 激活的传送点按激活顺序排列

    this._onNumKeyDown = (e) => {
      if (isGamePaused()) return;

      // 检查是否按下了数字键 (0-9)
      const keyCode = e.code;
      if (keyCode.startsWith("Digit")) {
        const digit = parseInt(keyCode.replace("Digit", ""), 10);
        if (digit >= 0 && digit <= 9) {
          this.teleportToPointByNumber(digit);
        }
      }
      // 也支持小键盘数字键
      else if (keyCode.startsWith("Numpad")) {
        const digit = parseInt(keyCode.replace("Numpad", ""), 10);
        if (digit >= 0 && digit <= 9) {
          this.teleportToPointByNumber(digit);
        }
      }
    };
    document.addEventListener("keydown", this._onNumKeyDown);
  }

  /**
   * 注册关卡中的所有传送点（不分配序号，动态分配）
   * @param {Array} entities - 关卡中的所有实体集合（Set 或 Array）
   */
  registerTeleportPoints(entities) {
    this._teleportPoints = [];
    this._teleportPointMap.clear();
    this._activatedOrder = [];

    for (const entity of entities) {
      if (entity.type === "teleportpoint") {
        this._teleportPoints.push(entity);
        entity._teleportPointIndex = null; // 动态分配，初始为 null
        // 绑定激活回调
        entity._onTeleportPointActivate = () => {
          this._handleTeleportPointActivated(entity);
        };
      }
    }
  }

  /**
   * 处理传送点被激活事件 —— 动态分配快捷键，支持循环覆盖
   * 快捷键分配: 1,2,3,4,5,6,7,8,9,0,1,2,3...（循环）
   * @param {TeleportPoint} tp
   */
  _handleTeleportPointActivated(tp) {
    // 如果还没分配索引，就分配下一个
    if (tp._teleportPointIndex === null && !this._activatedOrder.includes(tp)) {
      const maxActiveCount = 10; // 最多支持 10 个激活的传送点（对应 0-9 十个快捷键）

      // 计算新的快捷键
      let newKeyboardKey;
      if (this._activatedOrder.length < maxActiveCount) {
        // 前 10 个：分别对应 1-9,0
        newKeyboardKey =
          this._activatedOrder.length === 9
            ? 0
            : this._activatedOrder.length + 1;
      } else {
        // 超过 10 个：循环覆盖最旧的，新的快捷键复用被移除的快捷键
        const oldestTp = this._activatedOrder.shift(); // 移除最旧的
        const recycledKey = oldestTp._teleportPointIndex; // 获取被移除的快捷键
        oldestTp._teleportPointIndex = null;
        oldestTp.activated = false;
        this._teleportPointMap.delete(oldestTp);

        // 新的快捷键复用被移除的快捷键
        newKeyboardKey = recycledKey;
      }

      // 分配新的快捷键
      tp._teleportPointIndex = newKeyboardKey;
      this._activatedOrder.push(tp);
      this._teleportPointMap.set(tp, newKeyboardKey);
    }
  }

  /**
   * 获取当前已激活传送点快照（按激活顺序）
   * @returns {{ activatedTeleportPointIndices: number[] }}
   */
  getActivatedTeleportPointsSnapshot() {
    // 返回已激活传送点在 _teleportPoints 中的原始索引，按激活顺序
    const activatedIndices = [];
    for (const tp of this._activatedOrder) {
      const originalIndex = this._teleportPoints.indexOf(tp);
      if (originalIndex >= 0) {
        activatedIndices.push(originalIndex);
      }
    }
    return { activatedTeleportPointIndices: activatedIndices };
  }

  /**
   * 从快照恢复传送点激活状态和顺序
   * @param {{ activatedTeleportPointIndices?: number[] } | null} snapshot
   */
  restoreTeleportPointsFromSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.activatedTeleportPointIndices)) {
      return;
    }

    // 清空当前激活状态
    this._activatedOrder = [];
    this._teleportPointMap.clear();

    // 根据保存的索引顺序恢复 —— 按顺序"激活"传送点
    // 这样会自动触发循环覆盖逻辑
    for (const originalIndex of snapshot.activatedTeleportPointIndices) {
      if (originalIndex < this._teleportPoints.length) {
        const tp = this._teleportPoints[originalIndex];
        if (tp) {
          // 重置激活状态，然后触发激活处理（这会分配快捷键）
          tp._teleportPointIndex = null;
          this._handleTeleportPointActivated(tp);
          tp.activated = true;
        }
      }
    }
  }

  /**
   * 根据序号传送到对应的传送点（支持 0-9 十个快捷键）
   * @param {number} pointNumber - 传送点序号（0-9）
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
   * 重置所有传送点的激活状态和顺序（用于关卡重置）
   */
  resetAllTeleportPoints() {
    this._activatedOrder = [];
    this._teleportPointMap.clear();
    for (const tp of this._teleportPoints) {
      tp._teleportPointIndex = null;
      tp.activated = false;
    }
  }

  /**
   * 移除事件监听器
   */
  destroy() {
    document.removeEventListener("keydown", this._onNumKeyDown);
  }
}
