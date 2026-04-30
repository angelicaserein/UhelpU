/**
 * EditorEntityManager — Manages list of entities placed by editor
 * EditorEntityManager — 管理编辑器放置的实体列表
 *
 * On placement creates real game entities (Ground / Portal, etc.),
 * 放置时创建真实游戏实体 (地面 / 传送门等等),
 * directly adds to level's entities Set and syncs physics/collision system,
 * 直接添加到级别的 entities Set 中并同步物理/碰撞系统,
 * so player can step on them, interact with them, real-time debug level design.
 * 以便玩家可以踏上它们、与它们互动、实时调试级别设计。
 */

import {
  EntityTool,
  GRID_SIZE,
  HANDLE_SIZE,
  GROUND_DEFAULTS,
  PLATFORM_DEFAULTS,
  SPIKE_DEFAULTS,
  WALL_DEFAULTS,
  WIRE_PORTAL_DEFAULTS,
  BTN_SPIKE_DEFAULTS,
  BTN_PLATFORM_DEFAULTS,
  NPC_SIZE,
  SIGNBOARD_SIZE,
  TEXT_PROMPT_DEFAULTS,
  CHECKPOINT_SIZE,
  ENEMY_DEFAULTS,
  DELETE_BTN_SIZE,
  TELEPORT_POINT_SIZE,
  BOX_DEFAULTS,
} from "./EditorConfig.js";
import { Ground } from "../game-entity-model/terrain/Ground.js";
import { Portal } from "../game-entity-model/interactables/Portal.js";
import { Platform } from "../game-entity-model/terrain/Platform.js";
import { Spike } from "../game-entity-model/interactables/Spike.js";
import { Wall } from "../game-entity-model/terrain/Wall.js";
import { Button } from "../game-entity-model/interactables/Button.js";
import { BtnWirePortalSystem } from "../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonSpikeLinkSystem } from "../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { ButtonPlatformLinkSystem } from "../mechanism-system/demo2/ButtonPlatformLinkSystem.js";
import { NPCDemo1 } from "../game-entity-model/interactables/NPCDemo1.js";
import { SignboardDemo2 } from "../game-entity-model/interactables/SignboardDemo2.js";
import { TextPrompt } from "../game-entity-model/prompts/TextPrompt.js";
import { Checkpoint } from "../game-entity-model/interactables/Checkpoint.js";
import { Enemy } from "../game-entity-model/characters/Enemy.js";
import { TeleportPoint } from "../game-entity-model/interactables/TeleportPoint.js";

import { Box } from "../game-entity-model/interactables/Box.js";
/**
 * @typedef {Object} PlacedRecord
 * @property {string} tool      — EntityTool enum value | EntityTool 枚举值
 * @property {object} gameEntity — Real game entity reference | 真实游戏实体引用
 */

export class EditorEntityManager {
  /**
   * @param {object} level — Host level instance (requires entities, physicsSystem, collisionSystem)
   */
  constructor(level) {
    this._level = level;
    /** @type {PlacedRecord[]} */
    this._records = [];

    /** Currently selected record (Ground/Platform/Spike can be resized) */
    this._selected = null;
    /** Handle being dragged: id ('bl'|'br'|'tl'|'tr') or null */
    this._resizeHandle = null;
    /** Anchor point for dragging (opposite corner fixed) */
    this._anchor = null;

    /** WirePortal / BtnSpike sub-entity dragging state */
    this._movingEntity = null; // Reference to sub-entity being moved (button or portal or spike)
    this._movingRecord = null; // Associated record
    this._moveOffsetX = 0;
    this._moveOffsetY = 0;

    /** Overall entity dragging state (Ground/Platform/Spike/Wall/NPC/Signboard/Checkpoint/Portal) */
    this._draggingRecord = null; // Record being dragged
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;

    /** BtnSpike spike resize state */
    this._bsResizeRecord = null;
    this._bsResizeHandle = null;
    this._bsResizeAnchor = null;

    /** BtnPlatform platform resize state */
    this._bpResizeRecord = null;
    this._bpResizeHandle = null;
    this._bpResizeAnchor = null;
    this._bpResizePlatformIdx = 0;
  }

