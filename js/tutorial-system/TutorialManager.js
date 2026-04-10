// js/tutorial-system/TutorialManager.js — 教学系统核心管理器
// PHASE 状态机管理 + 按键监听 + RecordSystem 轮询

import {
  TutorialStates,
  IdleState,
  GuideRecordState,
  GuideTimelineState,
  RecordingState,
  GuideReplayState,
  ReplayingState,
  CompleteState,
} from "./TutorialState.js";
import { TutorialUI } from "./TutorialUI.js";
import { KeyBindingManager } from "../key-binding-system/KeyBindingManager.js";
import { setGamePaused, isGamePaused } from "../game-runtime/GamePauseState.js";
import { EventTypes } from "../event-system/EventTypes.js";

/**
 * TutorialManager - 教学系统核心管理器
 *
 * 职责：
 * - 管理 PHASE 0～6 的状态转移
 * - 监听按键（录制键、回放键、移动/跳跃键）
 * - 轮询 RecordSystem 状态变化
 * - 控制游戏暂停和黑幕显示
 * - 禁用暂停菜单
 * - 处理 ESC 全局退出
 */
export class TutorialManager {
  constructor(gamePageContainer, level, recordSystem, eventBus, p5Instance = null) {
    this.gamePageContainer = gamePageContainer;
    this.level = level;
    this.recordSystem = recordSystem;
    this.eventBus = eventBus;

    // 获取 p5 实例
    // 优先级：直接传入 > window.p > window（作为 p5 instance mode）
    this.p = p5Instance || window.p || window;

    // UI 系统
    this.ui = new TutorialUI(this.p, gamePageContainer);

    // 状态管理
    this._currentPhase = TutorialStates.IDLE;
    this._phaseMap = {}; // 在 start() 中初始化

    // 按键监听
    this._keydownHandler = null;
    this._kbm = KeyBindingManager.getInstance();

    // RecordSystem 轮询
    this._recordSystemPollInterval = null;
    this._lastRecordSystemState = null;

    // 暂停菜单禁用
    this._pauseMenuDisabledFlag = false;

    // ESC 全局处理
    this._globalEscHandler = null;

    console.log("[TutorialManager] ✓ Initialized");
  }

  /**
   * 启动教程
   */
  start() {
    if (this._currentPhase !== TutorialStates.IDLE) {
      return; // 已启动则不重复启动
    }

    console.log("[TutorialManager] Starting tutorial...");

    // 导入状态类
    this._phaseMap = {
      [TutorialStates.IDLE]: new IdleState(
        this,
        this.ui,
        this.level,
        this.recordSystem
      ),
      [TutorialStates.GUIDE_RECORD]: new GuideRecordState(
        this,
        this.ui,
        this.level,
        this.recordSystem
      ),
      [TutorialStates.GUIDE_TIMELINE]: new GuideTimelineState(
        this,
        this.ui,
        this.level,
        this.recordSystem
      ),
      [TutorialStates.RECORDING]: new RecordingState(
        this,
        this.ui,
        this.level,
        this.recordSystem
      ),
      [TutorialStates.GUIDE_REPLAY]: new GuideReplayState(
        this,
        this.ui,
        this.level,
        this.recordSystem
      ),
      [TutorialStates.REPLAYING]: new ReplayingState(
        this,
        this.ui,
        this.level,
        this.recordSystem
      ),
      [TutorialStates.COMPLETE]: new CompleteState(
        this,
        this.ui,
        this.level,
        this.recordSystem
      ),
    };

    // 设置监听
    this._setupKeyboardListeners();
    this._setupRecordSystemPolling();
    this._setupGlobalEscHandler();

    // 禁用暂停菜单
    this._disablePauseMenu();

    // 发送事件通知 signboard 关闭
    if (this.eventBus) {
      this.eventBus.publish(EventTypes.TUTORIAL_CLOSE_SIGNBOARD);
    }

    // 进入第一个教学 PHASE（GUIDE_RECORD）
    this._transitionToPhase(TutorialStates.GUIDE_RECORD);

    console.log("[TutorialManager] ✓ Tutorial started");
  }

  /**
   * 跳过教程
   */
  skip() {
    console.log("[TutorialManager] Skipping tutorial");
    this._transitionToPhase(TutorialStates.IDLE);
  }

  /**
   * 中断教程（ESC）
   */
  interrupt() {
    console.log("[TutorialManager] Interrupting tutorial (ESC)");
    this._transitionToPhase(TutorialStates.IDLE);
  }

  /**
   * 销毁教程系统
   */
  destroy() {
    console.log("[TutorialManager] Destroying tutorial system");

    // 清理所有 PHASE
    Object.values(this._phaseMap).forEach((phase) => {
      if (phase && phase.exit) {
        phase.exit();
      }
    });
    this._phaseMap = {};

    // 清理监听
    this._cleanupKeyboardListeners();
    this._cleanupRecordSystemPolling();
    this._cleanupGlobalEscHandler();

    // 恢复暂停菜单
    this._restorePauseMenu();

    // 清理 UI
    if (this.ui) {
      this.ui.cleanup();
    }

    console.log("[TutorialManager] ✓ Destroyed");
  }

