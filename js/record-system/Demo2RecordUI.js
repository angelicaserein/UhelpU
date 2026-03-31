// Demo2RecordUI.js - 复古像素硬边风格 RECORD HUD + 操作时间轴
// 核心色系：深紫黑 #2A1433 + 中深紫 #6B4A7A + 浅紫灰 #8A6A99 + 淡紫/极浅紫背景
import { keyCodeToLabel } from "./RecordKeyUtil.js";
import { KeyBindingManager } from "../key-binding-system/KeyBindingManager.js";
import { t } from "../i18n.js";
import { isGamePaused } from "../game-runtime/GamePauseState.js";
import { Assets } from "../AssetsManager.js";

export class Demo2RecordUI {
  // 核心色板（RGB值）
  static COLOR_PALETTE = {
    deepPurpleBlack: { r: 42, g: 20, b: 51 }, // #2A1433
    midPurple: { r: 107, g: 74, b: 122 }, // #6B4A7A
    lightPurpleGray: { r: 138, g: 106, b: 153 }, // #8A6A99
    softPurple: { r: 212, g: 190, b: 224 },
    veryLightPurple: { r: 232, g: 216, b: 240 },

    recordRed: { r: 255, g: 100, b: 150 },
    replayBlue: { r: 120, g: 180, b: 255 },
    standbyPurple: { r: 160, g: 120, b: 180 },

    // 操作颜色
    moveLeftColor: { r: 100, g: 200, b: 255 }, // 蓝色左
    moveRightColor: { r: 122, g: 92, b: 67 }, // 哑光棕右 #7A5C43
    jumpColor: { r: 255, g: 200, b: 100 }, // 橙色跳
  };

  static getRecordUiState(
    p,
    state,
    maxRecordTime,
    recordStartTime,
    recordEndTime,
    replayStartTime,
    paused,
    pausedRecordElapsed,
    pausedReplayElapsed,
  ) {
    const kbm = KeyBindingManager.getInstance();
    const recordKey = keyCodeToLabel(kbm.getKeyByIntent("record"));
    const replayKey = keyCodeToLabel(kbm.getKeyByIntent("replay"));

    const base = {
      title: t("rec_demo2_ready_to_record"),
      subtitle: "",
      stateLabel: t("rec_state_ready"),
      progress: 0,
      timeStr: "0.0s",
      isRecording: false,
      isReplaying: false,
      isPaused: false,
      recordKey,
      replayKey,
    };

    switch (state) {
      case "Recording": {
        const isPausedRecording = paused && pausedRecordElapsed !== null;
        const elapsedMs = isPausedRecording
          ? pausedRecordElapsed
          : Math.max(0, performance.now() - recordStartTime);
        const elapsedSec = (elapsedMs / 1000).toFixed(1);
        return {
          ...base,
          title:
            t("rec_demo2_recording") + " - " + t("rec_demo2_recording_sub"),
          subtitle: "",
          stateLabel: isPausedRecording ? `◼ ${t("rec_state_paused")}` : `● ${t("rec_state_rec")}`,
          progress: Math.min(1, elapsedMs / maxRecordTime),
          timeStr: `${elapsedSec}s`,
          isRecording: true,
          isPaused: isPausedRecording,
          isBlinking: !isPausedRecording,
        };
      }
      case "ReadyToReplay": {
        const recordedMs = recordEndTime - recordStartTime;
        const recordedSec = (recordedMs / 1000).toFixed(1);
        return {
          ...base,
          title: t("rec_demo2_ready_to_replay"),
          subtitle: "",
          stateLabel: `✓ ${t("rec_state_ready")}`,
          progress: 1,
          timeStr: `${recordedSec}s`,
        };
      }
      case "Replaying": {
        const isPausedReplaying = paused && pausedReplayElapsed !== null;
        const totalMs = Math.max(1, recordEndTime - recordStartTime);
        const replayElapsedMs = isPausedReplaying
          ? pausedReplayElapsed
          : Math.min(Math.max(0, performance.now() - replayStartTime), totalMs);
        const replayElapsedSec = (replayElapsedMs / 1000).toFixed(1);
        const totalReplaySec = (totalMs / 1000).toFixed(1);
        return {
          ...base,
          title: t("rec_demo2_replaying"),
          subtitle: "",
          stateLabel: isPausedReplaying ? `◼ ${t("rec_state_paused")}` : `▶ ${t("rec_state_play")}`,
          progress: Math.min(1, replayElapsedMs / totalMs),
          timeStr: `${replayElapsedSec}s/${totalReplaySec}s`,
          isReplaying: true,
          isPaused: isPausedReplaying,
          isBlinking: !isPausedReplaying,
        };
      }
      default:
        return base;
    }
  }

