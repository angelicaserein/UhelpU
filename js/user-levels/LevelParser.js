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

/**
 * UserLevel — Runtime parser for user-created level JSON
 *
 * Converts a level data JSON object (as documented in LevelDataFormat.js)
 * into a playable Level instance with all systems initialized.
 *
 * Usage:
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

    this.bgAssetKey = "bgImageDemo2Level";

    // Parse and create all entities
    this._parseEntities(levelData);

    // Create player
    this._createPlayer(levelData);

    // Initialize physics and collision systems
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // Create BtnPlatform systems (must be after initSystems)
    this._createButtonPlatformSystems(levelData);
  }

  /**
   * Parse entities from levelData and create runtime instances
   * @private
   */
  _parseEntities(levelData) {
    const entities = levelData.entities || [];
    const roomCount = levelData.roomCount || 1;
    const canvasWidth = levelData.canvasWidth || 1366;
    const canvasHeight = levelData.canvasHeight || 768;

    // Single-room level: add entities directly
    if (roomCount === 1) {
      this._parseEntitiesSingleRoom(entities);
    } else {
      // Multi-room level: create rooms and apply offsets
      this._parseEntitiesMultiRoom(entities, levelData.rooms || [], roomCount, canvasWidth, canvasHeight);
    }
  }

  /**
   * Parse entities for single-room level
   * @private
   */
  _parseEntitiesSingleRoom(entities) {
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
   * @private
   */
  _parseEntitiesMultiRoom(entities, rooms, roomCount, canvasWidth, canvasHeight) {
    // Create a map: entityIndex -> Room
    const entityToRoom = new Map();
    rooms.forEach((room) => {
      const room_obj = room;
      (room_obj.entityIndices || []).forEach((idx) => {
        entityToRoom.set(idx, room_obj.roomIndex);
      });
    });

    // Create Room objects for each room
    this.rooms = Array.from({ length: roomCount }, () => new Room([]));

    // Add entities to respective rooms
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
   * @private
   */
  _applyWorldOffsetsToRooms(canvasWidth, canvasHeight, roomCount) {
    for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
      const offsetX = roomIndex * canvasWidth;
      for (const entity of this.rooms[roomIndex].entities) {
        entity.x += offsetX;
      }

      // Set up room exits
      this.rooms[roomIndex].exit = {};
      if (roomIndex > 0) {
        this.rooms[roomIndex].exit.left = { targetRoomIndex: roomIndex - 1 };
      }
      if (roomIndex < roomCount - 1) {
        this.rooms[roomIndex].exit.right = { targetRoomIndex: roomIndex + 1 };
      }
    }

    // Build combined entities set from all rooms
    this.entities = this._buildEntities();
  }

  /**
   * Build combined entities set from all rooms
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
   * @private
   */
  _createEntity(entityData) {
    const type = entityData.type;

    switch (type) {
      case "Ground":
        return new Ground(entityData.x, entityData.y, entityData.w, entityData.h);

      case "Wall":
        return new Wall(entityData.x, entityData.y, entityData.w, entityData.h);

      case "Platform":
        return new Platform(entityData.x, entityData.y, entityData.w, entityData.h);

      case "Box":
        return new Box(entityData.x, entityData.y, entityData.w, entityData.h);

      case "Spike":
        return new Spike(entityData.x, entityData.y, entityData.w, entityData.h);

      case "Portal": {
        const portal = new Portal(entityData.x, entityData.y, entityData.w, entityData.h);
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
        return new TextPrompt(entityData.x, entityData.y, this.p, {
          text: entityData.text || "todo",
        });

      case "Enemy": {
        const enemy = new Enemy(entityData.x, entityData.y, entityData.w, entityData.h, {
          speed: entityData.speed ?? 2,
        });
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
        const system = new BtnWirePortalSystem({ button, portal });
        // WirePortal systems need to be created after multi-room offset application
        // Store for later creation if multi-room
        this._wpSystems.push({ button, portal, system, entityData });
        return [button, portal, new WireRenderer(system)];
      }

      case "BtnPlatform": {
        // BtnPlatform must be created after initSystems (collisionSystem initialized)
        // Store for later
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
   * @private
   */
  _createPlayer(levelData) {
    const spawn = levelData.spawn || { x: 50, y: 400, w: 40, h: 40 };
    this._player = new Player(spawn.x, spawn.y, spawn.w, spawn.h);
    this._player.createListeners();
    this.entities.add(this._player);
  }

  /**
   * Create BtnPlatform systems after initSystems (requires collisionSystem)
   * @private
   */
  _createButtonPlatformSystems(levelData) {
    if (!this._pendingBtnPlatforms || this._pendingBtnPlatforms.length === 0) {
      return;
    }

    const canvasWidth = levelData.canvasWidth || 1366;
    const roomCount = levelData.roomCount || 1;

    // If multi-room, re-apply offsets to WirePortal systems
    if (roomCount > 1 && this._wpSystems.length > 0) {
      const canvasHeight = levelData.canvasHeight || 768;
      this._createWirePortalSystemsMultiRoom(canvasWidth, canvasHeight, roomCount);
      this._wpSystems = []; // Clear after processing
    }

    this._pendingBtnPlatforms.forEach((pending) => {
      const { button, entityData } = pending;
      const platforms = (entityData.platforms || []).map(
        (platData) =>
          new Platform(platData.x, platData.y, platData.w, platData.h),
      );
      const platformConfigs = platforms.map((platform, idx) => ({
        platform,
        mode: (entityData.platforms[idx] && entityData.platforms[idx].mode) || "disappear",
      }));

      const system = new ButtonPlatformLinkSystem(
        { button, platforms: platformConfigs },
        this.collisionSystem,
        { startColorIndex: entityData.colorIndex ?? 0 },
      );
      this._bpSystems.push(system);

      // Add platforms to entities
      platforms.forEach((platform) => this.entities.add(platform));
      // Button already added to entities
    });

    this._pendingBtnPlatforms = [];
  }

  /**
   * Create WirePortal systems for multi-room levels after offset application
   * @private
   */
  _createWirePortalSystemsMultiRoom(canvasWidth, canvasHeight, roomCount) {
    this._wpSystems.forEach((wpData) => {
      const { button, portal, system } = wpData;
      // Button and portal are already added to entities with offsets applied
      // WireRenderer was already created and added
      // Just ensure system is tracked (already in array)
    });
  }

  /**
   * Update physics for all composite systems
   */
  updatePhysics() {
    super.updatePhysics();
    this._bsSystems.forEach((system) => system.update?.());
    this._wpSystems.forEach((system) => system.system?.update?.());
    this._bpSystems.forEach((system) => system.update?.());
  }

  /**
   * Draw composite systems if needed (e.g., BtnPlatform)
   */
  draw(p) {
    super.draw(p);
    this._bpSystems.forEach((system) => system.draw?.(p));
  }
}
