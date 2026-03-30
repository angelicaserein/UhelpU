/**
 * KeyBindingManager.js — 按键管理器（单例）
 *
 * 职责：
 * - 维护当前的按键配置
 * - 提供查询接口（按键<->意图的双向映射）
 * - 处理配置变更和持久化
 * - 通知监听器配置已变更
 */

import { KeyBindingConfig, DEFAULT_KEYBINDING, KEY_ALIASES } from "./KeyBindingConfig.js";

export class KeyBindingManager {
  static _instance = null;

  constructor() {
    // 单例模式：只允许一个实例
    if (KeyBindingManager._instance) {
      return KeyBindingManager._instance;
    }

    // 加载已保存的配置（或使用默认值）
    this._config = KeyBindingConfig.load();

    // 反向映射：按键码 -> 意图
    // 例：{ "KeyW": "jump", "KeyA": "moveLeft", "KeyD": "moveRight" }
    this._reverseMap = this._buildReverseMap();

    // 变更监听器数组
    this._listeners = [];

    KeyBindingManager._instance = this;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 查询接口
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 按键码 -> 意图
   * @param {string} keyCode - 按键码（如 'KeyW'）
   * @returns {string|undefined} 意图名称（如 'jump'），不存在则返回 undefined
   */
  getIntentByKey(keyCode) {
    return this._reverseMap[keyCode];
  }

  /**
   * 意图 -> 按键码
   * @param {string} intent - 意图名称（如 'jump'）
   * @returns {string|undefined} 按键码（如 'KeyW'），不存在则返回 undefined
   */
  getKeyByIntent(intent) {
    return this._config[intent];
  }

  /**
   * 获取所有允许的按键（Set 集合）
   * @returns {Set<string>} 按键码集合
   */
  getAllowedKeys() {
    return new Set([...Object.values(this._config), ...Object.keys(KEY_ALIASES)]);
  }

  /**
   * 获取当前完整配置副本
   * @returns {Object} 配置对象（深拷贝）
   */
  getConfig() {
    return { ...this._config };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 修改接口
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 重新绑定某个意图到新按键
   * @param {string} intent - 意图名称（如 'jump'）
   * @param {string} newKeyCode - 新的按键码（如 'KeyW'）
   * @returns {boolean} 成功返回 true，意图不存在返回 false
   */
  rebind(intent, newKeyCode) {
    if (!this._config.hasOwnProperty(intent)) {
      console.warn(`[KeyBindingManager] Unknown intent: ${intent}`);
      return false;
    }

    this._config[intent] = newKeyCode;
    this._reverseMap = this._buildReverseMap();
    KeyBindingConfig.save(this._config);

    // 通知所有监听器
    this._notifyListeners(intent, newKeyCode);
    return true;
  }

  /**
   * 重置为默认按键配置
   */
  reset() {
    this._config = { ...DEFAULT_KEYBINDING };
    this._reverseMap = this._buildReverseMap();
    KeyBindingConfig.save(this._config);

    // 通知监听器：完全重置（传 null）
    this._notifyListeners(null, null);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 监听器接口
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 注册配置变更监听器
   * @param {Function} callback - 回调函数，签名为 (intent, newKeyCode)
   */
  onChange(callback) {
    this._listeners.push(callback);
  }

  /**
   * 注销监听器
   * @param {Function} callback - 要移除的回调函数
   */
  offChange(callback) {
    const idx = this._listeners.indexOf(callback);
    if (idx !== -1) {
      this._listeners.splice(idx, 1);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 内部辅助方法
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 构建反向映射：按键码 -> 意图
   * @private
   */
  _buildReverseMap() {
    const map = {};
    for (const [intent, keyCode] of Object.entries(this._config)) {
      map[keyCode] = intent;
    }
    for (const [keyCode, intent] of Object.entries(KEY_ALIASES)) {
      map[keyCode] = intent;
    }
    return map;
  }

  /**
   * 通知所有监听器配置已变更
   * @private
   */
  _notifyListeners(intent, newKeyCode) {
    this._listeners.forEach((fn) => {
      try {
        fn(intent, newKeyCode);
      } catch (e) {
        console.error("[KeyBindingManager] Listener error:", e);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 工具方法
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 将 keyCode（如 "KeyE"）转换为显示标签（如 "E"）
   * @param {string} keyCode
   * @returns {string}
   */
  static keyCodeToLabel(keyCode) {
    if (!keyCode) return "?";
    if (keyCode.startsWith("Key")) return keyCode.slice(3);
    if (keyCode.startsWith("Digit")) return keyCode.slice(5);
    if (keyCode === "Space") return "SPACE";
    if (keyCode === "ShiftLeft" || keyCode === "ShiftRight") return "SHIFT";
    if (keyCode === "ControlLeft" || keyCode === "ControlRight") return "CTRL";
    return keyCode;
  }

  /**
   * 解析文本中的 {key:intent} 占位符，替换为当前绑定的按键标签。
   * 例："{key:teleportCheckpoint}" → "B"
   * @param {string} text
   * @returns {string}
   */
  static resolveKeyPlaceholders(text) {
    if (!text || typeof text !== "string") return text;
    const mgr = KeyBindingManager.getInstance();
    return text.replace(/\{key:(\w+)\}/g, (_, intent) => {
      const keyCode = mgr.getKeyByIntent(intent);
      return KeyBindingManager.keyCodeToLabel(keyCode);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 单例获取
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 获取 KeyBindingManager 单例
   * @static
   * @returns {KeyBindingManager}
   */
  static getInstance() {
    if (!KeyBindingManager._instance) {
      new KeyBindingManager();
    }
    return KeyBindingManager._instance;
  }
}
