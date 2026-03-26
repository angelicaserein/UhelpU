/**
 * EditorEntityManager — 管理编辑器放置的实体列表
 *
 * 放置时创建真实的 Ground / Portal 游戏实体，
 * 直接加入关卡的 entities Set 并同步物理/碰撞系统，
 * 使玩家可以踩上去、与之交互，实时调试关卡设计。
 */

import {
  EntityTool,
  GRID_SIZE,
  HANDLE_SIZE,
  GROUND_DEFAULTS,
  PLATFORM_DEFAULTS,
  SPIKE_DEFAULTS,
  WALL_DEFAULTS,
  DELETE_BTN_SIZE,
} from "./EditorConfig.js";
import { Ground } from "../game-entity-model/terrain/Ground.js";
import { Portal } from "../game-entity-model/interactables/Portal.js";
import { Platform } from "../game-entity-model/terrain/Platform.js";
import { Spike } from "../game-entity-model/interactables/Spike.js";
import { Wall } from "../game-entity-model/terrain/Wall.js";

/**
 * @typedef {Object} PlacedRecord
 * @property {string} tool      — EntityTool 枚举值
 * @property {object} gameEntity — 真实的游戏实体引用
 */

export class EditorEntityManager {
  /**
   * @param {object} level — 宿主关卡实例（需要 entities, physicsSystem, collisionSystem）
   */
  constructor(level) {
    this._level = level;
    /** @type {PlacedRecord[]} */
    this._records = [];

    /** 当前选中的记录（Ground/Platform/Spike 可调整大小） */
    this._selected = null;
    /** 正在拖拽的手柄 id ('bl'|'br'|'tl'|'tr') 或 null */
    this._resizeHandle = null;
    /** 拖拽时的锚点（对角固定点） */
    this._anchor = null;
  }

  /**
   * 放置一个新实体（创建真实游戏实体并加入关卡）
   */
  place(tool, x, y, w, h) {
    let gameEntity;
    if (tool === EntityTool.GROUND) {
      gameEntity = new Ground(x, y, w, h);
    } else if (tool === EntityTool.PLATFORM) {
      gameEntity = new Platform(x, y, w, h);
    } else if (tool === EntityTool.SPIKE) {
      gameEntity = new Spike(x, y, w, h, { color: [220, 50, 50] });
    } else if (tool === EntityTool.WALL) {
      gameEntity = new Wall(x, y, w, h);
    } else {
      gameEntity = new Portal(x, y, w, h);
      gameEntity.openPortal();
    }

    // 加入关卡实体集合并同步系统
    this._level.entities.add(gameEntity);
    this._syncSystems();

    const record = { tool, gameEntity };
    this._records.push(record);
    return record;
  }

  /** 撤销最后一个放置（从关卡中移除） */
  undoLast() {
    const record = this._records.pop();
    if (!record) return null;
    this._level.entities.delete(record.gameEntity);
    this._syncSystems();
    return record;
  }

  /** 清空全部编辑器实体（从关卡中移除） */
  clear() {
    for (const record of this._records) {
      this._level.entities.delete(record.gameEntity);
    }
    this._records.length = 0;
    this._syncSystems();
  }

  /** 删除指定记录（从关卡中移除） */
  remove(record) {
    const idx = this._records.indexOf(record);
    if (idx === -1) return false;
    this._level.entities.delete(record.gameEntity);
    this._records.splice(idx, 1);
    if (this._selected === record) this.deselect();
    this._syncSystems();
    return true;
  }

  /** 获取所有放置记录 */
  getAll() {
    return this._records;
  }

  // ══════════════════════════════════════════════════════════════
  // 选中 & 调整大小
  // ══════════════════════════════════════════════════════════════

