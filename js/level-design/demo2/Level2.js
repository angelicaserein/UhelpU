import {
  Player,
  Replayer,
  Ground,
  Wall,
  Platform,
  Portal,
  NPCDemo2,
  SignboardDemo2,
  Button,
  Spike,
} from "../../game-entity-model/index.js";
import { CollisionSystem } from "../../collision-system/CollisionSystem.js";
import { PhysicsSystem } from "../../physics-system/PhysicsSystem.js";
import { RecordSystem } from "../../record-system/RecordSystem.js";
import { Assets } from "../../AssetsManager.js";
import { BaseLevel } from "../BaseLevel.js";
import { Room } from "../Room.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";

export class Level2 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this._activeRoomIndex = 0;
    this._replayer = null;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    // ── ButtonSpikeLinkSystem（5 组） ──────────────────────────
    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_0, spikes: [this._bsSpike_0] },
      { startColorIndex: 0 },
    );
    this._bsSys_1 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_1, spikes: [this._bsSpike_1] },
      { startColorIndex: 1 },
    );
    this._bsSys_2 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_2, spikes: [this._bsSpike_2] },
      { startColorIndex: 2 },
    );
    this._bsSys_3 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_3, spikes: [this._bsSpike_3] },
      { startColorIndex: 3 },
    );
    this._bsSys_4 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_4, spikes: [this._bsSpike_4] },
      { startColorIndex: 4 },
    );

    // ── 玩家 ──────────────────────────────────────────────────
    this._player = new Player(110, 440, 40, 40);
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

  // ── 编辑器导出的实体 ───────────────────────────────────────
  //
  // 房间数量: 2
  //   Room 0: x ∈ [0, 1366)
  //   Room 1: x ∈ [1366, 2732)

  _buildRooms(p) {
    const wallThickness = 20;

    // ── ButtonSpikeLinkSystem 实体 ────────────────────────────
    // Room 0 buttons
    this._bsBtn_0 = new Button(700, 120, 34, 16);
    this._bsBtn_1 = new Button(1170, 80, 34, 16);
    this._bsBtn_2 = new Button(1230, 80, 34, 16);
    this._bsBtn_3 = new Button(1170, 270, 34, 16);
    this._bsBtn_4 = new Button(1230, 270, 34, 16);
    // Room 0 spike
    this._bsSpike_0 = new Spike(1000, 80, 100, 20);
    // Room 1 spikes (local coords: world_x − 1366)
    this._bsSpike_1 = new Spike(194, 80, 150, 20); // world 1560
    this._bsSpike_2 = new Spike(444, 80, 160, 20); // world 1810
    this._bsSpike_3 = new Spike(194, 270, 150, 20); // world 1560
    this._bsSpike_4 = new Spike(444, 270, 160, 20); // world 1810

    // ── Room 0: x ∈ [0, 1366) ─────────────────────────────────
    const room0 = new Room(
      [
        new Wall(0, 0, wallThickness, 768),
        new Ground(0, 0, p.width, 80),
        new Ground(310, 80, 170, 180),
        new Platform(190, 80, 120, 60),
        new Platform(480, 350, 100, 40),
        new Platform(880, 360, 1100, 30),
        new Platform(880, 240, 1190, 30),
        new Platform(640, 80, 160, 40),
        new Wall(580, 80, 60, 310),
        new NPCDemo2(230, 140, 40, 40, {
          getPlayer: () => this._player,
          eventBus: this.eventBus,
          npcId: "level2_npc_0",
          dialogueLines: ["d2_npc_level2_0_line1", "d2_npc_level2_0_line2"],
          exhaustedLine: "d2_npc_level2_0_exhausted",
        }),
        new NPCDemo2(930, 270, 40, 40, {
          getPlayer: () => this._player,
          eventBus: this.eventBus,
          npcId: "level2_npc_1",
          dialogueLines: ["d2_npc_level2_1_line1", "d2_npc_level2_1_line2"],
          exhaustedLine: "d2_npc_level2_1_exhausted",
        }),
        new SignboardDemo2(
          510,
          390,
          100,
          65,
          () => this._player,
          this.eventBus,
          {
            textKey: "d2_signboard_level2_front",
          },
        ),
        this._bsBtn_0,
        this._bsBtn_1,
        this._bsBtn_2,
        this._bsBtn_3,
        this._bsBtn_4,
        this._bsSpike_0,
      ],
      { right: { targetRoomIndex: 1 } },
    );

    // ── Room 1: x ∈ [1366, 2732) ─────────────────────────────
    const portal = new Portal(1264, 250, 50, 50); // world 2630
    portal.openPortal();

    const room1 = new Room(
      [
        new Wall(p.width - wallThickness, 0, wallThickness, 768),
        new Ground(0, 0, p.width, 80),
        new Ground(784, 80, 130, 120), // world 2150
        new Platform(994, 220, 40, 30), // world 2360
        new Platform(1234, 230, 110, 20), // world 2600
        portal,
        new NPCDemo2(394, 390, 40, 40, {
          // world 1760
          getPlayer: () => this._player,
          eventBus: this.eventBus,
          npcId: "level2_npc_2",
          dialogueLines: ["d2_npc_level2_2_line1", "d2_npc_level2_2_line2"],
          exhaustedLine: "d2_npc_level2_2_exhausted",
        }),
        new NPCDemo2(1184, 80, 40, 40, {
          // world 2550
          getPlayer: () => this._player,
          eventBus: this.eventBus,
          npcId: "level2_npc_3",
          dialogueLines: ["d2_npc_level2_3_line1", "d2_npc_level2_3_line2"],
          exhaustedLine: "d2_npc_level2_3_exhausted",
        }),
        this._bsSpike_1,
        this._bsSpike_2,
        this._bsSpike_3,
        this._bsSpike_4,
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
    const bg = Assets.bgImageDemo2Level;
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
    this._bsSys_0.update();
    this._bsSys_1.update();
    this._bsSys_2.update();
    this._bsSys_3.update();
    this._bsSys_4.update();
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
    for (const entity of this.entities) {
      if (entity.type !== "spike" && entity.type !== "ground") entity.draw(p);
    }
    p.pop();
    this.recordSystem.draw && this.recordSystem.draw(p);
  }
}
