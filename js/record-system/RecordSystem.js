import { Clip } from "./Clip.js";
import { RecordUI } from "./RecordUI.js";
import { KeyBindingManager } from "../key-binding-system/KeyBindingManager.js";
import { isGamePaused } from "../game-runtime/GamePauseState.js";

export class RecordSystem {
  /**
   * @param {object}   player
   * @param {number}   maxRecordTime
   * @param {Function} addReplayerCallback
   * @param {Function} removeReplayerCallback
   * @param {object}   [options]
   * @param {Function} [options.onReplayStart] - called once each time replay begins
   */
  constructor(
    player,
    maxRecordTime,
    addReplayerCallback,
    removeReplayerCallback,
    options = {},
  ) {
    this.player = player;
    this.maxRecordTime = maxRecordTime;
    this._keyBindingManager = KeyBindingManager.getInstance();
    this._pressedKeys = new Set();
    this.addReplayer = addReplayerCallback;
    this.removeReplayer = removeReplayerCallback;
    this._onReplayStart = options.onReplayStart || null;
    this._onFirstRecord = options.onFirstRecord || null;
    this._hasRecordedOnce = false;
    this._keydownHandler = (event) => this.eventHandler(event);
    this._keyupHandler = (event) => this.eventHandler(event);

    //状态转移规则（使用意图而不是键码）
    this.states = {
      ReadyToRecord: {
        record: "Recording",
      },
      Recording: {
        record: "ReadyToReplay",
        RecordTimeout: "ReadyToReplay",
      },
      ReadyToReplay: {
        replay: "Replaying",
        record: "Recording",
      },
      Replaying: {
        ReplayTimeout: "ReadyToReplay",
        replay: "ReadyToReplay", // 按 R 键提前停止回放
      },
    };
    this.actions = {
      ReadyToRecord: {
        record: this.beingRecordingFromIdle,
      },
      Recording: {
        record: this.finishRecordingByKey,
        RecordTimeout: this.finishRecordingByTimeout,
      },
      ReadyToReplay: {
        replay: this.beingReplay,
        record: this.restartRecording,
      },
      Replaying: {
        ReplayTimeout: this.finishReplayAndReset,
        replay: this.finishReplayByKey, // 按 R 键提前停止回放
      },
    };

    //决定状态的属性
    this.state = "ReadyToRecord";
    this.clip = null;
    this.recordStartTime = -1;
    this.recordEndTime = -1;
    this.recordTimer = null;
    this.replayTimer = null;
    this.eventTimers = [];
    this.eventDispatchTimer = null;
    this._replayRecords = [];
    this._replayCursor = 0;
    this.replayer = null;
    this._pausedRecordElapsed = null;
    this._pausedReplayElapsed = null;
    this._airBlockFlashMs = -9999; // timestamp of last blocked-in-air attempt
    this._hudVisible = true;
    this._disabled = false;
  }

  setHudVisible(visible) {
    this._hudVisible = !!visible;
  }

  isHudVisible() {
    return this._hudVisible;
  }

  setDisabled(v) {
    this._disabled = !!v;
  }

  isDisabled() {
    return this._disabled;
  }

  createListeners() {
    window.addEventListener("keydown", this._keydownHandler);
    window.addEventListener("keyup", this._keyupHandler);
  }
  clearAllListenersAndTimers() {
    window.removeEventListener("keydown", this._keydownHandler);
    window.removeEventListener("keyup", this._keyupHandler);
    if (this.clip) {
      this.clip.clearListeners();
    }
    if (this.recordTimer) {
      clearTimeout(this.recordTimer);
    }
    if (this.replayTimer) {
      clearTimeout(this.replayTimer);
    }
    if (this.eventDispatchTimer) {
      clearTimeout(this.eventDispatchTimer);
      this.eventDispatchTimer = null;
    }
    if (this.eventTimers.length !== 0) {
      for (const timer of this.eventTimers) {
        clearTimeout(timer);
      }
    }
    this.eventTimers = [];
    this._replayRecords = [];
    this._replayCursor = 0;
    this._pausedRecordElapsed = null;
    this._pausedReplayElapsed = null;
    if (this.replayer) {
      this.removeReplayer();
    }
  }
  // event: window raw keyboard event -> returns: string (intent) or null
  eventHandler(event) {
    if (this._disabled || isGamePaused()) {
      this.resetInputState();
      return;
    }
    const intent = this.process(event);
    if (intent !== null) {
      // Block starting a new recording while player is airborne
      if (
        intent === "record" &&
        (this.state === "ReadyToRecord" || this.state === "ReadyToReplay")
      ) {
        const cc = this.player?.controllerManager?.currentControlComponent;
        const isOnGround = cc?.abilityCondition?.["isOnGround"] ?? true;
        if (!isOnGround) {
          this._airBlockFlashMs = performance.now();
          return;
        }
      }
      // Intercept the very first record attempt to fire callback
      if (
        intent === "record" &&
        this.state === "ReadyToRecord" &&
        !this._hasRecordedOnce &&
        this._onFirstRecord
      ) {
        this._hasRecordedOnce = true;
        this._onFirstRecord();
        return;
      }
      if (intent === "record" && this.state === "ReadyToRecord") {
        this._hasRecordedOnce = true;
      }
      this.transition(intent);
    }
  }

