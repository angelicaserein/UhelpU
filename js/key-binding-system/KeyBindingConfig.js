/**
 * KeyBindingConfig.js — 按键配置数据层
 * 负责读写 localStorage 中的按键绑定配置
 */

// 默认按键配置
export const DEFAULT_KEYBINDING = {
  // 游戏控制
  jump: "KeyW",
  moveLeft: "KeyA",
  moveRight: "KeyD",
  interaction: "KeyE",

  // 录制系统
  record: "KeyC",
  replay: "KeyR",
};

// localStorage 储存键名（已废弃，刷新不再持久化）
// export const STORAGE_KEY = 'game_keybinding';

/**
 * 配置管理类：负责 localStorage 的读写
 */
export class KeyBindingConfig {
  /**
   * 兼容旧版本默认键位：旧版本没有 interaction，且 record 默认是 KeyE。
   * 升级时将 interaction 设为 KeyE，并把 record 挪到 KeyC。
   * @param {Object} raw
   * @returns {Object}
   */
  static migrateLegacy(raw = {}) {
    const migrated = { ...(raw || {}) };
    const hasInteraction = Object.prototype.hasOwnProperty.call(
      migrated,
      "interaction",
    );
    if (!hasInteraction && migrated.record === "KeyE") {
      migrated.record = "KeyC";
      migrated.interaction = "KeyE";
    }
    return migrated;
  }

  /**
   * 只保留默认意图键，避免旧版本脏数据污染配置。
   * @param {Object} raw
   * @returns {Object}
   */
  static sanitize(raw = {}) {
    const clean = {};
    for (const [intent, defaultKey] of Object.entries(DEFAULT_KEYBINDING)) {
      const candidate = raw[intent];
      clean[intent] =
        typeof candidate === "string" && candidate.length > 0
          ? candidate
          : defaultKey;
    }
    return clean;
  }

  /**
   * 加载配置：始终返回默认配置（不再持久化）
   */
  static load() {
    return { ...DEFAULT_KEYBINDING };
  }

  /**
   * 保存配置：无操作（不再持久化）
   */
  static save(config) {
    // 不再持久化
  }

  /**
   * 重置为默认配置：无操作（不再持久化）
   */
  static reset() {
    // 不再持久化
  }
}
