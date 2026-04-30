import {
  Player,
  Ground,
  Wall,
  Spike,
  Portal,
  Button,
  Platform,
  Box,
  CheckpointDemo2,
  TeleportPoint,
  Enemy,
  WireRenderer,
  TextPrompt,
} from "../game-entity-model/index.js";
import { BaseLevel } from "../level-design/BaseLevel.js";
import { Demo2RecordUI } from "../record-system/Demo2RecordUI.js";
import { Room } from "../level-design/Room.js";
import { ButtonSpikeLinkSystem } from "../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { BtnWirePortalSystem } from "../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonPlatformLinkSystem } from "../mechanism-system/demo2/ButtonPlatformLinkSystem.js";
import { Assets } from "../AssetsManager.js";

/**
 * UserLevel — Runtime parser for user-created level JSON
 * UserLevel — 用户创建的业 JSON 的运行时解析器
 *
 * Converts a level data JSON object (as documented in LevelDataFormat.js)
 * 将一个等级数据 JSON 对象（如 LevelDataFormat.js 中記載）
 * into a playable Level instance with all systems initialized.
 * 转换成可播放的等级實例，其中所有系統都已初始化。
 *
 * Usage:
 * 使用：
 *   const levelData = JSON.parse(levelJsonString);
 *   const level = new UserLevel(p, eventBus, levelData);
 */
export class UserLevel extends BaseLevel {
  constructor(p, eventBus, levelData) {
    super(p, eventBus);
    this.levelData = levelData;

    // System arrays for composite entities
    this._bsSystems = [];
    this._wpSystems = [];
    this._bpSystems = [];

    // Multi-room support
    this._currentRoomIndex = 0;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.bgAssetKey = "bgImageDemo2Level";

    // Parse and create all entities
    this._parseEntities(levelData);

    // Create player
    this._createPlayer(levelData);

    // Initialize physics and collision systems
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // Create BtnPlatform systems (must be after initSystems for collisionSystem)
    this._parseBtnPlatformSystems(levelData);

    // Create WirePortal systems (must be after room offsets applied for multi-room)
    this._createWirePortalSystems(levelData);
  }

  /**
   * Parse entities from levelData and create runtime instances
   * 下英文 levelData 的实体并创建下一个实例
   * @private
   */
  _parseEntities(levelData) {
    const entities = levelData.entities || [];
    const roomCount = levelData.roomCount || 1;
    const canvasWidth = levelData.canvasWidth || 1366;
    const canvasHeight = levelData.canvasHeight || 768;

    // Single-room level: add entities directly
    if (roomCount === 1) {
      this._parseEntitiesSingleRoom(entities, canvasHeight);
    } else {
      // Multi-room level: create rooms and apply offsets
      this._parseEntitiesMultiRoom(
        entities,
        levelData.rooms || [],
        roomCount,
        canvasWidth,
        canvasHeight,
      );
    }
  }

  /**
   * Parse entities for single-room level
   * 解析单一房間等级的实体
   * @private
   */
  _parseEntitiesSingleRoom(entities, canvasHeight = 768) {
    // Add boundary walls
    this.entities.add(new Wall(-100, 0, 120, canvasHeight));
    this.entities.add(new Wall(1346, 0, 120, canvasHeight));
    // Add ground
    this.entities.add(new Ground(0, 0, this.p.width, 80));

    // Add user-placed entities
    for (const entity of entities) {
      const runtimeEntity = this._createEntity(entity);
      if (runtimeEntity) {
        if (Array.isArray(runtimeEntity)) {
          runtimeEntity.forEach((e) => this.entities.add(e));
        } else {
          this.entities.add(runtimeEntity);
        }
      }
    }
  }

