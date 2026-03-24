// js/i18n.js — 国际化 / Internationalization
// 用法：import { i18n, t } from '../i18n.js';
//       t('key') 获取当前语言对应的文字

const _dict = {
  en: {
    // ── Menu ─────────────────────────────────────────────────────────
    btn_play: "PLAY",
    btn_settings: "Settings",
    btn_credits: "Credits",
    menu_subtitle: "----   you help you   ----",

    // ── Opening Story ────────────────────────────────────────────────
    btn_skip: "PRESS [ENTER] TO SKIP",
    notebook_front:
      '<div class="scene-hint-title">This Is You</div><div class="scene-hint-body">Pause in-game to check hints!\nTry to complete the level without hints~</div><div class="scene-hint-footer">click to turn the page</div>',
    notebook_back:
      '<div class="scene-hint-title">This Is Also You</div><div class="scene-hint-body">Temporarily consider it as your phantom.\nPretty smart eyes, and very obedient!</div><div class="scene-hint-footer">click to turn the page</div>',
    story_loading: "Loading story...",

    // ── Result ───────────────────────────────────────────────────────
    btn_back_menu: "Back to Menu",
    btn_restart: "Restart Level",
    btn_next_level: "Next Level",
    result_win: "Level Complete!",
    result_lose: "Game Over",

    // ── Setting Window ───────────────────────────────────────────────
    win_title: "⚙  Settings",
    win_sound: "🔊 Sound",
    win_bgm: "BGM",
    win_sfx: "SFX",
    win_language: "🌐 Language",
    win_keybind: "⌨ Controls",
    pause_title: "⏸  Paused",
    pause_hint: "Game is paused",
    pause_resume: "▶  Resume",
    pause_setting: "⚙  Setting",
    pause_hint_btn: "💡  Hint",
    pause_back_level_choice: "🗺  Back to Level Choice",
    pause_back_menu: "⏏  Back to Menu",
    hint_title: "💡  Hint",
    hint_level1:
      "Record yourself next to the platform. Do not move around randomly. After finishing recording, press the playback button. Jump up by stepping on your own head.",
    hint_level2:
      "while recording, jump to have a higher platform, then step on two buttons at the same time to open the portal",
    hint_level3: "Level 3 hint example",
    hint_level4: "Level 4 hint example",
    keybind_reset_title: "Reset to default",
    keybind_conflict: "The key {KEY} is already bound to {ACTION}",
    keybind_jump: "Jump",
    keybind_moveLeft: "Move Left",
    keybind_moveRight: "Move Right",
    keybind_interaction: "Interaction",
    keybind_record: "Record/Stop",
    keybind_replay: "Replay",

    // ── Record HUD ───────────────────────────────────────────────────
    rec_title_standby: "Phantom Recorder Standby",
    rec_title_recording: "Recording",
    rec_title_ready: "Record Complete",
    rec_title_replaying: "Replaying",
    rec_sub_max: "Press {KEY} to Start Recording | Max Record Duration",
    rec_sub_press_e_end: "Press {KEY} to end early",
    rec_sub_press_replay_end: "Press {KEY} to end replay early",
    rec_sub_ready_prefix:
      "Press {REPLAY} to replay | {RECORD} to re-record  Recorded",
    rec_hud_label: "RECORD HUD",
    rec_blocked_air: "Land first to record!",
    level1_missed_prompt:
      "Wait... did I just miss something? let me carefully check the noticeboard content",
    level1_replay_prompt:
      "...He is repeating every step I just did.\nI think... I cannot touch him? Is it really impossible to touch him?",
    level1_title: "Rule",
    level2_title: "Higher",
    level2_jump_higher_prompt: "How can I jump much higher?",
    level2_jump_hint_window:
      'Congratulations! You\'ve unlocked the achievement: "<span class="rainbow-wave">P</span><span class="rainbow-wave">e</span><span class="rainbow-wave">r</span><span class="rainbow-wave">s</span><span class="rainbow-wave">e</span><span class="rainbow-wave">v</span><span class="rainbow-wave">e</span><span class="rainbow-wave">r</span><span class="rainbow-wave">a</span><span class="rainbow-wave">n</span><span class="rainbow-wave">c</span><span class="rainbow-wave">e</span>"!\n(Hint: hint is in the pause menu, not here haha)',
    level3_title: "Electricity",
    level4_title: "Level 4 Title Placeholder",
    module_btn_label: "Install Module",
    module_installation_complete:
      "Installation Complete\n Now you can see the record HUD",
    first_record_prompt:
      "You have successfully learned to record your actions!\nPress the record key again to start~\nMax recording duration: 5 seconds",
    click_to_close: "Click anywhere to close",
  },

  zh: {
    // ── Menu ─────────────────────────────────────────────────────────
    btn_play: "开始",
    btn_settings: "设置",
    btn_credits: "关于",
    menu_subtitle: "----   能自渡者，方得天助   ----",

    // ── Opening Story ────────────────────────────────────────────────
    btn_skip: "按 [ENTER] 跳过",
    notebook_front:
      '<div class="scene-hint-title">这是你</div><div class="scene-hint-body">关卡内暂停可以查看提示！\n试试不看提示通关吧~</div><div class="scene-hint-footer">点击可以翻页哦！</div>',
    notebook_back:
      '<div class="scene-hint-title">这也是你</div><div class="scene-hint-body">暂且把它当成你的幻影吧\n眼神比较智慧，也很听话！</div><div class="scene-hint-footer">点击可以翻回去哦！</div>',
    story_loading: "故事加载中...",

    // ── Result ───────────────────────────────────────────────────────
    btn_back_menu: "返回菜单",
    btn_restart: "重新开始当前关卡",
    btn_next_level: "下一关",
    result_win: "恭喜通关！",
    result_lose: "游戏结束",

    // ── Setting Window ───────────────────────────────────────────────
    win_title: "⚙  设置",
    win_sound: "🔊 音效设置",
    win_bgm: "背景音乐",
    win_sfx: "音效",
    win_language: "🌐 语言",
    win_keybind: "⌨ 按键设置",
    pause_title: "⏸  已暂停",
    pause_hint: "游戏已暂停",
    pause_resume: "▶  继续游戏",
    pause_setting: "⚙  设置",
    pause_hint_btn: "💡  提示",
    pause_back_level_choice: "🗺  返回关卡选择",
    pause_back_menu: "⏏  返回菜单",
    hint_title: "💡  提示",
    hint_level1:
      "在平台旁边录制自己，不要乱移动，结束录制之后按回放键，踩着自己的头跳上去",
    hint_level2:
      "录制自己的过程中跳跃，自己踩在自己的回放幻影头上，在幻影起跳的同时自己也起跳，利用这个技巧踩上更高的平台，最后操纵幻影同时按下两个按钮，打开传送门",
    hint_level3: "level3提示实例",
    hint_level4: "level4提示实例",
    keybind_reset_title: "重置为默认",
    keybind_conflict: "按键 {KEY} 已绑定到 {ACTION}",
    keybind_jump: "跳跃",
    keybind_moveLeft: "向左移动",
    keybind_moveRight: "向右移动",
    keybind_interaction: "交互",
    keybind_record: "录制/停止",
    keybind_replay: "回放",

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
    level1_missed_prompt:
      "等等，我刚刚是不是错过了什么？让我仔细看看公告栏的内容",
    level1_replay_prompt:
      "……他在重复我刚才做的每一步。\n我好像……碰不到他？真的碰不到吗？",
    level1_title: "规则",
    level2_title: "登高",
    level2_jump_higher_prompt: "怎么才能跳得更高呢？",
    level2_jump_hint_window:
      '恭喜你解锁"<span class="rainbow-wave">坚</span><span class="rainbow-wave">持</span><span class="rainbow-wave">不</span><span class="rainbow-wave">懈</span>"的成就！\n（提示在暂停菜单里哦，不在这里哈哈）',
    level3_title: "通关",
    level4_title: "Level4标题占位",
    module_btn_label: "安装模块",
    module_installation_complete: "安装完成\n现在你可以看到录制面板了",
    first_record_prompt:
      "你学会录制自己的操作了！\n再按一次录制键开始吧\n最多只能录 5 秒哦",
    click_to_close: "点击任意处关闭",
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
