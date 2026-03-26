/**
 * EditorConfig — 地图编辑器全局常量与默认值
 */

/** 可放置的实体类型枚举 */
export const EntityTool = Object.freeze({
  GROUND: "ground",
  PORTAL: "portal",
  PLATFORM: "platform",
  SPIKE: "spike",
  WALL: "wall",
});

/** 网格吸附大小 */
export const GRID_SIZE = 10;

/** Ground 默认/限制 */
export const GROUND_DEFAULTS = {
  width: 200,
  height: 40,
  minWidth: 30,
  maxWidth: 1200,
  minHeight: 20,
  maxHeight: 400,
};

/** Portal 固定大小 */
export const PORTAL_SIZE = {
  width: 50,
  height: 50,
};

/** Platform 默认/限制 */
export const PLATFORM_DEFAULTS = {
  width: 160,
  height: 30,
  minWidth: 30,
  maxWidth: 1200,
  minHeight: 20,
  maxHeight: 200,
};

/** Spike 默认/限制 */
export const SPIKE_DEFAULTS = {
  width: 100,
  height: 20,
  minWidth: 20,
  maxWidth: 600,
  minHeight: 10,
  maxHeight: 60,
};

/** Wall 默认/限制 */
export const WALL_DEFAULTS = {
  width: 20,
  height: 400,
  minWidth: 10,
  maxWidth: 100,
  minHeight: 40,
  maxHeight: 800,
};

/** 预览半透明度 (0–255) */
export const PREVIEW_ALPHA = 100;

/** 工具栏高度 */
export const TOOLBAR_HEIGHT = 60;

/** 拖拽手柄大小（世界坐标像素） */
export const HANDLE_SIZE = 12;

/** 删除按钮大小（世界坐标像素） */
export const DELETE_BTN_SIZE = 18;

/** 摄像机手动移动速度（像素/帧） */
export const CAMERA_MOVE_SPEED = 8;

/** 默认房间数量 */
export const DEFAULT_ROOM_COUNT = 2;

/** 自动墙壁厚度（像素） */
export const WALL_THICKNESS = 20;
