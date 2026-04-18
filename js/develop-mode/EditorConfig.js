/**
 * EditorConfig — Map editor global constants and defaults
 */

/** Enum of placeable entity types */
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

/** Grid snap size */
export const GRID_SIZE = 10;

/** Ground default/limits */
export const GROUND_DEFAULTS = {
  width: 200,
  height: 40,
  minWidth: 30,
  maxWidth: 1200,
  minHeight: 20,
  maxHeight: 400,
};

/** Portal fixed size */
export const PORTAL_SIZE = {
  width: 50,
  height: 50,
};

/** Platform default/limits */
export const PLATFORM_DEFAULTS = {
  width: 160,
  height: 30,
  minWidth: 30,
  maxWidth: 1200,
  minHeight: 20,
  maxHeight: 200,
};

/** Spike default/limits */
export const SPIKE_DEFAULTS = {
  width: 100,
  height: 20,
  minWidth: 20,
  maxWidth: 600,
  minHeight: 10,
  maxHeight: 60,
};

/** Wall default/limits */
export const WALL_DEFAULTS = {
  width: 20,
  height: 400,
  minWidth: 10,
  maxWidth: 100,
  minHeight: 40,
  maxHeight: 800,
};

/** Box default/limits */
export const BOX_DEFAULTS = {
  width: 40,
  height: 40,
  minWidth: 20,
  maxWidth: 200,
  minHeight: 20,
  maxHeight: 200,
};

/** BtnWirePortalSystem defaults (button + portal) */
export const WIRE_PORTAL_DEFAULTS = {
  buttonWidth: 34,
  buttonHeight: 16,
  portalWidth: 50,
  portalHeight: 50,
  offsetX: 200,
};

/** BtnSpikeLink System defaults (button + spike) */
export const BTN_SPIKE_DEFAULTS = {
  buttonWidth: 34,
  buttonHeight: 16,
  spikeWidth: 100,
  spikeHeight: 20,
  offsetX: 200,
};

/** BtnPlatformLinkSystem defaults (button + disappearing platform) */
export const BTN_PLATFORM_DEFAULTS = {
  buttonWidth: 34,
  buttonHeight: 16,
  platformWidth: 160,
  platformHeight: 30,
  offsetX: 200,
};

/** NPC fixed size */
export const NPC_SIZE = {
  width: 40,
  height: 40,
};

/** Signboard fixed size */
export const SIGNBOARD_SIZE = {
  width: 100,
  height: 65,
};

/** TextPrompt default size */
export const TEXT_PROMPT_DEFAULTS = {
  width: 280,
  height: 72,
  textSize: 14,
  lineHeight: 18,
};

/** Checkpoint fixed size */
export const CHECKPOINT_SIZE = {
  width: 40,
  height: 70,
};

/** TeleportPoint fixed size */
export const TELEPORT_POINT_SIZE = {
  width: 40,
  height: 70,
};

/** Enemy default size and properties */
export const ENEMY_DEFAULTS = {
  width: 40,
  height: 40,
  speed: 2,
  directionRight: 1,
  directionLeft: -1,
};

/** Preview opacity (0–255) */
export const PREVIEW_ALPHA = 100;

/** Toolbar height */
export const TOOLBAR_HEIGHT = 80;

/** Drag handle size (world coordinate pixels) */
export const HANDLE_SIZE = 12;

/** Delete button size (world coordinate pixels) */
export const DELETE_BTN_SIZE = 18;

/** Camera manual movement speed (pixels/frame) */
export const CAMERA_MOVE_SPEED = 8;

/** Default room count */
export const DEFAULT_ROOM_COUNT = 2;

/** Auto wall thickness (pixels) */
export const WALL_THICKNESS = 20;

/** Spawn marker size (world coordinate pixels) */
export const SPAWN_MARKER_SIZE = 20;

/** Spawn default location */
export const SPAWN_DEFAULTS = {
  x: 50,
  y: 450,
  playerW: 40,
  playerH: 40,
};
