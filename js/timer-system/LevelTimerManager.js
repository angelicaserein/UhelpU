/**
 * LevelTimerManager.js
 * 游戏层级的计时系统集成
 *
 * 职责：
 * - 监听游戏事件（LOAD_LEVEL, FIRST_INPUT, PAUSE_GAME, RESUME_GAME, AUTO_RESULT）
 * - 维护 TimerSystem 实例
 * - 根据配置决定是否启用计时
 * - 提供时间查询接口给UI
 * - 预留排行榜回调
 */

import { TimerSystem } from "./TimerSystem.js";
import { EventTypes } from "../event-system/EventTypes.js";
import { TIMER_CONFIG } from "./TimerConfig.js";

export class LevelTimerManager {
  /**
   * @param {EventBus} eventBus - 事件总线（从 switcher.eventBus 或 AppCoordinator 传入）
   * @param {Object} config - 配置对象
   * @param {string} config.levelId - 关卡ID（如 "easy_level1"）
   * @param {boolean} [config.enabled] - 是否启用（可选，会从 TIMER_CONFIG 读取）
   */
  constructor(eventBus, config = {}) {
    this.eventBus = eventBus;
    this.levelId = config.levelId;

    // 从配置表读取是否启用
    const configEntry = TIMER_CONFIG[this.levelId] || {};
    this.enabled =
      config.enabled !== undefined ? config.enabled : configEntry.enabled;

    if (!this.enabled) {
      console.log(
        `[LevelTimerManager] Timer disabled for level: ${this.levelId}`,
      );
      return;
    }

    // 核心计时系统
    this.timerSystem = new TimerSystem();

    // 标记首次输入是否已经发生
    this._firstInputDetected = false;

    // 排行榜回调
    this._onLevelCompleteCallback = null;

    // 玩家名字（来自全局变量或外部设置）
    this._playerName = window.playerName || null;

    // 绑定所有监听器
    this._bindEventListeners();

    console.log(`[LevelTimerManager] Initialized for level: ${this.levelId}`);
  }

  /**
   * 设置玩家名字（用于排行榜）
   * @param {string} name - 玩家名字
   */
  setPlayerName(name) {
    this._playerName = name;
    window.playerName = name;
    console.log("[LevelTimerManager] Player name set to:", name);
  }

