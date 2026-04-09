// js/i18nDemo2.js — Demo2 关卡专属文案
// 导入即自动注册到全局 i18n 字典

import { registerTranslations } from "./i18n.js";

registerTranslations({
  en: {
    // ── Record System UI ───────────────────────────────────────────────
    // 英文
    rec_system_name: "PHANTOM\nSYSTEM",
    rec_demo2_ready_to_record: "Ready to Capture",
    rec_demo2_recording: "Capturing...",
    rec_demo2_recording_sub: "Capturing your actions",
    rec_demo2_ready_to_replay: "Phantom Standby",
    rec_demo2_replaying: "Phantom Awakens",
    rec_state_paused: "Paused",
    rec_state_rec: "Capture",
    rec_state_ready: "Standby",
    rec_state_play: "Summon",

    // Record/Replay Instructions
    rec_press_to_stop: "Press {KEY} to stop capturing early",
    rec_press_to_start: "Press {KEY} to start capturing",
    rec_press_to_replay: "Press {KEY} to replay your phantom",
    rec_press_to_rerecord: "Press {KEY} to re-capture",
    rec_press_to_exit: "Press {KEY} to stop replay early",

    // Operation Labels
    rec_op_left: "Left",
    rec_op_right: "Right",
    rec_op_jump: "Jump",

    // ── Win Page ─────────────────────────────────────────────────────────
    win_press_space_or_enter:
      "Press Space or Enter to proceed to the next level",

    // ── Level 1 — NPC Dialogue ───────────────────────────────────────
    d2_npc_level1_line1:
      "Welcome to           !\nYou could check the tutorial on the notice board.",
    d2_npc_level1_line2: "Press ESC to pause and see more hints!",
    d2_npc_level1_line3:
      "Remember, you're recording your starting point and keyboard actions!",
    d2_npc_level1_exhausted:
      "Press ESC to pause and see more hints， and dont forget to check the board!",

    // ── Level 1 — Hint (pause menu) ─────────────────────────────────
    d2_hint_level1:
      "Step on the buttons to retract the spikes, then reach the portal on the right side.",

    // ── Level 1 — Signboard ─────────────────────────────────────────
    d2_signboard_level1_front:
      "Phantom System\n---\nYou could follow the Phantom System HUD's instructions to capture your actions and replay them to help your future self pass certain sections.",
    signboard_press_to_interact: "Press {KEY} or move away to close",
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

    // ── Level 4 — NPC Dialogue ───────────────────────────────────────
    d2_npc_level4_line1: "I can give you hints!",
    d2_npc_level4_line2: "Come find me when you need a hint~",
    d2_npc_level4_exhausted:
      "Let your phantom fall down! Press Pause for more hints~",
    win_press_space_or_enter:
      "Press Space or Enter to proceed to the next level",
  },

  zh: {
    // ── 录制系统 UI ──────────────────────────────────────────────────
    // 中文
    rec_system_name: "幻影\n系统",
    rec_demo2_ready_to_record: "准备捕捉",
    rec_demo2_recording: "捕捉中",
    rec_demo2_recording_sub: "正在记录你的行动轨迹",
    rec_demo2_ready_to_replay: "幻影待命",
    rec_demo2_replaying: "幻影出现",
    rec_state_paused: "暂停",
    rec_state_rec: "捕捉",
    rec_state_ready: "就绪",
    rec_state_play: "召唤",

    // 录制回放指令
    rec_press_to_stop: "按 {KEY} 键提前停止捕捉",
    rec_press_to_start: "按 {KEY} 键开始捕捉",
    rec_press_to_replay: "按 {KEY} 键回放幻影",
    rec_press_to_rerecord: "按 {KEY} 键重新捕捉",
    rec_press_to_exit: "按 {KEY} 键提前结束回放",

    // 操作标签
    rec_op_left: "左移",
    rec_op_right: "右移",
    rec_op_jump: "跳跃",

    // ── 胜利页面 ────────────────────────────────────────────────────────
    win_press_space_or_enter: "按空格或回车进入下一关",

    // ── 第一关 — NPC 对话 ────────────────────────────────────────────
    d2_npc_level1_line1:
      "嘿，欢迎来到            ！\n你可以查看公告板上的教程。",
    d2_npc_level1_line2: "按 ESC 可以暂停游戏\n并查看更多提示！",
    d2_npc_level1_line3: "记住，你捕捉的是\n你的起始位置和键盘操作！",
    d2_npc_level1_exhausted:
      "按 ESC 可以暂停游戏并查看更多提示\n别忘了查看公告板哦！",

    // ── 第一关 — 提示（暂停菜单） ────────────────────────────────────
    d2_hint_level1: "踩下按钮可以收回地刺，然后到达右侧的传送门即可过关。",

    // ── 第一关 — 告示板 ─────────────────────────────────────────────
    d2_signboard_level1_front:
      "幻影系统\n---\n按照上方幻影系统HUD的指示捕捉你的操作，并进行回放，帮助未来的自己通过重重障碍。",
    signboard_press_to_interact: "按 {KEY} 键或离开关闭",

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

    // ── 第四关 — NPC 对话 ────────────────────────────────────────────
    d2_npc_level4_line1: "我可以给你提示哦！",
    d2_npc_level4_line2: "等你需要提示的时候来找我吧~",
    d2_npc_level4_exhausted: "让你的幻影掉下去吧！更多提示请按暂停哦~",
    win_press_space_or_enter: "按空格或回车进入下一关",
  },
});
