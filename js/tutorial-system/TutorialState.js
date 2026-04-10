// js/tutorial-system/TutorialState.js — 教学系统 7 个 PHASE 状态定义

import { t } from "../i18n.js";
import { setGamePaused, isGamePaused } from "../game-runtime/GamePauseState.js";

/**
 * PHASE 状态常量
 * 0: IDLE（待机）
 * 1: GUIDE_RECORD（引导录制）
 * 2: GUIDE_TIMELINE（引导时间轴）
 * 3: RECORDING（录制进行中）
 * 4: GUIDE_REPLAY（引导回放）
 * 5: REPLAYING（回放进行中）
 * 6: COMPLETE（教程完成）
 */
export const TutorialStates = {
  IDLE: "IDLE",
  GUIDE_RECORD: "GUIDE_RECORD",
  GUIDE_TIMELINE: "GUIDE_TIMELINE",
  RECORDING: "RECORDING",
  GUIDE_REPLAY: "GUIDE_REPLAY",
  REPLAYING: "REPLAYING",
  COMPLETE: "COMPLETE",
};

/**
 * 基础 PHASE 状态类
 */
export class BaseTutorialState {
  constructor(manager, ui, level, recordSystem) {
    this.manager = manager;
    this.ui = ui;
    this.level = level;
    this.recordSystem = recordSystem;

    this._listeners = [];
    this._timers = [];
  }

  enter() {
    // 子类实现
  }

  exit() {
    // 清理所有 UI 元素
    this.ui.cleanup();
    // 清理事件监听和定时器
    this._cleanup();
  }

  _cleanup() {
    // 清理事件监听
    this._listeners.forEach(({ target, event, handler }) => {
      if (target && target.removeEventListener) {
        target.removeEventListener(event, handler);
      }
    });
    this._listeners = [];

    // 清理定时器
    this._timers.forEach((timerId) => {
      clearTimeout(timerId);
      clearInterval(timerId);
    });
    this._timers = [];
  }

  on(target, event, handler) {
    if (!target || !target.addEventListener) return;
    target.addEventListener(event, handler);
    this._listeners.push({ target, event, handler });
  }

  setTimeout(callback, delay) {
    const timerId = setTimeout(callback, delay);
    this._timers.push(timerId);
    return timerId;
  }

  setInterval(callback, interval) {
    const timerId = setInterval(callback, interval);
    this._timers.push(timerId);
    return timerId;
  }

  transitionTo(nextPhaseType) {
    this.manager._transitionToPhase(nextPhaseType);
  }
}

/**
 * PHASE 0: IDLE — 待机状态（教程未开始）
 */
export class IdleState extends BaseTutorialState {
  enter() {
    console.log("[IdleState] Entering");
    // 确保所有 UI 隐藏
    this.ui.hideOverlay();
    this.ui.cleanup();
  }

  exit() {
    super.exit();
  }
}

/**
 * PHASE 1: GUIDE_RECORD — 引导录制按钮
 * 游戏暂停，全屏黑幕，录制 UI 镂空
 * 触发：玩家按录制键 → GUIDE_TIMELINE
 */
export class GuideRecordState extends BaseTutorialState {
  enter() {
    console.log("[GuideRecordState] Entering");

    // 游戏暂停
    setGamePaused(true);

    // 显示全屏黑幕 + 录制 UI 镂空
    const windowWidth = window.innerWidth;
    const recordUIRect = { x: 12, y: 12, width: windowWidth - 24, height: 56 };
    this.ui.showOverlay({ type: "partial", visibleRects: [recordUIRect] });

    // 显示提示文字
    this.ui.showPrompt("tutorial_guide_record_msg", {
      position: "top-center",
      isPersistent: true,
    });

    console.log("[GuideRecordState] ✓ Waiting for record key press...");
  }

  exit() {
    super.exit();
  }
}

/**
 * PHASE 2: GUIDE_TIMELINE — 引导时间轴
 * 游戏暂停，全屏黑幕，时间轴镂空
 * 触发：玩家按移动/跳跃键 → RECORDING
 */
export class GuideTimelineState extends BaseTutorialState {
  enter() {
    console.log("[GuideTimelineState] Entering");

    // 游戏暂停
    setGamePaused(true);

    // 显示全屏黑幕 + 时间轴镂空
    const windowWidth = window.innerWidth;
    const timelineRect = { x: 12, y: 92, width: windowWidth - 24, height: 50 };
    this.ui.showOverlay({ type: "partial", visibleRects: [timelineRect] });

    // 显示提示文字
    this.ui.showPrompt("tutorial_guide_timeline_msg", {
      position: "top-center",
      isPersistent: true,
    });

    console.log("[GuideTimelineState] ✓ Waiting for movement key press...");
  }

