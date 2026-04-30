/**
 * KeyBindingManager.js — Key binding manager (singleton)
 * 按键管理器（单例）
 *
 * Responsibilities:
 * 职责：
 * - Maintain current key binding configuration | 维持当前的按键配置
 * - Provide query interfaces (bidirectional mapping of keys<->intents) | 提供查询接口（按键<->意图的双向映射）
 * - Handle configuration changes and persistence | 处理配置变更和持久化
 * - Notify listeners of configuration changes | 通知监听器配置已变更
 */

import {
  KeyBindingConfig,
  DEFAULT_KEYBINDING,
  KEY_ALIASES,
} from "./KeyBindingConfig.js";

export class KeyBindingManager {
  static _instance = null;

  constructor() {
    // Singleton mode: allow only one instance | 单例模式：只允许一个实例
    if (KeyBindingManager._instance) {
      return KeyBindingManager._instance;
    }

    // Load saved configuration (or use default) | 加载已保存的配置（或使用默认值）
    this._config = KeyBindingConfig.load();

    // Reverse mapping: key code -> intent | 反向映射：按键码 -> 意图
    // Example: { "KeyW": "jump", "KeyA": "moveLeft", "KeyD": "moveRight" } | 例：{ "KeyW": "jump", "KeyA": "moveLeft", "KeyD": "moveRight" }
    this._reverseMap = this._buildReverseMap();

    // Change listener array | 变更监听器数组
    this._listeners = [];

    KeyBindingManager._instance = this;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query interfaces | 查询接口
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Key code -> intent | 按键码 -> 意图
   * @param {string} keyCode - Key code (e.g., 'KeyW') | 按键码（如 'KeyW'）
   * @returns {string|undefined} Intent name (e.g., 'jump'), returns undefined if not found | 意图名称（如 'jump'），不存在则返回 undefined
   */
  getIntentByKey(keyCode) {
    return this._reverseMap[keyCode];
  }

  /**
   * Intent -> key code | 意图 -> 按键码
   * @param {string} intent - Intent name (e.g., 'jump') | 意图名称（如 'jump'）
   * @returns {string|undefined} Key code (e.g., 'KeyW'), returns undefined if not found | 按键码（如 'KeyW'），不存在则返回 undefined
   */
  getKeyByIntent(intent) {
    return this._config[intent];
  }

  /**
   * Get all allowed keys (Set collection) | 获取所有允许的按键（Set 集合）
   * @returns {Set<string>} Key code set | 按键码集合
   */
  getAllowedKeys() {
    return new Set([
      ...Object.values(this._config),
      ...Object.keys(KEY_ALIASES),
    ]);
  }

  /**
   * 获取当前完整配置副本
   * @returns {Object} 配置对象（深拷贝）
   */
  getConfig() {
    return { ...this._config };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Modification interfaces | 修改接口
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Re-bind an intent to a new key | 重新绑定成帯到新按键
   * @param {string} intent - Intent name (e.g., 'jump') | 意图名称（如 'jump'）
   * @param {string} newKeyCode - New key code (e.g., 'KeyW') | 新的按键码（如 'KeyW'）
   * @returns {boolean} Returns true on success, false if intent doesn't exist | 成功返回 true，意图不存在返回 false
   */
  rebind(intent, newKeyCode) {
    if (!this._config.hasOwnProperty(intent)) {
      console.warn(`[KeyBindingManager] Unknown intent: ${intent}`);
      return false;
    }

    this._config[intent] = newKeyCode;
    this._reverseMap = this._buildReverseMap();
    KeyBindingConfig.save(this._config);

    // Notify all listeners | 通知所有监听器
    this._notifyListeners(intent, newKeyCode);
    return true;
  }

  /**
   * Reset to default key binding configuration | 重置为默认按键配置
   */
  reset() {
    this._config = { ...DEFAULT_KEYBINDING };
    this._reverseMap = this._buildReverseMap();
    KeyBindingConfig.save(this._config);

    // Notify listeners: complete reset (pass null) | 通知监听器：完全重置（传 null）
    this._notifyListeners(null, null);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Listener interfaces | 监听器接口
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Register configuration change listener | 注册配置变更监听器
   * @param {Function} callback - Callback function with signature (intent, newKeyCode) | 回调函数，签名为 (intent, newKeyCode)
   */
  onChange(callback) {
    this._listeners.push(callback);
  }

  /**
   * Unregister listener | 注销监听器
   * @param {Function} callback - Callback function to remove | 要移除的回调函数
   */
  offChange(callback) {
    const idx = this._listeners.indexOf(callback);
    if (idx !== -1) {
      this._listeners.splice(idx, 1);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Internal helper methods | 内部辅助方法
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Build reverse mapping: key code -> intent | 构建反向映射：按键码 -> 意图
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
   * Notify all listeners that configuration has changed | 通知所有监听器配置已变更
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
  // Utility methods | 工具方法
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Convert keyCode (e.g., "KeyE") to display label (e.g., "E") | 将 keyCode（如 "KeyE"）转换为显示标签（如 "E"）
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
   * Parse {key:intent} placeholders in text, replace with currently bound key label.
   * Example: "{key:teleportCheckpoint}" → "B"
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
  // Singleton accessor | 单例获取
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get KeyBindingManager singleton | 获取 KeyBindingManager 单例
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