  /**
   * Parse entities for multi-room level
   * 解析超于一个房間等级的实体
   * @private
   */
  _parseEntitiesMultiRoom(
    entities,
    rooms,
    roomCount,
    canvasWidth,
    canvasHeight,
  ) {
    // Create a map: entityIndex -> Room
    // 创建映嬉：entityIndex -> Room
    const entityToRoom = new Map();
    rooms.forEach((room) => {
      const room_obj = room;
      (room_obj.entityIndices || []).forEach((idx) => {
        entityToRoom.set(idx, room_obj.roomIndex);
      });
    });

    // Create Room objects for each room
    // 為每個房間创建 Room 實例
    this.rooms = [];
    for (let i = 0; i < roomCount; i++) {
      this.rooms.push(new Room([]));
    }

    // Add boundary walls and ground to each room
    // 每個房間添加边界墙和地基
    for (let roomIndex = 0; roomIndex < roomCount; roomIndex++) {
      // Add left wall (first room only)
      // 仅在第一個房間添加左箱
      if (roomIndex === 0) {
        this.rooms[roomIndex].entities.add(
          new Wall(-100, 0, 120, canvasHeight),
        );
      }
      // Add right wall (last room only)
      // 仅在最后一個房間添加右箱
      if (roomIndex === roomCount - 1) {
        this.rooms[roomIndex].entities.add(
          new Wall(1346, 0, 120, canvasHeight),
        );
      }
      // Add ground to every room
      // 预每個房間添加地基
      this.rooms[roomIndex].entities.add(new Ground(0, 0, canvasWidth, 80));
    }

    // Add entities to respective rooms
    // 將实体添加到各自的房間
    entities.forEach((entity, index) => {
      const roomIndex = entityToRoom.get(index) ?? 0;
      const runtimeEntity = this._createEntity(entity);

      if (runtimeEntity) {
        if (Array.isArray(runtimeEntity)) {
          runtimeEntity.forEach((e) => this.rooms[roomIndex].entities.add(e));
        } else {
          this.rooms[roomIndex].entities.add(runtimeEntity);
        }
      }
    });

    // Apply world offsets and configure room exits
    this._applyWorldOffsetsToRooms(canvasWidth, canvasHeight, roomCount);
  }

  /**
   * Apply world offsets to entities in each room and set up exits
   * 將世界偏移量應用到每個房間中的实体並設置出口
   * @private
   */
  _applyWorldOffsetsToRooms(canvasWidth, canvasHeight, roomCount) {
    for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
      const offsetX = roomIndex * canvasWidth;
      for (const entity of this.rooms[roomIndex].entities) {
        entity.x += offsetX;
      }

      // Set up room exits | 設置房間出口
      this.rooms[roomIndex].exit = {};
      if (roomIndex > 0) {
        this.rooms[roomIndex].exit.left = { targetRoomIndex: roomIndex - 1 };
      }
      if (roomIndex < roomCount - 1) {
        this.rooms[roomIndex].exit.right = { targetRoomIndex: roomIndex + 1 };
      }
    }

