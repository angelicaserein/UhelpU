import {
  Player,
  Replayer,
  Ground,
  Wall,
  Platform,
  Portal,
  NPC,
  Signboard,
  Checkpoint,
  Button,
  Spike,
} from "../../game-entity-model/index.js";
import { CollisionSystem } from "../../collision-system/CollisionSystem.js";
import { PhysicsSystem } from "../../physics-system/PhysicsSystem.js";
import { RecordSystem } from "../../record-system/RecordSystem.js";
import { BaseLevel } from "../BaseLevel.js";
import { Assets } from "../../AssetsManager.js";
import { Room } from "../Room.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";

export class Level7 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this._activeRoomIndex = 0;
    this._replayer = null;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    // BtnWirePortalSystem
    this._btnWirePortalSystem = new BtnWirePortalSystem({
      button: this._wpBtn_0,
      portal: this._wpPortal_0,
    });

    // ButtonSpikeLinkSystem
    this._buttonSpikeLinkSystem = new ButtonSpikeLinkSystem([
      { button: this._bsBtn_0, spikes: [this._bsSpike_0] },
    ]);

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

    // BtnWirePortalSystem entities
    this._wpBtn_0 = new Button(760, 270, 34, 16);
    this._wpPortal_0 = new Portal(960, 270, 50, 50);

    // ButtonSpikeLinkSystem entities
    this._bsBtn_0 = new Button(1040, 80, 34, 16);
    this._bsSpike_0 = new Spike(1240, 80, 100, 20);

    const room0 = new Room(
      [
        new Wall(0, 0, wallThickness, 768),
        new Ground(0, 0, p.width, 80),
        new Ground(450, 170, 200, 40),
        new Platform(220, 85, 160, 30),
        new Portal(970, 120, 50, 50),
        new NPC(290, 130, 40, 40),
        new Signboard(620, 90, 100, 65),
        new Checkpoint(480, 70, 40, 70),
        this._wpBtn_0,
        this._wpPortal_0,
        this._bsBtn_0,
        this._bsSpike_0,
      ],
      { right: { targetRoomIndex: 1 } },
    );

    const room1 = new Room(
      [
        new Wall(p.width - wallThickness, 0, wallThickness, 768),
        new Ground(0, 0, p.width, 80),
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
      for (const entity of room.entities) set.add(entity);
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
    const playerCenterX = player.x + player.collider.w / 2;

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
    if (this._transition.elapsedMs >= this._transitionDurationMs)
      this._transition = null;
  }

  _getCameraX(p) {
    if (!this._transition) return this._activeRoomIndex * p.width;
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
    this.recordSystem.clearAllListenersAndTimers();
    this._player.clearListeners();
    super.clearLevel(p, eventBus);
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
    // const bg = Assets.bgImageDemo2Level4;
    const bg = null;
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
    } else {
      p.background(220);
    }
  }

  updatePhysics() {
    this.physicsSystem.physicsEntry();
    for (const entity of this.entities) {
      if (entity.update && typeof entity.update === "function")
        entity.update(this.p);
    }
    this._btnWirePortalSystem.update();
    this._buttonSpikeLinkSystem.update();
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
    p.push();
    p.translate(-cameraX, 0);
    for (const entity of this.entities) {
      if (entity.type === "spike") entity.draw(p);
    }
    for (const entity of this.entities) {
      if (entity.type === "ground") entity.draw(p);
    }
    this._btnWirePortalSystem.draw(p);
    for (const entity of this.entities) {
      if (entity.type !== "spike" && entity.type !== "ground") entity.draw(p);
    }
    p.pop();
    this.recordSystem.draw && this.recordSystem.draw(p);
  }
}
