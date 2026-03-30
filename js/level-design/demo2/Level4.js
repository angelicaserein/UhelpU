import {
  Player,
  Replayer,
  Ground,
  Wall,
  Platform,
  Portal,
  Checkpoint,
  Button,
  Spike,
  NPCDemo2,
} from "../../game-entity-model/index.js";
import { CollisionSystem } from "../../collision-system/CollisionSystem.js";
import { PhysicsSystem } from "../../physics-system/PhysicsSystem.js";
import { RecordSystem } from "../../record-system/RecordSystem.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { BaseLevel } from "../BaseLevel.js";
import { Assets } from "../../AssetsManager.js";
import { Room } from "../Room.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";

export class Level4 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this._activeRoomIndex = 0;
    this._replayer = null;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    this._player = new Player(80, 450, 40, 40);
    this._player.createListeners();

    this.entities = this._buildEntities();

    this.recordSystem = new RecordSystem(
      this._player,
      5000,
      (x, y) => this.addReplayer(x, y),
      () => this.removeReplayer(),
      { uiClass: Demo2RecordUI }
    );
    this.recordSystem.createListeners();

    this.physicsSystem = new PhysicsSystem(this.entities);
    this.collisionSystem = new CollisionSystem(this.entities, eventBus);

    this._wpSys_0 = new BtnWirePortalSystem({
      button: this._wpBtn_0,
      portal: this._wpPortal_0,
    });

    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_0, spikes: [this._bsSpike_0] },
      { startColorIndex: 0 },
    );

    this._bsSys_1 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_1, spikes: [this._bsSpike_1] },
      { startColorIndex: 1 },
    );

    this._bpSystems = [
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_0,
          platforms: [{ platform: this._bpPlat_0_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 0 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_1,
          platforms: [{ platform: this._bpPlat_1_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 1 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_2,
          platforms: [{ platform: this._bpPlat_2_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 2 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_3,
          platforms: [{ platform: this._bpPlat_3_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 3 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_4,
          platforms: [{ platform: this._bpPlat_4_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 4 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_5,
          platforms: [{ platform: this._bpPlat_5_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 5 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_6,
          platforms: [
            { platform: this._bpPlat_6_0, mode: "disappear" },
            { platform: this._bpPlat_6_1, mode: "disappear" },
            { platform: this._bpPlat_6_2, mode: "disappear" },
          ],
        },
        this.collisionSystem,
        { startColorIndex: 6 },
      ),
    ];
  }

  _buildRooms(p) {
    const wallThickness = 20;

    const room0 = new Room(
      [
        new Wall(0, 0, wallThickness, p.height),
        new Ground(0, 0, p.width, 80),
        new Ground(20, 80, 290, 180),
        new Ground(500, 80, 140, 180),
        new Ground(730, 170, 190, 90),
        new Ground(970, 80, 620, 180),
        new Platform(240, 330, 1040, 30),
        new Spike(310, 80, 200, 20),
        new Ground(580, 80, 100, 90),
        (this._bsBtn_1 = new Button(880, 80, 34, 16)),
        (this._bsSpike_1 = new Spike(740, 80, 130, 20)),
        (this._bsBtn_0 = new Button(930, 80, 34, 16)),
        (this._bsSpike_0 = new Spike(1020, 260, 110, 20)),
        (this._bpBtn_0 = new Button(250, 260, 34, 16)),
        (this._bpPlat_0_0 = new Platform(310, 230, 190, 30)),
        (this._bpBtn_1 = new Button(870, 260, 34, 16)),
        (this._bpPlat_1_0 = new Platform(920, 230, 50, 30)),
        (this._bpBtn_6 = new Button(1180, 260, 34, 16)),
        (this._bpPlat_6_0 = new Platform(1280, 260, 160, 200)),
        (this._bpPlat_6_1 = new Platform(1280, 460, 160, 200)),
        (this._bpPlat_6_2 = new Platform(1280, 660, 160, 110)),
        new NPCDemo2(790, 260, 40, 40, {
          getPlayer: () => this._player,
          eventBus: this.eventBus,
          npcId: "level4_npc",
          dialogueLines: ["d2_npc_level4_line1", "d2_npc_level4_line2"],
          exhaustedLine: "d2_npc_level4_exhausted",
        }),
      ],
      { right: { targetRoomIndex: 1 } },
    );

    const room1 = new Room(
      [
        new Wall(p.width - wallThickness, 0, wallThickness, p.height),
        new Ground(0, 0, p.width, 80),
        new Ground(284, 80, 310, 180),
        new Platform(1024, 560, 180, 30),
        new Spike(224, 80, 60, 20),
        new Spike(594, 80, 580, 60),
        new Spike(1174, 80, 170, 60),
        new Checkpoint(144, 260, 40, 70, () => this._player),
        (this._wpBtn_0 = new Button(484, 260, 34, 16)),
        (this._wpPortal_0 = new Portal(1084, 590, 50, 50)),
        (this._bpBtn_2 = new Button(234, 260, 34, 16)),
        (this._bpPlat_2_0 = new Platform(224, 256, 60, 4)),
        (this._bpBtn_3 = new Button(394, 260, 34, 16)),
        (this._bpPlat_3_0 = new Platform(614, 320, 120, 20)),
        (this._bpBtn_4 = new Button(424, 260, 34, 16)),
        (this._bpPlat_4_0 = new Platform(744, 410, 120, 20)),
        (this._bpBtn_5 = new Button(454, 260, 34, 16)),
        (this._bpPlat_5_0 = new Platform(874, 490, 120, 20)),
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
    this._wpSys_0.update();
    this._bsSys_0.update();
    this._bsSys_1.update();
    for (const system of this._bpSystems) {
      system.update();
    }
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
      if (entity.type === "checkpoint") entity.draw(p);
    }
    for (const entity of this.entities) {
      if (entity.type === "ground") entity.draw(p);
    }
    for (const system of this._bpSystems) {
      system.draw(p);
    }
    this._wpSys_0.draw(p);
    for (const entity of this.entities) {
      if (
        entity.type !== "spike" &&
        entity.type !== "ground" &&
        entity.type !== "checkpoint" &&
        !(entity.type === "platform" && entity._hidden)
      ) {
        entity.draw(p);
      }
    }
    p.pop();
    this.recordSystem.draw && this.recordSystem.draw(p);
  }
}
