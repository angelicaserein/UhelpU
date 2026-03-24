// Signboard.js — 场景内可交互木牌组件
//
// 用法示例：
//   const sign = new Signboard(p, {
//     x: 600, y: 400,          // DOM 屏幕坐标（左上角）
//     w: 120, h: 80,           // 尺寸
//     label: '木牌',            // 按钮文字
//     getLevelManager: () => switcher.runtimeLevelManager,
//     onInteract: () => { /* 玩家进入范围并触发交互时的回调 */ },
//   });
//
//   // 每帧调用（检测距离 + 更新高亮）
//   sign.update();
//
//   // 玩家按下交互键时调用
//   sign.tryInteract();
//
//   // 页面离开时清理
//   sign.remove();

import { ButtonBase } from "./ButtonBase.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";
import { Assets } from "../../AssetsManager.js";

export class Signboard {
  static DEFAULT_W = 100;
  static DEFAULT_H = 65;
  /**
   * @param {p5}    p
   * @param {{
   *   x: number,
   *   y: number,
   *   w: number,
   *   h: number,
   *   label?: string,
   *   getLevelManager: () => object|null,
   *   onInteract: () => void,
   * }} options
   */
  constructor(
    p,
    {
      x,
      y,
      w = Signboard.DEFAULT_W,
      h = Signboard.DEFAULT_H,
      label = "",
      getLevelManager,
      onInteract,
    },
  ) {
    this._p = p;
    this._rect = { x, y, w, h };
    this._getLevelManager = getLevelManager;
    this._onInteract = onInteract;
    this._keyBindingManager = KeyBindingManager.getInstance();
    this._interactionKeyPressed = false;
    this._inRange = false;

    // DOM 按鈕：由 CSS 显示 signboard.png 背景图
    this._btn = new ButtonBase(
      p,
      label,
      x,
      y,
      () => {
        this.tryInteract();
      },
      "signboard-button",
    );
    this._btn.btn.style("width", w + "px");
    this._btn.btn.style("height", h + "px");

    // 键盘交互监听
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

    // 初始化高亮状态
    this.update();
  }

  /** 每帧调用，更新高亮状态 */
  update() {
    if (this.isPlayerOverlapping()) {
      this._btn.btn.addClass("signboard-button-in-range");
    } else {
      this._btn.btn.removeClass("signboard-button-in-range");
    }
  }

  /**
   * 将木牌图片绘制到 p5 canvas。
   * 如需在某个层次重绘，可调用此方法替代 CSS 显示。
   */
  draw(p) {
    const img = Assets.tileImage_signboard;
    if (!img) return;
    const { x, y, w, h } = this._rect;
    const inRange = this._btn.btn.elt.classList.contains(
      "signboard-button-in-range",
    );
    if (inRange) {
      p.drawingContext.shadowColor = "white";
      p.drawingContext.shadowBlur = 14;
    }
    p.image(img, x, y, w, h);
    p.drawingContext.shadowColor = "transparent";
    p.drawingContext.shadowBlur = 0;
  }

  /** 尝试交互：仅在玩家与木牌 AABB 重叠时触发 onInteract */
  tryInteract() {
    if (this.isPlayerOverlapping()) {
      this._onInteract && this._onInteract();
    }
  }

  /**
   * 检测玩家碰撞盒与木牌矩形是否 AABB 重叠。
   * 木牌使用 DOM 屏幕坐标（y 轴向下），玩家使用游戏坐标（y 轴向上），此处做转换。
   * 取不到玩家时安全退化为 true（不阻止交互）。
   */
  isPlayerOverlapping() {
    const levelManager = this._getLevelManager && this._getLevelManager();
    const level = levelManager && levelManager.level;
    if (!level || typeof level.getPlayer !== "function") return true;

    const player = level.getPlayer();
    if (!player || !player.collider) return true;

    const pw = player.collider.w || 0;
    const ph = player.collider.h || 0;
    const px = player.x;
    const py = player.y;

    const { x: sx, y: syScreen, w: sw, h: sh } = this._rect;
    // 木牌游戏坐标 y（底部）= 画布高度 - 屏幕 y 坐标底部
    const sy = this._p.height - (syScreen + sh);

    return px < sx + sw && px + pw > sx && py < sy + sh && py + ph > sy;
  }

  /** 返回内部 p5 按钮元素（供 PageBase.addElement 使用） */
  get btn() {
    return this._btn;
  }

  /** 清理 DOM 和键盘监听 */
  remove() {
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
    this._btn.remove();
  }
}
