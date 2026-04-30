/**
 * TimerSystem.js
 * Core stopwatch logic - independent of UI and event system | 核心秒表逻辑 - 独立于UI和事件系统
 *
 * Features:
 * - Record the start, pause, resume, finish times of timing | 记录计时的开始、暂停、恢复、结束
 * - Calculate elapsed time in seconds | 计算已用时间（秒）
 * - Provide formatted time output (mm:ss) | 提供格式化时间输出 (mm:ss)
 * - State management: idle → running → paused → finished | 状态管理: idle → running → paused → finished
 */

export class TimerSystem {
  constructor() {
    this._state = "idle"; // idle, running, paused, finished
    this._startTime = null; // 首次start时的时间戳
    this._pauseTime = null; // pause时记录的已用时间
    this._resumeTime = null; // 最后resume时的时间戳
    this._accumulatedPausedTime = 0; // 所有暂停期间累计的时间（毫秒）
    this._finalTime = null; // finish时记录的最终时间
  }

  /**
   * Start timing | 开始计时
   * From idle → running, record the start timestamp | 从 idle → running，记录起始时间戳
   */
  start() {
    if (this._state === "running") {
      console.warn("[TimerSystem] Already running, ignore start()");
      return;
    }

    this._state = "running";
    this._startTime = performance.now();
    this._pauseTime = null;
    this._resumeTime = null;
    this._accumulatedPausedTime = 0;
    this._finalTime = null;

    console.log("[TimerSystem] Started timing");
  }

  /**
   * Pause timing | 暂停计时
   * From running → paused, record the current elapsed time | 从 running → paused，记录当前已用时间
   */
  pause() {
    if (this._state !== "running") {
      console.warn("[TimerSystem] Not running, cannot pause");
      return;
    }

    this._state = "paused";
    const now = performance.now();
    this._pauseTime = now;

    console.log(`[TimerSystem] Paused at ${this.getElapsedTime().toFixed(2)}s`);
  }

  /**
   * Resume timing | 恢复计时
   * From paused → running, record resume time to calculate pause duration | 从 paused → running，记录恢复时间以计算暂停时長
   */
  resume() {
    if (this._state !== "paused") {
      console.warn("[TimerSystem] Not paused, cannot resume");
      return;
    }

    this._state = "running";
    const now = performance.now();
    if (this._pauseTime !== null) {
      const pausedDuration = now - this._pauseTime;
      this._accumulatedPausedTime += pausedDuration;
    }
    this._resumeTime = now;

    console.log(
      `[TimerSystem] Resumed, isolated pause time: ${this._pauseTime !== null ? (now - this._pauseTime).toFixed(2) : 0}ms`,
    );
  }

  /**
   * Finish timing | 结束计时
   * From running → finished, record the final time and return | 从 running → finished，记录最终时间并返回
   * @returns {number} Elapsed time in seconds | 已用时间（秒）
   */
  finish() {
    if (this._state !== "running") {
      console.warn("[TimerSystem] Not running, cannot finish");
      return 0;
    }

    this._state = "finished";
    this._finalTime = performance.now();
    const elapsed = this.getElapsedTime();

    console.log(
      `[TimerSystem] Finished with total time: ${elapsed.toFixed(2)}s`,
    );
    return elapsed;
  }

  /**
   * Reset timer to initial state | 重置计时器到初始状态
   */
  reset() {
    this._state = "idle";
    this._startTime = null;
    this._pauseTime = null;
    this._resumeTime = null;
    this._accumulatedPausedTime = 0;
    this._finalTime = null;

    console.log("[TimerSystem] Reset");
  }

  exportSnapshot() {
    return {
      state: this._state,
      elapsedMs: Math.round(this.getElapsedTime() * 1000),
    };
  }

  restoreSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      this.reset();
      return;
    }

    const elapsedMs = Math.max(0, Number(snapshot.elapsedMs) || 0);
    const state = snapshot.state || "idle";

    if (state === "idle") {
      this.reset();
      return;
    }

    const now = performance.now();
    this._startTime = now - elapsedMs;
    this._resumeTime = null;
    this._accumulatedPausedTime = 0;
    this._finalTime = null;

    if (state === "paused") {
      this._state = "paused";
      this._pauseTime = now;
      return;
    }

    if (state === "finished") {
      this._state = "finished";
      this._pauseTime = null;
      this._finalTime = now;
      return;
    }

    this._state = "running";
    this._pauseTime = null;
  }

  /**
   * Get elapsed time in seconds (including decimals) | 获取已用时间（秒，包含小数）
   * Calculation method: | 计算方式：
   *   - If finished: (finalTime - startTime - accumulatedPausedTime) / 1000 | 如果finished: (finalTime - startTime - accumulatedPausedTime) / 1000
   *   - If paused: (pauseTime - startTime - accumulatedPausedTime) / 1000 | 如果paused: (pauseTime - startTime - accumulatedPausedTime) / 1000
   *   - If running: (now - startTime - accumulatedPausedTime) / 1000 | 如果running: (now - startTime - accumulatedPausedTime) / 1000
   *   - Otherwise: 0 | 其他: 0
   * @returns {number}
   */
  getElapsedTime() {
    if (this._startTime === null) {
      return 0;
    }

    let endTime;
    if (this._state === "finished" && this._finalTime !== null) {
      endTime = this._finalTime;
    } else if (this._state === "paused" && this._pauseTime !== null) {
      endTime = this._pauseTime;
    } else if (this._state === "running") {
      endTime = performance.now();
    } else {
      return 0;
    }

    const totalMs = endTime - this._startTime - this._accumulatedPausedTime;
    return Math.max(0, totalMs / 1000); // 防止负数
  }

  /**
   * Get formatted time string | 获取格式化的时间字符串
   * @param {string} format - Format (currently only supports "mm:ss") | 格式（目前仅支持 "mm:ss"）
   * @returns {string}
   */
  getFormattedTime(format = "mm:ss") {
    const elapsed = this.getElapsedTime();
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);

    if (format === "mm:ss") {
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return "00:00";
  }

  /**
   * Get current state | 获取当前状态
   * @returns {string}
   */
  getState() {
    return this._state;
  }

  /**
   * Whether currently running | 是否正在运行中
   * @returns {boolean}
   */
  isRunning() {
    return this._state === "running";
  }

  /**
   * Whether currently paused | 是否已暂停
   * @returns {boolean}
   */
  isPaused() {
    return this._state === "paused";
  }
}
