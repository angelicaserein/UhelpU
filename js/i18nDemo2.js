// js/i18nDemo2.js — Demo2 关卡专属文案
// 导入即自动注册到全局 i18n 字典

import { registerTranslations } from "./i18n.js";

registerTranslations({
  en: {
    // ── Level 1 — NPC Dialogue ───────────────────────────────────────
    d2_npc_level1_line1:
      "Welcome to           !\nYou could check the tutorial on the notice board.",
    d2_npc_level1_line2: "Press ESC or the button to pause and see more hints!",
    d2_npc_level1_line3: "Remember, you're recording actions, not positions!",
    d2_npc_level1_exhausted:
      "If you missed the three lines I said, you'll have to restart to see them again~",

    // ── Level 1 — Hint (pause menu) ─────────────────────────────────
    d2_hint_level1:
      "Step on the buttons to retract the spikes, then reach the portal on the right side.",

    // ── Level 1 — Signboard ─────────────────────────────────────────
    d2_signboard_level1_front:
      "Record System\n---\nYou could follow the Record System HUD's instructions to record your actions and replay them as a phantom to help your future self pass certain sections.",
    // ── Level 2 — NPC Dialogue ───────────────────────────────────────
    d2_npc_level2_0_line1: "You'll need to find a way to jump higher!",
    d2_npc_level2_0_line2: "Remember to use your recording ability.",
    d2_npc_level2_0_exhausted: "You can't step on my head! Try another way?",

    d2_npc_level2_1_line1: "Great jump!",
    d2_npc_level2_1_line2: "This path is the same as the one below~",
    d2_npc_level2_1_exhausted: "Keep going to the right~",

    d2_npc_level2_2_line1: "Which way did you come from?",
    d2_npc_level2_2_line2: "If you came from the left, good job!",
    d2_npc_level2_2_exhausted: "Get more familiar with your recording ability!",

    d2_npc_level2_3_line1: "What do you think of the difficulty?",
    d2_npc_level2_3_line2:
      "If you find it hard, think more about how to use your recording ability!",
    d2_npc_level2_3_exhausted: "Don't even think about stepping on me!",

    // ── Level 2 — Hint (pause menu) ─────────────────────────────────
    d2_hint_level2:
      "Step on the buttons to retract the corresponding color spikes。 You can jump on your own head, and your phantom can boost you higher if it jumps while you're on it.",

    // ── Level 2 — Signboard ─────────────────────────────────────────
    d2_signboard_level2_front:
      "Notice\n---\nAll paths ahead can lead to the end.\nSee how far you can jump?\nMaking good use of your ability to let you jump farther.",
  },

  zh: {
    // ── 第一关 — NPC 对话 ────────────────────────────────────────────
    d2_npc_level1_line1:
      "嘿，欢迎来到            ！\n你可以查看公告板上的教程。",
    d2_npc_level1_line2: "按esc或者按钮暂停，可以查看更多提示！",
    d2_npc_level1_line3: "你录制的是操作而不是位置哦！",
    d2_npc_level1_exhausted: "如果你错过了我说的三句话，那你只能重开来看了~",

    // ── 第一关 — 提示（暂停菜单） ────────────────────────────────────
    d2_hint_level1: "踩下按钮可以收回地刺，然后到达右侧的传送门即可过关。",

    // ── 第一关 — 告示板 ─────────────────────────────────────────────
    d2_signboard_level1_front:
      "录制系统\n---\n按照录制系统HUD的指示录制你的操作，并以幻影的形式回放，帮助未来的自己通过关卡。",

    // ── 第二关 — NPC 对话 ────────────────────────────────────────────
    d2_npc_level2_0_line1: "你要想办法跳高了！",
    d2_npc_level2_0_line2: "记得使用你的录制技能哦。",
    d2_npc_level2_0_exhausted: "你不能踩在我头上！试试别的方法？",

    d2_npc_level2_1_line1: "很棒的跳远！",
    d2_npc_level2_1_line2: "这条路和下面的路一样~",
    d2_npc_level2_1_exhausted: "继续往右边走吧~",

    d2_npc_level2_2_line1: "你是从哪边来的呢？",
    d2_npc_level2_2_line2: "如果你是从左边来的话，你很棒！",
    d2_npc_level2_2_exhausted: "多多熟悉你的录制能力吧！",

    d2_npc_level2_3_line1: "你觉得难度如何呢？",
    d2_npc_level2_3_line2: "如果觉得难的话，多多思考录制技能的用法吧！",
    d2_npc_level2_3_exhausted: "不要想着踩我上去！",

    // ── 第二关 — 提示（暂停菜单） ────────────────────────────────────
    d2_hint_level2:
      "踩下按钮收回对应颜色的地刺。你可以踩在自己的头上跳跃，你的幻影可以起跳把你顶的更高。",

    // ── 第二关 — 告示板 ─────────────────────────────────────────────
    d2_signboard_level2_front:
      "注意\n---\n前方每条路都可以到达终点哦。\n试试看你最远能跳多远吧？\n利用好你的能力似乎可以跳得更远？",
  },
});
