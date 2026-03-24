import {
  Player,
  Replayer,
  Ground,
  Wall,
  Portal,
  Button,
  Spike,
} from "../game-entity-model/index.js";
import { CollisionSystem } from "../collision-system/CollisionSystem.js";
import { PhysicsSystem } from "../physics-system/PhysicsSystem.js";
import { RecordSystem } from "../record-system/RecordSystem.js";
import { BaseLevel } from "./BaseLevel.js";
import { Assets } from "../AssetsManager.js";
import { Room } from "./Room.js";
import { ButtonSpikeLinkSystem } from "../mechanism-system/ButtonSpikeLinkSystem.js";

export class Level4 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this._activeRoomIndex = 0;
    this._replayer = null;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    // 按钮-地刺联动系统（每个房间各一组）
    this._spikeLinkSystem0 = new ButtonSpikeLinkSystem([
      {
        button: this._room0Button,
        spikes: [{ spike: this._room0Spike, retractDistance: 30 }],
      },
    ]);
    this._spikeLinkSystem1 = new ButtonSpikeLinkSystem([
      {
        button: this._room1Button,
        spikes: [{ spike: this._room1Spike, retractDistance: 30 }],
      },
    ]);
    this._spikeLinkSystem2 = new ButtonSpikeLinkSystem([
      {
        button: this._room1Button2,
        spikes: [{ spike: this._room1Spike2, retractDistance: 30 }],
      },
    ]);

    const wallThickness = 20;
    this._player = new Player(50, 450, 40, 40);
    this._player.createListeners();

    this.entities = this._buildEntities();

    this.recordSystem = new RecordSystem(
      this._player,
      5000,
      (x, y) => this.addReplayer(x, y),
      () => this.removeReplayer(),
    );
    this.recordSystem.createListeners();

    this.physicsSystem = new PhysicsSystem(this.entities);
    this.collisionSystem = new CollisionSystem(this.entities, eventBus);
  }

  _buildRooms(p) {
    const wallThickness = 20;

    // ---- Room 0 ----
    // 按钮放在浮空平台 (200,160,160,20) 表面，地刺放在地面 (y=80)
    this._room0Button = new Button(250, 80, 20, 5); //每个参数分别是按钮的 x, y, width, height
    this._room0Spike = new Spike(350, 80, 200, 20); //每个参数分别是地刺的 x, y, width, height

    const room0 = new Room(
      [
        new Wall(0, 0, wallThickness, p.height),
        new Ground(0, 0, p.width, 80),
        this._room0Button,
        this._room0Spike,
      ],
      {
        right: { targetRoomIndex: 1 },
      },
    );

    // ---- Room 1 ----
    // 第一组：按钮地刺放在地面 (y=80)
    this._room1Button = new Button(-500, 80, 20, 5); //每个参数分别是按钮的 x, y, width, height
    this._room1Spike = new Spike(300, 80, 150, 20); //每个参数分别是地刺的 x, y, width, height
    // 第二组
    this._room1Button2 = new Button(-400, 80, 20, 5);
    this._room1Spike2 = new Spike(550, 80, 150, 20);

    const room1 = new Room(
      [
        new Wall(p.width - wallThickness, 0, wallThickness, p.height),
        new Ground(0, 0, p.width, 80), //每个参数分别是地面块的 x, y, width, height
        this._room1Button,
        this._room1Spike,
        this._room1Button2,
        this._room1Spike2,
      ],
      {
        left: { targetRoomIndex: 0 },
      },
    );

    const portal = new Portal(900, 80, 50, 50); //参数分别是传送门的 x, y, width, height
    portal.openPortal();
    room1.entities.add(portal);

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
    if (this._replayer) set.add(this._replayer);
    return set;
  }

  _rebuildEntities() {
    this.entities = this._buildEntities();
    this.physicsSystem.setEntities(this.entities);
    this.collisionSystem.setEntities(this.entities);
  }

  _checkRoomTransition(p) {
    const player = this._player;
    const room = this.rooms[this._activeRoomIndex];
    const leftBound = this._activeRoomIndex * p.width;
    const rightBound = leftBound + p.width;

    if (player.x + player.collider.w > rightBound && room.exits.right) {
      this._switchRoom(room.exits.right.targetRoomIndex, "right");
    } else if (player.x < leftBound && room.exits.left) {
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

    const dt = p.deltaTime || 16;
    this._transition.elapsedMs += dt;

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
    return {
      minX: cameraX,
      maxX: cameraX + p.width,
      minY: 0,
      maxY: p.height,
    };
  }

  clearLevel(p = this.p, eventBus = this.eventBus) {
    this.recordSystem.clearAllListenersAndTimers();
    this._player.clearListeners();
  }

  addReplayer(startX, startY) {
    if (this._replayer === null) {
      this._replayer = new Replayer(startX, startY, 40, 40);
      this._replayer.createListeners();
      this.entities.add(this._replayer);
      this.physicsSystem.setEntities(this.entities);
      this.collisionSystem.setEntities(this.entities);
      return this._replayer;
    }
  }

  removeReplayer() {
    if (this._replayer !== null) {
      this._replayer.clearEventListeners();
      this.entities.delete(this._replayer);
      this._replayer = null;
      this.physicsSystem.setEntities(this.entities);
      this.collisionSystem.setEntities(this.entities);
    }
  }

  getPlayer() {
    return this._player ?? null;
  }
  getReplayer() {
    return this._replayer ?? null;
  }

  clearCanvas(p = this.p, cameraNudgeX = 0, bgParallaxFactor = 1) {
    const cameraX = this._getCameraX(p);
    const bgOffsetX = cameraNudgeX * bgParallaxFactor;
    const bg = Assets.bgImageLevel4;
    if (bg) {
      p.push();
      p.translate(-cameraX - bgOffsetX, 0);
      p.scale(1, -1);
      for (let i = 0; i < this.rooms.length; i++) {
        // Calculate scale to make background slightly larger than canvas while maintaining aspect ratio
        const scaleX = p.width / bg.width;
        const scaleY = p.height / bg.height;
        const scale = Math.max(scaleX, scaleY) * 1.05; // Slightly larger than canvas
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

  updatePhysics() {
    this.physicsSystem.physicsEntry();
  }

  updateCollision(p = this.p, eventBus = this.eventBus) {
    this.collisionSystem.collisionEntry(eventBus);

    // 更新按钮-地刺联动
    this._spikeLinkSystem0.update();
    this._spikeLinkSystem1.update();
    this._spikeLinkSystem2.update();

    if (this._transition) {
      this._updateTransition(p);
      return;
    }

    this._checkRoomTransition(p);
  }

  draw(p = this.p) {
    const cameraX = this._getCameraX(p);
    p.push();
    p.translate(-cameraX, 0);

    // 地刺先画，地面覆盖地刺底部
    for (const entity of this.entities) {
      if (entity.type === "spike") entity.draw(p);
    }
    for (const entity of this.entities) {
      if (entity.type === "ground") entity.draw(p);
    }
    for (const entity of this.entities) {
      if (entity.type !== "spike" && entity.type !== "ground") {
        entity.draw(p);
      }
    }

    p.pop();

    this.recordSystem.draw && this.recordSystem.draw(p);

    // 每帧末尾释放按钮，下一帧碰撞重新判定
    this._room0Button.releaseButton();
    this._room1Button.releaseButton();
    this._room1Button2.releaseButton();
  }
}