  /**
   * 检测世界坐标是否落在某个实体的删除按钮上，返回该记录或 null
   */
  getDeleteBtnHit(worldX, worldY) {
    const bs = DELETE_BTN_SIZE;
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      const e = rec.gameEntity;
      const w = e.collider ? e.collider.w : 50;
      const h = e.collider ? e.collider.h : 50;
      // 删除按钮位于实体右上角偏移
      const bx = e.x + w - bs / 2;
      const by = e.y + h + 2;
      if (
        worldX >= bx &&
        worldX <= bx + bs &&
        worldY >= by &&
        worldY <= by + bs
      ) {
        return rec;
      }
    }
    return null;
  }

  /** 查找世界坐标处的可选中记录（后放置的优先） */
  findAt(worldX, worldY) {
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      if (rec.tool === EntityTool.PORTAL) continue;
      const e = rec.gameEntity;
      const w = e.collider ? e.collider.w : 0;
      const h = e.collider ? e.collider.h : 0;
      if (
        worldX >= e.x &&
        worldX <= e.x + w &&
        worldY >= e.y &&
        worldY <= e.y + h
      ) {
        return rec;
      }
    }
    return null;
  }

  /** 选中一个记录 */
  select(record) {
    this._selected = record;
  }

  /** 取消选中 */
  deselect() {
    this._selected = null;
    this._resizeHandle = null;
    this._anchor = null;
  }

  /** 获取当前选中 */
  get selected() {
    return this._selected;
  }

  /** 是否正在拖拽调整大小 */
  isResizing() {
    return this._resizeHandle !== null;
  }

  /**
   * 检测世界坐标是否落在选中实体的某个手柄上，返回手柄 id 或 null
   */
  getHandleAt(worldX, worldY) {
    if (!this._selected) return null;
    const e = this._selected.gameEntity;
    const w = e.collider.w;
    const h = e.collider.h;
    const handles = {
      bl: { x: e.x, y: e.y },
      br: { x: e.x + w, y: e.y },
      tl: { x: e.x, y: e.y + h },
      tr: { x: e.x + w, y: e.y + h },
    };
    for (const [id, pos] of Object.entries(handles)) {
      if (
        Math.abs(worldX - pos.x) <= HANDLE_SIZE &&
        Math.abs(worldY - pos.y) <= HANDLE_SIZE
      ) {
        return id;
      }
    }
    return null;
  }

  /** 开始拖拽某个手柄 */
  startResize(handle) {
    if (!this._selected) return;
    const e = this._selected.gameEntity;
    const w = e.collider.w;
    const h = e.collider.h;
    const anchors = {
      bl: { x: e.x + w, y: e.y + h },
      br: { x: e.x, y: e.y + h },
      tl: { x: e.x + w, y: e.y },
      tr: { x: e.x, y: e.y },
    };
    this._anchor = anchors[handle];
    this._resizeHandle = handle;
  }

  /** 拖拽中更新大小 */
  updateResize(worldX, worldY) {
    if (!this._resizeHandle || !this._selected) return;
    const sx = this._snap(worldX);
    const sy = this._snap(worldY);

    // 根据实体类型取对应的尺寸限制
    const limits =
      this._selected.tool === EntityTool.PLATFORM
        ? PLATFORM_DEFAULTS
        : this._selected.tool === EntityTool.SPIKE
          ? SPIKE_DEFAULTS
          : this._selected.tool === EntityTool.WALL
            ? WALL_DEFAULTS
            : GROUND_DEFAULTS;

    let newW = Math.abs(this._anchor.x - sx);
    let newH = Math.abs(this._anchor.y - sy);
    newW = Math.max(limits.minWidth, Math.min(limits.maxWidth, newW));
    newH = Math.max(limits.minHeight, Math.min(limits.maxHeight, newH));

    const newX = Math.min(
      this._anchor.x,
      this._anchor.x + (sx < this._anchor.x ? -newW : 0),
    );
    const newY = Math.min(
      this._anchor.y,
      this._anchor.y + (sy < this._anchor.y ? -newH : 0),
    );

    const e = this._selected.gameEntity;
    // 根据锚点确定新的位置
    if (sx <= this._anchor.x) {
      e.x = this._anchor.x - newW;
    } else {
      e.x = this._anchor.x;
    }
    if (sy <= this._anchor.y) {
      e.y = this._anchor.y - newH;
    } else {
      e.y = this._anchor.y;
    }
    e.collider.w = newW;
    e.collider.h = newH;

    this._syncSystems();
  }

  /** 结束拖拽 */
  endResize() {
    this._resizeHandle = null;
    this._anchor = null;
  }

  _snap(v) {
    return Math.round(v / GRID_SIZE) * GRID_SIZE;
  }

  /** 同步物理和碰撞系统的实体引用 */
  _syncSystems() {
    if (this._level.physicsSystem?.setEntities) {
      this._level.physicsSystem.setEntities(this._level.entities);
    }
    if (this._level.collisionSystem?.setEntities) {
      this._level.collisionSystem.setEntities(this._level.entities);
    }
  }

  /**
   * 在世界空间绘制编辑器标注（高亮边框 + 标签），
   * 真实实体的本体绘制由关卡自身的 draw 完成。
   */
  draw(p) {
    for (const rec of this._records) {
      const e = rec.gameEntity;
      const w = e.collider ? e.collider.w : 50;
      const h = e.collider ? e.collider.h : 50;
      const isSelected = rec === this._selected;

      p.push();
      p.noFill();
      p.strokeWeight(isSelected ? 3 : 2);
      if (rec.tool === EntityTool.GROUND) {
        p.stroke(isSelected ? 255 : 100, 255, 100, isSelected ? 240 : 180);
      } else if (rec.tool === EntityTool.PLATFORM) {
        p.stroke(isSelected ? 255 : 180, 180, 100, isSelected ? 240 : 180);
      } else if (rec.tool === EntityTool.SPIKE) {
        p.stroke(isSelected ? 255 : 220, 80, 80, isSelected ? 240 : 180);
      } else if (rec.tool === EntityTool.WALL) {
        p.stroke(isSelected ? 255 : 140, 140, 160, isSelected ? 240 : 180);
      } else {
        p.stroke(100, 170, 255, 180);
      }
      p.rect(e.x, e.y, w, h);

      // 选中可调整大小实体时绘制四个角手柄
      if (isSelected && rec.tool !== EntityTool.PORTAL) {
        this._drawHandles(p, e.x, e.y, w, h);
      }

      // 删除按钮（右上角）
      this._drawDeleteBtn(p, e.x + w, e.y + h);

      // 标签
      p.push();
      p.translate(e.x, e.y + h);
      p.scale(1, -1);
      p.fill(255, 255, 255, 220);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      if (rec.tool === EntityTool.GROUND) {
        p.text(`G ${w}×${h}`, 3, 3);
      } else if (rec.tool === EntityTool.PLATFORM) {
        p.text(`P ${w}×${h}`, 3, 3);
      } else if (rec.tool === EntityTool.SPIKE) {
        p.text(`S ${w}×${h}`, 3, 3);
      } else if (rec.tool === EntityTool.WALL) {
        p.text(`W ${w}×${h}`, 3, 3);
      } else {
        p.text("Portal", 3, 3);
      }
      p.pop();
      p.pop();
    }
  }

  /** 绘制删除按钮（实体右上角） */
  _drawDeleteBtn(p, rightX, topY) {
    const bs = DELETE_BTN_SIZE;
    const bx = rightX - bs / 2;
    const by = topY + 2;

    // 背景圆角矩形
    p.fill(200, 50, 50, 220);
    p.stroke(255, 80, 80);
    p.strokeWeight(1);
    p.rect(bx, by, bs, bs, 3);

    // X 号（翻转回正常文字方向）
    p.push();
    p.translate(bx + bs / 2, by + bs / 2);
    p.scale(1, -1);
    p.fill(255);
    p.noStroke();
    p.textSize(13);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("×", 0, 0);
    p.pop();
  }

  /** 绘制四个角拖拽手柄 */
  _drawHandles(p, x, y, w, h) {
    const hs = HANDLE_SIZE;
    const corners = [
      { cx: x, cy: y },
      { cx: x + w, cy: y },
      { cx: x, cy: y + h },
      { cx: x + w, cy: y + h },
    ];
    for (const c of corners) {
      p.fill(255, 255, 100, 220);
      p.stroke(80);
      p.strokeWeight(1);
      p.rectMode(p.CENTER);
      p.rect(c.cx, c.cy, hs, hs);
      p.rectMode(p.CORNER);
    }
  }
}