  exit() {
    super.exit();
  }
}

/**
 * PHASE 3: RECORDING — 录制进行中
 * 游戏运行，无黑幕
 * 触发：RecordSystem 状态变为 "ReadyToReplay"（5秒或手动结束）→ GUIDE_REPLAY
 */
export class RecordingState extends BaseTutorialState {
  enter() {
    console.log("[RecordingState] Entering");

    // 游戏时间恢复运行
    setGamePaused(false);

    // 隐藏黑幕
    this.ui.hideOverlay();

    // 显示提示文字（醒目样式）
    this.ui.showPrompt("tutorial_recording_msg", {
      position: "top-center",
      isPersistent: true,
      isHighlight: true, // 醒目样式
    });

    console.log("[RecordingState] ✓ Recording in progress...");
  }

  exit() {
    super.exit();
  }
}

/**
 * PHASE 4: GUIDE_REPLAY — 引导回放
 * 游戏暂停，全屏黑幕，三个区域镂空（录制UI、时间轴、分身位置）
 * 触发：玩家按回放键 → REPLAYING
 */
export class GuideReplayState extends BaseTutorialState {
  enter() {
    console.log("[GuideReplayState] Entering");

    // 游戏暂停
    setGamePaused(true);

    // 显示全屏黑幕 + 三个区域镂空
    const windowWidth = window.innerWidth;
    const recordUIRect = { x: 12, y: 12, width: windowWidth - 24, height: 56 };
    const timelineRect = { x: 12, y: 92, width: windowWidth - 24, height: 50 };
    const phantomRect = { x: 480, y: 80, width: 100, height: 65 }; // Signboard 位置

    this.ui.showOverlay({
      type: "partial",
      visibleRects: [recordUIRect, timelineRect, phantomRect]
    });

    // 显示三个提示文字
    this.ui.showMultiplePrompts([
      {
        text: "tutorial_guide_replay_msg",
        position: "top-center",
      },
      {
        text: "tutorial_phantom_label",
        x: 530, // 分身位置附近
        y: 150,
        style: "label",
      },
      {
        text: "tutorial_actions_label",
        x: 30, // 时间轴附近
        y: 150,
        style: "label",
      },
    ]);

    console.log("[GuideReplayState] ✓ Waiting for replay key press...");
  }

  exit() {
    super.exit();
  }
}

/**
 * PHASE 5: REPLAYING — 回放进行中
 * 游戏运行，无黑幕，分身执行回放动作
 * 触发：RecordSystem 状态变为 "ReadyToRecord"（5秒或手动结束）→ COMPLETE
 */
export class ReplayingState extends BaseTutorialState {
  enter() {
    console.log("[ReplayingState] Entering");

    // 游戏时间恢复运行
    setGamePaused(false);

    // 隐藏黑幕
    this.ui.hideOverlay();

    // 显示两个提示文字
    this.ui.showMultiplePrompts([
      {
        text: "tutorial_replaying_msg",
        position: "top-center",
      },
      {
        text: "tutorial_phantom_replaying_label",
        x: 530,
        y: 150,
        style: "label",
      },
    ]);

    console.log("[ReplayingState] ✓ Replaying in progress...");
  }

  exit() {
    super.exit();
  }
}

/**
 * PHASE 6: COMPLETE — 教程完成
 * 游戏运行，无黑幕，显示完成提示，3秒后自动消失
 * 之后：游戏恢复正常，signboard 保留"开始教程"按钮
 */
export class CompleteState extends BaseTutorialState {
  enter() {
    console.log("[CompleteState] Entering");

    // 游戏时间恢复运行
    setGamePaused(false);

    // 隐藏黑幕
    this.ui.hideOverlay();

    // 显示完成提示（屏幕中央大字）
    this.ui.showPrompt("tutorial_complete_msg", {
      position: "center",
      isPersistent: false, // 不需要持久显示，会自动消失
    });

    // 3秒后自动返回 IDLE（正常游玩）
    this.setTimeout(() => {
      console.log("[CompleteState] Tutorial completed, returning to IDLE");
      this.transitionTo(TutorialStates.IDLE);
    }, 3000);

    console.log("[CompleteState] ✓ Tutorial complete!");
  }

  exit() {
    super.exit();
  }
}