  /**
   * Place a new entity (create real game entity and add to level)
   * 放置一个新实体 (创建真实游戏实体并添加到级别)
   */
  place(tool, x, y, w, h, options = {}) {
    let gameEntity;
    if (tool === EntityTool.GROUND) {
      gameEntity = new Ground(x, y, w, h);
    } else if (tool === EntityTool.PLATFORM) {
      gameEntity = new Platform(x, y, w, h);
    } else if (tool === EntityTool.SPIKE) {
      gameEntity = new Spike(x, y, w, h, { color: [220, 50, 50] });
    } else if (tool === EntityTool.WALL) {
      gameEntity = new Wall(x, y, w, h);
    } else if (tool === EntityTool.BOX) {
      gameEntity = new Box(x, y, w, h);
    } else if (tool === EntityTool.WIRE_PORTAL) {
      const btn = new Button(
        x,
        y,
        WIRE_PORTAL_DEFAULTS.buttonWidth,
        WIRE_PORTAL_DEFAULTS.buttonHeight,
      );
      const portal = new Portal(
        x + WIRE_PORTAL_DEFAULTS.offsetX,
        y,
        WIRE_PORTAL_DEFAULTS.portalWidth,
        WIRE_PORTAL_DEFAULTS.portalHeight,
      );
      const system = new BtnWirePortalSystem({ button: btn, portal: portal });
      this._level.entities.add(btn);
      this._level.entities.add(portal);
      this._syncSystems();
      const record = {
        tool,
        gameEntity: btn,
        portalEntity: portal,
        wireSystem: system,
      };
      this._records.push(record);
      return record;
    } else if (tool === EntityTool.BTN_SPIKE) {
      const btn = new Button(
        x,
        y,
        BTN_SPIKE_DEFAULTS.buttonWidth,
        BTN_SPIKE_DEFAULTS.buttonHeight,
      );
      const spike = new Spike(
        x + BTN_SPIKE_DEFAULTS.offsetX,
        y,
        BTN_SPIKE_DEFAULTS.spikeWidth,
        BTN_SPIKE_DEFAULTS.spikeHeight,
        { color: [220, 50, 50] },
      );
      const btnSpikeCount = this._records.filter(
        (record) => record.tool === EntityTool.BTN_SPIKE,
      ).length;
      const system = new ButtonSpikeLinkSystem(
        { button: btn, spikes: [spike] },
        { startColorIndex: btnSpikeCount },
      );
      this._level.entities.add(btn);
      this._level.entities.add(spike);
      this._syncSystems();
      const record = {
        tool,
        gameEntity: btn,
        spikeEntity: spike,
        spikeLinkSystem: system,
        startColorIndex: btnSpikeCount,
      };
      this._records.push(record);
      return record;
    } else if (tool === EntityTool.BTN_PLATFORM) {
      const btn = new Button(
        x,
        y,
        BTN_PLATFORM_DEFAULTS.buttonWidth,
        BTN_PLATFORM_DEFAULTS.buttonHeight,
      );
      const count = options.platformCount || 1;
      const btnPlatformCount = this._records.filter(
        (record) => record.tool === EntityTool.BTN_PLATFORM,
      ).length;
      const startColorIndex = options.startColorIndex ?? btnPlatformCount;
      const platGapY = 50; // Vertical spacing between each platform
      const platforms = [];
      const platformLinks = [];
      for (let i = 0; i < count; i++) {
        const plat = new Platform(
          x + BTN_PLATFORM_DEFAULTS.offsetX,
          y + i * platGapY,
          BTN_PLATFORM_DEFAULTS.platformWidth,
          BTN_PLATFORM_DEFAULTS.platformHeight,
        );
        platforms.push(plat);
        platformLinks.push({
          platform: plat,
          mode: options.platformModes?.[i] || "disappear",
        });
        this._level.entities.add(plat);
      }
      const system = new ButtonPlatformLinkSystem(
        { button: btn, platforms: platformLinks },
        this._level.collisionSystem,
        { startColorIndex },
      );
      this._level.entities.add(btn);
      this._syncSystems();
      const record = {
        tool,
        gameEntity: btn,
        platformEntities: platforms,
        platformLinks,
        platformLinkSystem: system,
        startColorIndex,
      };
      this._records.push(record);
      return record;
    } else if (tool === EntityTool.NPC) {
      gameEntity = new NPCDemo1(x, y, NPC_SIZE.width, NPC_SIZE.height);
    } else if (tool === EntityTool.SIGNBOARD) {
      gameEntity = new SignboardDemo2(
        x,
        y,
        SIGNBOARD_SIZE.width,
        SIGNBOARD_SIZE.height,
      );
    } else if (tool === EntityTool.TEXT_PROMPT) {
      gameEntity = new TextPrompt(x, y, this._level, {
        textKey: options.textKey || "todo_text_prompt",
        width: options.width || TEXT_PROMPT_DEFAULTS.width,
        height: options.height || TEXT_PROMPT_DEFAULTS.height,
        textSize: options.textSize || TEXT_PROMPT_DEFAULTS.textSize,
        lineHeight: options.lineHeight || TEXT_PROMPT_DEFAULTS.lineHeight,
      });
    } else if (tool === EntityTool.CHECKPOINT) {
      gameEntity = new Checkpoint(
        x,
        y,
        CHECKPOINT_SIZE.width,
        CHECKPOINT_SIZE.height,
      );
    } else if (tool === EntityTool.ENEMY) {
      gameEntity = new Enemy(
        x,
        y,
        ENEMY_DEFAULTS.width,
        ENEMY_DEFAULTS.height,
        { speed: ENEMY_DEFAULTS.speed },
      );
    } else if (tool === EntityTool.TELEPORT_POINT) {
      gameEntity = new TeleportPoint(
        x,
        y,
        TELEPORT_POINT_SIZE.width,
        TELEPORT_POINT_SIZE.height,
      );
    } else {
      gameEntity = new Portal(x, y, w, h);
      gameEntity.openPortal();
    }

    // Add to level entity set and sync systems
    this._level.entities.add(gameEntity);
    this._syncSystems();

    const record = { tool, gameEntity };
    // Add Enemy record direction attribute
    if (tool === EntityTool.ENEMY) {
      record.direction = options.direction ?? ENEMY_DEFAULTS.directionRight;
      gameEntity._direction = record.direction;
    }
    this._records.push(record);
    return record;
  }

  /**
   * Undo last placement (remove from level)
   * 撤销最后放置 (从级别中删除)
   */
  undoLast() {
    const record = this._records.pop();
    if (!record) return null;
    this._level.entities.delete(record.gameEntity);
    if (record.portalEntity) this._level.entities.delete(record.portalEntity);
    if (record.spikeEntity) this._level.entities.delete(record.spikeEntity);
    if (record.platformEntities) {
      for (const plt of record.platformEntities)
        this._level.entities.delete(plt);
    }
    this._syncSystems();
    return record;
  }

  /**
   * Clear all editor entities (remove from level)
   * 清除所有编辑器实体 (从级别中删除)
   */
  clear() {
    for (const record of this._records) {
      this._level.entities.delete(record.gameEntity);
      if (record.portalEntity) this._level.entities.delete(record.portalEntity);
      if (record.spikeEntity) this._level.entities.delete(record.spikeEntity);
      if (record.platformEntities) {
        for (const plt of record.platformEntities)
          this._level.entities.delete(plt);
      }
    }
    this._records.length = 0;
    this._syncSystems();
  }

  /**
   * Delete specified record (remove from level)
   * 删除指定记录 (从级别中删除)
   */
  remove(record) {
    const idx = this._records.indexOf(record);
    if (idx === -1) return false;
    this._level.entities.delete(record.gameEntity);
    if (record.portalEntity) this._level.entities.delete(record.portalEntity);
    if (record.spikeEntity) this._level.entities.delete(record.spikeEntity);
    if (record.platformEntities) {
      for (const plt of record.platformEntities)
        this._level.entities.delete(plt);
    }
    this._records.splice(idx, 1);
    if (this._selected === record) this.deselect();
    this._syncSystems();
    return true;
  }

  /**
   * Get all placement records
   * 获取所有放置记录
   */
  getAll() {
    return this._records;
  }

  serializeRecords() {
    return this._records.map((record) => {
      const base = {
        tool: record.tool,
        gameEntity: this._serializeEntity(record.gameEntity),
      };

      if (record.portalEntity) {
        base.portalEntity = this._serializeEntity(record.portalEntity);
      }
      if (record.spikeEntity) {
        base.spikeEntity = this._serializeEntity(record.spikeEntity);
      }
      if (record.platformEntities) {
        base.platformEntities = record.platformEntities.map((entity) =>
          this._serializeEntity(entity),
        );
      }
      if (record.platformLinks) {
        base.platformLinks = record.platformLinks.map((link, index) => ({
          mode: link.mode || "disappear",
          platform: base.platformEntities?.[index] || null,
        }));
      }
      if (record.startColorIndex !== undefined) {
        base.startColorIndex = record.startColorIndex;
      }
      if (record.direction !== undefined) {
        base.direction = record.direction;
      }
      if (record.tool === EntityTool.TEXT_PROMPT) {
        base.textKey = record.gameEntity?.textKey || "";
        base.textPromptWidth = record.gameEntity?._boxWidth;
        base.textPromptHeight = record.gameEntity?._boxHeight;
        base.textPromptTextSize = record.gameEntity?._textSizeValue;
        base.textPromptLineHeight = record.gameEntity?._lineHeight;
      }

      return base;
    });
  }

