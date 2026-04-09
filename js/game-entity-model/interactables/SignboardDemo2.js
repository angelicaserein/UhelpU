import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { EventTypes } from "../../event-system/EventTypes.js";
import { Assets } from "../../AssetsManager.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";
import { keyCodeToLabel } from "../../record-system/RecordKeyUtil.js";
import { t } from "../../i18n.js";

/**
 * SignboardContent — 木牌交互弹出内容
 * 居中在画布中间显示背景图，再次交互或离开范围时关闭
 */
export class SignboardContent {
  /**
   * @param {p5} p - p5 实例
   * @param {string} [bgImageUrl] - 背景图路径
   */
  constructor(p, bgImageUrl = "assets/images/bg/signboard.png") {
    this.p = p;
    this.isVisible = false;
    this._bgImageUrl = bgImageUrl;
    this._buildDOM();
  }

  _buildDOM() {
    const p = this.p;

    // 半透明遮罩层
    this.overlay = p.createDiv("");
    this.overlay.addClass("signboard-content-overlay");

    // 居中内容区
    this.content = p.createDiv("");
    this.content.addClass("signboard-content-box");
    this.content.parent(this.overlay);

    // 背景图（用 img 元素擑开容器，保持图片原始比例）
    this.bgImg = p.createElement("img");
    this.bgImg.elt.src = this._bgImageUrl;
    this.bgImg.addClass("signboard-content-img");
    this.bgImg.parent(this.content);

    // 标题
    this.titleEl = p.createDiv("");
    this.titleEl.addClass("signboard-content-title");
    this.titleEl.parent(this.content);

    // 正文
    this.bodyEl = p.createDiv("");
    this.bodyEl.addClass("signboard-content-body");
    this.bodyEl.parent(this.content);

    // 教程按钮（可选）
    this.tutorialBtn = p.createButton("");
    this.tutorialBtn.addClass("signboard-tutorial-btn");
    this.tutorialBtn.parent(this.content);
    this.tutorialBtn.elt.style.display = "none";

    // 底部提示
    this.footerEl = p.createDiv("");
    this.footerEl.addClass("signboard-content-footer");
    this.footerEl.parent(this.content);

    this.overlay.elt.style.display = "none";
  }

  setTitle(text) {
    if (this.titleEl) this.titleEl.html(text);
  }

  setBody(text) {
    if (this.bodyEl) this.bodyEl.html(text);
  }

  setFooter(text) {
    if (this.footerEl) this.footerEl.html(text);
  }

  setTutorialButton(callback, textKey = null) {
    if (this.tutorialBtn) {
      if (callback) {
        this.tutorialBtn.elt.style.display = "block";
        this.tutorialBtn.elt.onclick = callback;
        // 设置按钮文本
        if (textKey) {
          this.tutorialBtn.elt.textContent = t(textKey);
        }
      } else {
        this.tutorialBtn.elt.style.display = "none";
      }
    }
  }

  /**
   * 设置交互键的底部提示（动态生成，包含当前设置的交互键）
   * @param {string} interactionKey - 交互键（如 'KeyE'）
   */
  setFooterWithKey(interactionKey) {
    if (!this.footerEl) return;
    const footerText = t("signboard_press_to_interact");
    // 将 {KEY} 占位符替换为交互键的显示符号
    const keyDisplay = this._formatKeyDisplay(interactionKey);
    const finalText = footerText.replace("{KEY}", keyDisplay);
    this.footerEl.html(finalText);
  }

  /**
   * 将键码转换为显示符号（如 'KeyE' -> 'E'）
   * @param {string} keyCode - 键码（如 'KeyE', 'Space', 'ArrowUp'）
   * @returns {string} - 显示符号
   */
  _formatKeyDisplay(keyCode) {
    if (!keyCode) return "?";

    // 处理字母键 (KeyA, KeyB, ...)
    if (keyCode.startsWith("Key")) {
      return keyCode.substring(3).toUpperCase();
    }

    // 处理特殊键
    const keyDisplayMap = {
      Space: "Space",
      Enter: "Enter",
      ShiftLeft: "Shift",
      ShiftRight: "Shift",
      ControlLeft: "Ctrl",
      ControlRight: "Ctrl",
      AltLeft: "Alt",
      AltRight: "Alt",
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
      Tab: "Tab",
      Escape: "ESC",
    };

    return keyDisplayMap[keyCode] || keyCode;
  }