  /**
   * 绑定事件监听器
   * @private
   */
  _bindEventListeners() {
    if (!this.eventBus) {
      console.warn(
        "[LevelTimerManager] No eventBus provided, some features may not work",
      );
      return;
    }

    console.log("[LevelTimerManager] Starting to bind event listeners...");

    // 1. 关卡加载→重置计时器
    this._onLoadLevel = (levelId) => {
      console.log(
        `[LevelTimerManager] LOAD_LEVEL event received for: ${levelId}`,
      );
      if (levelId === this.levelId) {
        this.timerSystem.reset();
        this._firstInputDetected = false;
        console.log(`[LevelTimerManager] ✓ Timer reset for level: ${levelId}`);
      }
    };

    // 2. 首次输入→开始计时
    this._onFirstInput = () => {
      console.log("[LevelTimerManager] FIRST_INPUT event received");
      if (!this._firstInputDetected && this.timerSystem.getState() === "idle") {
        this._firstInputDetected = true;
        this.timerSystem.start();
        console.log("[LevelTimerManager] ✓ Timer started on first input");
      }
    };

    // 3. 暂停游戏→暂停计时
    this._onGamePaused = () => {
      console.log("[LevelTimerManager] PAUSE event received");
      if (this.timerSystem.getState() === "running") {
        this.timerSystem.pause();
        console.log("[LevelTimerManager] ✓ Timer paused");
      }
    };

    // 4. 恢复游戏→恢复计时
    this._onGameResumed = () => {
      console.log("[LevelTimerManager] RESUME event received");
      if (this.timerSystem.getState() === "paused") {
        this.timerSystem.resume();
        console.log("[LevelTimerManager] ✓ Timer resumed");
      }
    };

    // 5. 通关（进入Portal）→结束计时
    this._onAutoResult = (resultType) => {
      console.log(
        `[LevelTimerManager] AUTO_RESULT event received: ${resultType}`,
      );
      if (
        resultType === "autoResult1" &&
        this.timerSystem.getState() === "running"
      ) {
        const elapsedTime = this.timerSystem.finish();
        const elapsedTimeMs = elapsedTime * 1000;
        console.log(
          `[LevelTimerManager] ✓ Level completed! Time: ${elapsedTime.toFixed(2)}s`,
        );

        // 保存通关时间到全局变量（供Win Page读取）
        window.finalScore = elapsedTime;
        console.log(`[LevelTimerManager] Saved finalScore to window: ${elapsedTime}s`);

        // 自动上报成绩到Firebase（异步执行，不阻塞）
        if (
          this.levelId.startsWith("easy_") &&
          window.submitScore &&
          window.playerName
        ) {
          console.log(
            `[LevelTimerManager] Auto-reporting score for ${this.levelId}...`,
          );
          // 异步执行，不等待结果
          window
            .submitScore(window.playerName, elapsedTimeMs, this.levelId)
            .catch((error) => {
              console.error(
                "[LevelTimerManager] Error submitting score:",
                error,
              );
            });
        } else {
          if (!this.levelId.startsWith("easy_")) {
            console.log(
              "[LevelTimerManager] Not Easy difficulty, skipping score submission",
            );
          }
          if (!window.submitScore) {
            console.warn(
              "[LevelTimerManager] window.submitScore not available",
            );
          }
          if (!window.playerName) {
            console.warn(
              "[LevelTimerManager] window.playerName not set:",
              window.playerName,
            );
          }
        }

        // 触发排行榜回调
        if (this._onLevelCompleteCallback) {
          this._onLevelCompleteCallback({
            levelId: this.levelId,
            playerName: this._playerName || window.playerName,
            playerTime: elapsedTime,
            playerTimeMs: elapsedTimeMs,
            timestamp: Date.now(),
          });
        }
      }
    };

    // 注册所有监听器
    console.log("[LevelTimerManager] Registering event listeners...");
    this.eventBus.subscribe(EventTypes.LOAD_LEVEL, this._onLoadLevel);
    this.eventBus.subscribe("GAME_FIRST_INPUT", this._onFirstInput);
    this.eventBus.subscribe(EventTypes.PAUSE_GAME, this._onGamePaused);
    this.eventBus.subscribe(EventTypes.RESUME_GAME, this._onGameResumed);
    this.eventBus.subscribe(EventTypes.AUTO_RESULT, this._onAutoResult);
    console.log("[LevelTimerManager] ✓ All event listeners registered");
  }

  /**
   * 获取当前已用时间（秒）
   * @returns {number}
   */
  getElapsedTime() {
    if (!this.enabled || !this.timerSystem) {
      return 0;
    }
    return this.timerSystem.getElapsedTime();
  }

  /**
   * 获取格式化的时间字符串
   * @param {string} format - 格式（目前仅支持 "mm:ss"）
   * @returns {string}
   */
  getFormattedTime(format = "mm:ss") {
    if (!this.enabled || !this.timerSystem) {
      return "00:00";
    }
    return this.timerSystem.getFormattedTime(format);
  }

  /**
   * 获取计时器状态
   * @returns {string}
   */
  getState() {
    if (!this.enabled || !this.timerSystem) {
      return "disabled";
    }
    return this.timerSystem.getState();
  }

  /**
   * 注册关卡完成回调（用于排行榜上报）
   * @param {Function} callback - 回调函数，参数为 { levelId, playerTime, timestamp }
   */
  onLevelComplete(callback) {
    this._onLevelCompleteCallback = callback;
  }

  /**
   * 清理资源、取消所有监听器
   * 在 GamePage.exit() 时调用
   */
  cleanup() {
    if (!this.eventBus) {
      return;
    }

    if (this._onLoadLevel) {
      this.eventBus.unsubscribe(EventTypes.LOAD_LEVEL, this._onLoadLevel);
    }
    if (this._onFirstInput) {
      this.eventBus.unsubscribe("GAME_FIRST_INPUT", this._onFirstInput);
    }
    if (this._onGamePaused) {
      this.eventBus.unsubscribe(EventTypes.PAUSE_GAME, this._onGamePaused);
    }
    if (this._onGameResumed) {
      this.eventBus.unsubscribe(EventTypes.RESUME_GAME, this._onGameResumed);
    }
    if (this._onAutoResult) {
      this.eventBus.unsubscribe(EventTypes.AUTO_RESULT, this._onAutoResult);
    }

    console.log("[LevelTimerManager] Cleaned up all event listeners");
  }
}
