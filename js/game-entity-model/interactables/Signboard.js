import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";

/**
 * 游戏场景互动木牌 — 游戏实体
 * 在游戏坐标系中绘制，支持与玩家交互
 */
export class Signboard extends GameEntity {
  static DEFAULT_W = 100;
  static DEFAULT_H = 65;

  /**
   * @param {number} x - 游戏坐标 x
   * @param {number} y - 游戏坐标 y（底部）
   * @param {number} w - 宽度
   * @param {number} h - 高度
   * @param {() => Player | null} getPlayer - 获取玩家引用的函数（避免直接持有 Level 引用）
   * @param {EventBus} eventBus - 事件总线（用于发送交互事件）
   */
  constructor(
    x,
    y,
    w = Signboard.DEFAULT_W,
    h = Signboard.DEFAULT_H,
    getPlayer = null,
    eventBus = null,
  ) {
    super(x, y);
    this.type = "signboard";
    this.w = w;
    this.h = h;
    this._getPlayer = getPlayer;
    this.eventBus = eventBus;
    this.zIndex = -1; // 木牌在角色下层，不挡住它们

    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);
    this._inRange = false;
    this._interactionKeyPressed = false;
    this._keyBindingManager = KeyBindingManager.getInstance();

    // 键盘监听
    this._onKeyDown = (e) => {
      const interactionKey =
        this._keyBindingManager.getKeyByIntent("interaction");
      if (
        interactionKey &&
        e.code === interactionKey &&
        !this._interactionKeyPressed
      ) {
        this._interactionKeyPressed = true;
        this.tryInteract();
      }
    };
    this._onKeyUp = (e) => {
      const interactionKey =
        this._keyBindingManager.getKeyByIntent("interaction");
      if (interactionKey && e.code === interactionKey) {
        this._interactionKeyPressed = false;
      }
    };
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  /**
   * 每帧更新：检测玩家是否在范围内
   */
  update(p) {
    const wasInRange = this._inRange;
    this._inRange = this.isPlayerOverlapping();

    if (wasInRange && !this._inRange && this.eventBus) {
      this.eventBus.publish("signboardOutOfRange");
    }
  }

  /**
   * 绘制木牌：进入范围时显示实线描边
   * 图像需要 y 轴翻转（游戏坐标系反向）
   */
  draw(p) {
    const img = Assets.tileImage_signboard;
    if (!img) return;

    // 翻转图像（游戏坐标系 y 轴朝上）
    p.push();
    p.translate(this.x, this.y + this.h);
    p.scale(1, -1);
    p.image(img, 0, 0, this.w, this.h);
    p.pop();

    // 进入范围时显示白色实线描边
    if (this._inRange) {
      p.push();
      p.strokeWeight(3);
      p.stroke(255, 255, 255, 200);
      p.noFill();
      p.rect(this.x, this.y, this.w, this.h);
      p.pop();
    }
  }

  /**
   * 尝试交互：仅在玩家与木牌 AABB 重叠时触发
   */
  tryInteract() {
    if (this.isPlayerOverlapping()) {
      if (this.eventBus) {
        this.eventBus.publish("signboardInteracted");
      }
    }
  }

  /**
   * 检测玩家中心点是否位于木牌矩形内（游戏坐标系）
   * 交互范围始终与木牌可视范围一致，不受玩家碰撞盒大小影响
   */
  isPlayerOverlapping() {
    if (!this._getPlayer) return false;

    const player = this._getPlayer();
    if (!player || !player.collider) return false;

    const pw = player.collider.w || 0;
    const ph = player.collider.h || 0;
    const playerCenterX = player.x + pw / 2;
    const playerCenterY = player.y + ph / 2;

    // 木牌矩形：this.x, this.y（底部）, this.w, this.h
    const sx = this.x;
    const sy = this.y;
    const sw = this.w;
    const sh = this.h;

    // 玩家中心点位于木牌矩形内才可交互
    return (
      playerCenterX >= sx &&
      playerCenterX <= sx + sw &&
      playerCenterY >= sy &&
      playerCenterY <= sy + sh
    );
  }

  /**
   * 清理键盘监听
   */
  clearListeners() {
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }
}
