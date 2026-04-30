import { KeyBindingManager } from "../key-binding-system/KeyBindingManager.js";

class IntentResolver {
  constructor() {}
  resolve() {}
}
export class BasicIntentResolver extends IntentResolver {
  constructor() {
    super();
    this._keyBindingManager = KeyBindingManager.getInstance();
    this._conflictResolver = {
      right: false,
      left: false,
    };
  }

  get conflictResolver() {
    return this._conflictResolver;
  }

  resetConflictResolver() {
    this._conflictResolver["left"] = false;
    this._conflictResolver["right"] = false;
  }

  resolve(event) {
    let intent = new Set();
    // Handle movement intent conflicts: when both keys are pressed simultaneously, use the latest intent.
    //�������ͼ������������ͬʱ��������ͼ

    // Dynamically query the KeyBindingManager for the intent mapped to this key.
    // ͨ�� KeyBindingManager ��̬��ѯ������Ӧ����ͼ
    const mappedIntent = this._keyBindingManager.getIntentByKey(event.code);

    if (event.type === "keydown") {
      if (mappedIntent === "jump") {
        intent.add("wantsJump");
      } else if (mappedIntent === "moveRight") {
        this._conflictResolver["left"] = false;
        this._conflictResolver["right"] = true;
      } else if (mappedIntent === "moveLeft") {
        this._conflictResolver["left"] = true;
        this._conflictResolver["right"] = false;
      }
    }

    if (event.type === "keyup") {
      if (mappedIntent === "moveRight") {
        this._conflictResolver["right"] = false;
      } else if (mappedIntent === "moveLeft") {
        this._conflictResolver["left"] = false;
      }
    }

    if (this._conflictResolver["left"] && !this._conflictResolver["right"]) {
      intent.add("wantsLeft");
    } else if (
      !this._conflictResolver["left"] &&
      this._conflictResolver["right"]
    ) {
      intent.add("wantsRight");
    } else if (
      !this._conflictResolver["left"] &&
      !this._conflictResolver["right"]
    ) {
      intent.add("wantsStopX");
    }

    return intent;
  }
  // Return the intent based on current key state, independent of events, for per-frame querying.
  // ���ص�ǰ����״̬�µ���ͼ���������¼�������ÿ֡��ѯ��
  getCurrentIntent() {
    const intent = new Set();
    if (this._conflictResolver["left"] && !this._conflictResolver["right"]) {
      intent.add("wantsLeft");
    } else if (
      !this._conflictResolver["left"] &&
      this._conflictResolver["right"]
    ) {
      intent.add("wantsRight");
    } else if (
      !this._conflictResolver["left"] &&
      !this._conflictResolver["right"]
    ) {
      intent.add("wantsStopX");
    }
    return intent;
  }
}
