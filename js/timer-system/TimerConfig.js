/**
 * TimerConfig.js
 * Timer configuration table - determines which levels have timers enabled | 计时器配置表 - 决定哪些关卡启用计时
 *
 * Usage: Read this config in LevelTimerManager, can be modified at runtime via enableTimerForLevel() | 使用方式：在 LevelTimerManager 中读取此配置，可在运行时通过 enableTimerForLevel() 函数修改
 */

export const TIMER_CONFIG = {
  // ── Easy difficulty (Timer enabled) | 简单难度（启用计时） ────────────────────────────────────
  easy_level1: { enabled: true },
  easy_level2: { enabled: true },
  easy_level3: { enabled: true },
  easy_level4: { enabled: true },
  easy_level5: { enabled: true },
  easy_level6: { enabled: true },
  easy_level7: { enabled: true },
  easy_level8: { enabled: true },
  easy_level9: { enabled: true },
  easy_level10: { enabled: true },

  // ── Hard difficulty (Timer enabled) | 困难难度（启用计时） ────────────────────────────────────
  hard_level1: { enabled: true },
  hard_level2: { enabled: true },
  hard_level3: { enabled: true },
  hard_level4: { enabled: true },
  hard_level5: { enabled: true },
  hard_level6: { enabled: true },
  hard_level7: { enabled: true },
  hard_level8: { enabled: true },
  hard_level9: { enabled: true },
  hard_level10: { enabled: true },

  // ── Demo1 difficulty (Timer disabled) | Demo1 难度（禁用计时） ────────────────────────────────────
  level1: { enabled: false },
  level2: { enabled: false },
  level3: { enabled: false },
  level4: { enabled: false },
  level5: { enabled: false },
  level6: { enabled: false },
  level7: { enabled: false },
  level8: { enabled: false },
  level9: { enabled: false },
  level10: { enabled: false },

  // ── Demo2 difficulty (Timer disabled) | Demo2 难度（禁用计时） ────────────────────────────────────
  demo2_level1: { enabled: false },
  demo2_level2: { enabled: false },
  demo2_level3: { enabled: false },
  demo2_level4: { enabled: false },
  demo2_level5: { enabled: false },
  demo2_level6: { enabled: false },
  demo2_level7: { enabled: false },
  demo2_level8: { enabled: false },
  demo2_level9: { enabled: false },
  demo2_level10: { enabled: false },
};

/**
 * Enable or disable timer for a level at runtime | 运行时启用或禁用某个关卡的计时器
 * @param {string} levelId - Level ID | 关卡ID
 * @param {boolean} enabled - Whether to enable | 是否启用
 */
export function enableTimerForLevel(levelId, enabled) {
  TIMER_CONFIG[levelId] = { enabled };
  console.log(`[TimerConfig] Timer for level "${levelId}" set to: ${enabled}`);
}