  restoreRecords(records = []) {
    this._records = [];
    for (const record of records) {
      const gameEntity = record.gameEntity;
      if (!gameEntity) continue;

      if (record.tool === EntityTool.WIRE_PORTAL) {
        const restored = this.place(
          record.tool,
          gameEntity.x,
          gameEntity.y,
          gameEntity.w,
          gameEntity.h,
        );
        if (restored.portalEntity && record.portalEntity) {
          this._applySerializedEntity(
            restored.portalEntity,
            record.portalEntity,
          );
          this._rebuildWirePath(restored);
        }
        continue;
      }

      if (record.tool === EntityTool.BTN_SPIKE) {
        const restored = this.place(
          record.tool,
          gameEntity.x,
          gameEntity.y,
          gameEntity.w,
          gameEntity.h,
        );
        restored.startColorIndex =
          record.startColorIndex ?? restored.startColorIndex;
        if (record.spikeEntity && restored.spikeEntity) {
          this._applySerializedEntity(restored.spikeEntity, record.spikeEntity);
        }
        continue;
      }

      if (record.tool === EntityTool.BTN_PLATFORM) {
        const platformModes = (record.platformLinks || []).map(
          (link) => link.mode || "disappear",
        );
        const restored = this.place(
          record.tool,
          gameEntity.x,
          gameEntity.y,
          gameEntity.w,
          gameEntity.h,
          {
            platformCount: record.platformEntities?.length || 1,
            platformModes,
            startColorIndex: record.startColorIndex,
          },
        );
        restored.startColorIndex =
          record.startColorIndex ?? restored.startColorIndex;
        (record.platformEntities || []).forEach((entity, index) => {
          const platform = restored.platformEntities?.[index];
          if (platform) {
            this._applySerializedEntity(platform, entity);
          }
          if (restored.platformLinks?.[index]) {
            restored.platformLinks[index].mode =
              record.platformLinks?.[index]?.mode || "disappear";
          }
          if (restored.platformLinkSystem?._platforms?.[index]) {
            restored.platformLinkSystem._platforms[index].mode =
              restored.platformLinks[index].mode;
          }
        });
        if (typeof restored.platformLinkSystem?.reset === "function") {
          restored.platformLinkSystem.reset();
        }
        continue;
      }

      const restored = this.place(
        record.tool,
        gameEntity.x,
        gameEntity.y,
        gameEntity.w,
        gameEntity.h,
        record.tool === EntityTool.ENEMY
          ? { direction: record.direction }
          : record.tool === EntityTool.TEXT_PROMPT
            ? {
                textKey: record.textKey,
                width: record.textPromptWidth,
                height: record.textPromptHeight,
                textSize: record.textPromptTextSize,
                lineHeight: record.textPromptLineHeight,
              }
            : undefined,
      );
      if (restored?.gameEntity) {
        this._applySerializedEntity(restored.gameEntity, gameEntity);
      }
      if (record.tool === EntityTool.ENEMY && record.direction !== undefined) {
        restored.direction = record.direction;
        restored.gameEntity._direction = record.direction;
      }
      if (record.tool === EntityTool.TEXT_PROMPT) {
        restored.gameEntity.textKey = record.textKey || "";
      }
    }

    this._syncSystems();
  }

  toggleBtnPlatformMode(record, platformIdx) {
    if (
      !record ||
      record.tool !== EntityTool.BTN_PLATFORM ||
      !record.platformLinks ||
      !record.platformLinks[platformIdx] ||
      !record.platformLinkSystem
    ) {
      return null;
    }

    const link = record.platformLinks[platformIdx];
    const nextMode = link.mode === "appear" ? "disappear" : "appear";
    link.mode = nextMode;

    const entry = record.platformLinkSystem._platforms?.[platformIdx];
    if (entry) {
      entry.mode = nextMode;
      const pressed = record.gameEntity?.isPressed || false;
      entry.gone =
        (nextMode === "disappear" && pressed) ||
        (nextMode === "appear" && !pressed);
      entry.platform._hidden = entry.gone;
      entry.platform.collider.colliderType = entry.gone
        ? "TRIGGER"
        : entry._origColliderType;
    }

    if (
      typeof this._level.collisionSystem?.partitionEntitiesByType === "function"
    ) {
      this._level.collisionSystem.partitionEntitiesByType();
    }
    this._syncSystems();
    return nextMode;
  }

  // ══════════════════════════════════════════════════════════════
  // Selection & Resizing | 选择和调整大小
  // ══════════════════════════════════════════════════════════════

