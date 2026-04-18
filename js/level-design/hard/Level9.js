import {
  Player,
  Ground,
  Wall,
  Portal,
  Spike,
  TeleportPoint,
  Enemy,
} from "../../game-entity-model/index.js";
import { Assets } from "../../AssetsManager.js";
import { BaseLevel } from "../BaseLevel.js";
import { Room } from "../Room.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { MapEditor } from "../../develop-mode/MapEditor.js";

export class Level9 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";
    this._activeRoomIndex = 0;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    this._player = new Player(50, 450, 40, 40);
    this._player.createListeners();

    this.entities = this._buildEntities();
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // ── 开发模式：地图编辑器（按 M 开关） ──
    this._mapEditor = new MapEditor(this);
  }

  _buildRooms(p) {
    const wallThickness = 20;

    const room0 = new Room(
      [
        new Wall(-100, 0, wallThickness + 100, 768),
        new Ground(0, 0, p.width, 80),
        new Ground(310, 80, 200, 40),
        new Spike(980, 90, 100, 20),
        new TeleportPoint(220, 80, 40, 70, () => this._player),
        new Enemy(316, 120, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(944, 79.5, 40, 40, { speed: 2, direction: 1 }),
      ],
      { right: { targetRoomIndex: 1 } },
    );

    const portal = new Portal(1200, 80, 50, 50);
    portal.openPortal();

    const room1 = new Room(
      [
        new Ground(0, 0, p.width, 80),
        new Wall(p.width - wallThickness, 0, wallThickness + 100, 768),
        portal,
      ],
      { left: { targetRoomIndex: 0 } },
    );

    return [room0, room1];
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

    // ── 开发模式：编辑器叠加绘制 ──
    if (this._mapEditor) this._mapEditor.draw(p);
  }
}
