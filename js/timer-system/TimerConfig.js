/**
 * TimerConfig.js
 * 计时器配置表 - 决定哪些关卡启用计时
 *
 * 使用方式：
 * - 在 LevelTimerManager 中读取此配置
 * - 可在运行时通过 enableTimerForLevel() 函数修改
 */

export const TIMER_CONFIG = {
  // ── 简单难度（启用计时） ────────────────────────────────────
  easy_level1: { enabled: false },
  easy_level2: { enabled: true },
  easy_level3: { enabled: false },
  easy_level4: { enabled: false },
  easy_level5: { enabled: false },
  easy_level6: { enabled: false },
  easy_level7: { enabled: false },
  easy_level8: { enabled: false },
  easy_level9: { enabled: false },
  easy_level10: { enabled: false },

  // ── Demo1 难度（禁用计时） ────────────────────────────────────
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

  // ── Demo2 难度（禁用计时） ────────────────────────────────────
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
 * 运行时启用或禁用某个关卡的计时器
 * @param {string} levelId - 关卡ID
 * @param {boolean} enabled - 是否启用
 */
export function enableTimerForLevel(levelId, enabled) {
  TIMER_CONFIG[levelId] = { enabled };
  console.log(`[TimerConfig] Timer for level "${levelId}" set to: ${enabled}`);
}
