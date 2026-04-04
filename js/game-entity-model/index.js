//index.js是负责导出游戏实体模型中所有类的文件，方便其他模块统一从这里导入所需的实体类。它将游戏中的各种实体，如玩家、地面、墙壁、传送门、NPC、按钮、地刺等，按照类别进行组织和导出，使得在关卡设计和游戏逻辑实现中可以方便地使用这些实体类来创建和管理游戏对象。
// base
export { GameEntity } from "./base/GameEntity.js";
export { Character } from "./base/Character.js";
export { BasePlatform } from "./base/BasePlatform.js";

// characters
export { Player } from "./characters/Player.js";
export { Replayer } from "./characters/Replayer.js";
export { Enemy } from "./characters/Enemy.js";

// terrain
export { Ground } from "./terrain/Ground.js";
export { Wall } from "./terrain/Wall.js";
export { Platform } from "./terrain/Platform.js";

// interactables
export { Spike } from "./interactables/Spike.js";
export { Portal } from "./interactables/Portal.js";
export { Button } from "./interactables/Button.js";
export { SignboardDemo2 } from "./interactables/SignboardDemo2.js";
export { SignboardDemo1 } from "./interactables/SignboardDemo1.js";
export { NPCDemo1 } from "./interactables/NPCDemo1.js";
export { NPC as NPCDemo2 } from "./interactables/NPCDemo2.js";
export { Checkpoint } from "./interactables/Checkpoint.js";

// prompts
export { KeyPrompt } from "./prompts/KeyPrompt.js";
export { TextPrompt } from "./prompts/TextPrompt.js";