  /**
   * Detect if world coordinate falls on a delete button, return record or null
   * 检测世界坐标是否落在删除按钮上,返回记录或 null
   */
  getDeleteBtnHit(worldX, worldY) {
    const bs = DELETE_BTN_SIZE;
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      const e = rec.gameEntity;
      const { w, h } = this._getEntityBounds(e);
      // Delete button positioned at top-right corner offset
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
      // WirePortal: also check delete button on portal side
      if (rec.portalEntity) {
        const ptl = rec.portalEntity;
        const pw = ptl.collider ? ptl.collider.w : 50;
        const ph = ptl.collider ? ptl.collider.h : 50;
        const pbx = ptl.x + pw - bs / 2;
        const pby = ptl.y + ph + 2;
        if (
          worldX >= pbx &&
          worldX <= pbx + bs &&
          worldY >= pby &&
          worldY <= pby + bs
        ) {
          return rec;
        }
      }
      // BtnSpike: also check delete button on spike side
      if (rec.spikeEntity) {
        const spk = rec.spikeEntity;
        const sw = spk.collider ? spk.collider.w : 100;
        const sh = spk.collider ? spk.collider.h : 20;
        const sbx = spk.x + sw - bs / 2;
        const sby = spk.y + sh + 2;
        if (
          worldX >= sbx &&
          worldX <= sbx + bs &&
          worldY >= sby &&
          worldY <= sby + bs
        ) {
          return rec;
        }
      }
      // BtnPlatform: also check delete buttons on all platform sides
      if (rec.platformEntities) {
        for (const plt of rec.platformEntities) {
          const plw = plt.collider ? plt.collider.w : 160;
          const plh = plt.collider ? plt.collider.h : 30;
          const plbx = plt.x + plw - bs / 2;
          const plby = plt.y + plh + 2;
          if (
            worldX >= plbx &&
            worldX <= plbx + bs &&
            worldY >= plby &&
            worldY <= plby + bs
          ) {
            return rec;
          }
        }
      }
    }
    return null;
  }

  /**
   * Find selectable record at world coordinate (later placements take priority)
   * 在世界坐标处查找可选记录 (后续放置优先)
   */
  findAt(worldX, worldY) {
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      if (
        rec.tool === EntityTool.PORTAL ||
        rec.tool === EntityTool.WIRE_PORTAL ||
        rec.tool === EntityTool.BTN_SPIKE ||
        rec.tool === EntityTool.BTN_PLATFORM ||
        rec.tool === EntityTool.NPC ||
        rec.tool === EntityTool.SIGNBOARD ||
        rec.tool === EntityTool.CHECKPOINT ||
        rec.tool === EntityTool.TELEPORT_POINT ||
        rec.tool === EntityTool.ENEMY
      )
        continue;
      const e = rec.gameEntity;
      const { w, h } = this._getEntityBounds(e, 0, 0);
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

  /**
   * Select a record
   * 选择一条记录
   */
  select(record) {
    this._selected = record;
  }

  /**
   * Deselect
   * 取消选择
   */
  deselect() {
    this._selected = null;
    this._resizeHandle = null;
    this._anchor = null;
  }

  /**
   * Get currently selected
   * 获取当前选择的
   */
  get selected() {
    return this._selected;
  }

  /**
   * Is resizing in progress
   * 是否正在调整大小
   */
  isResizing() {
    return this._resizeHandle !== null;
  }

  /**
   * Is moving WirePortal / BtnSpike sub-entity
   * 是否正在移动 WirePortal / BtnSpike 子实体
   */
  isMoving() {
    return this._movingEntity !== null;
  }

  /**
   * Is dragging overall entity
   * 是否正在拖动整体实体
   */
  isDragging() {
    return this._draggingRecord !== null;
  }

  /**
   * Find draggable entity at world coordinate (not delete button or resize handle)
   * 在世界坐标处找到可拖动的实体 (不是删除按钮或调整大小句柄)
   * Return record or null
   * 返回记录或 null
   */
  findDraggableAt(worldX, worldY) {
    // Reverse iteration (later placements take priority)
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];

      // Skip types handled through sub-entity dragging
      if (
        rec.tool === EntityTool.WIRE_PORTAL ||
        rec.tool === EntityTool.BTN_SPIKE ||
        rec.tool === EntityTool.BTN_PLATFORM
      ) {
        continue;
      }

      const e = rec.gameEntity;

      // Get entity size
      const { w, h } = this._getEntityBounds(e);

      // Check if in delete button area (top-right)
      const bs = DELETE_BTN_SIZE;
      const delBtnX = e.x + w;
      const delBtnY = e.y + h;
      if (
        worldX >= delBtnX - bs &&
        worldX <= delBtnX + bs &&
        worldY >= delBtnY &&
        worldY <= delBtnY + bs
      ) {
        // In delete button area, should not drag
        continue;
      }

      // Check if in entity body
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

  /**
   * Start dragging overall entity
   * 开始拖动整体实体
   */
  startDrag(record, worldX, worldY) {
    this._draggingRecord = record;
    this._dragOffsetX = worldX - record.gameEntity.x;
    this._dragOffsetY = worldY - record.gameEntity.y;
  }

  /**
   * Update entity position during drag
   * 在拖动期间更新实体位置
   */
  updateDrag(worldX, worldY) {
    if (!this._draggingRecord) return;
    const e = this._draggingRecord.gameEntity;
    e.x = this._snap(worldX - this._dragOffsetX);
    e.y = this._snap(worldY - this._dragOffsetY);
    this._syncSystems();
  }

  /**
   * End drag
   * 结束拖动
   */
  endDrag() {
    this._draggingRecord = null;
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;
  }

  /**
   * Find WirePortal sub-entity at world coordinate
   * 在世界坐标处找到 WirePortal 子实体
   * @returns {{ record, entity }|null}
   */
  findWirePortalSubEntity(worldX, worldY) {
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      if (rec.tool !== EntityTool.WIRE_PORTAL) continue;
      // Check portal
      const ptl = rec.portalEntity;
      const pw = ptl.collider ? ptl.collider.w : 50;
      const ph = ptl.collider ? ptl.collider.h : 50;
      if (
        worldX >= ptl.x &&
        worldX <= ptl.x + pw &&
        worldY >= ptl.y &&
        worldY <= ptl.y + ph
      ) {
        return { record: rec, entity: ptl };
      }
      // Check button
      const btn = rec.gameEntity;
      const bw = btn.collider ? btn.collider.w : 34;
      const bh = btn.collider ? btn.collider.h : 16;
      if (
        worldX >= btn.x &&
        worldX <= btn.x + bw &&
        worldY >= btn.y &&
        worldY <= btn.y + bh
      ) {
        return { record: rec, entity: btn };
      }
    }
    return null;
  }

  /**
   * Find BtnSpike sub-entity at world coordinate
   * 在世界坐标处找到 BtnSpike 子实体
   * @returns {{ record, entity, isSpike: boolean }|null}
   */
  findBtnSpikeSubEntity(worldX, worldY) {
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      if (rec.tool !== EntityTool.BTN_SPIKE) continue;
      // Check spike
      const spk = rec.spikeEntity;
      const sw = spk.collider ? spk.collider.w : 100;
      const sh = spk.collider ? spk.collider.h : 20;
      if (
        worldX >= spk.x &&
        worldX <= spk.x + sw &&
        worldY >= spk.y &&
        worldY <= spk.y + sh
      ) {
        return { record: rec, entity: spk, isSpike: true };
      }
      // Check button
      const btn = rec.gameEntity;
      const bw = btn.collider ? btn.collider.w : 34;
      const bh = btn.collider ? btn.collider.h : 16;
      if (
        worldX >= btn.x &&
        worldX <= btn.x + bw &&
        worldY >= btn.y &&
        worldY <= btn.y + bh
      ) {
        return { record: rec, entity: btn, isSpike: false };
      }
    }
    return null;
  }

  /**
   * Find BtnPlatform sub-entity at world coordinate
   * 在世界坐标处找到 BtnPlatform 子实体
   * @returns {{ record, entity, isPlatform: boolean, platformIdx?: number }|null}
   */
  findBtnPlatformSubEntity(worldX, worldY) {
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      if (rec.tool !== EntityTool.BTN_PLATFORM) continue;
      // Check all platforms
      if (rec.platformEntities) {
        for (let pi = 0; pi < rec.platformEntities.length; pi++) {
          const plt = rec.platformEntities[pi];
          const pw = plt.collider ? plt.collider.w : 160;
          const ph = plt.collider ? plt.collider.h : 30;
          if (
            worldX >= plt.x &&
            worldX <= plt.x + pw &&
            worldY >= plt.y &&
            worldY <= plt.y + ph
          ) {
            return {
              record: rec,
              entity: plt,
              isPlatform: true,
              platformIdx: pi,
            };
          }
        }
      }
      // Check button
      const btn = rec.gameEntity;
      const bw = btn.collider ? btn.collider.w : 34;
      const bh = btn.collider ? btn.collider.h : 16;
      if (
        worldX >= btn.x &&
        worldX <= btn.x + bw &&
        worldY >= btn.y &&
        worldY <= btn.y + bh
      ) {
        return { record: rec, entity: btn, isPlatform: false };
      }
    }
    return null;
  }

  /**
   * Start dragging WirePortal sub-entity
   * 开始拖动 WirePortal 子实体
   */
  startMove(record, entity, worldX, worldY) {
    this._movingRecord = record;
    this._movingEntity = entity;
    this._moveOffsetX = worldX - entity.x;
    this._moveOffsetY = worldY - entity.y;
  }

  /**
   * Update WirePortal sub-entity position during drag
   * 在拖动期间更新 WirePortal 子实体位置
   */
  updateMove(worldX, worldY) {
    if (!this._movingEntity) return;
    this._movingEntity.x = this._snap(worldX - this._moveOffsetX);
    this._movingEntity.y = this._snap(worldY - this._moveOffsetY);
    this._syncSystems();
  }

  /**
   * End drag and rebuild wire path
   * 结束拖动并重建电线路径
   */
  endMove() {
    if (
      this._movingRecord &&
      this._movingRecord.tool === EntityTool.WIRE_PORTAL
    ) {
      this._rebuildWirePath(this._movingRecord);
    }
    this._movingEntity = null;
    this._movingRecord = null;
    this._moveOffsetX = 0;
    this._moveOffsetY = 0;
  }

  /**
   * Rebuild WirePortal record's wire path
   * 重建 WirePortal 记录的电线路径
   */
  _rebuildWirePath(record) {
    const sys = record.wireSystem;
    sys._wirePath = sys._buildAutoWirePath(50);
    sys._totalLen = 0;
    sys._segLens = [];
    const wp = sys._wirePath;
    for (let i = 1; i < wp.length; i++) {
      const dx = wp[i].x - wp[i - 1].x;
      const dy = wp[i].y - wp[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      sys._segLens.push(len);
      sys._totalLen += len;
    }
  }

  /**
   * Detect if world coordinate falls on a resize handle, return handle id or null
   * 检测世界坐标是否落在调整句柄上，返回句柄 id 或 null
   */
  getHandleAt(worldX, worldY) {
    if (!this._selected) return null;
    const e = this._selected.gameEntity;
    const { w, h } = this._getEntityBounds(e, 0, 0);
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

  /**
   * Start dragging a handle
   * 开始拖动句柄
   */
  startResize(handle) {
    if (!this._selected) return;
    const e = this._selected.gameEntity;
    const { w, h } = this._getEntityBounds(e, 0, 0);
    const anchors = {
      bl: { x: e.x + w, y: e.y + h },
      br: { x: e.x, y: e.y + h },
      tl: { x: e.x + w, y: e.y },
      tr: { x: e.x, y: e.y },
    };
    this._anchor = anchors[handle];
    this._resizeHandle = handle;
  }

  /**
   * Update size during drag
   * 在拖动期间更新大小
   */
  updateResize(worldX, worldY) {
    if (!this._resizeHandle || !this._selected) return;
    const sx = this._snap(worldX);
    const sy = this._snap(worldY);

    // Get size limits based on entity type | 根据实体类型获取大小限制
    const limits =
      this._selected.tool === EntityTool.PLATFORM
        ? PLATFORM_DEFAULTS
        : this._selected.tool === EntityTool.SPIKE
          ? SPIKE_DEFAULTS
          : this._selected.tool === EntityTool.WALL
            ? WALL_DEFAULTS
            : this._selected.tool === EntityTool.BOX
              ? BOX_DEFAULTS
              : this._selected.tool === EntityTool.TEXT_PROMPT
                ? {
                    minWidth: 80,
                    maxWidth: 1200,
                    minHeight: 40,
                    maxHeight: 300,
                  }
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
    // Determine new position based on anchor | 根据锚点确定新位置
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
    if (e.collider) {
      e.collider.w = newW;
      e.collider.h = newH;
    }
    if (e.type === "textprompt") {
      e._boxWidth = newW;
      e._boxHeight = newH;
    }
    if ("w" in e) e.w = newW;
    if ("h" in e) e.h = newH;

    this._syncSystems();
  }

  /**
   * End drag
   * 结束拖动
   */
  endResize() {
    this._resizeHandle = null;
    this._anchor = null;
  }

  // ══════════════════════════════════════════════════════════════
  // BtnSpike spike resize | BtnSpike 尖刺调整大小
  // ══════════════════════════════════════════════════════════════

  /**
   * Is BtnSpike spike resize in progress
   * BtnSpike 尖刺调整大小是否正在进行中
   */
  isBtnSpikeResizing() {
    return this._bsResizeHandle !== null;
  }

  /**
   * Detect if world coordinate falls on a BtnSpike spike handle
   * 检测世界坐标是否落在 BtnSpike 尖刺句柄上
   * @returns {{ record, handle: string }|null}
   */
  getBtnSpikeHandleAt(worldX, worldY) {
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      if (rec.tool !== EntityTool.BTN_SPIKE) continue;
      const spk = rec.spikeEntity;
      const w = spk.collider ? spk.collider.w : 100;
      const h = spk.collider ? spk.collider.h : 20;
      const handles = {
        bl: { x: spk.x, y: spk.y },
        br: { x: spk.x + w, y: spk.y },
        tl: { x: spk.x, y: spk.y + h },
        tr: { x: spk.x + w, y: spk.y + h },
      };
      for (const [id, pos] of Object.entries(handles)) {
        if (
          Math.abs(worldX - pos.x) <= HANDLE_SIZE &&
          Math.abs(worldY - pos.y) <= HANDLE_SIZE
        ) {
          return { record: rec, handle: id };
        }
      }
    }
    return null;
  }

  /**
   * Start resizing BtnSpike spike
   * 开始调整 BtnSpike 尖刺大小
   */
  startBtnSpikeResize(record, handle) {
    const spk = record.spikeEntity;
    const w = spk.collider.w;
    const h = spk.collider.h;
    const anchors = {
      bl: { x: spk.x + w, y: spk.y + h },
      br: { x: spk.x, y: spk.y + h },
      tl: { x: spk.x + w, y: spk.y },
      tr: { x: spk.x, y: spk.y },
    };
    this._bsResizeRecord = record;
    this._bsResizeHandle = handle;
    this._bsResizeAnchor = anchors[handle];
  }

  /**
   * Resize BtnSpike spike in progress
   * 正在调整 BtnSpike 尖刺大小
   */
  updateBtnSpikeResize(worldX, worldY) {
    if (!this._bsResizeHandle || !this._bsResizeRecord) return;
    const sx = this._snap(worldX);
    const sy = this._snap(worldY);
    const limits = SPIKE_DEFAULTS;

    let newW = Math.abs(this._bsResizeAnchor.x - sx);
    let newH = Math.abs(this._bsResizeAnchor.y - sy);
    newW = Math.max(limits.minWidth, Math.min(limits.maxWidth, newW));
    newH = Math.max(limits.minHeight, Math.min(limits.maxHeight, newH));

    const spk = this._bsResizeRecord.spikeEntity;
    if (sx <= this._bsResizeAnchor.x) {
      spk.x = this._bsResizeAnchor.x - newW;
    } else {
      spk.x = this._bsResizeAnchor.x;
    }
    if (sy <= this._bsResizeAnchor.y) {
      spk.y = this._bsResizeAnchor.y - newH;
    } else {
      spk.y = this._bsResizeAnchor.y;
    }
    spk.collider.w = newW;
    spk.collider.h = newH;
    this._syncSystems();
  }

  /**
   * End BtnSpike spike resize
   * 结束 BtnSpike 尖刺调整大小
   */
  endBtnSpikeResize() {
    this._bsResizeRecord = null;
    this._bsResizeHandle = null;
    this._bsResizeAnchor = null;
  }

  // ══════════════════════════════════════════════════════════════
  // BtnPlatform platform resize | BtnPlatform 平台调整大小
  // ══════════════════════════════════════════════════════════════

  /**
   * Is BtnPlatform platform resize in progress
   * BtnPlatform 平台调整大小是否正在进行中
   */
  isBtnPlatformResizing() {
    return this._bpResizeHandle !== null;
  }

  /**
   * Detect if world coordinate falls on a BtnPlatform platform handle
   * 检测世界坐标是否落在 BtnPlatform 平台句柄上
   * @returns {{ record, handle: string, platformIdx: number }|null}
   */
  getBtnPlatformHandleAt(worldX, worldY) {
    for (let i = this._records.length - 1; i >= 0; i--) {
      const rec = this._records[i];
      if (rec.tool !== EntityTool.BTN_PLATFORM) continue;
      if (!rec.platformEntities) continue;
      for (let pi = 0; pi < rec.platformEntities.length; pi++) {
        const plt = rec.platformEntities[pi];
        const w = plt.collider ? plt.collider.w : 160;
        const h = plt.collider ? plt.collider.h : 30;
        const handles = {
          bl: { x: plt.x, y: plt.y },
          br: { x: plt.x + w, y: plt.y },
          tl: { x: plt.x, y: plt.y + h },
          tr: { x: plt.x + w, y: plt.y + h },
        };
        for (const [id, pos] of Object.entries(handles)) {
          if (
            Math.abs(worldX - pos.x) <= HANDLE_SIZE &&
            Math.abs(worldY - pos.y) <= HANDLE_SIZE
          ) {
            return { record: rec, handle: id, platformIdx: pi };
          }
        }
      }
    }
    return null;
  }

  /**
   * Start resizing BtnPlatform platform
   * 开始调整 BtnPlatform 平台大小
   */
  startBtnPlatformResize(record, handle, platformIdx = 0) {
    const plt = record.platformEntities
      ? record.platformEntities[platformIdx]
      : null;
    if (!plt) return;
    const w = plt.collider.w;
    const h = plt.collider.h;
    const anchors = {
      bl: { x: plt.x + w, y: plt.y + h },
      br: { x: plt.x, y: plt.y + h },
      tl: { x: plt.x + w, y: plt.y },
      tr: { x: plt.x, y: plt.y },
    };
    this._bpResizeRecord = record;
    this._bpResizeHandle = handle;
    this._bpResizeAnchor = anchors[handle];
    this._bpResizePlatformIdx = platformIdx;
  }

  /**
   * Resize BtnPlatform platform in progress
   * 正在调整 BtnPlatform 平台大小
   */
  updateBtnPlatformResize(worldX, worldY) {
    if (!this._bpResizeHandle || !this._bpResizeRecord) return;
    const sx = this._snap(worldX);
    const sy = this._snap(worldY);
    const limits = PLATFORM_DEFAULTS;

    let newW = Math.abs(this._bpResizeAnchor.x - sx);
    let newH = Math.abs(this._bpResizeAnchor.y - sy);
    newW = Math.max(limits.minWidth, Math.min(limits.maxWidth, newW));
    newH = Math.max(limits.minHeight, Math.min(limits.maxHeight, newH));

    const plt = this._bpResizeRecord.platformEntities
      ? this._bpResizeRecord.platformEntities[this._bpResizePlatformIdx]
      : null;
    if (!plt) return;
    if (sx <= this._bpResizeAnchor.x) {
      plt.x = this._bpResizeAnchor.x - newW;
    } else {
      plt.x = this._bpResizeAnchor.x;
    }
    if (sy <= this._bpResizeAnchor.y) {
      plt.y = this._bpResizeAnchor.y - newH;
    } else {
      plt.y = this._bpResizeAnchor.y;
    }
    plt.collider.w = newW;
    plt.collider.h = newH;
    this._syncSystems();
  }

  /**
   * End BtnPlatform platform resize
   * 结束 BtnPlatform 平台调整大小
   */
  endBtnPlatformResize() {
    this._bpResizeRecord = null;
    this._bpResizeHandle = null;
    this._bpResizeAnchor = null;
    this._bpResizePlatformIdx = 0;
  }

  _snap(v) {
    return Math.round(v / GRID_SIZE) * GRID_SIZE;
  }

  _serializeEntity(entity) {
    if (!entity) return null;
    const serialized = {
      x: entity.x,
      y: entity.y,
      w: this._getEntityBounds(entity, 0, 0).w,
      h: this._getEntityBounds(entity, 0, 0).h,
    };
    if (entity.type === "textprompt") {
      serialized.textKey = entity.textKey || "";
      serialized.textPromptWidth = entity._boxWidth;
      serialized.textPromptHeight = entity._boxHeight;
      serialized.textPromptTextSize = entity._textSizeValue;
      serialized.textPromptLineHeight = entity._lineHeight;
    }
    return serialized;
  }

  _applySerializedEntity(entity, snapshot) {
    if (!entity || !snapshot) return;
    entity.x = snapshot.x;
    entity.y = snapshot.y;
    if (entity.collider) {
      entity.collider.w = snapshot.w;
      entity.collider.h = snapshot.h;
    }
    if ("w" in entity) entity.w = snapshot.w;
    if ("h" in entity) entity.h = snapshot.h;
    if (entity.type === "textprompt") {
      entity.textKey = snapshot.textKey || entity.textKey || "";
      if (snapshot.textPromptWidth !== undefined) {
        entity._boxWidth = snapshot.textPromptWidth;
      }
      if (snapshot.textPromptHeight !== undefined) {
        entity._boxHeight = snapshot.textPromptHeight;
      }
      if (snapshot.textPromptTextSize !== undefined) {
        entity._textSizeValue = snapshot.textPromptTextSize;
      }
      if (snapshot.textPromptLineHeight !== undefined) {
        entity._lineHeight = snapshot.textPromptLineHeight;
      }
    }
  }

  _getEntityBounds(entity, fallbackW = 50, fallbackH = 50) {
    return {
      w: entity?.collider?.w ?? entity?._boxWidth ?? entity?.w ?? fallbackW,
      h: entity?.collider?.h ?? entity?._boxHeight ?? entity?.h ?? fallbackH,
    };
  }

  setTextPromptText(record, textKey) {
    if (!record || record.tool !== EntityTool.TEXT_PROMPT) return false;
    const text = String(textKey || "").trim();
    record.gameEntity.textKey = text;
    return true;
  }

  /**
   * Sync physics and collision system entity references
   * 同步物理和碰撞系统实体引用
   */
  _syncSystems() {
    if (this._level.physicsSystem?.setEntities) {
      this._level.physicsSystem.setEntities(this._level.entities);
    }
    if (this._level.collisionSystem?.setEntities) {
      this._level.collisionSystem.setEntities(this._level.entities);
    }
  }

  /**
   * Draw editor annotations in world space (highlight borders + labels),
   * 在世界空间中绘制编辑器注释 (高亮边框 + 标签),
   * Actual entity rendering is done by level's own draw method.
   * 实际实体渲染由级别自己的 draw 方法完成。
   */
  draw(p) {
    for (const rec of this._records) {
      // WIRE_PORTAL: special handling - draw button+portal+wire
      if (rec.tool === EntityTool.WIRE_PORTAL) {
        const btn = rec.gameEntity;
        const ptl = rec.portalEntity;
        const bw = btn.collider ? btn.collider.w : 34;
        const bh = btn.collider ? btn.collider.h : 16;
        const pw = ptl.collider ? ptl.collider.w : 50;
        const ph = ptl.collider ? ptl.collider.h : 50;
        const btnMoving = this._movingEntity === btn;
        const ptlMoving = this._movingEntity === ptl;

        p.push();
        p.noFill();

        // Button border
        p.strokeWeight(btnMoving ? 3 : 2);
        p.stroke(btnMoving ? 255 : 180, 100, 240, btnMoving ? 255 : 180);
        p.rect(btn.x, btn.y, bw, bh);

        // Portal border
        p.strokeWeight(ptlMoving ? 3 : 2);
        p.stroke(ptlMoving ? 255 : 180, 100, 240, ptlMoving ? 255 : 180);
        p.rect(ptl.x, ptl.y, pw, ph);

        // Connection line
        p.stroke(180, 100, 240, 100);
        p.strokeWeight(1);
        p.line(btn.x + bw / 2, btn.y + bh, ptl.x + pw / 2, ptl.y + ph);

        // Delete buttons (Button side + Portal side)
        this._drawDeleteBtn(p, btn.x + bw, btn.y + bh);
        this._drawDeleteBtn(p, ptl.x + pw, ptl.y + ph);

        // Label
        p.push();
        p.translate(btn.x, btn.y + bh);
        p.scale(1, -1);
        p.fill(255, 255, 255, 220);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`WP-Btn ${bw}×${bh}`, 3, 3);
        p.pop();

        p.push();
        p.translate(ptl.x, ptl.y + ph);
        p.scale(1, -1);
        p.fill(255, 255, 255, 220);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`WP-Ptl ${pw}×${ph}`, 3, 3);
        p.pop();

        p.pop();
        continue;
      }

      // BTN_SPIKE: special handling - draw button+spike+wire+handles
      if (rec.tool === EntityTool.BTN_SPIKE) {
        const btn = rec.gameEntity;
        const spk = rec.spikeEntity;
        const bw = btn.collider ? btn.collider.w : 34;
        const bh = btn.collider ? btn.collider.h : 16;
        const sw = spk.collider ? spk.collider.w : 100;
        const sh = spk.collider ? spk.collider.h : 20;
        const btnMoving = this._movingEntity === btn;
        const spkMoving = this._movingEntity === spk;

        p.push();
        p.noFill();

        // Button border (orange)
        p.strokeWeight(btnMoving ? 3 : 2);
        p.stroke(btnMoving ? 255 : 240, 160, 30, btnMoving ? 255 : 180);
        p.rect(btn.x, btn.y, bw, bh);

        // Spike border (orange)
        p.strokeWeight(spkMoving ? 3 : 2);
        p.stroke(spkMoving ? 255 : 240, 160, 30, spkMoving ? 255 : 180);
        p.rect(spk.x, spk.y, sw, sh);

        // Connection line
        p.stroke(240, 160, 30, 100);
        p.strokeWeight(1);
        p.line(btn.x + bw / 2, btn.y + bh, spk.x + sw / 2, spk.y + sh);

        // Spike resize handles
        this._drawHandles(p, spk.x, spk.y, sw, sh);

        // Delete buttons (Button side + Spike side)
        this._drawDeleteBtn(p, btn.x + bw, btn.y + bh);
        this._drawDeleteBtn(p, spk.x + sw, spk.y + sh);

        // Label
        p.push();
        p.translate(btn.x, btn.y + bh);
        p.scale(1, -1);
        p.fill(255, 255, 255, 220);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`BS-Btn ${bw}×${bh}`, 3, 3);
        p.pop();

        p.push();
        p.translate(spk.x, spk.y + sh);
        p.scale(1, -1);
        p.fill(255, 255, 255, 220);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`BS-Spk ${sw}×${sh}`, 3, 3);
        p.pop();

        p.pop();
        continue;
      }

      // BTN_PLATFORM: special handling - draw button+all platforms+wire+handles
      if (rec.tool === EntityTool.BTN_PLATFORM) {
        const btn = rec.gameEntity;
        const platforms = rec.platformEntities || [];
        const bw = btn.collider ? btn.collider.w : 34;
        const bh = btn.collider ? btn.collider.h : 16;
        const btnMoving = this._movingEntity === btn;

        p.push();
        p.noFill();

        // Button border (cyan/green)
        p.strokeWeight(btnMoving ? 3 : 2);
        p.stroke(60, btnMoving ? 255 : 180, 140, btnMoving ? 255 : 180);
        p.rect(btn.x, btn.y, bw, bh);

        // Delete button (Button side)
        this._drawDeleteBtn(p, btn.x + bw, btn.y + bh);

        // Label
        p.push();
        p.translate(btn.x, btn.y + bh);
        p.scale(1, -1);
        p.fill(255, 255, 255, 220);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`BP-Btn ${bw}×${bh}`, 3, 3);
        p.pop();

        // Draw each platform
        for (let pi = 0; pi < platforms.length; pi++) {
          const plt = platforms[pi];
          const pw = plt.collider ? plt.collider.w : 160;
          const ph = plt.collider ? plt.collider.h : 30;
          const pltMoving = this._movingEntity === plt;

          // Platform border (cyan/green)
          p.strokeWeight(pltMoving ? 3 : 2);
          p.stroke(60, pltMoving ? 255 : 180, 140, pltMoving ? 255 : 180);
          p.rect(plt.x, plt.y, pw, ph);

          // Connection line
          p.stroke(60, 180, 140, 100);
          p.strokeWeight(1);
          p.line(btn.x + bw / 2, btn.y + bh, plt.x + pw / 2, plt.y + ph);

          // Platform resize handles
          this._drawHandles(p, plt.x, plt.y, pw, ph);

          // Delete button (Platform side)
          this._drawDeleteBtn(p, plt.x + pw, plt.y + ph);

          // Label
          p.push();
          p.translate(plt.x, plt.y + ph);
          p.scale(1, -1);
          p.fill(255, 255, 255, 220);
          p.noStroke();
          p.textSize(10);
          p.textAlign(p.LEFT, p.TOP);
          const platLabel =
            platforms.length > 1
              ? `BP-Plt${pi + 1} ${pw}×${ph} ${rec.platformLinks?.[pi]?.mode || "disappear"}`
              : `BP-Plt ${pw}×${ph} ${rec.platformLinks?.[pi]?.mode || "disappear"}`;
          p.text(platLabel, 3, 3);
          p.pop();
        }

        p.pop();
        continue;
      }

      const e = rec.gameEntity;
      const { w, h } = this._getEntityBounds(e);
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
      } else if (rec.tool === EntityTool.BOX) {
        p.stroke(isSelected ? 255 : 200, 140, 100, isSelected ? 240 : 180);
      } else if (rec.tool === EntityTool.NPC) {
        p.stroke(60, 200, 220, 180);
      } else if (rec.tool === EntityTool.SIGNBOARD) {
        p.stroke(200, 160, 80, 180);
      } else if (rec.tool === EntityTool.TEXT_PROMPT) {
        p.stroke(100, 220, 200, 180);
      } else if (rec.tool === EntityTool.CHECKPOINT) {
        p.stroke(200, 80, 180, 180);
      } else if (rec.tool === EntityTool.TELEPORT_POINT) {
        p.stroke(100, 180, 255, 180);
      } else if (rec.tool === EntityTool.ENEMY) {
        p.stroke(100, 200, 100, 180);
      } else {
        p.stroke(100, 170, 255, 180);
      }
      p.rect(e.x, e.y, w, h);

      // Draw four corner handles when resizing-capable entity is selected
      if (
        isSelected &&
        rec.tool !== EntityTool.PORTAL &&
        rec.tool !== EntityTool.NPC &&
        rec.tool !== EntityTool.SIGNBOARD &&
        rec.tool !== EntityTool.CHECKPOINT &&
        rec.tool !== EntityTool.TELEPORT_POINT
      ) {
        this._drawHandles(p, e.x, e.y, w, h);
      }

      // Delete button (top-right)
      this._drawDeleteBtn(p, e.x + w, e.y + h);

      // Label
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
      } else if (rec.tool === EntityTool.BOX) {
        p.text(`B ${w}×${h}`, 3, 3);
      } else if (rec.tool === EntityTool.NPC) {
        p.text("NPC", 3, 3);
      } else if (rec.tool === EntityTool.SIGNBOARD) {
        p.text("Sign", 3, 3);
      } else if (rec.tool === EntityTool.TEXT_PROMPT) {
        const brief = rec.gameEntity?.textKey || "(empty)";
        p.text(`Txt ${brief.slice(0, 18)}`, 3, 3);
      } else if (rec.tool === EntityTool.CHECKPOINT) {
        p.text("CkPt", 3, 3);
      } else if (rec.tool === EntityTool.TELEPORT_POINT) {
        p.text("TelePt", 3, 3);
      } else if (rec.tool === EntityTool.ENEMY) {
        const direction = rec.direction === 1 ? "→" : "←";
        p.text(`Emy ${direction}`, 3, 3);
      } else {
        p.text("Portal", 3, 3);
      }
      p.pop();
      p.pop();
    }
  }

  /** Draw delete button (top-right of entity) */
  _drawDeleteBtn(p, rightX, topY) {
    const bs = DELETE_BTN_SIZE;
    const bx = rightX - bs / 2;
    const by = topY + 2;

    // Background rounded rectangle
    p.fill(200, 50, 50, 220);
    p.stroke(255, 80, 80);
    p.strokeWeight(1);
    p.rect(bx, by, bs, bs, 3);

    // X symbol (flip back to normal text direction)
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

  /** Draw four corner drag handles */
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
