// js/i18nEasy.js — Easy mode level exclusive text | Easy 模式关卡专属文案
// Auto-register to global i18n dictionary on import | 导入即自动注册到全局 i18n 字典

import { registerTranslations } from "./index.js";

registerTranslations({
  en: {
    // ── Level titles & info ──────────────────────────────────────────
    easy_level1_title: "Rules",
    easy_level1_info_left: "Level 1\nRules",
    easy_level1_info_right: "Difficulty\nTutorial",

    easy_level2_title: "Spikes",
    easy_level2_info_left: "Level 2\nSpikes",
    easy_level2_info_right: "Difficulty\n💜",

    easy_level3_title: "Higher",
    easy_level3_info_left: "Level 3\nHigher",
    easy_level3_info_right: "Difficulty\n💜💜",

    easy_level4_title: "Illusions",
    easy_level4_info_left: "Level 4\nIllusions",
    easy_level4_info_right: "Difficulty\n💜💜",

    easy_level5_title: "Ghosts",
    easy_level5_info_left: "Level 5\nGhosts",
    easy_level5_info_right: "Difficulty\n💜💜",

    easy_level6_title: "Teleport",
    easy_level6_info_left: "Level 6\nTeleport",
    easy_level6_info_right: "Difficulty\n💜💜",

    easy_level7_title: "Boxes",
    easy_level7_info_left: "Level 7\nBoxes",
    easy_level7_info_right: "Difficulty\n💜",

    easy_level8_title: "Easy Level 8",
    easy_level8_info_left: "Level 8\nEasy Level 8",
    easy_level8_info_right: "Difficulty\nBeginner",

    easy_level9_title: "Easy Level 9",
    easy_level9_info_left: "Level 9\nEasy Level 9",
    easy_level9_info_right: "Difficulty\nBeginner",

    easy_level10_title: "Easy Level 10",
    easy_level10_info_left: "Level 10\nEasy Level 10",
    easy_level10_info_right: "Difficulty\nBeginner",

    // ── Easy NPC (EasyNPC1) ──────────────────────────────────────────
    easy_npc1_line1: "Hi there! Nice to meet you!",
    easy_npc1_line2: "Get familiar with your skills, they're really useful!",
    easy_npc1_exhausted: "Easy mode levels are super simple!",

    // ── Easy Level 2 — NPC ────────────────────────────────────────────
    easy_level2_npc_line1: "Step on the buttons to clear the spikes!",
    easy_level2_npc_line2:
      "You can reach the portal on the right side after clearing them!",
    easy_level2_npc_exhausted: "Don't give up! Keep trying!",

    // ── Easy Level 1 — Signboard ──────────────────────────────────
    easy_signboard_level1_front:
      "Notice Board\n---\nWelcome to Beginner Level, you can check the tutorial here.",
    easy_signboard_tutorial: "Start Tutorial",

    // ── Easy Level 2 — Hint ────────────────────────────────────────
    easy_hint_level2:
      "Step on the buttons to retract the spikes, then reach the portal to complete the level.",
    easy_level6_teleport_hint:
      "Press {key:interaction} to activate a teleport point, then press the number key shown above to teleport.",

    // ── Prompts ───────────────────────────────────────────────────
    prompt_ad: "A/D",
    prompt_arrows: "←/→",
    prompt_space: "Space",
    prompt_w: "W",
    prompt_up: "↑",
    win_press_space_or_enter:
      "Press Space or Enter to proceed to the next level",
  },

  zh: {
    // ── Level titles & info ──────────────────────────────────────────
    easy_level1_title: "规则",
    easy_level1_info_left: "第一关\n规则",
    easy_level1_info_right: "难度\n教程关",

    easy_level2_title: "地刺",
    easy_level2_info_left: "第二关\n地刺",
    easy_level2_info_right: "难度\n💜",

    easy_level3_title: "登高",
    easy_level3_info_left: "第三关\n登高",
    easy_level3_info_right: "难度\n💜💜",

    easy_level4_title: "虚实",
    easy_level4_info_left: "第四关\n虚实",
    easy_level4_info_right: "难度\n💜💜",

    easy_level5_title: "幽灵",
    easy_level5_info_left: "第五关\n幽灵",
    easy_level5_info_right: "难度\n💜💜",

    easy_level6_title: "传送",
    easy_level6_info_left: "第六关\n传送",
    easy_level6_info_right: "难度\n💜💜",

    easy_level7_title: "木箱",
    easy_level7_info_left: "第七关\n木箱",
    easy_level7_info_right: "难度\n💜",

    easy_level8_title: "简易关卡 8",
    easy_level8_info_left: "第八关\n简易关卡 8",
    easy_level8_info_right: "难度\n初级",

    easy_level9_title: "简易关卡 9",
    easy_level9_info_left: "第九关\n简易关卡 9",
    easy_level9_info_right: "难度\n初级",

    easy_level10_title: "简易关卡 10",
    easy_level10_info_left: "第十关\n简易关卡 10",
    easy_level10_info_right: "难度\n初级",

    // ── Easy NPC (EasyNPC1) ──────────────────────────────────────────
    easy_npc1_line1: "你好呀！很高兴认识你！",
    easy_npc1_line2: "多多熟悉你的技能，特别有用！",
    easy_npc1_exhausted: "简单模式的关卡超级简单！",

    // ── Easy Level 2 — NPC ────────────────────────────────────────────
    easy_level2_npc_line1: "嗨嗨！又见面了！",
    easy_level2_npc_line2: "这些颜色好像很重要？",
    easy_level2_npc_exhausted: "死亡之后你的幻影也会损坏！",

    // ── Easy Level 1 — Signboard ──────────────────────────────────
    easy_signboard_level1_front:
      "公告板\n---\n欢迎来到新手关卡，你可以在这里查看教程。",
    easy_signboard_tutorial: "开始教程",

    // ── Easy Level 2 — Hint ────────────────────────────────────────
    easy_hint_level2: "踩下按钮可以收回地刺，然后到达传送门即可过关。",
    easy_level6_teleport_hint:
      "按 {key:interaction} 激活传送点，并按上方数字键进行传送。",

    // ── Prompts ───────────────────────────────────────────────────
    prompt_ad: "A/D",
    prompt_arrows: "←/→",
    prompt_space: "Space",
    prompt_w: "W",
    prompt_up: "↑",
    win_press_space_or_enter: "按空格或回车进入下一关",
  },
});
