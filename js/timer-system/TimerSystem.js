/**
 * TimerSystem.js
 * 核心秒表逻辑 - 独立于UI和事件系统
 *
 * 功能：
 * - 记录计时的开始、暂停、恢复、结束
 * - 计算已用时间（秒）
 * - 提供格式化时间输出（mm:ss）
 * - 状态管理：idle → running → paused → finished
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
   * 开始计时
   * 从idle→running，记录起始时间戳
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
   * 暂停计时
   * 从running→paused，记录当前已用时间
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
   * 恢复计时
   * 从paused→running，记录恢复时间以计算暂停时长
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
   * 结束计时
   * 从running→finished，记录最终时间并返回
   * @returns {number} 已用时间（秒）
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
   * 重置计时器到初始状态
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

  /**
   * 获取已用时间（秒，包含小数）
   * 计算方式：
   *   - 如果finished: (finalTime - startTime - accumulatedPausedTime) / 1000
   *   - 如果paused: (pauseTime - startTime - accumulatedPausedTime) / 1000
   *   - 如果running: (now - startTime - accumulatedPausedTime) / 1000
   *   - 否则: 0
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
   * 获取格式化的时间字符串
   * @param {string} format - 格式（目前仅支持 "mm:ss"）
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
   * 获取当前状态
   * @returns {string}
   */
  getState() {
    return this._state;
  }

  /**
   * 是否正在运行中
   * @returns {boolean}
   */
  isRunning() {
    return this._state === "running";
  }

  /**
   * 是否已暂停
   * @returns {boolean}
   */
  isPaused() {
    return this._state === "paused";
  }
}
