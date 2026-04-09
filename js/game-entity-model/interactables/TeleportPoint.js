import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { Assets } from "../../AssetsManager.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";

/**
 * TeleportPoint — 手动激活的传送点
 *
 * 玩家靠近后按交互键（E）激活；激活后按 B 键（teleportCheckpoint）
 * 可传送回此处。不参与死亡重生逻辑（死亡仍回到 Checkpoint）。
 *
 * 贴图：
 *   未激活 → TeleportPointClose.png
 *   激活后 → TeleportPointOpen.png
 */
export class TeleportPoint extends GameEntity {
  static DEFAULT_W = 40;
  static DEFAULT_H = 70;

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {() => Player | null} getPlayer
   * @param {object} options
   * @param {() => void} [options.onActivate]
   */
  constructor(
    x,
    y,
    w = TeleportPoint.DEFAULT_W,
    h = TeleportPoint.DEFAULT_H,
    getPlayer = null,
    options = {},
  ) {
    super(x, y);
    this.type = "teleportpoint";
    this.zIndex = -15;
    this.movementComponent = null;
    this.w = w;
    this.h = h;
    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);
    this.activated = false;
    this._getPlayer = getPlayer;
    this._inRange = false;
    this._interactionKeyPressed = false;
    this._keyBindingManager = KeyBindingManager.getInstance();
    this._onActivate = options.onActivate || null;

    this._onKeyDown = (e) => {
      const interactionKey =
        this._keyBindingManager.getKeyByIntent("interaction");
      if (
        interactionKey &&
        e.code === interactionKey &&
        !this._interactionKeyPressed
      ) {
        this._interactionKeyPressed = true;
        if (this._inRange && !this.activated) {
          this.activate();
        }
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

  activate() {
    this.activated = true;
    if (this._onActivate) this._onActivate();
  }

  reset() {
    this.activated = false;
  }

  update(_p) {
    this._inRange = this._isPlayerOverlapping();
  }

  _isPlayerOverlapping() {
    if (!this._getPlayer) return false;
    const player = this._getPlayer();
    if (!player || !player.collider) return false;

    const pw = player.collider.w || 0;
    const ph = player.collider.h || 0;
    const playerCenterX = player.x + pw / 2;
    const playerCenterY = player.y + ph / 2;

    return (
      playerCenterX >= this.x &&
      playerCenterX <= this.x + this.collider.w &&
      playerCenterY >= this.y &&
      playerCenterY <= this.y + this.collider.h
    );
  }

  draw(p) {
    const img = this.activated
      ? Assets.tileImage_teleportPointOpen
      : Assets.tileImage_teleportPointClose;

    if (img) {
      p.push();
      p.translate(this.x, this.y + this.h);
      p.scale(1, -1);
      p.image(img, 0, 0, this.w, this.h);
      p.pop();
    } else {
      // 贴图缺失时的 fallback
      p.push();
      if (this.activated) {
        p.fill(100, 200, 255);
      } else {
        p.fill(150, 150, 200);
      }
      p.noStroke();
      p.rect(this.x, this.y, this.w, this.h);
      p.pop();
    }

    // 在范围内且未激活时，在贴图上方显示交互键提示
    if (this._inRange && !this.activated) {
      this._drawKeyPrompt(p);
    }
  }

  /**
   * 在贴图正上方绘制交互键方块提示（与 KeyPrompt 样式一致）
   */
  _drawKeyPrompt(p) {
    const keyCode = this._keyBindingManager.getKeyByIntent("interaction");
    const label = KeyBindingManager.keyCodeToLabel(keyCode) || "E";
    const keySize = 28;
    const gap = 8;

    // 游戏坐标系 y 轴向上，贴图顶端 = this.y + this.h，向上再偏移 gap
    const kx = this.x + this.w / 2 - keySize / 2;
    const ky = this.y + this.h + gap;

    // 镂空矩形框
    p.push();
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(2);
    p.noFill();
    p.rect(kx, ky, keySize, keySize, 2);
    p.pop();

    // 文字（补偿全局 Y 轴翻转）
    p.push();
    p.translate(kx + keySize / 2, ky + keySize / 2);
    p.scale(1, -1);
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.text(label, 0, 0);
    p.pop();
  }

  onDestroy() {
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }
}