  /**
   * 绘制 RECORD HUD + 操作时间轴
   * @param {object} p - p5实例
   * @param {object} params - 绘制参数
   * @param {string} params.state - 状态
   * @param {number} params.maxRecordTime - 最大录制时长
   * @param {number} params.recordStartTime - 录制开始时间
   * @param {number} params.recordEndTime - 录制结束时间
   * @param {number} params.replayStartTime - 回放开始时间
   * @param {number|null} params.pausedRecordElapsed - 暂停时的录制经过时间
   * @param {number|null} params.pausedReplayElapsed - 暂停时的回放经过时间
   * @param {number} params.airBlockFlashMs - 空中被挡的时间戳
   * @param {object} params.player - 玩家对象
   * @param {array} params.recordedActions - [{ time: ms, action: "moveLeft"|"moveRight"|"jump" }, ...]
   */
  static draw(
    p,
    {
      state,
      maxRecordTime,
      recordStartTime,
      recordEndTime,
      replayStartTime,
      pausedRecordElapsed,
      pausedReplayElapsed,
      airBlockFlashMs,
      player,
      recordedActions = [],
    },
  ) {
    const ui = Demo2RecordUI.getRecordUiState(
      p,
      state,
      maxRecordTime,
      recordStartTime,
      recordEndTime,
      replayStartTime,
      isGamePaused(),
      pausedRecordElapsed,
      pausedReplayElapsed,
    );

    // === 布局尺寸 ===
    const padding = 12;
    const baseHeight = 80; // 上部分：状态 + 按键提示
    const timelineHeight = 50; // 下部分：进度条 + 时间轴 + 操作标记
    const showTimeline =
      state === "Recording" ||
      state === "ReadyToReplay" ||
      state === "Replaying";
    const totalHeight = showTimeline
      ? baseHeight + timelineHeight + padding * 2
      : baseHeight;
    const borderWidth = 2;

    // 空中检测
    const _cc = player?.controllerManager?.currentControlComponent;
    const _isOnGround = _cc?.abilityCondition?.["isOnGround"] ?? true;
    const isAirBlocked =
      (state === "ReadyToRecord" || state === "ReadyToReplay") && !_isOnGround;
    const airBlockAge = performance.now() - airBlockFlashMs;

    p.push();
    p.resetMatrix();
    p.noStroke();
    if (Assets.customFont) {
      p.textFont(Assets.customFont);
    }

    // === 背景 ===
    // 上半部分：紫色背景
    Demo2RecordUI._drawBackground(p, baseHeight);

    // 下半部分：20%白色背景（仅在显示时间轴时）
    if (showTimeline) {
      p.noStroke();
      p.fill(255, 255, 255, 51); // 255 * 0.2 ≈ 51
      p.rect(0, baseHeight, p.width, timelineHeight + padding);
    }

    // === 主容器（双层硬边描边） ===
    Demo2RecordUI._drawContainer(
      p,
      padding,
      padding,
      p.width - padding * 2,
      baseHeight - padding * 2,
      borderWidth,
    );

    // === 内部布局 ===
    const innerX = padding + borderWidth + 2;
    const innerY = padding + borderWidth + 2;
    const innerW = p.width - padding * 2 - (borderWidth + 2) * 2;
    const innerH = baseHeight - padding * 2 - (borderWidth + 2) * 2;

    // 左：状态指示器
    Demo2RecordUI._drawStateIndicator(
      p,
      innerX + 80,
      innerY,
      ui,
      state,
      innerH,
    );

    // 中：按键提示（往右边挪动更多）
    const hintAreaX = innerX + 880;
    const hintAreaW = innerW - 730 - 100;
    Demo2RecordUI._drawActionHints(
      p,
      hintAreaX,
      innerY,
      hintAreaW,
      innerH,
      ui,
      state,
    );

    // === 操作时间轴（录制/准备回放/回放时都显示） ===
    if (showTimeline) {
      const timelineContainerX = padding;
      const timelineContainerY = baseHeight + padding;
      const timelineContainerW = p.width - padding * 2;
      const timelineContainerH = timelineHeight;

      // 先绘制进度条（上方）
      const progressH = 10;
      const progressX = timelineContainerX + borderWidth + 2;
      const progressY = timelineContainerY + borderWidth + 2;
      const progressW = timelineContainerW - (borderWidth + 2) * 2 - 150;

      // 计算时间轴y坐标
      const timelineY = progressY + progressH + 4;

      Demo2RecordUI._drawProgressBar(
        p,
        progressX,
        progressY,
        progressW,
        progressH,
        ui,
        state,
        recordStartTime,
        recordEndTime,
        replayStartTime,
        maxRecordTime,
        timelineY,
        isGamePaused(),
        pausedRecordElapsed,
        pausedReplayElapsed,
      );

      // 绘制操作时间轴（下方）
      const timelineX = progressX;
      const timelineW = progressW;
      const timelineH =
        timelineContainerH - (borderWidth + 2) * 2 - progressH - 4 - 14;

      Demo2RecordUI._drawActionTimeline(
        p,
        timelineX,
        timelineY,
        timelineW,
        timelineH,
        ui,
        recordedActions,
        recordStartTime,
        recordEndTime,
        replayStartTime,
        maxRecordTime,
        state,
        isGamePaused(),
        pausedRecordElapsed,
      );
    }

    // === 空中被挡住警告 ===
    if (isAirBlocked) {
      Demo2RecordUI._drawAirBlockWarning(p, baseHeight, airBlockAge);
    }

    p.pop();
  }