  show() {
    if (this.isVisible) return;
    // 同步尺寸和位置到当前画布
    const canvas = this.p.canvas;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const el = this.overlay.elt;
      el.style.position = "fixed";
      el.style.left = rect.left + "px";
      el.style.top = rect.top + "px";
      el.style.width = rect.width + "px";
      el.style.height = rect.height + "px";
    }
    // 使用 requestAnimationFrame 确保 DOM 内容已完全设置再显示
    requestAnimationFrame(() => {
      this.overlay.elt.style.display = "flex";
      this.isVisible = true;
    });
  }

  hide() {
    if (!this.isVisible) return;
    this.overlay.elt.style.display = "none";
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  remove() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

/**
 * 游戏场景互动木牌 — 游戏实体
 * 在游戏坐标系中绘制，支持与玩家交互
 */
export class SignboardDemo2 extends GameEntity {
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
    w = SignboardDemo2.DEFAULT_W,
    h = SignboardDemo2.DEFAULT_H,
    getPlayer = null,
    eventBus = null,
    {
      imageKey = "tileImage_signboard",
      onInteract = null,
      textKey = null,
      onTutorialClick = null,
      tutorialButtonTextKey = null,
    } = {},
  ) {
    super(x, y);
    this.type = "signboard";
    this.w = w;
    this.h = h;
    this._getPlayer = getPlayer;
    this.eventBus = eventBus;
    this._imageKey = imageKey;
    this._onInteract = onInteract;
    this._textKey = textKey;
    this._onTutorialClick = onTutorialClick;
    this._tutorialButtonTextKey = tutorialButtonTextKey;
    this.zIndex = -5; // 木牌在地形上层、交互物下层

    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);
    this._inRange = false;
    this._interactionKeyPressed = false;
    this._keyBindingManager = KeyBindingManager.getInstance();
    this._signboardContent = null; // 延迟创建，需要 p5 实例

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
    if (!this._p) this._p = p;

    const wasInRange = this._inRange;
    this._inRange = this.isPlayerOverlapping();

    if (wasInRange && !this._inRange) {
      // 离开交互范围时关闭内容
      if (this._signboardContent) {
        this._signboardContent.hide();
      }
      if (this.eventBus) {
        this.eventBus.publish(EventTypes.SIGNBOARD_OUT_OF_RANGE);
      }
    }
  }

  /**
   * 绘制木牌：进入范围时显示实线描边
   * 图像需要 y 轴翻转（游戏坐标系反向）
   */
  draw(p) {
    const img = Assets[this._imageKey];
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

    // 进入范围且内容未打开时显示交互键提示
    if (
      this._inRange &&
      !(this._signboardContent && this._signboardContent.isVisible)
    ) {
      this._drawInteractHint(p);
    }
  }

  /**
   * Draw interact key hint above signboard
   */
  _drawInteractHint(p) {
    const kbm = KeyBindingManager.getInstance();
    const interactionKey = kbm.getKeyByIntent("interaction");
    const hintText = keyCodeToLabel(interactionKey);
    const hintSize = 24;
    const hintY = this.y + this.h + 16;
    const hintX = this.x + this.w / 2;

    p.push();
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(2);
    p.noFill();
    p.rect(hintX - hintSize / 2, hintY, hintSize, hintSize, 3);

    p.translate(hintX, hintY + hintSize / 2);
    p.scale(1, -1);
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.text(hintText, 0, 0);
    p.pop();
  }

  /**
   * 尝试交互：仅在玩家与木牌 AABB 重叠时触发
   */
  _applyText() {
    if (!this._signboardContent || !this._textKey) return;
    const raw = t(this._textKey);
    const sep = raw.indexOf("\n---\n");
    if (sep !== -1) {
      this._signboardContent.setTitle(raw.slice(0, sep).replace(/\n/g, "<br>"));
      this._signboardContent.setBody(raw.slice(sep + 5).replace(/\n/g, "<br>"));
    } else {
      this._signboardContent.setBody(raw.replace(/\n/g, "<br>"));
    }
  }

  tryInteract() {
    if (this.isPlayerOverlapping()) {
      // 切换木牌内容显示
      if (this._p) {
        if (!this._signboardContent) {
          this._signboardContent = new SignboardContent(this._p);
        }
        // 先设置所有文本内容
        this._applyText();
        // 动态更新底部提示文本，包含当前交互键
        const interactionKey =
          this._keyBindingManager.getKeyByIntent("interaction");
        if (interactionKey) {
          this._signboardContent.setFooterWithKey(interactionKey);
        }

        // 设置教程按钮
        if (this._onTutorialClick) {
          this._signboardContent.setTutorialButton(
            this._onTutorialClick,
            this._tutorialButtonTextKey
          );
        } else {
          this._signboardContent.setTutorialButton(null);
        }

        // 使用 requestAnimationFrame 确保文本完全渲染后再显示
        requestAnimationFrame(() => {
          this._signboardContent.toggle();
        });
      }

      if (this.eventBus) {
        this.eventBus.publish(EventTypes.SIGNBOARD_INTERACTED);
      }
      if (this._onInteract) {
        this._onInteract();
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

  onDestroy() {
    this.clearListeners();
    if (this._signboardContent) {
      this._signboardContent.remove();
      this._signboardContent = null;
    }
  }
}
