import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { EventTypes } from "../../event-system/EventTypes.js";
import { Assets } from "../../AssetsManager.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";
import { t } from "../../i18n.js";

/**
 * NPC — 可交互对话角色
 * 玩家进入范围后按 E 键触发对话事件
 */
export class NPC extends GameEntity {
  static DEFAULT_W = 40;
  static DEFAULT_H = 40;

  /**
   * @param {number} x - 游戏坐标 x
   * @param {number} y - 游戏坐标 y（底部）
   * @param {number} w - 宽度
   * @param {number} h - 高度
   * @param {object} options
   * @param {() => Player | null} options.getPlayer - 获取玩家引用的函数
   * @param {EventBus} options.eventBus - 事件总线
   * @param {string} options.npcId - NPC 唯一标识（用于区分不同 NPC 的对话内容）
   * @param {string[]} options.dialogueLines - 对话 i18n key 数组
   * @param {string} options.imageKey - 图片资源键名
   * @param {number[]} options.color - 没有图片时的填充颜色 [r, g, b]
   */
  constructor(x, y, w = NPC.DEFAULT_W, h = NPC.DEFAULT_H, options = {}) {
    super(x, y);
    this.type = "npc";
    this.w = w;
    this.h = h;
    this._getPlayer = options.getPlayer || null;
    this.eventBus = options.eventBus || null;
    this.npcId = options.npcId || "default";
    this.dialogueLines = options.dialogueLines || ["..."];
    this._exhaustedLine = options.exhaustedLine || null;
    this._maxDialogueCount = options.maxDialogueCount || Infinity;
    this._dialogueCompletedCount = 0;
    this._imageKey = options.imageKey || null;
    this._color = options.color || [100, 200, 255];
    this.zIndex = -1;

    this.collider = new RectangleCollider(ColliderType.TRIGGER, w, h);

    // 待机动画：每 2 秒播放一次 1-2-3-4-5-4-3-2-1
    this._idleSequence = [0, 1, 2, 3, 4, 3, 2, 1];
    this._idleFrameIndex = 0;
    this._idleFrameDurationMs = 120; // 每帧 120ms
    this._idleCooldownMs = 2000; // 每 2 秒触发一次
    this._idleTimer = 0;
    this._idlePlaying = false; // 是否正在播放动画

    // 对话结束后继续显示 face 贴图 3 秒
    this._faceLingerMs = 3000;
    this._faceLingerTimer = 0;

    this._inRange = false;
    this._interactionKeyPressed = false;
    this._keyBindingManager = KeyBindingManager.getInstance();

    // 对话状态
    this._dialogueActive = false;
    this._dialogueIndex = 0;

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
        this._handleInteraction();
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

  update(p) {
    // 更新待机动画
    const dt = p.deltaTime || 16;
    this._idleTimer += dt;
    if (this._idlePlaying) {
      // 正在播放动画，按 120ms/帧推进
      if (this._idleTimer >= this._idleFrameDurationMs) {
        this._idleTimer -= this._idleFrameDurationMs;
        this._idleFrameIndex++;
        if (this._idleFrameIndex >= this._idleSequence.length) {
          // 动画播完，回到第一帧，开始等待下一个 2 秒周期
          this._idleFrameIndex = 0;
          this._idlePlaying = false;
          this._idleTimer = 0;
        }
      }
    } else {
      // 等待冷却，达到 2 秒后触发一轮动画
      if (this._idleTimer >= this._idleCooldownMs) {
        this._idlePlaying = true;
        this._idleFrameIndex = 0;
        this._idleTimer = 0;
      }
    }

    // 更新 face 贴图延迟计时器
    if (this._faceLingerTimer > 0) {
      this._faceLingerTimer -= dt;
      if (this._faceLingerTimer < 0) this._faceLingerTimer = 0;
    }

    const wasInRange = this._inRange;
    this._inRange = this._isPlayerOverlapping();

    // 玩家离开范围时关闭对话
    if (wasInRange && !this._inRange) {
      if (this._dialogueActive) {
        this._endDialogue();
      }
    }
  }

  draw(p) {
    // 对话中(非 exhausted)或结束后 3 秒内显示 face 贴图
    const useFace =
      (this._dialogueActive && !this._useExhaustedLine) ||
      this._faceLingerTimer > 0;
    if (useFace && Assets.npcFaceImg) {
      p.push();
      p.translate(this.x, this.y + this.h);
      p.scale(1, -1);
      p.image(Assets.npcFaceImg, 0, 0, this.w, this.h);
      p.pop();
    } else {
      const idleImgs = Assets.npcIdleImgs;
      const frameIdx = this._idleSequence[this._idleFrameIndex];
      const img = (idleImgs && idleImgs[frameIdx]) || null;
      if (img) {
        p.push();
        p.translate(this.x, this.y + this.h);
        p.scale(1, -1);
        p.image(img, 0, 0, this.w, this.h);
        p.pop();
      } else {
        p.push();
        p.fill(this._color[0], this._color[1], this._color[2]);
        p.noStroke();
        p.rect(this.x, this.y, this.w, this.h);
        p.pop();
      }
    }

    // 进入范围时显示提示框
    if (this._inRange && !this._dialogueActive) {
      this._drawInteractHint(p);
    }

    // 显示对话气泡
    if (this._dialogueActive) {
      this._drawDialogueBubble(p);
    }
  }

  // ── 交互逻辑 ───────────────────────────────────────────────────

  _handleInteraction() {
    if (!this._inRange) return;

    if (!this._dialogueActive) {
      // 已耗尽对话次数，显示 exhaustedLine
      if (
        this._exhaustedLine &&
        this._dialogueCompletedCount >= this._maxDialogueCount
      ) {
        this._dialogueActive = true;
        this._dialogueIndex = 0;
        this._useExhaustedLine = true;
        return;
      }
      // 开始对话
      this._dialogueActive = true;
      this._dialogueIndex = 0;
      this._useExhaustedLine = false;
      if (this.eventBus) {
        this.eventBus.publish(EventTypes.NPC_DIALOGUE_START, {
          npcId: this.npcId,
          line: this.dialogueLines[0],
          index: 0,
          total: this.dialogueLines.length,
        });
      }
    } else {
      // 如果是 exhaustedLine 模式，按交互键直接关闭
      if (this._useExhaustedLine) {
        this._endDialogue();
        return;
      }
      // 推进对话
      this._dialogueIndex++;
      if (this._dialogueIndex >= this.dialogueLines.length) {
        this._endDialogue();
      } else if (this.eventBus) {
        this.eventBus.publish(EventTypes.NPC_DIALOGUE_NEXT, {
          npcId: this.npcId,
          line: this.dialogueLines[this._dialogueIndex],
          index: this._dialogueIndex,
          total: this.dialogueLines.length,
        });
      }
    }
  }

  _endDialogue() {
    // 非 exhausted 对话结束后保留 face 贴图 3 秒
    if (!this._useExhaustedLine) {
      this._faceLingerTimer = this._faceLingerMs;
      this._dialogueCompletedCount++;
    }
    this._dialogueActive = false;
    this._dialogueIndex = 0;
    this._useExhaustedLine = false;
    if (this.eventBus) {
      this.eventBus.publish(EventTypes.NPC_DIALOGUE_END, {
        npcId: this.npcId,
      });
    }
  }

  // ── 绘制辅助 ───────────────────────────────────────────────────

  /**
   * 玩家在范围内时，在 NPC 头顶显示 [E] 提示
   */
  _drawInteractHint(p) {
    const hintText = "E";
    const hintSize = 24;
    const hintY = this.y + this.h + 16;
    const hintX = this.x + this.w / 2;

    p.push();
    // 绘制按键框
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(2);
    p.noFill();
    p.rect(hintX - hintSize / 2, hintY, hintSize, hintSize, 3);

    // 文字（补偿 y 轴翻转）
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
   * 绘制对话气泡
   */
  _drawDialogueBubble(p) {
    const lineKey = this._useExhaustedLine
      ? this._exhaustedLine
      : this.dialogueLines[this._dialogueIndex] || "";
    const line = t(lineKey);
    const bubbleW = 200;
    const bubbleH = 60;
    const bubbleX = this.x + this.w / 2 - bubbleW / 2;
    const bubbleY = this.y + this.h + 50;

    p.push();
    // 气泡背景
    p.fill(0, 0, 0, 180);
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(2);
    p.rect(bubbleX, bubbleY, bubbleW, bubbleH, 6);

    // 气泡文字（补偿 y 轴翻转）
    p.translate(bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
    p.scale(1, -1);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    if (Assets.customFont) {
      p.textFont(Assets.customFont);
    }
    p.text(
      line,
      -(bubbleW - 16) / 2,
      -(bubbleH - 12) / 2,
      bubbleW - 16,
      bubbleH - 12,
    );
    p.pop();

    // “按交互键继续”提示（对话未到最后一句且非 exhausted 模式时显示）
    if (
      !this._useExhaustedLine &&
      this._dialogueIndex < this.dialogueLines.length - 1
    ) {
      const hintText = t("npc_continue_hint");
      p.push();
      p.translate(bubbleX + bubbleW - 8, bubbleY + 16); //参数分别是提示文本的 x 和 y 坐标（相对于气泡框）
      p.scale(1, -1);
      p.fill(200, 200, 200, 180);
      p.noStroke();
      p.textAlign(p.RIGHT, p.TOP);
      p.textSize(9);
      p.text(hintText, 0, 0);
      p.pop();
    }
  }

  // ── 碰撞检测 ───────────────────────────────────────────────────

  _isPlayerOverlapping() {
    if (!this._getPlayer) return false;
    const player = this._getPlayer();
    if (!player || !player.collider) return false;

    const pw = player.collider.w || 0;
    const ph = player.collider.h || 0;
    const pcx = player.x + pw / 2;
    const pcy = player.y + ph / 2;

    return (
      pcx >= this.x &&
      pcx <= this.x + this.w &&
      pcy >= this.y &&
      pcy <= this.y + this.h
    );
  }

  clearListeners() {
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
  }

  onDestroy() {
    this.clearListeners();
  }
}
