import { GameEntity } from "../base/GameEntity.js";
import { RectangleCollider } from "../../collision-system/CollideComponent.js";
import { ColliderType } from "../../collision-system/enumerator.js";
import { EventTypes } from "../../event-system/EventTypes.js";
import { Assets } from "../../AssetsManager.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";
import { keyCodeToLabel } from "../../record-system/RecordKeyUtil.js";
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
    this.dialogueLines = options.dialogueLines || [
      "npc_default_line1",
      "npc_default_line2",
    ];
    this._exhaustedLine =
      options.exhaustedLine !== undefined
        ? options.exhaustedLine
        : "npc_default_exhausted";
    this._maxDialogueCount =
      options.maxDialogueCount !== undefined ? options.maxDialogueCount : 1;
    this._dialogueCompletedCount = 0;
    this._imageKey = options.imageKey || null;
    this._color = options.color || [100, 200, 255];
    this._dialogueScale = options.dialogueScale || 1;
    this.zIndex = 5; // NPC 在交互物上层、玩家下层

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

    // 进入范围时显示白色描边效果（与 SignboardDemo2 一致）
    if (this._inRange) {
      p.push();
      p.strokeWeight(3);
      p.stroke(255, 255, 255, 200);
      p.noFill();
      p.rect(this.x, this.y, this.w, this.h);
      p.pop();
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
   * 绘制对话气泡
   */
  _drawDialogueBubble(p) {
    const s = this._dialogueScale;
    const lineKey = this._useExhaustedLine
      ? this._exhaustedLine
      : this.dialogueLines[this._dialogueIndex] || "";
    const line = t(lineKey);
    const bubbleW = 300 * s;
    const bubbleH = 100 * s;
    const bubbleX = this.x + this.w / 2 - bubbleW / 2;
    const bubbleY = this.y + this.h + 50 * s;

    p.push();
    // 气泡背景
    p.fill(80, 160, 255, 150);
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(2 * s);
    p.rect(bubbleX, bubbleY, bubbleW, bubbleH, 6 * s);

    // 气泡文字（补偿 y 轴翻转）
    p.translate(bubbleX + bubbleW / 2, bubbleY + bubbleH / 2);
    p.scale(1, -1);
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20 * s);
    if (Assets.customFont) {
      p.textFont(Assets.customFont);
    }
    p.text(
      line,
      -(bubbleW - 16 * s) / 2,
      -(bubbleH - 12 * s) / 2,
      bubbleW - 16 * s,
      bubbleH - 12 * s,
    );
    this._drawDialogueRainbowOverlay(
      p,
      lineKey,
      line,
      -(bubbleW - 16 * s) / 2,
      -(bubbleH - 12 * s) / 2,
      bubbleW - 16 * s,
      bubbleH - 12 * s,
    );
    p.pop();

    // Continue hint
    if (
      !this._useExhaustedLine &&
      this._dialogueIndex < this.dialogueLines.length - 1
    ) {
      const interactKey = keyCodeToLabel(
        this._keyBindingManager.getKeyByIntent("interaction")
      );
      const hintText = t("npc_continue_hint").replace("{KEY}", interactKey);
      p.push();
      p.translate(bubbleX + bubbleW - 8 * s, bubbleY + 16 * s);
      p.scale(1, -1);
      p.fill(255, 255, 255, 200);
      p.noStroke();
      p.textAlign(p.RIGHT, p.TOP);
      p.textSize(9 * s);
      p.text(hintText, 0, 0);
      p.pop();
    }
  }

  _drawDialogueRainbowOverlay(p, lineKey, line, x, y, width, height) {
    const overlaySpec = this._getDialogueRainbowOverlaySpec(lineKey);
    if (!overlaySpec) return;

    const textLines = String(line).split("\n");
    const targetLine = textLines[overlaySpec.lineIndex] || "";
    const overlayIndex = this._findOverlayStartIndex(targetLine, overlaySpec);
    if (overlayIndex < 0) return;

    const lineHeight = p.textLeading() || p.textSize() * 1.2;
    const totalHeight = textLines.length * lineHeight;
    const targetY =
      y +
      height / 2 -
      totalHeight / 2 +
      lineHeight / 2 +
      overlaySpec.lineIndex * lineHeight -
      10;

    const lineWidth = p.textWidth(targetLine);
    const lineStartX = x + (width - lineWidth) / 2;
    const overlayX =
      lineStartX + p.textWidth(targetLine.slice(0, overlayIndex)) + 28;

    this._drawSplitRainbowWaveText(p, overlaySpec, overlayX, targetY);
  }

  _getDialogueRainbowOverlaySpec(lineKey) {
    if (lineKey !== "d2_npc_level1_line1") return null;

    return {
      text: "U help U",
      parts: ["U", "help", "U"],
      gapWidths: [15, 13],
      lineIndex: 0,
      prefixes: ["Welcome to ", "嘿，欢迎来到 "],
    };
  }

  _findOverlayStartIndex(targetLine, overlaySpec) {
    const directIndex = targetLine.indexOf(overlaySpec.text);
    if (directIndex >= 0) return directIndex;

    for (const prefix of overlaySpec.prefixes) {
      const prefixIndex = targetLine.indexOf(prefix);
      if (prefixIndex >= 0) {
        return prefixIndex + prefix.length;
      }
    }

    return -1;
  }

  _drawRainbowWaveText(p, text, startX, baselineY) {
    // 与成就页面 .rainbow-wave CSS 动画保持一致：
    // - rainbow-color 3s linear infinite：所有字符同时共享同一颜色
    // - wave 2.4s ease-in-out infinite：振幅 2px，每个字符延迟 0.15s
    const waveAmplitude = 2;
    const wavePeriodMs = 2400;
    const colorPeriodMs = 3000;
    const charDelayMs = 150;

    // CSS rainbow-color 关键帧颜色停靠点
    const colorStops = [
      [0.00, [255, 78,  80 ]],  // #ff4e50
      [0.16, [255, 159, 67 ]],  // #ff9f43
      [0.33, [254, 202, 87 ]],  // #feca57
      [0.50, [72,  219, 251]],  // #48dbfb
      [0.66, [162, 155, 254]],  // #a29bfe
      [0.83, [253, 121, 168]],  // #fd79a8
      [1.00, [255, 78,  80 ]],  // #ff4e50（回到起点）
    ];

    const timeMs = p.millis();
    const colorT = (timeMs % colorPeriodMs) / colorPeriodMs;
    let cr, cg, cb;
    for (let j = 0; j < colorStops.length - 1; j++) {
      const [t0, c0] = colorStops[j];
      const [t1, c1] = colorStops[j + 1];
      if (colorT >= t0 && colorT < t1) {
        const f = (colorT - t0) / (t1 - t0);
        cr = c0[0] + (c1[0] - c0[0]) * f;
        cg = c0[1] + (c1[1] - c0[1]) * f;
        cb = c0[2] + (c1[2] - c0[2]) * f;
        break;
      }
    }
    if (cr === undefined) [cr, cg, cb] = colorStops[colorStops.length - 1][1];

    let currentX = startX;
    p.push();
    p.colorMode(p.RGB, 255);
    p.noStroke();

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // wave：每个字符延迟 charDelayMs，形状对应 CSS 0%→50%(-2px)→100% 的半弧
      const rawPhase = (timeMs - i * charDelayMs) / wavePeriodMs;
      const wavePhase = ((rawPhase % 1) + 1) % 1;
      const charY = baselineY - waveAmplitude * Math.sin(Math.PI * wavePhase);

      p.fill(cr, cg, cb);
      p.text(char, currentX, charY);
      currentX += p.textWidth(char);
    }

    p.pop();
  }

  _drawSplitRainbowWaveText(p, overlaySpec, startX, baselineY) {
    const parts = overlaySpec.parts || [overlaySpec.text || ""];
    const gapWidths = overlaySpec.gapWidths || [];
    let currentX = startX;

    for (let i = 0; i < parts.length; i++) {
      this._drawRainbowWaveText(p, parts[i], currentX, baselineY);
      currentX += p.textWidth(parts[i]);

      if (i < gapWidths.length) {
        currentX += gapWidths[i];
      }
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
