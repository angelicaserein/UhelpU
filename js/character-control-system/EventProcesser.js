import { KeyBindingManager } from "../key-binding-system/KeyBindingManager.js";

class EventProcesser {
  constructor() {}
  process() {}
}

export class BasicEventProcesser extends EventProcesser {
  constructor() {
    super();
    this._keyBindingManager = KeyBindingManager.getInstance();
    this._pressedKeys = new Set();
  }

  get pressedKeys() {
    return this._pressedKeys;
  }

  clearPressedKeys() {
    this._pressedKeys.clear();
  }

  process(event) {
    //输入层
    if (!this._keyBindingManager.getAllowedKeys().has(event.code)) {
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
