/**
 * EditorConfig — 地图编辑器全局常量与默认值
 */

/** 可放置的实体类型枚举 */
export const EntityTool = Object.freeze({
  GROUND: "ground",
  PORTAL: "portal",
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

/** 预览半透明度 (0–255) */
export const PREVIEW_ALPHA = 100;

/** 工具栏高度 */
export const TOOLBAR_HEIGHT = 100;
