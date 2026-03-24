// RecordUI.js
// 负责录制系统的 UI 状态生成和渲染
import { keyCodeToLabel } from "./RecordKeyUtil.js";
import { KeyBindingManager } from "../key-binding-system/KeyBindingManager.js";
import { t } from "../i18n.js";
import { isGamePaused } from "../game-runtime/GamePauseState.js";
import { Assets } from "../AssetsManager.js";

export class RecordUI {
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
    const maxSec = (maxRecordTime / 1000).toFixed(1);
    // Steampunk dark-purple chrome shared by all states
    const chrome = {
      frameLight: p.color(68, 38, 100),
      frameDark: p.color(12, 6, 24),
      panelFill: p.color(34, 18, 58),
      panelShade: p.color(22, 11, 40),
      textMain: p.color(218, 198, 238),
      textSub: p.color(148, 122, 175),
    };
    const base = {
      ...chrome,
      title: t("rec_title_standby"),
      subtitle: `${t("rec_sub_max").replace("{KEY}", recordKey)} ${maxSec}s`,
      badge: "STANDBY",
      accentA: p.color(72, 48, 105),
      accentB: p.color(44, 26, 70),
      dotColor: p.color(100, 72, 138),
      progress: 0,
      showBlinkDot: false,
      pulse: 0,
      hudLabel: t("rec_hud_label"),
      airBlockText: t("rec_blocked_air"),
    };
    switch (state) {
      case "Recording": {
        const elapsedMs =
          paused && pausedRecordElapsed !== null
            ? pausedRecordElapsed
            : Math.max(0, performance.now() - recordStartTime);
        const elapsedSec = (elapsedMs / 1000).toFixed(1);
        return {
          ...chrome,
          title: t("rec_title_recording"),
          subtitle: `${t("rec_sub_press_e_end").replace("{KEY}", recordKey)}  ${elapsedSec}s / ${maxSec}s`,
          badge: "REC",
          accentA: p.color(175, 38, 88),
          accentB: p.color(105, 18, 50),
          panelFill: p.color(42, 16, 55),
          panelShade: p.color(28, 10, 40),
          dotColor: p.color(240, 65, 115),
          textMain: p.color(240, 215, 235),
          textSub: p.color(195, 148, 175),
          progress: Math.min(1, elapsedMs / maxRecordTime),
          showBlinkDot: Math.floor(performance.now() / 450) % 2 === 0,
          pulse: (Math.sin(performance.now() / 200) + 1) / 2,
          hudLabel: t("rec_hud_label"),
          airBlockText: t("rec_blocked_air"),
        };
      }
      case "ReadyToReplay": {
        const recordedSec = ((recordEndTime - recordStartTime) / 1000).toFixed(
          1,
        );
        return {
          ...chrome,
          title: t("rec_title_ready"),
          subtitle: `${t("rec_sub_ready_prefix").replace("{REPLAY}", replayKey).replace("{RECORD}", recordKey)}  ${recordedSec}s`,
          badge: "READY",
          accentA: p.color(58, 98, 130),
          accentB: p.color(34, 62, 90),
          panelFill: p.color(28, 22, 55),
          panelShade: p.color(18, 14, 40),
          dotColor: p.color(105, 165, 210),
          textMain: p.color(210, 215, 240),
          textSub: p.color(138, 148, 185),
          progress: 1,
          showBlinkDot: false,
          pulse: 0,
          hudLabel: t("rec_hud_label"),
          airBlockText: t("rec_blocked_air"),
        };
      }
      case "Replaying": {
        const totalMs = Math.max(1, recordEndTime - recordStartTime);
        const replayElapsedMs =
          paused && pausedReplayElapsed !== null
            ? pausedReplayElapsed
            : Math.min(
                Math.max(0, performance.now() - replayStartTime),
                totalMs,
              );
        const replayElapsedSec = (replayElapsedMs / 1000).toFixed(1);
        const totalReplaySec = (totalMs / 1000).toFixed(1);
        return {
          ...chrome,
          title: t("rec_title_replaying"),
          subtitle: `${t("rec_sub_press_replay_end").replace("{KEY}", replayKey)}  ${replayElapsedSec}s / ${totalReplaySec}s`,
          badge: "PLAY",
          accentA: p.color(115, 75, 155),
          accentB: p.color(72, 42, 105),
          panelFill: p.color(36, 20, 62),
          panelShade: p.color(22, 12, 44),
          dotColor: p.color(175, 138, 215),
          textMain: p.color(218, 200, 240),
          textSub: p.color(155, 128, 185),
          progress: Math.min(1, replayElapsedMs / totalMs),
          showBlinkDot: Math.floor(performance.now() / 700) % 2 === 0,
          pulse: 0,
          hudLabel: t("rec_hud_label"),
          airBlockText: t("rec_blocked_air"),
        };
      }
      default:
        return {
          ...base,
        };
    }
  }

  /**
   * 绘制录制系统 HUD
   * @param {object} p - p5 实例
   * @param {object} params
   * @param {string}  params.state
   * @param {number}  params.maxRecordTime
   * @param {number}  params.recordStartTime
   * @param {number}  params.recordEndTime
   * @param {number}  params.replayStartTime
   * @param {number|null} params.pausedRecordElapsed
   * @param {number|null} params.pausedReplayElapsed
   * @param {number}  params.airBlockFlashMs
   * @param {object}  params.player
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
    },
  ) {
    const ui = RecordUI.getRecordUiState(
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

    const panelW = Math.min(630, p.width - 32);
    const panelH = 92;
    const panelX = Math.floor((p.width - panelW) / 2);
    const panelY = 14;
    const badgeW = 104;
    const progressW = panelW - 32;
    const progressH = 8;
    const progressX = panelX + 16;
    const progressY = panelY + panelH - 16;
    const pulseSize = 14 + ui.pulse * 8;

    // Air-block state
    const _cc = player?.controllerManager?.currentControlComponent;
    const _isOnGround = _cc?.abilityCondition?.["isOnGround"] ?? true;
    const isAirBlocked =
      (state === "ReadyToRecord" || state === "ReadyToReplay") && !_isOnGround;
    const airBlockAge = performance.now() - airBlockFlashMs;
    // Shake: brief horizontal oscillation decaying over 350ms
    const shakeX =
      airBlockAge < 350
        ? Math.sin((airBlockAge / 350) * Math.PI * 6) *
          5 *
          (1 - airBlockAge / 350)
        : 0;

    p.push();
    p.resetMatrix();
    p.translate(shakeX, 0);
    p.noStroke();
    if (Assets.customFont) {
      p.textFont(Assets.customFont);
    }

    // === PANEL CHROME ===
    // Outermost near-black border
    p.fill(ui.frameDark);
    p.rect(panelX - 4, panelY - 4, panelW + 8, panelH + 8);
    // Metallic purple inner border
    p.fill(ui.frameLight);
    p.rect(panelX - 2, panelY - 2, panelW + 4, panelH + 4);
    // Panel body layers
    p.fill(ui.panelShade);
    p.rect(panelX, panelY, panelW, panelH);
    p.fill(ui.panelFill);
    p.rect(panelX + 2, panelY + 2, panelW - 4, panelH - 4);
    // Subtle cool-purple shimmer strip at top
    p.fill(155, 95, 210, 16);
    p.rect(panelX + 4, panelY + 4, panelW - 8, 7);

    // === CORNER RIVETS (pixel steampunk detail) ===
    p.fill(72, 40, 108);
    p.rect(panelX + 4, panelY + 4, 5, 5);
    p.rect(panelX + panelW - 9, panelY + 4, 5, 5);
    p.rect(panelX + 4, panelY + panelH - 9, 5, 5);
    p.rect(panelX + panelW - 9, panelY + panelH - 9, 5, 5);
    // Rivet glint pixel
    p.fill(148, 98, 195, 200);
    p.rect(panelX + 5, panelY + 5, 2, 2);
    p.rect(panelX + panelW - 8, panelY + 5, 2, 2);
    p.rect(panelX + 5, panelY + panelH - 8, 2, 2);
    p.rect(panelX + panelW - 8, panelY + panelH - 8, 2, 2);

    // === BADGE AREA ===
    p.fill(ui.frameDark);
    p.rect(panelX + 12, panelY + 12, badgeW + 4, 38);
    p.fill(ui.accentB);
    p.rect(panelX + 14, panelY + 14, badgeW, 34);
    // Top accent stripe
    p.fill(ui.accentA);
    p.rect(panelX + 16, panelY + 16, badgeW - 4, 8);
    // Badge rivets on stripe
    p.fill(ui.frameDark);
    p.rect(panelX + 20, panelY + 18, 3, 3);
    p.rect(panelX + 108, panelY + 18, 3, 3);

    // Recording crimson-rose pulse glow
    if (ui.badge === "REC") {
      p.fill(205, 38, 95, 36 + ui.pulse * 44);
      p.circle(panelX + 40, panelY + 33, pulseSize + 10);
      p.fill(205, 38, 95, 22 + ui.pulse * 24);
      p.circle(panelX + 40, panelY + 33, pulseSize);
    }

    // Indicator diamond (rotated square — pixel-art style)
    p.fill(ui.showBlinkDot ? ui.dotColor : p.color(38, 20, 60));
    p.push();
    p.translate(panelX + 40, panelY + 33);
    p.rotate(Math.PI / 4);
    p.rect(-5, -5, 10, 10);
    p.pop();
    if (ui.showBlinkDot) {
      p.fill(255, 225);
      p.push();
      p.translate(panelX + 40, panelY + 33);
      p.rotate(Math.PI / 4);
      p.rect(-2, -2, 4, 4);
      p.pop();
    }

    // Badge label
    p.fill(ui.textMain);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(15);
    p.textStyle(p.BOLD);
    p.text(ui.badge, panelX + 52, panelY + 33);

    // Title + subtitle
    p.textStyle(p.BOLD);
    p.textSize(23);
    p.text(ui.title, panelX + 136, panelY + 31);

    p.textStyle(p.NORMAL);
    p.fill(ui.textSub);
    p.textSize(15);
    p.text(ui.subtitle, panelX + 136, panelY + 54);

    // === PROGRESS BAR ===
    p.fill(ui.frameDark);
    p.rect(progressX - 2, progressY - 2, progressW + 4, progressH + 4);
    // Dark purple track
    p.fill(14, 7, 28);
    p.rect(progressX, progressY, progressW, progressH);
    // Filled portion
    p.fill(ui.accentA);
    const barFillW = Math.max(0, progressW * ui.progress - 2);
    if (barFillW > 0) {
      p.rect(progressX + 1, progressY + 1, barFillW, progressH - 2);
    }
    // Quarter tick marks (industrial gauge look)
    p.fill(ui.frameDark);
    for (let i = 1; i < 4; i++) {
      p.rect(
        progressX + Math.floor((progressW * i) / 4),
        progressY,
        1,
        progressH,
      );
    }

    // HUD label
    p.fill(ui.textSub);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(15);
    p.text(t("rec_hud_label"), panelX + panelW - 14, panelY + 20);

    // === AIR BLOCK OVERLAY ===
    if (isAirBlocked) {
      p.fill(10, 5, 28, 135);
      p.rect(panelX + 2, panelY + 2, panelW - 4, panelH - 4);
      p.fill(185, 155, 220, 200);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(15);
      p.textStyle(p.BOLD);
      p.text(t("rec_blocked_air"), panelX + panelW / 2, panelY + panelH / 2);
      p.textStyle(p.NORMAL);
    }

    // Crimson-purple flash on blocked attempt
    if (airBlockAge < 380) {
      const flashAlpha = (1 - airBlockAge / 380) * 140;
      p.fill(185, 28, 80, flashAlpha);
      p.rect(panelX + 2, panelY + 2, panelW - 4, panelH - 4);
    }

    p.pop();
  }
}
