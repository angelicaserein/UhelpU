import { BaseLevel } from "../level-design/BaseLevel.js";
import { Room } from "../level-design/Room.js";
import { Ground, Wall, Player } from "../game-entity-model/index.js";
import { Demo2RecordUI } from "../record-system/Demo2RecordUI.js";
import { MapEditor } from "../develop-mode/MapEditor.js";
import { Assets } from "../AssetsManager.js";

export class LevelEmpty10Room extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";
    this._activeRoomIndex = 0;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    this._player = new Player(100, 400, 40, 40);
    this._player.createListeners();

    this.entities = this._buildEntities();
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // Activate map editor
    // 激活编辑器
    this._mapEditor = new MapEditor(this);
    this._mapEditor.activate();
  }

  _buildRooms(p) {
    const rooms = [];
    for (let i = 0; i < 10; i++) {
      const entities = [];
      // 左边界墙只加在第一个房间
      if (i === 0) entities.push(new Wall(-100, 0, 120, 768));
      // 右边界墙只加在最后一个房间
      if (i === 9) entities.push(new Wall(1346, 0, 120, 768));
      // 每个房间都有地面
      entities.push(new Ground(0, 0, p.width, 80));

      const exits = {};
      if (i > 0) exits.left = { targetRoomIndex: i - 1 };
      if (i < 9) exits.right = { targetRoomIndex: i + 1 };
      rooms.push(new Room(entities, exits));
    }
    return rooms;
  }

  _applyWorldOffsetsToRooms(p) {
    for (let i = 0; i < this.rooms.length; i++) {
      const offsetX = i * p.width;
      for (const entity of this.rooms[i].entities) {
        entity.x += offsetX;
      }
    }
  }

  _buildEntities() {
    const set = new Set();
    for (const room of this.rooms) {
      for (const entity of room.entities) {
        set.add(entity);
      }
    }
    set.add(this._player);
    return set;
  }

  _checkRoomTransition(p) {
    const room = this.rooms[this._activeRoomIndex];
    const leftBound = this._activeRoomIndex * p.width;
    const rightBound = leftBound + p.width;
    const playerCenterX = this._player.x + this._player.collider.w / 2;

    if (playerCenterX > rightBound && room.exits.right) {
      this._switchRoom(room.exits.right.targetRoomIndex, "right");
    } else if (playerCenterX < leftBound && room.exits.left) {
      this._switchRoom(room.exits.left.targetRoomIndex, "left");
    }
  }

  _switchRoom(roomIndex, direction) {
    if (roomIndex === this._activeRoomIndex) return;
    const fromRoomIndex = this._activeRoomIndex;
    this._activeRoomIndex = roomIndex;
    this._transition = {
      fromRoomIndex,
      toRoomIndex: roomIndex,
      direction,
      elapsedMs: 0,
    };
  }

  _easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  _updateTransition(p) {
    if (!this._transition) return;
    this._transition.elapsedMs += p.deltaTime || 16;
    if (this._transition.elapsedMs >= this._transitionDurationMs) {
      this._transition = null;
    }
  }

  _getCameraX(p) {
    if (!this._transition) {
      return this._activeRoomIndex * p.width;
    }
    const t = Math.min(
      1,
      this._transition.elapsedMs / this._transitionDurationMs,
    );
    const eased = this._easeOutCubic(t);
    const fromX = this._transition.fromRoomIndex * p.width;
    const toX = this._transition.toRoomIndex * p.width;
    return fromX + (toX - fromX) * eased;
  }

  getViewBounds(p = this.p) {
    const cameraX = this._getCameraX(p);
    return { minX: cameraX, maxX: cameraX + p.width, minY: 0, maxY: p.height };
  }

  clearLevel(p = this.p, eventBus = this.eventBus) {
    if (this._mapEditor) this._mapEditor.destroy();
    super.clearLevel(p, eventBus);
  }

  clearCanvas(p = this.p, cameraNudgeX = 0, bgParallaxFactor = 1) {
    const cameraX = this._getCameraX(p);
    const bgOffsetX = cameraNudgeX * bgParallaxFactor;
    const bg = this.bgAssetKey ? Assets[this.bgAssetKey] : null;
    if (bg) {
      p.push();
      p.translate(-cameraX - bgOffsetX, 0);
      p.scale(1, -1);
      for (let i = 0; i < this.rooms.length; i++) {
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
      return;
    }
    p.background(220);
  }

  updatePhysics() {
    super.updatePhysics();
  }

  updateCollision(p = this.p, eventBus = this.eventBus) {
    this.collisionSystem.collisionEntry(eventBus);
    if (this._transition) {
      this._updateTransition(p);
      return;
    }
    this._checkRoomTransition(p);
  }

  draw(p = this.p) {
    const cameraX = this._getCameraX(p);
    const sortedEntities = Array.from(this.entities).sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
    );

    p.push();
    p.translate(-cameraX, 0);
    for (const entity of sortedEntities) {
      entity.draw(p);
    }
    p.pop();

    this.recordSystem.draw && this.recordSystem.draw(p);

    // 编辑器叠加绘制
    if (this._mapEditor) this._mapEditor.draw(p);
  }
}