  resetInputState() {
    this._pressedKeys.clear();
  }

  pauseForGamePause() {
    if (this.state === "Recording") {
      if (this._pausedRecordElapsed !== null) return;
      this._pausedRecordElapsed = Math.max(
        0,
        performance.now() - this.recordStartTime,
      );
      if (this.recordTimer) {
        clearTimeout(this.recordTimer);
        this.recordTimer = null;
      }
      return;
    }

    if (this.state === "Replaying") {
      if (this._pausedReplayElapsed !== null) return;
      const totalMs = Math.max(1, this.recordEndTime - this.recordStartTime);
      this._pausedReplayElapsed = Math.min(
        Math.max(0, performance.now() - this.replayStartTime),
        totalMs,
      );

      if (this.replayTimer) {
        clearTimeout(this.replayTimer);
        this.replayTimer = null;
      }
      if (this.eventDispatchTimer) {
        clearTimeout(this.eventDispatchTimer);
        this.eventDispatchTimer = null;
      }
      this.eventTimers = [];
      this._replayRecords = [];
      this._replayCursor = 0;
    }
  }

  resumeFromGamePause() {
    if (this.state === "Recording") {
      if (this._pausedRecordElapsed === null) return;

      const elapsed = this._pausedRecordElapsed;
      const remaining = Math.max(0, this.maxRecordTime - elapsed);
      this.recordStartTime = performance.now() - elapsed;

      this.recordTimer = setTimeout(() => {
        this.transition("RecordTimeout");
      }, remaining);

      this._pausedRecordElapsed = null;
      return;
    }

    if (this.state === "Replaying") {
      if (this._pausedReplayElapsed === null) return;

      const elapsed = this._pausedReplayElapsed;
      const totalMs = Math.max(1, this.recordEndTime - this.recordStartTime);
      const remaining = Math.max(0, totalMs - elapsed);
      this.replayStartTime = performance.now() - elapsed;

      this.replayTimer = setTimeout(() => {
        this.transition("ReplayTimeout");
      }, remaining);

      this.dispatchEvent(elapsed);
      this._pausedReplayElapsed = null;
    }
  }
  // -> return: boolean
  beingRecordingFromIdle() {
    this.recordStartTime = performance.now();
    this.clip = new Clip(this.player.x, this.player.y, this.recordStartTime);
    const heldKeys =
      this.player.controllerManager.currentControlMode.eventProcesser
        .pressedKeys;
    this.clip.injectHeldKeys(heldKeys);
    this.clip.createListeners();

    this.recordTimer = setTimeout(() => {
      this.transition("RecordTimeout");
    }, this.maxRecordTime);
  }
  // -> return:
  finishRecordingByKey() {
    this.recordEndTime = performance.now();
    this.clip.clearListeners();
    clearTimeout(this.recordTimer);
    this.recordTimer = null;
    this.replayer = this.addReplayer(
      this.clip.getStartX(),
      this.clip.getStartY(),
    );
  }

  finishRecordingByTimeout() {
    this.recordEndTime = performance.now();
    this.clip.clearListeners();
    this.recordTimer = null;
    this.replayer = this.addReplayer(
      this.clip.getStartX(),
      this.clip.getStartY(),
    );
  }
  //
  restartRecording() {
    this.recordStartTime = performance.now();
    this.recordEndTime = -1;

    this.recordTimer = setTimeout(() => {
      this.transition("RecordTimeout");
    }, this.maxRecordTime);
    this.removeReplayer();
    this.replayer = null;

    this.clip = new Clip(this.player.x, this.player.y, this.recordStartTime);
    const heldKeys =
      this.player.controllerManager.currentControlMode.eventProcesser
        .pressedKeys;
    this.clip.injectHeldKeys(heldKeys);
    this.clip.createListeners();
  }
  dispatchEvent(elapsedMs = 0) {
    const records = this.clip.getRecords() || [];
    this._replayRecords = records.map((record, index) => ({
      ...record,
      __index: index,
    }));
    this._replayRecords.sort((a, b) => {
      if (a.time === b.time) return a.__index - b.__index;
      return a.time - b.time;
    });

    this._replayCursor = 0;
    // 严格小于：time === elapsedMs 的事件（如注入的 t=0 移动键）不能跳过
    while (
      this._replayCursor < this._replayRecords.length &&
      this._replayRecords[this._replayCursor].time < elapsedMs
    ) {
      this._replayCursor += 1;
    }

    // 同步立即触发当前时刻到期的事件（包括 t=0 注入的移动键），不等下一帧
    this.flushDueReplayEvents();
    this.scheduleNextReplayEvent();
  }