  /**
   * 内部：PHASE 转换
   */
  _transitionToPhase(nextPhaseType) {
    if (this._currentPhase === nextPhaseType) {
      return; // 已经在这个阶段
    }

    // 退出当前 PHASE
    const currentPhase = this._phaseMap[this._currentPhase];
    if (currentPhase && currentPhase.exit) {
      currentPhase.exit();
    }

    // 进入新 PHASE
    this._currentPhase = nextPhaseType;
    const nextPhase = this._phaseMap[nextPhaseType];
    if (nextPhase && nextPhase.enter) {
      nextPhase.enter();
    }

    console.log(`[TutorialManager] → PHASE: ${this._currentPhase}`);

    // 回到 IDLE，完全清理
    if (nextPhaseType === TutorialStates.IDLE) {
      this._cleanupKeyboardListeners();
      this._cleanupRecordSystemPolling();
      this._cleanupGlobalEscHandler();
      this._restorePauseMenu();
      setGamePaused(false);
      this.ui.cleanup();
    }
  }

  /**
   * 内部：设置按键监听
   */
  _setupKeyboardListeners() {
    this._keydownHandler = (event) => {
      const intent = this._kbm.getIntentByKey(event.code);

      // PHASE 1（GUIDE_RECORD）：检测录制键
      if (this._currentPhase === TutorialStates.GUIDE_RECORD) {
        if (intent === "record") {
          console.log("[TutorialManager] Record key pressed");
          this._transitionToPhase(TutorialStates.GUIDE_TIMELINE);
        }
      }
      // PHASE 2（GUIDE_TIMELINE）：检测移动/跳跃键
      else if (this._currentPhase === TutorialStates.GUIDE_TIMELINE) {
        if (
          intent === "moveLeft" ||
          intent === "moveRight" ||
          intent === "jump"
        ) {
          console.log("[TutorialManager] Movement key pressed");
          this._transitionToPhase(TutorialStates.RECORDING);
          // 游戏时间恢复运行
          setGamePaused(false);
        }
      }
      // PHASE 4（GUIDE_REPLAY）：检测回放键
      else if (this._currentPhase === TutorialStates.GUIDE_REPLAY) {
        if (intent === "replay") {
          console.log("[TutorialManager] Replay key pressed");
          this._transitionToPhase(TutorialStates.REPLAYING);
          // 游戏时间恢复运行
          setGamePaused(false);
        }
      }
    };

    document.addEventListener("keydown", this._keydownHandler);
    console.log("[TutorialManager] ✓ Keyboard listeners activated");
  }

  /**
   * 内部：清理按键监听
   */
  _cleanupKeyboardListeners() {
    if (this._keydownHandler) {
      document.removeEventListener("keydown", this._keydownHandler);
      this._keydownHandler = null;
    }
  }

  /**
   * 内部：设置 RecordSystem 轮询
   */
  _setupRecordSystemPolling() {
    this._lastRecordSystemState = this.recordSystem.state;

    this._recordSystemPollInterval = setInterval(() => {
      const currentState = this.recordSystem.state;

      if (currentState === this._lastRecordSystemState) {
        return; // 没有变化
      }

      console.log(
        `[TutorialManager] RecordSystem: ${this._lastRecordSystemState} → ${currentState}`
      );

      // PHASE 3（RECORDING）完成 → PHASE 4（GUIDE_REPLAY）
      if (
        this._currentPhase === TutorialStates.RECORDING &&
        currentState === "ReadyToReplay"
      ) {
        this._transitionToPhase(TutorialStates.GUIDE_REPLAY);
        // 暂停游戏
        setGamePaused(true);
      }

      // PHASE 5（REPLAYING）完成 → PHASE 6（COMPLETE）
      if (
        this._currentPhase === TutorialStates.REPLAYING &&
        currentState === "ReadyToRecord"
      ) {
        this._transitionToPhase(TutorialStates.COMPLETE);
      }

      this._lastRecordSystemState = currentState;
    }, 100);

    console.log("[TutorialManager] ✓ RecordSystem polling activated");
  }

  /**
   * 内部：清理 RecordSystem 轮询
   */
  _cleanupRecordSystemPolling() {
    if (this._recordSystemPollInterval) {
      clearInterval(this._recordSystemPollInterval);
      this._recordSystemPollInterval = null;
    }
  }

  /**
   * 内部：设置 ESC 全局处理
   */
  _setupGlobalEscHandler() {
    this._globalEscHandler = (event) => {
      if (event.code === "Escape" && this._currentPhase !== TutorialStates.IDLE) {
        console.log("[TutorialManager] ESC pressed - exiting tutorial");
        event.preventDefault();
        event.stopPropagation();
        this.interrupt();
      }
    };

    // 使用捕获阶段以拦截事件
    document.addEventListener("keydown", this._globalEscHandler, true);
    console.log("[TutorialManager] ✓ Global ESC handler activated");
  }

  /**
   * 内部：清理 ESC 全局处理
   */
  _cleanupGlobalEscHandler() {
    if (this._globalEscHandler) {
      document.removeEventListener("keydown", this._globalEscHandler, true);
      this._globalEscHandler = null;
    }
  }

  /**
   * 内部：禁用暂停菜单
   */
  _disablePauseMenu() {
    // 设置全局标志以供 GamePageBaseDemo2 检查
    window._tutorialPauseMenuDisabled = true;
    this._pauseMenuDisabledFlag = true;

    console.log("[TutorialManager] ✓ Pause menu disabled");
  }

  /**
   * 内部：恢复暂停菜单
   */
  _restorePauseMenu() {
    window._tutorialPauseMenuDisabled = false;
    this._pauseMenuDisabledFlag = false;

    // 恢复游戏时间
    setGamePaused(false);

    console.log("[TutorialManager] ✓ Pause menu restored");
  }
}
