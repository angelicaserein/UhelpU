// js/tutorial-system/i18n-tutorial.js — 教学系统国际化文本
// 导入即自动注册到全局 i18n 字典

import { registerTranslations } from "../i18n.js";

registerTranslations({
  en: {
    // ── PHASE 1: Guide Record ──────────────────────────────────────
    tutorial_guide_record_msg: "Follow the recording UI and start recording!",

    // ── PHASE 2: Guide Timeline ────────────────────────────────────
    tutorial_guide_timeline_msg: "You have 5 seconds to record. Press any movement key to start!",

    // ── PHASE 3: Recording ─────────────────────────────────────────
    tutorial_recording_msg: "Now try to move! You can see your actions being captured. Press the capture key again to stop early.",

    // ── PHASE 4: Guide Replay ──────────────────────────────────────
    tutorial_guide_replay_msg: "Follow the replay key hint to watch your phantom replay!",
    tutorial_phantom_label: "You've captured your spawn point!",
    tutorial_actions_label: "You've captured your actions!",

    // ── PHASE 5: Replaying ─────────────────────────────────────────
    tutorial_replaying_msg: "You can interrupt the replay anytime!",
    tutorial_phantom_replaying_label: "Your phantom is replaying your recorded actions!",

    // ── PHASE 6: Complete ──────────────────────────────────────────
    tutorial_complete_msg: "Great! Now use your newfound skills to complete the level!",

    // ── ESC/Skip ────────────────────────────────────────────────────
    tutorial_press_esc_to_skip: "Press ESC to skip the tutorial",
  },

  zh: {
    // ── PHASE 1: Guide Record ──────────────────────────────────────
    tutorial_guide_record_msg: "按照这个录制 UI 上面的字，开始录制吧！",

    // ── PHASE 2: Guide Timeline ────────────────────────────────────
    tutorial_guide_timeline_msg: "你一共有 5 秒的时间可以录制你自己的操作，按移动、跳跃或任意键继续！",

    // ── PHASE 3: Recording ─────────────────────────────────────────
    tutorial_recording_msg: "现在可以尝试移动！你可以看见你的动作正在被捕捉，并且也可以再按一次捕捉键来提前结束捕捉。",

    // ── PHASE 4: Guide Replay ──────────────────────────────────────
    tutorial_guide_replay_msg: "按照这个按键提示，开始回放吧！",
    tutorial_phantom_label: "你已经捕捉了你自己的出生点操作！",
    tutorial_actions_label: "你已经捕捉了自己的操作！",

    // ── PHASE 5: Replaying ─────────────────────────────────────────
    tutorial_replaying_msg: "这里你也可以随时中断回放！",
    tutorial_phantom_replaying_label: "你的幻影已经按照你捕捉的动作进行回放了！",

    // ── PHASE 6: Complete ──────────────────────────────────────────
    tutorial_complete_msg: "你已经完成了教学！多多利用你的技能完成关卡吧！",

    // ── ESC/Skip ────────────────────────────────────────────────────
    tutorial_press_esc_to_skip: "按 ESC 跳过教程",
  },
});
