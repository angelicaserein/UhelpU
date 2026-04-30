/**
 * EditorConfig — Map editor global constants and defaults
 * EditorConfig — 地图编辑器全局常量和默认值
 */

/** Enum of placeable entity types | 可放置实体类型的枚举 */
export const EntityTool = Object.freeze({
  GROUND: "ground",
  PORTAL: "portal",
  PLATFORM: "platform",
  SPIKE: "spike",
  WALL: "wall",
  WIRE_PORTAL: "wirePortal",
  BTN_SPIKE: "btnSpike",
  BTN_PLATFORM: "btnPlatform",
  NPC: "npc",
  SIGNBOARD: "signboard",
  TEXT_PROMPT: "textPrompt",
  CHECKPOINT: "checkpoint",
  ENEMY: "enemy",
  SPAWN: "spawn",
  TELEPORT_POINT: "teleportPoint",
  BOX: "box",
});

/** Grid snap size | 网格对齐大小 */
export const GRID_SIZE = 10;

/** Ground default/limits | 地面默认/限制 */
export const GROUND_DEFAULTS = {
  width: 200,
  height: 40,
  minWidth: 30,
  maxWidth: 1200,
  minHeight: 20,
  maxHeight: 400,
};

/** Portal fixed size | 传送门固定大小 */
export const PORTAL_SIZE = {
  width: 50,
  height: 50,
};

/** Platform default/limits | 平台默认/限制 */
export const PLATFORM_DEFAULTS = {
  width: 160,
  height: 30,
  minWidth: 30,
  maxWidth: 1200,
  minHeight: 20,
  maxHeight: 200,
};

/** Spike default/limits | 尖刺默认/限制 */
export const SPIKE_DEFAULTS = {
  width: 100,
  height: 20,
  minWidth: 20,
  maxWidth: 600,
  minHeight: 10,
  maxHeight: 60,
};

/** Wall default/limits | 墙默认/限制 */
export const WALL_DEFAULTS = {
  width: 20,
  height: 400,
  minWidth: 10,
  maxWidth: 100,
  minHeight: 40,
  maxHeight: 800,
};

/** Box default/limits | 箱子默认/限制 */
export const BOX_DEFAULTS = {
  width: 40,
  height: 40,
  minWidth: 20,
  maxWidth: 200,
  minHeight: 20,
  maxHeight: 200,
};

/** BtnWirePortalSystem defaults (button + portal) | 按钮传送门系统默认值 (按钮 + 传送门) */
export const WIRE_PORTAL_DEFAULTS = {
  buttonWidth: 34,
  buttonHeight: 16,
  portalWidth: 50,
  portalHeight: 50,
  offsetX: 200,
};

/** BtnSpikeLink System defaults (button + spike) | 按钮尖刺系统默认值 (按钮 + 尖刺) */
export const BTN_SPIKE_DEFAULTS = {
  buttonWidth: 34,
  buttonHeight: 16,
  spikeWidth: 100,
  spikeHeight: 20,
  offsetX: 200,
};

/** BtnPlatformLinkSystem defaults (button + disappearing platform) | 按钮平台系统默认值 (按钮 + 消失平台) */
export const BTN_PLATFORM_DEFAULTS = {
  buttonWidth: 34,
  buttonHeight: 16,
  platformWidth: 160,
  platformHeight: 30,
  offsetX: 200,
};

/** NPC fixed size | NPC固定大小 */
export const NPC_SIZE = {
  width: 40,
  height: 40,
};

/** Signboard fixed size | 告示牌固定大小 */
export const SIGNBOARD_SIZE = {
  width: 100,
  height: 65,
};

/** TextPrompt default size | 文本提示默认大小 */
export const TEXT_PROMPT_DEFAULTS = {
  width: 280,
  height: 72,
  textSize: 14,
  lineHeight: 18,
};

/** Checkpoint fixed size | 检查点固定大小 */
export const CHECKPOINT_SIZE = {
  width: 40,
  height: 70,
};

/** TeleportPoint fixed size | 传送点固定大小 */
export const TELEPORT_POINT_SIZE = {
  width: 40,
  height: 70,
};

/** Enemy default size and properties | 敌人默认大小和属性 */
export const ENEMY_DEFAULTS = {
  width: 40,
  height: 40,
  speed: 2,
  directionRight: 1,
  directionLeft: -1,
};

/** Preview opacity (0–255) | 预览不透明度 (0–255) */
export const PREVIEW_ALPHA = 100;

/** Toolbar height | 工具栏高度 */
export const TOOLBAR_HEIGHT = 80;

/** Drag handle size (world coordinate pixels) | 拖动手柄大小 (世界坐标像素) */
export const HANDLE_SIZE = 12;

/** Delete button size (world coordinate pixels) | 删除按钮大小 (世界坐标像素) */
export const DELETE_BTN_SIZE = 18;

/** Camera manual movement speed (pixels/frame) | 摄像机手动移动速度 (像素/帧) */
export const CAMERA_MOVE_SPEED = 8;

/** Default room count | 默认房间数 */
export const DEFAULT_ROOM_COUNT = 2;

/** Auto wall thickness (pixels) | 自动墙厚度 (像素) */
export const WALL_THICKNESS = 20;

/** Spawn marker size (world coordinate pixels) | 生成点标记大小 (世界坐标像素) */
export const SPAWN_MARKER_SIZE = 20;

/** Spawn default location | 生成点默认位置 */
export const SPAWN_DEFAULTS = {
  x: 50,
  y: 450,
  playerW: 40,
  playerH: 40,
};
