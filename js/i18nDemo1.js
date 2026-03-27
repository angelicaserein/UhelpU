// js/i18nDemo1.js — Demo1 关卡专属文案
// 导入即自动注册到全局 i18n 字典

import { registerTranslations } from "./i18n.js";

registerTranslations({
  en: {
    // ── Opening Story ────────────────────────────────────────────────
    btn_skip: "PRESS [ENTER] TO SKIP",
    notebook_front:
      '<div class="scene-hint-title">This Is You</div><div class="scene-hint-body">Pause in-game to check hints!\nTry to complete the level without hints~</div><div class="scene-hint-footer">click to turn the page</div>',
    notebook_back:
      '<div class="scene-hint-title">This Is Also You</div><div class="scene-hint-body">Temporarily consider it as your phantom.\nPretty smart eyes, and very obedient!</div><div class="scene-hint-footer">click to turn the page</div>',
    story_loading: "Loading story...",

    // ── Level Hints (pause menu) ─────────────────────────────────────
    hint_level1:
      "Record yourself next to the platform. Do not move around randomly. After finishing recording, press the playback button. Jump up by stepping on your own head.",
    hint_level2:
      "While recording, jump to have a higher platform, then step on two buttons at the same time to open the portal",
    hint_level3:
      "Record the first half of yourself to build a path for your future self to jump up, then press the button in the second half. After recording ends, your real self steps on your own head to jump onto the platform, then presses the power-on button together with the phantom.",
    hint_level4:
      "During the recording, step on the yellow and blue buttons respectively. After your main character reaches the second side, click playback, then walk over the spike traps at the right time.",
    hint_level5:
      "Stand on a disappearing platform and record yourself, then go press the button to make the platform vanish — your recorded phantom will fall off and press the button for you!\n\n\n\n\n👇👇👇 The following hint is for the part after the next checkpoint:\n\n\n\n\n\n\nWhen recording, if you jump too hastily and press jump again before the phantom fully lands, the phantom will inherit that mid-air input and won't be able to jump properly.",

    // ── Level-specific prompts ────────────────────────────────────────
    level1_missed_prompt:
      "Wait... did I just miss something? let me carefully check the noticeboard content",
    level1_replay_prompt:
      "...He is repeating every step I just did.\nI think... I cannot touch him? Is it really impossible to touch him?",
    level2_jump_higher_prompt: "How can I jump much higher?",
    level2_jump_hint_window:
      'Congratulations!\n You\'ve unlocked the achievement: \n"<span class="rainbow-wave">P</span><span class="rainbow-wave">e</span><span class="rainbow-wave">r</span><span class="rainbow-wave">s</span><span class="rainbow-wave">e</span><span class="rainbow-wave">v</span><span class="rainbow-wave">e</span><span class="rainbow-wave">r</span><span class="rainbow-wave">a</span><span class="rainbow-wave">n</span><span class="rainbow-wave">c</span><span class="rainbow-wave">e</span>"!\n(Hint: hint is in the pause menu, not here haha)',
    level3_signboard_prompt: "Which key was it to interact again?",
    level4_button_hint: "Do I have to use these two buttons?",
    level4_checkpoint_hint:
      "You have successfully activated the checkpoint!<br>P.S. Press {key:teleportCheckpoint} to return to the checkpoint at any time.",
    level4_selfjump_hint_window:
      'Congratulations!\n You\'ve unlocked the achievement: \n"<span class="rainbow-wave">S</span><span class="rainbow-wave">e</span><span class="rainbow-wave">l</span><span class="rainbow-wave">f</span><span class="rainbow-wave">-</span><span class="rainbow-wave">J</span><span class="rainbow-wave">u</span><span class="rainbow-wave">m</span><span class="rainbow-wave">p</span>"!',
    level5_jail_prompt:
      "Huh?\nRemember to press {key:teleportCheckpoint} when checkpoint is activated!",
    level5_pause_hint:
      "Someone told me once\nIf you're stuck, try pressing pause.",
    level5_jail_hint_window:
      'Congratulations!\n You\'ve unlocked the achievement: \n"<span class="rainbow-wave">P</span><span class="rainbow-wave">r</span><span class="rainbow-wave">i</span><span class="rainbow-wave">s</span><span class="rainbow-wave">o</span><span class="rainbow-wave">n</span><span class="rainbow-wave">e</span><span class="rainbow-wave">r</span>"!',
    level5_recording_prompt:
      "I'm recording my key inputs,not my position.And pressing jump in mid-air does nothing...",
    level6_checkpoint_prompt:
      "Wait... isn't this the same as the last level?\nWhat's the point of this checkpoint?",
    jump_sign_prompt: 'This scene is a tribute to "Jump Off the Bridge".',

    // ── Level titles & info ──────────────────────────────────────────
    level1_title: "Rule",
    level1_info_left: "level 1\nRule",
    level1_info_right: "Difficulty\nTutorial 💜",
    level2_title: "Higher",
    level2_info_left: "level 2\nHigher",
    level2_info_right: "Difficulty\n💜💜",
    level3_title: "Electricity",
    level3_info_left: "level 3\nElectricity",
    level3_info_right: "Difficulty\n💜💜💜",
    level4_title: "Trap",
    level4_info_left: "level 4\nTrap",
    level4_info_right: "Difficulty\n💜💜",
    level5_title: "Jail",
    level5_info_left: "level 5\nJail",
    level5_info_right: "Difficulty\n💜💜💜💜",
    level6_title: "Checkpoint",
    level6_room2_title: "\u201CJump Off The Bridge\u201D",
    level6_info_left: "level 6\nCheckpoint",
    level6_info_right: "Difficulty\n💜💜💜",
    level7_title: "Level 7",
    level7_info_left: "level 7",
    level7_info_right: "Difficulty\n💜",
    level8_title: "Level 8",
    level8_info_left: "level 8",
    level8_info_right: "Difficulty\n💜",
    level9_title: "Level 9",
    level9_info_left: "level 9",
    level9_info_right: "Difficulty\n💜",
    level10_title: "Level 10",
    level10_info_left: "level 10",
    level10_info_right: "Difficulty\n💜",

    // ── Module / first record tutorial ───────────────────────────────
    module_btn_label: "Install Module",
    module_installation_complete:
      "Installation Complete\n Now you can see the record HUD",
    first_record_prompt:
      "You have successfully learned to record your actions!\nPress the record key again to start~\nMax recording duration: 5 seconds",

    // ── Achievement (demo1-specific) ─────────────────────────────────
    achiev_first_steps_name: "First Steps",
    achiev_first_steps_desc: "Complete Level 1 — Rule",
    achiev_selfjump_name: "Self-Jump",
    achiev_selfjump_desc: "You're a jumping master!",
    achiev_selfjump_unlock_desc:
      "Jump over spikes without stepping on yellow/blue buttons in level 4",
    achiev_prisoner_name: "Prisoner",
    achiev_prisoner_desc: "Some people are alive, but they are already dead.",
    achiev_prisoner_unlock_desc:
      "Trap yourself in Level 5 without activating the checkpoint",
    achiev_trap_master_name: "Trap Master",
    achiev_trap_master_desc: "Complete Level 4 — Trap",
    achiev_perfectionist_name: "Perfectionist",
    achiev_perfectionist_desc: "Complete all levels",
    achiev_perseverance_name: "Perseverance",
    achiev_perseverance_desc: "Did you fall down 3 times? ",
    achiev_perseverance_unlock_desc:
      'Trigger "How can I jump much higher?" 3 times in Level 2',
    achiev_student_name: "Student",
    achiev_student_desc: "Read all signboards",
    achiev_socialite_name: "Socialite",
    achiev_socialite_desc: "Talk to all NPCs",
    achiev_director_name: "Director",
    achiev_director_desc: "Use recording for the first time",
    achiev_phantom_master_name: "Phantom Master",
    achiev_phantom_master_desc: "Complete a level using phantom replay",
    achiev_jail_name: "Prisoner",
    achiev_jail_desc: "Some people are alive, but they are already dead.",
    achiev_jail_unlock_desc:
      "Trap yourself in Level 5 without activating the checkpoint",

    // ── NPC Dialogue ─────────────────────────────────────────────────
    npc_guide_line1: "Wow, it's great to meet you here!",
    npc_guide_line2: "Are you sleepy too?",
    npc_guide_line3: "I sleep with my eyes open;P",
    npc_guide_exhausted: "I'm sleeping, don't bother me~",
    npc_guide2_line1: "Did you see the colorful buttons and spikes?",
    npc_guide2_line2: "I dont know why but I feel like they are important",
    npc_guide2_line3: "But sleep is more important!",
    npc_guide2_exhausted: "I'm sleeping, don't bother me~",
    npc_guide3_line1: "I look different from the other three NPCs, do I?",
    npc_guide3_line2: "I like them, they are cute as me.",
    npc_guide3_line3: "But I like sleeping more!",
    npc_guide3_exhausted: "I'm sleeping, don't bother me~",
    npc_guide4_line1:
      "I am the last NPC, but I have the most lines! Impressive?",
    npc_guide4_line2:
      "I think the second NPC said something important, do you think so?",
    npc_guide4_line3: "But I can't understand!",
    npc_guide4_exhausted:
      "I want to figure out the buttons and spikes, but I'm too sleepy... Zzz",
    npc_continue_hint: "[{KEY}] Continue",
  },

  zh: {
    // ── Opening Story ────────────────────────────────────────────────
    btn_skip: "按 [ENTER] 跳过",
    notebook_front:
      '<div class="scene-hint-title">这是你</div><div class="scene-hint-body">关卡内暂停可以查看提示！\n试试不看提示通关吧~</div><div class="scene-hint-footer">点击可以翻页哦！</div>',
    notebook_back:
      '<div class="scene-hint-title">这也是你</div><div class="scene-hint-body">暂且把它当成你的幻影吧\n眼神比较智慧，也很听话！</div><div class="scene-hint-footer">点击可以翻回去哦！</div>',
    story_loading: "故事加载中...",

    // ── Level Hints (pause menu) ─────────────────────────────────────
    hint_level1:
      "在平台旁边录制自己，不要乱移动，结束录制之后按回放键，踩着自己的头跳上去",
    hint_level2:
      "录制自己的过程中跳跃，自己踩在自己的回放幻影头上，在幻影起跳的同时自己也起跳，利用这个技巧踩上更高的平台，最后操纵幻影同时按下两个按钮，打开传送门。",
    hint_level3:
      "录制自己的前半段先为未来的自己搭好跳上去的路，后半段再去按按钮，录制结束后本体踩着自己的头跳上平台之后再和幻影一起按下通电的按钮。（不止这一种解法哦）",
    hint_level4:
      "在录制的时间内分别踩下黄色和蓝色的按钮，本体走到第二面之后再点击回放，看准时机走过地刺。",
    hint_level5:
      "站在可以消失的平台上录制自己，然后去按按钮让平台消失，这时候录制的幻影可以从平台上掉下去按按钮哦！\n\n\n\n\n👇👇👇往下是下一个存档点后面部分的提示：\n\n\n\n\n\n\n在录制操作时，如果你跳得太急，幻影还没完全落地就再次按了跳跃，那么幻影会继承这个空中按键的状态，导致它无法正常起跳。",

    // ── Level-specific prompts ────────────────────────────────────────
    level1_missed_prompt:
      "等等，我刚刚是不是错过了什么？让我仔细看看公告栏的内容",
    level1_replay_prompt:
      "……他在重复我刚才做的每一步。\n我好像……碰不到他？真的碰不到吗？",
    level2_jump_higher_prompt: "怎么才能跳得更高呢？",
    level2_jump_hint_window:
      '恭喜你解锁"<span class="rainbow-wave">坚</span><span class="rainbow-wave">持</span><span class="rainbow-wave">不</span><span class="rainbow-wave">懈</span>"的成就！\n（提示在暂停菜单里哦，不在这里哈哈）',
    level3_signboard_prompt: "我记得按哪个键可以交互来着？",
    level4_button_hint: "我必须要用这两个按钮吗",
    level4_checkpoint_hint:
      "你成功激活了存档点！<br>p.s. 按{key:teleportCheckpoint}键可以随时返回存档点",
    level4_selfjump_hint_window:
      '恭喜你解锁"<span class="rainbow-wave">S</span><span class="rainbow-wave">e</span><span class="rainbow-wave">l</span><span class="rainbow-wave">f</span><span class="rainbow-wave">-</span><span class="rainbow-wave">J</span><span class="rainbow-wave">u</span><span class="rainbow-wave">m</span><span class="rainbow-wave">p</span>"的成就！',
    level5_jail_prompt:
      "咦？\n记得存档点激活后按{key:teleportCheckpoint}键哦！",
    level5_pause_hint: "好像有人告诉过我\n卡关了的话应该按暂停看看。",
    level5_jail_hint_window:
      '恭喜你解锁"<span class="rainbow-wave">囚</span><span class="rainbow-wave">犯</span>"的成就！',
    level5_recording_prompt:
      "我录制的是我的按键操作，而不是我的位置。而且我在空中按跳是没用的……",
    level6_checkpoint_prompt: "这好像和上一关一样？\n这个存档点放这干啥",
    jump_sign_prompt: "本场景致敬《Jump Off the Bridge》",

    // ── Level titles & info ──────────────────────────────────────────
    level1_title: "规则",
    level1_info_left: "第一关\n规则",
    level1_info_right: "难度\n🩷",
    level2_title: "登高",
    level2_info_left: "第二关\n登高",
    level2_info_right: "难度\n🩷🩷",
    level3_title: "通电",
    level3_info_left: "第三关\n通电",
    level3_info_right: "难度\n🩷🩷🩷",
    level4_title: "陷阱",
    level4_info_left: "第四关\n陷阱",
    level4_info_right: "难度\n🩷🩷",
    level5_title: "牢笼",
    level5_info_left: "第五关\n牢笼",
    level5_info_right: "难度\n🩷🩷🩷🩷",
    level6_title: "第六关",
    level6_room2_title: "《Jump Off the Bridge》",
    level6_info_left: "第六关",
    level6_info_right: "难度\n🩷",
    level7_title: "第七关",
    level7_info_left: "第七关",
    level7_info_right: "难度\n🩷",
    level8_title: "第八关",
    level8_info_left: "第八关",
    level8_info_right: "难度\n🩷",
    level9_title: "第九关",
    level9_info_left: "第九关",
    level9_info_right: "难度\n🩷",
    level10_title: "第十关",
    level10_info_left: "第十关",
    level10_info_right: "难度\n🩷",

    // ── Module / first record tutorial ───────────────────────────────
    module_btn_label: "安装模块",
    module_installation_complete: "安装完成\n现在你可以看到录制面板了",
    first_record_prompt:
      "你学会录制自己的操作了！\n再按一次录制键开始吧\n最多只能录 5 秒哦",

    // ── Achievement (demo1-specific) ─────────────────────────────────
    achiev_first_steps_name: "第一步",
    achiev_first_steps_desc: "通关第一关 — 规则",
    achiev_selfjump_name: "无钮自通",
    achiev_selfjump_desc: "你是跳跃高手！",
    achiev_selfjump_unlock_desc: "在第四关里不踩到黄、蓝按钮就跳过地刺",
    achiev_prisoner_name: "囚犯",
    achiev_prisoner_desc: "有的人活着，他已经死了。",
    achiev_prisoner_unlock_desc: "在第五关中没有激活存档点的情况下把自己困住",
    achiev_trap_master_name: "陷阱大师",
    achiev_trap_master_desc: "通关第四关 — 陷阱",
    achiev_perfectionist_name: "完美主义者",
    achiev_perfectionist_desc: "通关所有关卡",
    achiev_perseverance_name: "坚持不懈",
    achiev_perseverance_desc: "你是不是掉下来了三次？",
    achiev_perseverance_unlock_desc:
      "在第二关里触发三次\u201C怎么才能跳得更高呢？\u201D",
    achiev_student_name: "好学生",
    achiev_student_desc: "阅读所有告示牌",
    achiev_socialite_name: "社交达人",
    achiev_socialite_desc: "与所有NPC对话",
    achiev_director_name: "导演",
    achiev_director_desc: "第一次使用录制功能",
    achiev_phantom_master_name: "幻影大师",
    achiev_phantom_master_desc: "使用幻影回放完成一个关卡",
    achiev_jail_name: "囚犯",
    achiev_jail_desc: "有的人活着，但他已经死了。",
    achiev_jail_unlock_desc: "在第五关中没有激活存档点的情况下把自己困住",

    // ── NPC 对话 ─────────────────────────────────────────────────────
    npc_guide_line1: "哇，在这里很难得遇见你！",
    npc_guide_line2: "你也很困吗？",
    npc_guide_line3: "我会睁着眼睡觉;P",
    npc_guide_exhausted: "我在睡觉啦，不要打扰我哦~",
    npc_guide2_line1: "你看到那些彩色的按钮和地刺了吗？",
    npc_guide2_line2: "我不知道为什么，我觉得它们很重要",
    npc_guide2_line3: "但是睡觉更重要！",
    npc_guide2_exhausted: "我在睡觉啦，不要打扰我哦~",
    npc_guide3_line1: "我和其他三个NPC不一样，对吗？",
    npc_guide3_line2: "我喜欢它们，它们和我一样可爱。",
    npc_guide3_line3: "但是我更喜欢睡觉！",
    npc_guide3_exhausted: "我在睡觉啦，不要打扰我哦~",
    npc_guide4_line1: "我是最后一个NPC，但我台词最多！厉害不？",
    npc_guide4_line2: "我觉得第二个NPC说了些重要的东西，你觉得呢？",
    npc_guide4_line3: "但是睡觉更重要！",
    npc_guide4_exhausted: "我想搞清楚那些按钮和地刺\n但我太困了... Zzz",
    npc_continue_hint: "[{KEY}] 继续",
  },
});
