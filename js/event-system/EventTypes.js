// EventTypes.js
// Central registry of all EventBus event name constants.
// 所有 EventBus 事件名称常量的中央注册表。
// Import this instead of using raw string literals to catch typos at development time.
// 在开发时导入此文件而非直接使用字符串字面量，以便及早发现拼写错误。

export const EventTypes = Object.freeze({
  // Level lifecycle
  // 关卡生命周期
  LOAD_LEVEL: "loadLevel",
  UNLOAD_LEVEL: "unloadLevel",
  RETURN_LEVEL_CHOICE: "returnLevelChoice",

  // Game result
  // 游戏结果
  AUTO_RESULT: "autoResult",

  // Pause / resume
  // 暂停 / 恢复
  PAUSE_GAME: "pauseGame",
  RESUME_GAME: "resumeGame",

  // Signboard interactions
  // 告示牌交互
  SIGNBOARD_INTERACTED: "signboardInteracted",
  SIGNBOARD_OUT_OF_RANGE: "signboardOutOfRange",

  // Tutorial system (Easy level)
  // 新手教程系统（简单关卡）
  TUTORIAL_START_REQUESTED: "tutorialStartRequested",
  TUTORIAL_CLOSE_SIGNBOARD: "tutorialCloseSignboard",

  // NPC dialogue
  // NPC 对话
  NPC_DIALOGUE_START: "npcDialogueStart",
  NPC_DIALOGUE_NEXT: "npcDialogueNext",
  NPC_DIALOGUE_END: "npcDialogueEnd",

  // Developer tools
  // 开发者工具
  ACTIVATE_DEV_MODE: "activateDevMode",
});
