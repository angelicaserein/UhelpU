// js/i18n.js — 国际化 / Internationalization
// 用法：import { i18n, t } from '../i18n.js';
//       t('key') 获取当前语言对应的文字

const _dict = {
  en: {
    // ── Menu ─────────────────────────────────────────────────────────
    btn_play: "PLAY",
    btn_settings: "Settings",
    btn_achieves: "Achieves",
    menu_subtitle: "----   you help you   ----",

    // ── Result ───────────────────────────────────────────────────────
    btn_back_menu: "Back to Menu",
    btn_restart: "Restart Level",
    btn_next_level: "Next Level",
    result_win: "Level Complete!",
    result_lose: "Game Over",
    result_press_r: "Press R to Restart",

    // ── Setting Window ───────────────────────────────────────────────
    win_title: "⚙  Settings",
    win_sound: "🔊 Sound",
    win_bgm: "BGM",
    win_sfx: "SFX",
    win_language: "🌐 Language",
    win_keybind: "⌨ Controls",
    win_credits: "📜 Credits",
    win_credits_content:
      "Game Design & Development:\nTeam 13\n\nSpecial Thanks:\nBristol University",
    pause_title: "⏸  Paused",
    pause_hint: "Game is paused",
    pause_resume: "▶  Resume",
    pause_setting: "⚙  Setting",
    pause_hint_btn: "💡  Hint",
    pause_restart: "🔄  Restart Level",
    pause_back_level_choice: "🗺  Back to Level Choice",
    pause_back_menu: "⏏  Back to Menu",
    hint_title: "💡  Hint",
    keybind_reset_title: "Reset to default",
    keybind_conflict: "The key {KEY} is already bound to {ACTION}",
    keybind_jump: "Jump",
    keybind_moveLeft: "Move Left",
    keybind_moveRight: "Move Right",
    keybind_interaction: "Interaction",
    keybind_record: "Record/Stop",
    keybind_replay: "Replay",
    keybind_teleportCheckpoint: "Teleport to Checkpoint",

    // ── Record HUD ───────────────────────────────────────────────────
    rec_title_standby: "Phantom Recorder Standby",
    rec_title_recording: "Recording: actions being recorded",
    rec_title_ready: "Record Complete",
    rec_title_replaying: "Replaying",
    rec_sub_max: "Press {KEY} to Start Recording | Max Record Duration",
    rec_sub_press_e_end: "Press {KEY} to end early",
    rec_sub_press_replay_end: "Press {KEY} to end replay early",
    rec_sub_ready_prefix:
      "Press {REPLAY} to replay | {RECORD} to re-record  Recorded",
    rec_hud_label: "RECORD HUD",
    rec_blocked_air: "Land first to record!",
    click_to_close: "Click anywhere to close",

    // ── Achievement ─────────────────────────────────────────────────
    achievement_unlocked: "New Achievement Unlocked!",
    achiev_title: "Achievements",
    achiev_locked: "???",
    achiev_locked_desc: "Complete the required task to unlock this achievement",

    // ── World Select ─────────────────────────────────────────────────
    world_1: "Demo 2",
    world_2: "World 2",
    world_3: "Demo 1",
  },

  zh: {
    // ── Menu ─────────────────────────────────────────────────────────
    btn_play: "开始",
    btn_settings: "设置",
    btn_achieves: "成就",
    menu_subtitle: "----   能自渡者，方得天助   ----",

    // ── Result ───────────────────────────────────────────────────────
    btn_back_menu: "返回菜单",
    btn_restart: "重新开始当前关卡",
    btn_next_level: "下一关",
    result_win: "~恭喜通关~",
    result_lose: "游戏结束",
    result_press_r: "按 R 键重新开始",

    // ── Setting Window ───────────────────────────────────────────────
    win_title: "⚙  设置",
    win_sound: "🔊 音效设置",
    win_bgm: "背景音乐",
    win_sfx: "音效",
    win_language: "🌐 语言",
    win_keybind: "⌨ 按键设置",
    win_credits: "📜 制作人员",
    win_credits_content:
      "游戏设计与开发：\nTeam 13\n\n特别鸣谢：\n布里斯托尔大学",
    pause_title: "⏸  已暂停",
    pause_hint: "游戏已暂停",
    pause_resume: "▶  继续游戏",
    pause_setting: "⚙  设置",
    pause_hint_btn: "💡  提示",
    pause_restart: "🔄  重开当前关卡",
    pause_back_level_choice: "🗺  返回关卡选择",
    pause_back_menu: "⏏  返回菜单",
    hint_title: "💡  提示",
    keybind_reset_title: "重置为默认",
    keybind_conflict: "按键 {KEY} 已绑定到 {ACTION}",
    keybind_jump: "跳跃",
    keybind_moveLeft: "向左移动",
    keybind_moveRight: "向右移动",
    keybind_interaction: "交互",
    keybind_record: "录制/停止",
    keybind_replay: "回放",
    keybind_teleportCheckpoint: "回到存档点",

    // ── Record HUD ───────────────────────────────────────────────────
    rec_title_standby: "幻影录制器待命",
    rec_title_recording: "录制中:现在你的动作正在被记录",
    rec_title_ready: "录制完成",
    rec_title_replaying: "回放中",
    rec_sub_max: "按 {KEY} 开始录制 | 最大录制时长",
    rec_sub_press_e_end: "按 {KEY} 可提前结束录制",
    rec_sub_press_replay_end: "按 {KEY} 可提前结束回放",
    rec_sub_ready_prefix: "按 {REPLAY} 回放，按 {RECORD} 重新录制  已录制",
    rec_hud_label: "录制面板",
    rec_blocked_air: "落地后才能录制！",
    click_to_close: "点击任意处关闭",

    // ── 成就 ──────────────────────────────────────────────────────────
    achievement_unlocked: "新的成就已解锁！",
    achiev_title: "成就",
    achiev_locked: "???",
    achiev_locked_desc: "完成指定任务以解锁此成就",

    // ── World Select ─────────────────────────────────────────────────
    world_1: "Demo 2",
    world_2: "世界 2",
    world_3: "初代 Demo",
  },
};

// const LANG_STORAGE_KEY = 'kinoko_lang';

// 移除localStorage，始终使用默认语言en
let _lang = "en";
const _listeners = [];

export const i18n = {
  /** 切换语言，触发所有已注册的监听器 */
  setLang(lang) {
    if (!_dict[lang] || _lang === lang) return;
    _lang = lang;
    // 不再持久化
    _listeners.forEach((fn) => fn(lang));
  },

  getLang() {
    return _lang;
  },

  /** 注册语言变化监听器 */
  onChange(fn) {
    _listeners.push(fn);
  },

  /** 注销监听器 */
  offChange(fn) {
    const idx = _listeners.indexOf(fn);
    if (idx !== -1) _listeners.splice(idx, 1);
  },
};

/**
 * 快捷取文字函数：用当前语言取 _dict[lang][key]，
 * 找不到时回退到英文，再找不到返回 key 本身。
 */
export function t(key) {
  return _dict[_lang]?.[key] ?? _dict["en"]?.[key] ?? key;
}

/**
 * 注册额外的翻译条目（供各 demo 模块调用）。
 * @param {{ [lang: string]: Record<string, string> }} langEntries
 */
export function registerTranslations(langEntries) {
  for (const [lang, entries] of Object.entries(langEntries)) {
    if (!_dict[lang]) _dict[lang] = {};
    Object.assign(_dict[lang], entries);
  }
}
