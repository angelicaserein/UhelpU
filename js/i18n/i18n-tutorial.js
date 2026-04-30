// js/i18n/i18n-tutorial.js — Tutorial system i18n text | 教学系统国际化文本
// Auto-register to global i18n dictionary on import | 导入即自动注册到全局 i18n 字典

import { registerTranslations } from "./index.js";

registerTranslations({
  en: {
    // ── PHASE 1: Guide Record ──────────────────────────────────────
    tutorial_guide_record_msg:
      "Follow the capture key hint to try recording your actions!\nPress capture key to continue",

    // ── PHASE 2: Guide Timeline ────────────────────────────────────
    tutorial_guide_timeline_msg:
      "You have 5 seconds to record your actions. Try moving!\nPress move or jump to continue",

    // ── PHASE 3: Recording ─────────────────────────────────────────
    tutorial_recording_msg:
      "Your key presses are being recorded on the timeline.\nIn the real game, you can press the capture key again to stop recording early.",

    // ── PHASE 4: Guide Replay ──────────────────────────────────────
    tutorial_guide_replay_msg:
      "You've successfully captured your actions! You can see your phantom is ready at the bottom left corner. The spawn point of the phantom is the starting point of your recording!\nPress replay key to continue",

    // ── PHASE 5: Replaying ─────────────────────────────────────────
    tutorial_replaying_msg:
      "Your phantom will perfectly replicate the actions you just captured~ The phantom is no different from your real body and won't die!\nPress replay key again to end replay at any time",

    // ── PHASE 6: Complete ──────────────────────────────────────────
    tutorial_complete_msg:
      "Congratulations on completing the tutorial! You won't be able to clear the levels without the help of your phantom!\nCarefully plan every step of your actions and make good use of your phantom's abilities to complete the levels!",

    // ── ESC/Skip ────────────────────────────────────────────────────
    tutorial_press_esc_to_skip: "Press ESC to skip the tutorial",
  },

  zh: {
    // ── PHASE 1: Guide Record ──────────────────────────────────────
    tutorial_guide_record_msg:
      "请按照右上角幻影系统上的操作提示，尝试一下捕捉操作吧！\n按捕捉键继续",

    // ── PHASE 2: Guide Timeline ────────────────────────────────────
    tutorial_guide_timeline_msg:
      "你最多有 5 秒的时间可以录制你自己的操作，请尝试移动！\n按移动或跳跃继续",

    // ── PHASE 3: Recording ─────────────────────────────────────────
    tutorial_recording_msg:
      "在时间轴中可以看到你的按键操作正在被记录\n在正式游戏中，你可以通过再按一次捕捉键来提前终止录制",

    // ── PHASE 4: Guide Replay ──────────────────────────────────────
    tutorial_guide_replay_msg:
      "现在你已经成功捕捉了你的操作！左下角可以看到你的幻影已就绪！幻影的出生点即是你的录制起点哦！\n按回放键继续",

    // ── PHASE 5: Replaying ─────────────────────────────────────────
    tutorial_replaying_msg:
      "你的幻影会完全复刻你刚刚捕捉的操作~幻影与你本体没有区别，而且不会死亡！\n再按一次回放键可以随时结束回放",

    // ── PHASE 6: Complete ──────────────────────────────────────────
    tutorial_complete_msg:
      "恭喜你完成了教学！没有幻影的帮助是无法通关的哦！\n仔细规划你的每一步操作，利用好幻影的能力，来完成关卡吧！",

    // ── ESC/Skip ────────────────────────────────────────────────────
    tutorial_press_esc_to_skip: "按 ESC 跳过教程",
  },
});
