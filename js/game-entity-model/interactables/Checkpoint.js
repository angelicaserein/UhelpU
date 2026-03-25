import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import {
  ColliderShape,
  ColliderType,
} from "../../collision-system/enumerator.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";

export class Checkpoint extends GameEntity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {() => Player | null} getPlayer - 获取玩家引用的函数
   * @param {object} options
   */
  constructor(x, y, w = 40, h = 70, getPlayer = null, options = {}) {
    super(x, y);
    this.type = "checkpoint";
    this.movementComponent = null;
    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);
    this.activated = false;
    this._getPlayer = getPlayer;
    this._inRange = false;
    this._interactionKeyPressed = false;
    this._keyBindingManager = KeyBindingManager.getInstance();

    // 旗杆和旗帜颜色
    this.poleColor = options.poleColor || [80, 80, 80];
    this.flagColor = options.flagColor || [75, 0, 130]; // 深紫色
    this.activatedFlagColor = options.activatedFlagColor || [255, 182, 193]; // 激活后浅粉色

    // 光环动画状态
    this._haloTime = 0;
    this._haloParticles = [];

    // 激活回调
    this._onActivate = options.onActivate || null;

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
        this._tryActivate();
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

  update(_p) {
    this._inRange = this._isPlayerOverlapping();
    if (this.activated) {
      this._haloTime += 0.04;
      // 每几帧生成一个小粒子
      if (Math.random() < 0.3) {
        const w = this.collider.w;
        const h = this.collider.h;
        this._haloParticles.push({
          x: this.x + w / 2 + (Math.random() - 0.5) * w * 1.5,
          y: this.y + h * 0.5 + Math.random() * h * 0.6,
          vy: 0.3 + Math.random() * 0.5,
          size: 2 + Math.random() * 4,
          life: 1.0,
        });
      }
      // 更新粒子
      for (let i = this._haloParticles.length - 1; i >= 0; i--) {
        const pt = this._haloParticles[i];
        pt.y += pt.vy;
        pt.life -= 0.02;
        if (pt.life <= 0) this._haloParticles.splice(i, 1);
      }
    }
  }

  activate() {
    this.activated = true;
    if (this._onActivate) this._onActivate();
  }

  reset() {
    this.activated = false;
  }

  _tryActivate() {
    if (this._inRange && !this.activated) {
      this.activate();
    }
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
    const w = this.collider.w;
    const h = this.collider.h;
    const poleX = this.x + w / 2;
    const flagW = w * 1.2;
    const flagH = h * 0.4;
    const flagTop = this.y + h; // y轴向上：杆顶
    const flagColor = this.activated ? this.activatedFlagColor : this.flagColor;
    const showOutline = this._inRange && !this.activated;

    // --- 玩家在范围内且未激活时，先画一层白色描边轮廓（旗杆+旗帜整体外轮廓） ---
    if (showOutline) {
      p.push();
      p.stroke(255, 255, 255, 200);
      p.strokeWeight(7);
      p.strokeJoin(p.ROUND);
      // 旗杆描边
      p.line(poleX, this.y, poleX, this.y + h);
      // 旗帜描边
      p.noFill();
      p.triangle(
        poleX,
        flagTop,
        poleX + flagW,
        flagTop - flagH / 2,
        poleX,
        flagTop - flagH,
      );
      p.pop();
    }

    // --- 旗杆 ---
    p.stroke(...this.poleColor);
    p.strokeWeight(3);
    p.line(poleX, this.y, poleX, this.y + h);

    // --- 旗帜 ---
    p.fill(...flagColor);
    p.noStroke();
    p.triangle(
      poleX,
      flagTop,
      poleX + flagW,
      flagTop - flagH / 2,
      poleX,
      flagTop - flagH,
    );

    // --- 激活后可爱光环特效 ---
    if (this.activated) {
      const cx = poleX + flagW * 0.35;
      const cy = flagTop - flagH / 2;

      // 上升的小粒子/星星
      for (const pt of this._haloParticles) {
        const alpha = pt.life * 200;
        p.push();
        p.noStroke();
        p.fill(255, 200, 220, alpha);
        p.ellipse(pt.x, pt.y, pt.size, pt.size);
        p.pop();
      }
    }
  }

  clearListeners() {
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }

  onDestroy() {
    this.clearListeners();
  }
}