  // ========== 绘制辅助函数 ==========

  static _drawBackground(p, totalHeight) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    // 纯色背景：深紫黑，透明度85%
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 217); // 255 * 0.85 ≈ 217
    p.rect(0, 0, p.width, totalHeight);

    // 顶部亮线
    p.fill(255, 255, 255, 80);
    p.rect(0, 0, p.width, 2);
  }

  static _drawContainer(p, x, y, w, h, bw) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    // 细紫色边框
    p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b, 200);
    p.strokeWeight(1);
    p.noFill();
    p.rect(x, y, w, h);
  }

  static _drawStateIndicator(p, x, y, ui, state, h) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    // === 铭文风格的幻影系统标签 ===
    const labelX = x - 90;
    const labelY = y + h / 2;

    // 幻影系统标签文本（铭文风格：金色、斜体、大号）
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.textStyle(p.ITALIC);

    // 发光效果（外光晕）
    p.fill(240, 215, 235, 50);
    p.text(t("rec_system_name"), labelX + 45 + 1, labelY + 1);

    // 投影效果
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 160);
    p.text(t("rec_system_name"), labelX + 45 + 0.5, labelY + 0.5);

    // 淡粉色主文本（铭文风格）
    p.fill(240, 215, 235, 240);
    p.text(t("rec_system_name"), labelX + 45, labelY);

    // 标题文字（右侧）
    const titleX = x + 45;
    const titleY = labelY;

    // 标题（更大的字体，白色）
    p.textSize(28);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.CENTER);
    p.fill(255, 255, 255, 220);
    p.text(ui.title, titleX + 1, titleY + 1);
    p.fill(255, 255, 255);
    p.text(ui.title, titleX, titleY);
  }

  static _drawActionHints(p, x, y, w, h, ui, state) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    let hints = [];
    if (state === "Recording") {
      hints = [{ key: ui.recordKey, desc: t("rec_press_to_stop").replace("{KEY}", ui.recordKey) }];
    } else if (state === "ReadyToRecord") {
      hints = [{ key: ui.recordKey, desc: t("rec_press_to_start").replace("{KEY}", ui.recordKey) }];
    } else if (state === "ReadyToReplay") {
      hints = [
        { key: ui.replayKey, desc: t("rec_press_to_replay").replace("{KEY}", ui.replayKey) },
        { key: ui.recordKey, desc: t("rec_press_to_rerecord").replace("{KEY}", ui.recordKey) },
      ];
    } else if (state === "Replaying") {
      hints = [{ key: ui.replayKey, desc: t("rec_press_to_exit").replace("{KEY}", ui.replayKey) }];
    }

    // 绘制每个操作提示
    let startY = y + 6;
    const hintSpacing = h / Math.max(1, hints.length);

    hints.forEach((hint, idx) => {
      const hintY = startY + idx * hintSpacing;

      // 按键框（硬边，像素风，更大）
      const keyBoxW = 42;
      const keyBoxH = 16;

      p.fill(C.softPurple.r, C.softPurple.g, C.softPurple.b, 180);
      p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b);
      p.strokeWeight(1);
      p.rect(x, hintY, keyBoxW, keyBoxH);

      // 按键文字
      p.noStroke();
      p.textSize(12);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);

      p.fill(255, 255, 255);
      p.text(hint.key, x + keyBoxW / 2, hintY + keyBoxH / 2);

      // 操作说明（右侧）
      p.textSize(18);
      p.textStyle(p.NORMAL);
      p.textAlign(p.LEFT, p.CENTER);

      p.fill(255, 255, 255);
      p.text(hint.desc, x + keyBoxW + 6, hintY + keyBoxH / 2);
    });
  }

  /**
   * 绘制操作颜色图例（左、右、跳） - KeyPrompt 样式
   */
  static _drawOperationLegend(p, x, y, w, h) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    const legends = [
      { icon: "←", label: t("rec_op_left"), color: C.moveLeftColor },
      { icon: "→", label: t("rec_op_right"), color: C.moveRightColor },
      { icon: "↑", label: t("rec_op_jump"), color: C.jumpColor },
    ];

    // 竖向排列
    const itemH = h / legends.length;
    const startX = x + 8;
    const keySize = 28; // KeyPrompt 大小

    legends.forEach((leg, idx) => {
      const itemY = y + idx * itemH + itemH / 2;

      // 镂空方形框（KeyPrompt 风格）
      p.push();
      p.stroke(255, 255, 255, 255);
      p.strokeWeight(2);
      p.noFill();
      p.rect(startX - keySize / 2, itemY - keySize / 2, keySize, keySize, 2);
      p.pop();

      // 图标
      p.noStroke();
      p.fill(255, 255, 255);
      p.textSize(13);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(leg.icon, startX + 5, itemY);

      // 标签
      p.textSize(10);
      p.textStyle(p.NORMAL);
      p.textAlign(p.LEFT, p.CENTER);
      p.fill(255, 255, 255);
      p.text(leg.label, startX + 20, itemY);
    });
  }

  /**
   * 绘制进度条
   */
  static _drawProgressBar(
    p,
    x,
    y,
    w,
    h,
    ui,
    state,
    recordStartTime,
    recordEndTime,
    replayStartTime,
    maxRecordTime,
    timelineY,
    isPaused,
    pausedRecordElapsed,
    pausedReplayElapsed,
  ) {
    const C = Demo2RecordUI.COLOR_PALETTE;
    const now = performance.now();

    // 重置所有文本状态
    p.noStroke();
    p.textStyle(p.NORMAL);
    p.fill(255, 255, 255);

    // 计算进度 - 考虑暂停状态
    let currentProgress = 0;
    if (state === "Recording") {
      const isPausedRecording = isPaused && pausedRecordElapsed !== null;
      const recordedMs = isPausedRecording
        ? pausedRecordElapsed
        : Math.max(0, now - recordStartTime);
      currentProgress = Math.min(1, recordedMs / maxRecordTime);
    } else if (state === "ReadyToReplay") {
      currentProgress = 1;
    } else if (state === "Replaying") {
      const isPausedReplaying = isPaused && pausedReplayElapsed !== null;
      const totalMs = Math.max(1, recordEndTime - recordStartTime);
      const replayElapsedMs = isPausedReplaying
        ? pausedReplayElapsed
        : Math.min(Math.max(0, now - replayStartTime), totalMs);
      currentProgress = Math.min(1, replayElapsedMs / totalMs);
    }

    // 进度条轨道
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 120);
    p.stroke(255, 255, 255, 255);
    p.strokeWeight(1.5);
    p.rect(x, y, w, h);

    // 进度条填充
    const fillW = w * currentProgress;
    if (fillW > 1) {
      let fillColor = C.standbyPurple;
      if (state === "Recording") fillColor = C.recordRed;
      else if (state === "Replaying") fillColor = C.replayBlue;

      p.fill(fillColor.r, fillColor.g, fillColor.b, 220);
      p.stroke(fillColor.r, fillColor.g, fillColor.b, 255);
      p.strokeWeight(0.5);
      p.rect(x, y, fillW, h);

      // 亮光条
      for (let i = 0; i < fillW; i += 5) {
        const lightAlpha = 80 * (1 - i / fillW);
        p.fill(255, 255, 255, lightAlpha);
        p.rect(x + i, y, 2, h);
      }
    }

    // 进度指示线
    if (state !== "ReadyToReplay") {
      const progressX = x + w * currentProgress;
      p.stroke(255, 255, 255, 255);
      p.strokeWeight(2);
      p.line(progressX, y - 2, progressX, y + h + 2);
    }

    // 时间显示（放在进度条上方）- 清晰无加粗 - 考虑暂停状态
    let timeStr = "";
    const maxSec = (maxRecordTime / 1000).toFixed(1);

    if (state === "Recording") {
      const isPausedRecording = isPaused && pausedRecordElapsed !== null;
      const recordedMs = isPausedRecording
        ? pausedRecordElapsed
        : Math.max(0, now - recordStartTime);
      const currentSec = (recordedMs / 1000).toFixed(1);
      timeStr = `${currentSec}s/${maxSec}s`;
    } else if (state === "ReadyToReplay") {
      const recordedMs = recordEndTime - recordStartTime;
      const recordedSec = (recordedMs / 1000).toFixed(1);
      timeStr = `${recordedSec}s/${maxSec}s`;
    } else if (state === "Replaying") {
      const recordedMs = recordEndTime - recordStartTime;
      const recordedSec = (recordedMs / 1000).toFixed(1);
      timeStr = `${recordedSec}s/${maxSec}s`;
    }

    // 完全清晰：单一渲染，无任何效果 - 与时间轴平齐
    p.noStroke();
    p.textSize(22);
    p.textStyle(p.NORMAL);
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(255, 255, 255);
    p.text(timeStr, x + w + 130, timelineY - 10); //每个参数的含义分别是：文本内容、文本的x坐标、文本的y坐标
  }

  /**
   * 绘制操作时间轴
   * 展示录制过程中的移动/跳跃操作时间点
   */
  static _drawActionTimeline(
    p,
    x,
    y,
    w,
    h,
    ui,
    recordedActions,
    recordStartTime,
    recordEndTime,
    replayStartTime,
    maxRecordTime,
    state,
    isPaused,
    pausedRecordElapsed,
  ) {
    const C = Demo2RecordUI.COLOR_PALETTE;
    const now = performance.now();

    // 计算总时长
    let totalMs = maxRecordTime;
    if (state === "ReadyToReplay" || state === "Replaying") {
      totalMs = Math.max(1, recordEndTime - recordStartTime);
    }
    const tickCount = 5;
    p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b, 100);
    p.strokeWeight(1);
    for (let i = 0; i <= tickCount; i++) {
      const tickX = x + (w / tickCount) * i;
      p.line(tickX, y + 2, tickX, y + 6);
    }

    // 绘制操作标记 - 暂停时使用暂停时间
    const isPausedRecording = isPaused && pausedRecordElapsed !== null;
    const recordedMs = isPausedRecording
      ? pausedRecordElapsed
      : Math.max(0, now - recordStartTime);

    recordedActions.forEach((action) => {
      // 根据操作时间映射到进度条位置
      const actionProgress = action.time / totalMs;
      const actionX = x + w * actionProgress;

      // 检查是否在可见范围内
      const isVisible = actionX >= x && actionX <= x + w;
      const isRecorded =
        state === "Recording" ? action.time <= recordedMs : true;

      if (isVisible && isRecorded) {
        let actionColor = C.moveLeftColor;
        let icon = "←";

        if (action.action === "moveRight") {
          actionColor = C.moveRightColor;
          icon = "→";
        } else if (action.action === "jump") {
          actionColor = C.jumpColor;
          icon = "↑";
        }

        // 操作标记 - KeyPrompt 风格镂空方形框
        const keySize = 22;
        p.push();
        p.stroke(255, 255, 255, 255);
        p.strokeWeight(2);
        p.noFill();
        p.rect(actionX - keySize / 2, y + 14 - keySize / 2, keySize, keySize, 2);
        p.pop();

        // 操作图标
        p.noStroke();
        p.fill(255, 255, 255);
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(icon, actionX, y + 14);
      }
    });
  }

  static _drawAirBlockWarning(p, hudHeight, airBlockAge) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    // 半透明覆盖
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 200);
    p.rect(0, 0, p.width, hudHeight);

    // 警告文字（大号）
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.CENTER);

    p.fill(C.recordRed.r, C.recordRed.g, C.recordRed.b, 200);
    p.text(t("rec_blocked_air"), p.width / 2 + 1, hudHeight / 2 + 1);

    p.fill(255, 255, 255);
    p.text(t("rec_blocked_air"), p.width / 2, hudHeight / 2);

    // 闪烁
    if (airBlockAge < 300) {
      const flashAlpha = (1 - airBlockAge / 300) * 80;
      p.fill(C.recordRed.r, C.recordRed.g, C.recordRed.b, flashAlpha);
      p.rect(0, 0, p.width, hudHeight);
    }
  }
}
