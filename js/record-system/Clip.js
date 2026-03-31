import { isGamePaused } from "../game-runtime/GamePauseState.js";
import { KeyBindingManager } from "../key-binding-system/KeyBindingManager.js";

export class Clip {
  constructor(startX, startY, recordStartTime) {
    this._startX = startX;
    this._startY = startY;
    this.records = [];
    this.recordStartTime = recordStartTime; //

    this._keyBindingManager = KeyBindingManager.getInstance();
    this._pressedKeys = new Set();

    this._keydownHandler = (event) => this.eventHandler(event);
    this._keyupHandler = (event) => this.eventHandler(event);
  }
  eventHandler(event) {
    if (isGamePaused()) {
      this.resetInputState();
      return;
    }
    const processedEvent = this.process(event);
    if (processedEvent) {
      const record = {
        keyType: event.type,
        code: event.code,
        time: performance.now() - this.recordStartTime,
      };
      this.records.push(record);
    }
  }
  injectHeldKeys(heldKeys) {
    const allowedKeys = this._getAllowedKeys();
    for (const code of heldKeys) {
      if (allowedKeys.has(code)) {
        this._pressedKeys.add(code);
        this.records.push({
          keyType: "keydown",
          code: code,
          time: 0,
        });
      }
    }
  }

  createListeners() {
    window.addEventListener("keydown", this._keydownHandler);
    window.addEventListener("keyup", this._keyupHandler);
  }

  clearListeners() {
    window.removeEventListener("keydown", this._keydownHandler);
    window.removeEventListener("keyup", this._keyupHandler);
  }

  resetInputState() {
    this._pressedKeys.clear();
  }

  getStartX() {
    return this._startX;
  }

  getStartY() {
    return this._startY;
  }
  getRecords() {
    return this.records;
  }

  // 动态获取当前允许的按键
  _getAllowedKeys() {
    return new Set(
      [
        this._keyBindingManager.getKeyByIntent("jump"),
        this._keyBindingManager.getKeyByIntent("moveLeft"),
        this._keyBindingManager.getKeyByIntent("moveRight"),
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "Space",
      ].filter(Boolean),
    );
  }

  process(event) {
    // 动态获取当前允许的按键，这样当用户改变按键绑定时也能工作
    const allowedKeys = this._getAllowedKeys();
    if (!allowedKeys.has(event.code)) {
      return null;
    }

    if (event.type === "keydown") {
      if (this._pressedKeys.has(event.code)) {
        return null;
      }
      this._pressedKeys.add(event.code);
      return event;
    }

    if (event.type === "keyup") {
      //assert(pressedKeys.has(event.code));
      this._pressedKeys.delete(event.code);
      return event;
    }
  }
}