  scheduleNextReplayEvent() {
    if (this.eventDispatchTimer) {
      clearTimeout(this.eventDispatchTimer);
      this.eventDispatchTimer = null;
    }

    if (this._replayCursor >= this._replayRecords.length) {
      return;
    }

    const nextRecord = this._replayRecords[this._replayCursor];
    const elapsed = Math.max(0, performance.now() - this.replayStartTime);
    const delay = Math.max(0, nextRecord.time - elapsed);

    this.eventDispatchTimer = setTimeout(() => {
      this.flushDueReplayEvents();
      this.scheduleNextReplayEvent();
    }, delay);
  }

  flushDueReplayEvents() {
    const elapsed = Math.max(0, performance.now() - this.replayStartTime);
    while (
      this._replayCursor < this._replayRecords.length &&
      this._replayRecords[this._replayCursor].time <= elapsed + 0.5
    ) {
      this.triggerKey(this._replayRecords[this._replayCursor]);
      this._replayCursor += 1;
    }
  }

  triggerKey(record) {
    const event = new KeyboardEvent(record["keyType"], {
      code: record["code"],
    }); //创建键盘事件
    Object.defineProperty(event, "isReplay", { value: true });
    window.dispatchEvent(event); //发布键盘事件
  }

  beingReplay() {
    if (this._onReplayStart) this._onReplayStart();
    if (this.replayer) this.replayer.isReplaying = true;
    this._pausedReplayElapsed = null;
    this.replayStartTime = performance.now();

    this.replayTimer = setTimeout(() => {
      this.transition("ReplayTimeout");
    }, this.recordEndTime - this.recordStartTime);

    this.dispatchEvent();
  }

  finishReplayAndReset() {
    if (this.replayer) this.replayer.isReplaying = false;
    this.replayTimer = null;
    if (this.eventDispatchTimer) {
      clearTimeout(this.eventDispatchTimer);
      this.eventDispatchTimer = null;
    }
    this.eventTimers = [];
    this._replayRecords = [];
    this._replayCursor = 0;
    this._pausedReplayElapsed = null;
    this.replayer.inLevelReset();
  }

  finishReplayByKey() {
    // 按 R 键提前停止回放
    if (this.replayer) this.replayer.isReplaying = false;
    if (this.replayTimer) clearTimeout(this.replayTimer);
    this.replayTimer = null;
    if (this.eventDispatchTimer) {
      clearTimeout(this.eventDispatchTimer);
      this.eventDispatchTimer = null;
    }
    for (const timer of this.eventTimers) {
      clearTimeout(timer);
    }
    this.eventTimers = [];
    this._replayRecords = [];
    this._replayCursor = 0;
    this._pausedReplayElapsed = null;
    // 重置 replayer 位置和输入状态，保留监听器供下次回放使用
    if (this.replayer) this.replayer.inLevelReset();
  }

  process(event) {
    // 通过 KeyBindingManager 查询键码对应的意图
    const intent = this._keyBindingManager.getIntentByKey(event.code);

    // 只处理 record 和 replay 意图
    if (intent !== "record" && intent !== "replay") {
      return null;
    }

    if (event.type === "keydown") {
      if (this._pressedKeys.has(intent)) {
        return null;
      } else {
        this._pressedKeys.add(intent);
        return intent; // 返回意图而不是事件
      }
    }

    if (event.type === "keyup") {
      this._pressedKeys.delete(intent);
      return null;
    }
  }
  //input: string -> return: void
  transition(input) {
    const nextState = this.states[this.state][input];
    if (!nextState) {
      return false;
    } else {
      const actionFunc = this.actions[this.state][input];
      this.state = nextState;
      actionFunc.call(this);
    }
  }

  draw(p) {
    if (!this._hudVisible) return;
    RecordUI.draw(p, {
      state: this.state,
      maxRecordTime: this.maxRecordTime,
      recordStartTime: this.recordStartTime,
      recordEndTime: this.recordEndTime,
      replayStartTime: this.replayStartTime,
      pausedRecordElapsed: this._pausedRecordElapsed,
      pausedReplayElapsed: this._pausedReplayElapsed,
      airBlockFlashMs: this._airBlockFlashMs,
      player: this.player,
    });
  }
}