    // Build combined entities set from all rooms
    // 一我所有房間中延、延長的实体集
    this.entities = this._buildEntities();
  }

  /**
   * Build combined entities set from all rooms
   * 从所有房間中建構組合的实体集
   * @private
   */
  _buildEntities() {
    const entities = new Set();
    for (const room of this.rooms) {
      for (const entity of room.entities) {
        entities.add(entity);
      }
    }
    if (this._player) {
      entities.add(this._player);
    }
    return entities;
  }

  /**
   * Create a single runtime entity from JSON
   * 從 JSON 中建構单一的主場實例
   * @private
   */
  _createEntity(entityData) {
    const type = entityData.type;

    switch (type) {
      case "Ground":
        return new Ground(
          entityData.x,
          entityData.y,
          entityData.w,
          entityData.h,
        );

      case "Wall":
        return new Wall(entityData.x, entityData.y, entityData.w, entityData.h);

      case "Platform":
        return new Platform(
          entityData.x,
          entityData.y,
          entityData.w,
          entityData.h,
        );

      case "Box":
        return new Box(entityData.x, entityData.y, entityData.w, entityData.h);

      case "Spike":
        return new Spike(
          entityData.x,
          entityData.y,
          entityData.w,
          entityData.h,
        );

      case "Portal": {
        const portal = new Portal(
          entityData.x,
          entityData.y,
          entityData.w,
          entityData.h,
        );
        // Open portal if specified | 彬指了，開啟隨道
        if (entityData.open) {
          portal.openPortal();
        }
        return portal;
      }

      case "Checkpoint":
        return new CheckpointDemo2(
          entityData.x,
          entityData.y,
          entityData.w,
          entityData.h,
          () => this._player,
        );

      case "TeleportPoint":
        return new TeleportPoint(
          entityData.x,
          entityData.y,
          entityData.w,
          entityData.h,
          () => this._player,
        );

      case "TextPrompt":
        return new TextPrompt(entityData.x, entityData.y, this, {
          textKey: entityData.text || "todo",
        });

      case "Enemy": {
        const enemy = new Enemy(
          entityData.x,
          entityData.y,
          entityData.w,
          entityData.h,
          {
            speed: entityData.speed ?? 2,
          },
        );
        enemy._direction = entityData.direction ?? 1;
        return enemy;
      }

      case "BtnSpike": {
        const button = new Button(
          entityData.button.x,
          entityData.button.y,
          entityData.button.w,
          entityData.button.h,
        );
        const spike = new Spike(
          entityData.spike.x,
          entityData.spike.y,
          entityData.spike.w,
          entityData.spike.h,
        );
        const system = new ButtonSpikeLinkSystem(
          { button, spikes: [spike] },
          { startColorIndex: entityData.colorIndex ?? 0 },
        );
        this._bsSystems.push(system);
        return [button, spike];
      }

      case "WirePortal": {
        const button = new Button(
          entityData.button.x,
          entityData.button.y,
          entityData.button.w,
          entityData.button.h,
        );
        const portal = new Portal(
          entityData.portal.x,
          entityData.portal.y,
          entityData.portal.w,
          entityData.portal.h,
        );
        // WirePortal systems must be created AFTER room offsets applied (multi-room)
        // WirePortal 系統必須在應用房間偏移量之實區延墺建立（超一個房間）
        // Create a temporary WireRenderer; system will be set later
        // 延瘴緩 WireRenderer；系統稱て瘤投設定
        const wireRenderer = new WireRenderer(null);
        // Store for later creation
        // 存存此之後性延墺建立
        this._pendingWirePortals = this._pendingWirePortals || [];
        this._pendingWirePortals.push({
          button,
          portal,
          wireRenderer,
          entityData,
        });
        return [button, portal, wireRenderer];
      }

      case "BtnPlatform": {
        // BtnPlatform must be created after initSystems (collisionSystem initialized)
        // BtnPlatform 必須在 initSystems 之後才能建立（collisionSystem 已統事）
        // Store for later
        // 存存此之後性延墺建立
        const button = new Button(
          entityData.button.x,
          entityData.button.y,
          entityData.button.w,
          entityData.button.h,
        );
        // Return button for now; platforms will be added in _createButtonPlatformSystems
        this._pendingBtnPlatforms = this._pendingBtnPlatforms || [];
        this._pendingBtnPlatforms.push({ button, entityData });
        return button;
      }

      default:
        console.warn(`[UserLevel] Unknown entity type: ${type}`);
        return null;
    }
  }

  /**
   * Create player from spawn data
   * 從紅身數據後中建構玩家
   * @private
   */
  _createPlayer(levelData) {
    const spawn = levelData.spawn || { x: 50, y: 400, w: 40, h: 40 };
    this._player = new Player(spawn.x, spawn.y, spawn.w, spawn.h);
    this._player.createListeners();
    this.entities.add(this._player);
  }

  /**
   * Parse and create BtnPlatform systems (after initSystems, so collisionSystem exists)
   * 解析並中建構 BtnPlatform 系統（initSystems 之後，便 collisionSystem 存在）
   * @private
   */
  _parseBtnPlatformSystems(levelData) {
    if (!this._pendingBtnPlatforms || this._pendingBtnPlatforms.length === 0) {
      return;
    }

    this._pendingBtnPlatforms.forEach((pending) => {
      const { button, entityData } = pending;
      const platforms = (entityData.platforms || []).map(
        (platData) =>
          new Platform(platData.x, platData.y, platData.w, platData.h),
      );
      const platformConfigs = platforms.map((platform, idx) => ({
        platform,
        mode:
          (entityData.platforms[idx] && entityData.platforms[idx].mode) ||
          "disappear",
      }));

      const system = new ButtonPlatformLinkSystem(
        { button, platforms: platformConfigs },
        this.collisionSystem,
        { startColorIndex: entityData.colorIndex ?? 0 },
      );
      this._bpSystems.push(system);

      // Initialize platform collider state on first update
      // 第一氡更新時参數化台並婅將器狀態
      system.update();

      // Add platforms to entities
      // 將台並添加到实体
      platforms.forEach((platform) => this.entities.add(platform));
      // Button already added to entities
    });

    this._pendingBtnPlatforms = [];
  }

  /**
   * Create WirePortal systems after room offsets are applied (for multi-room)
   * 在應用房間偏移量之後成编 WirePortal 系統（超一個房間）
   * @private
   */
  _createWirePortalSystems(levelData) {
    if (!this._pendingWirePortals || this._pendingWirePortals.length === 0) {
      return;
    }

    const canvasWidth = levelData.canvasWidth || 1366;
    const canvasHeight = levelData.canvasHeight || 768;
    const roomCount = levelData.roomCount || 1;

    this._createWirePortalSystemsMultiRoom(
      canvasWidth,
      canvasHeight,
      roomCount,
    );
  }

  /**
   * Create WirePortal systems for multi-room levels after offset application
   * 佚超一個房間等级會後應用偏移量成编 WirePortal 系統
   * @private
   */
  _createWirePortalSystemsMultiRoom(canvasWidth, canvasHeight, roomCount) {
    if (!this._pendingWirePortals || this._pendingWirePortals.length === 0) {
      return;
    }

    this._pendingWirePortals.forEach((wpData) => {
      const { button, portal, wireRenderer, entityData } = wpData;
      // Now button and portal have correct world coordinates (offsets applied)
      // 下一個按遲和全体阮隊深傦。適榺的世界坐標（偏移量已應用）
      const system = new BtnWirePortalSystem({ button, portal });
      this._wpSystems.push({ button, portal, system, entityData });
      // Update WireRenderer to use the newly created system
      // 更新 WireRenderer 是用新建性延墺系統
      wireRenderer._wireSystem = system;
    });

    this._pendingWirePortals = [];
  }

  /**
   * Update physics for all composite systems
   * 更新所有複合系統的其中統
   */
  updatePhysics() {
    super.updatePhysics();
    this._bsSystems.forEach((system) => system.update?.());
    this._wpSystems.forEach((system) => system.system?.update?.());
    this._bpSystems.forEach((system) => system.update?.());
  }

  /**
   * Get camera X position for multi-room levels
   * 取得多房間等级中攀機 X 位置
   * @private
   */
  _getCameraX(p) {
    if (!this._transition) return this._currentRoomIndex * p.width;
    const t = Math.min(
      1,
      this._transition.elapsedMs / this._transitionDurationMs,
    );
    const eased = this._easeOutCubic(t);
    const fromX = this._transition.fromRoomIndex * p.width;
    const toX = this._transition.toRoomIndex * p.width;
    return fromX + (toX - fromX) * eased;
  }

  /**
   * Easing function for room transitions
   * 房間轉換的緩和函數
   * @private
   */
  _easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Update room transition animation
   * @private
   */
  _updateTransition(p) {
    if (!this._transition) return;
    this._transition.elapsedMs += p.deltaTime || 16;
    if (this._transition.elapsedMs >= this._transitionDurationMs)
      this._transition = null;
  }

  /**
   * Check if player crossed room boundary
   * @private
   */
  _checkRoomTransition(p) {
    if (!this.rooms || this.rooms.length <= 1) return;

    const player = this._player;
    const room = this.rooms[this._currentRoomIndex];
    const leftBound = this._currentRoomIndex * p.width;
    const rightBound = leftBound + p.width;
    const playerCenterX = player.x + player.collider.w / 2;

    if (playerCenterX > rightBound && room.exit?.right) {
      this._switchRoom(room.exit.right.targetRoomIndex, "right");
    } else if (playerCenterX < leftBound && room.exit?.left) {
      this._switchRoom(room.exit.left.targetRoomIndex, "left");
    }
  }

  /**
   * Switch to a different room
   * @private
   */
  _switchRoom(roomIndex, direction) {
    if (roomIndex === this._currentRoomIndex) return;
    const fromRoomIndex = this._currentRoomIndex;
    this._currentRoomIndex = roomIndex;
    this._transition = {
      fromRoomIndex,
      toRoomIndex: roomIndex,
      direction,
      elapsedMs: 0,
    };
  }

  /**
   * Clear canvas and draw background for multi-room levels
   */
  clearCanvas(p = this.p, cameraNudgeX = 0, bgParallaxFactor = 1) {
    const cameraX =
      this.rooms && this.rooms.length > 1 ? this._getCameraX(p) : 0;
    const bgOffsetX = cameraNudgeX * bgParallaxFactor;
    const bg = Assets.bgImageDemo2Level;

    if (bg) {
      p.push();
      p.translate(-cameraX - bgOffsetX, 0);
      p.scale(1, -1);

      // Determine number of rooms to draw
      const roomCount = this.rooms ? this.rooms.length : 1;
      for (let i = 0; i < roomCount; i++) {
        const scaleX = p.width / bg.width;
        const scaleY = p.height / bg.height;
        const scale = Math.max(scaleX, scaleY) * 1.05;
        p.image(
          bg,
          i * p.width,
          -p.height,
          bg.width * scale,
          bg.height * scale,
        );
      }
      p.pop();
    } else {
      p.background(220);
    }
  }

  /**
   * Get view bounds for camera culling
   */
  getViewBounds(p = this.p) {
    const cameraX =
      this.rooms && this.rooms.length > 1 ? this._getCameraX(p) : 0;
    return { minX: cameraX, maxX: cameraX + p.width, minY: 0, maxY: p.height };
  }

  /**
   * Update collision for multi-room levels
   */
  updateCollision(p = this.p, eventBus = this.eventBus) {
    super.updateCollision(p, eventBus);

    // Only handle room transitions for multi-room levels
    if (!this.rooms || this.rooms.length <= 1) return;

    if (this._transition) {
      this._updateTransition(p);
      return;
    }
    this._checkRoomTransition(p);
  }

  /**
   * Draw composite systems if needed (e.g., BtnPlatform)
   */
  draw(p) {
    // Multi-room: use camera translation
    if (this.rooms && this.rooms.length > 1) {
      const cameraX = this._getCameraX(p);
      p.push();
      p.translate(-cameraX, 0);
      for (const entity of this.entities) {
        if (entity.type === "spike") entity.draw(p);
      }
      for (const entity of this.entities) {
        if (entity.type === "ground") entity.draw(p);
      }
      for (const entity of this.entities) {
        if (entity.type !== "spike" && entity.type !== "ground") entity.draw(p);
      }
      // Draw BtnPlatform systems while camera translation is active
      this._bpSystems.forEach((system) => system.draw?.(p));
      p.pop();

      // Draw recordSystem UI (outside camera translation)
      if (this.recordSystem && typeof this.recordSystem.draw === "function") {
        this.recordSystem.draw(p);
      }
    } else {
      // Single-room: use default drawing
      super.draw(p);
      // Draw BtnPlatform systems (no camera translation needed)
      this._bpSystems.forEach((system) => system.draw?.(p));
    }
  }
}
