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
    deepPurpleBlack: { r: 42, g: 20, b: 51 },      // #2A1433
    midPurple: { r: 107, g: 74, b: 122 },          // #6B4A7A
    lightPurpleGray: { r: 138, g: 106, b: 153 },   // #8A6A99
    softPurple: { r: 212, g: 190, b: 224 },
    veryLightPurple: { r: 232, g: 216, b: 240 },

    recordRed: { r: 255, g: 100, b: 150 },
    replayBlue: { r: 120, g: 180, b: 255 },
    standbyPurple: { r: 160, g: 120, b: 180 },

    // 操作颜色
    moveLeftColor: { r: 100, g: 200, b: 255 },     // 蓝色左
    moveRightColor: { r: 100, g: 200, b: 255 },    // 蓝色右
    jumpColor: { r: 255, g: 200, b: 100 },         // 橙色跳
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
      stateLabel: "STANDBY",
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
          title: t("rec_demo2_recording"),
          subtitle: t("rec_demo2_recording_sub"),
          stateLabel: isPausedRecording ? "◼ PAUSED" : "● REC",
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
          stateLabel: "✓ READY",
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
          stateLabel: isPausedReplaying ? "◼ PAUSED" : "▶ PLAY",
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
    const baseHeight = 100;
    const timelineHeight = 26; // 操作时间轴高度（包含图例）
    const totalHeight = state === "Recording" ? baseHeight + timelineHeight + padding * 2 : baseHeight;
    const padding = 12;
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
    Demo2RecordUI._drawBackground(p, totalHeight);

    // === 主容器（双层硬边描边） ===
    Demo2RecordUI._drawContainer(
      p,
      padding,
      padding,
      p.width - padding * 2,
      baseHeight - padding * 2,
      borderWidth
    );

    // === 内部布局 ===
    const innerX = padding + borderWidth + 2;
    const innerY = padding + borderWidth + 2;
    const innerW = p.width - padding * 2 - (borderWidth + 2) * 2;
    const innerH = baseHeight - padding * 2 - (borderWidth + 2) * 2;

    // 左：状态指示器
    Demo2RecordUI._drawStateIndicator(p, innerX, innerY, ui, state, innerH);

    // 中：进度条区域
    const progressAreaX = innerX + 100;
    const progressAreaW = innerW - 100 - 180;
    Demo2RecordUI._drawProgressArea(p, progressAreaX, innerY, progressAreaW, innerH, ui);

    // 右：操作提示
    Demo2RecordUI._drawActionHints(
      p,
      innerX + innerW - 170,
      innerY,
      170,
      innerH,
      ui,
      state
    );

    // === 操作时间轴（仅在录制时显示） ===
    if (state === "Recording") {
      const timelineContainerX = padding;
      const timelineContainerY = baseHeight + padding;
      const timelineContainerW = p.width - padding * 2;
      const timelineContainerH = timelineHeight;

      // 时间轴背景容器
      Demo2RecordUI._drawContainer(
        p,
        timelineContainerX,
        timelineContainerY,
        timelineContainerW,
        timelineContainerH,
        borderWidth
      );

      // 绘制操作时间轴
      const timelineX = timelineContainerX + borderWidth + 2;
      const timelineY = timelineContainerY + borderWidth + 2;
      const timelineW = timelineContainerW - (borderWidth + 2) * 2;
      const timelineH = timelineContainerH - (borderWidth + 2) * 2 - 14; // 留出图例空间

      Demo2RecordUI._drawActionTimeline(
        p,
        timelineX,
        timelineY,
        timelineW,
        timelineH,
        ui,
        recordedActions,
        recordStartTime,
        maxRecordTime
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

    // 纵向渐变背景：极浅紫 → 淡紫
    for (let i = 0; i < totalHeight; i++) {
      const ratio = i / totalHeight;
      const r = Math.round(
        C.veryLightPurple.r * (1 - ratio * 0.3) + C.softPurple.r * ratio * 0.3
      );
      const g = Math.round(
        C.veryLightPurple.g * (1 - ratio * 0.3) + C.softPurple.g * ratio * 0.3
      );
      const b = Math.round(
        C.veryLightPurple.b * (1 - ratio * 0.3) + C.softPurple.b * ratio * 0.3
      );
      p.fill(r, g, b, 255);
      p.rect(0, i, p.width, 1);
    }

    // 雾化光斑：3个径向渐变
    const spots = [
      { x: p.width * 0.15, y: 50, size: 140, alpha: 30 },
      { x: p.width * 0.85, y: 40, size: 120, alpha: 25 },
      { x: p.width * 0.5, y: 10, size: 100, alpha: 20 },
    ];

    spots.forEach(spot => {
      for (let i = spot.size; i > 0; i--) {
        const alpha = (1 - i / spot.size) * spot.alpha;
        p.fill(C.lightPurpleGray.r, C.lightPurpleGray.g, C.lightPurpleGray.b, alpha);
        p.circle(spot.x, spot.y, i);
      }
    });

    // 顶部亮线
    p.fill(255, 255, 255, 50);
    p.rect(0, 0, p.width, 1);
  }

  static _drawContainer(p, x, y, w, h, bw) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    // 外边框（中深紫）
    p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b);
    p.strokeWeight(bw);
    p.noFill();
    p.rect(x, y, w, h);

    // 内高光（上和左）
    p.stroke(C.lightPurpleGray.r, C.lightPurpleGray.g, C.lightPurpleGray.b, 180);
    p.strokeWeight(1);
    p.line(x + bw, y + bw, x + w - bw, y + bw);
    p.line(x + bw, y + bw, x + bw, y + h - bw);

    // 内阴影（下和右）
    p.stroke(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 120);
    p.line(x + bw, y + h - bw, x + w - bw, y + h - bw);
    p.line(x + w - bw, y + bw, x + w - bw, y + h - bw);
  }

  static _drawStateIndicator(p, x, y, ui, state, h) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    // 选择状态颜色
    let stateColor = C.standbyPurple;
    if (state === "Recording") stateColor = C.recordRed;
    else if (state === "Replaying") stateColor = C.replayBlue;
    else if (state === "ReadyToReplay") stateColor = C.standbyPurple;

    // 状态徽章（圆形）
    const badgeX = x + 20;
    const badgeY = y + h / 2;
    const badgeR = 16;

    // 徽章外光晕
    if (ui.isRecording && ui.isBlinking) {
      p.fill(stateColor.r, stateColor.g, stateColor.b, 40);
      p.circle(badgeX, badgeY, badgeR * 2.5);
    }

    // 徽章圆圈（硬边）
    p.fill(stateColor.r, stateColor.g, stateColor.b, 220);
    p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b);
    p.strokeWeight(1.5);
    p.circle(badgeX, badgeY, badgeR);

    // 徽章状态标签（大号字）
    p.noStroke();
    p.fill(255, 255, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.textStyle(p.BOLD);

    // 投影
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 160);
    p.text(ui.stateLabel.charAt(0), badgeX + 0.5, badgeY + 0.5);

    // 主色
    p.fill(255, 255, 255);
    p.text(ui.stateLabel.charAt(0), badgeX, badgeY);

    // 标题文字（右侧）
    const titleX = x + 60;
    const titleY = y + 8;

    // 标题（大号）
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.TOP);
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 180);
    p.text(ui.title, titleX + 1, titleY + 1);
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b);
    p.text(ui.title, titleX, titleY);

    // 副标题（如有）
    if (ui.subtitle) {
      p.textSize(10);
      p.textStyle(p.NORMAL);
      p.fill(C.midPurple.r, C.midPurple.g, C.midPurple.b, 180);
      p.text(ui.subtitle.substring(0, 25), titleX, titleY + 20);
    }
  }

  static _drawProgressArea(p, x, y, w, h, ui) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    // 进度条（大而清晰）
    const progH = 14;
    const progX = x;
    const progY = y + h / 2 - progH / 2;

    // 背景轨道
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 80);
    p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b);
    p.strokeWeight(1);
    p.rect(progX, progY, w, progH);

    // 进度条填充
    const fillW = w * ui.progress;
    if (fillW > 1) {
      let fillColor = C.standbyPurple;
      if (ui.isRecording) fillColor = C.recordRed;
      else if (ui.isReplaying) fillColor = C.replayBlue;

      // 填充
      p.fill(fillColor.r, fillColor.g, fillColor.b, 200);
      p.stroke(fillColor.r, fillColor.g, fillColor.b, 255);
      p.strokeWeight(0.5);
      p.rect(progX, progY, fillW, progH);

      // 亮光条（梯度）
      for (let i = 0; i < fillW; i += 4) {
        const lightAlpha = 50 * (1 - i / fillW);
        p.fill(255, 255, 255, lightAlpha);
        p.rect(progX + i, progY, 2, progH);
      }
    }

    // 时间显示（中央下方，超大号）
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.TOP);

    // 投影
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 180);
    p.text(ui.timeStr, x + w / 2 + 1, progY + progH + 4);

    // 主色
    p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b);
    p.text(ui.timeStr, x + w / 2, progY + progH + 2);
  }

  static _drawActionHints(p, x, y, w, h, ui, state) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    let hints = [];
    if (state === "Recording") {
      hints = [
        { key: ui.recordKey, desc: t("rec_demo2_press_record_to_stop") },
      ];
    } else if (state === "ReadyToRecord") {
      hints = [
        { key: ui.recordKey, desc: t("rec_demo2_press_record_to_start") },
      ];
    } else if (state === "ReadyToReplay") {
      hints = [
        { key: ui.replayKey, desc: t("rec_demo2_press_replay_to_start") },
        { key: ui.recordKey, desc: t("rec_demo2_press_record_to_rerecord") },
      ];
    } else if (state === "Replaying") {
      hints = [
        { key: ui.replayKey, desc: t("rec_demo2_press_replay_to_exit") },
      ];
    }

    // 绘制每个操作提示
    let startY = y + 8;
    const hintSpacing = h / Math.max(1, hints.length);

    hints.forEach((hint, idx) => {
      const hintY = startY + idx * hintSpacing;

      // 按键框（硬边，像素风）
      const keyBoxW = 42;
      const keyBoxH = 16;

      p.fill(C.softPurple.r, C.softPurple.g, C.softPurple.b, 180);
      p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b);
      p.strokeWeight(1.5);
      p.rect(x, hintY, keyBoxW, keyBoxH);

      // 内高光
      p.stroke(C.lightPurpleGray.r, C.lightPurpleGray.g, C.lightPurpleGray.b, 160);
      p.strokeWeight(0.5);
      p.line(x + 1.5, hintY + 1.5, x + keyBoxW - 1.5, hintY + 1.5);
      p.line(x + 1.5, hintY + 1.5, x + 1.5, hintY + keyBoxH - 1.5);

      // 按键文字（大号）
      p.noStroke();
      p.textSize(11);
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);

      p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 180);
      p.text(hint.key, x + keyBoxW / 2 + 0.5, hintY + keyBoxH / 2 + 0.5);

      p.fill(255, 255, 255);
      p.text(hint.key, x + keyBoxW / 2, hintY + keyBoxH / 2);

      // 操作说明（右侧，清晰）
      const descText = hint.desc.replace("{KEY}", "").trim();
      p.textSize(9);
      p.textStyle(p.NORMAL);
      p.textAlign(p.LEFT, p.CENTER);

      p.fill(C.deepPurpleBlack.r, C.deepPurpleBlack.g, C.deepPurpleBlack.b, 160);
      p.text(descText, x + keyBoxW + 8, hintY + keyBoxH / 2 + 0.5);

      p.fill(C.midPurple.r, C.midPurple.g, C.midPurple.b);
      p.text(descText, x + keyBoxW + 8, hintY + keyBoxH / 2);
    });
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
    maxRecordTime
  ) {
    const C = Demo2RecordUI.COLOR_PALETTE;

    // 时间轴背景（半透明）
    p.fill(C.softPurple.r, C.softPurple.g, C.softPurple.b, 120);
    p.rect(x, y, w, h);

    // 时间轴刻度线和标签
    const tickCount = 5;
    p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b, 100);
    p.strokeWeight(1);
    for (let i = 0; i <= tickCount; i++) {
      const tickX = x + (w / tickCount) * i;
      p.line(tickX, y + 2, tickX, y + 6);
    }

    // 绘制操作标记
    const now = performance.now();
    const recordedMs = now - recordStartTime;

    recordedActions.forEach(action => {
      // 根据操作时间映射到进度条位置
      const actionProgress = action.time / maxRecordTime;
      const actionX = x + w * actionProgress;

      // 检查是否在可见范围内（仅显示已录制的部分）
      if (action.time <= recordedMs && actionX >= x && actionX <= x + w) {
        let actionColor = C.moveLeftColor;
        let icon = "←";

        if (action.action === "moveRight") {
          actionColor = C.moveRightColor;
          icon = "→";
        } else if (action.action === "jump") {
          actionColor = C.jumpColor;
          icon = "↑";
        }

        // 操作标记圆圈
        p.fill(actionColor.r, actionColor.g, actionColor.b, 200);
        p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b);
        p.strokeWeight(1);
        const iconR = 4;
        p.circle(actionX, y + 14, iconR * 2);

        // 操作图标
        p.noStroke();
        p.fill(255, 255, 255);
        p.textSize(9);
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(icon, actionX, y + 14);
      }
    });

    // 时间轴标签（左右）
    p.textSize(8);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.fill(C.midPurple.r, C.midPurple.g, C.midPurple.b, 180);
    p.text("0s", x + 2, y + h - 2);

    p.textAlign(p.RIGHT, p.BOTTOM);
    const maxSec = (maxRecordTime / 1000).toFixed(1);
    p.text(`${maxSec}s`, x + w - 2, y + h - 2);

    // 图例（操作颜色说明）
    const legendStartY = y + h + 2;
    const legendX = x;
    const legendItemW = 45;

    const legends = [
      { icon: "←", label: "Left", color: C.moveLeftColor },
      { icon: "→", label: "Right", color: C.moveRightColor },
      { icon: "↑", label: "Jump", color: C.jumpColor },
    ];

    legends.forEach((leg, idx) => {
      const legX = legendX + idx * (legendItemW + 4);

      // 彩色圆点
      p.fill(leg.color.r, leg.color.g, leg.color.b, 180);
      p.stroke(C.midPurple.r, C.midPurple.g, C.midPurple.b);
      p.strokeWeight(0.5);
      p.circle(legX + 4, legendStartY + 4, 3);

      // 标签
      p.noStroke();
      p.fill(C.midPurple.r, C.midPurple.g, C.midPurple.b);
      p.textSize(7);
      p.textStyle(p.NORMAL);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(leg.label, legX + 10, legendStartY + 4);
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
