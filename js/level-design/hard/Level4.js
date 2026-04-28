import {
  Player,
  Ground,
  Wall,
  Spike,
  Portal,
  Button,
  Platform,
  CheckpointDemo2,
  TeleportPoint,
  Enemy,
  WireRenderer,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { Room } from "../Room.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";
import { MapEditor } from "../../develop-mode/MapEditor.js";
import { Assets } from "../../AssetsManager.js";

export class Level4 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";
    this._activeRoomIndex = 0;
    this._transition = null;
    this._transitionDurationMs = 260;
    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    // ButtonSpikeLinkSystem
    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_0, spikes: [this._bsSpike_0] },
      { startColorIndex: 0 },
    );
    this._bsSys_1 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_1, spikes: [this._bsSpike_1] },
      { startColorIndex: 1 },
    );

    // BtnWirePortalSystem
    this._wpSys_0 = new BtnWirePortalSystem({
      button: this._wpBtn_0,
      portal: this._wpPortal_0,
    });
    this.rooms[1].entities.add(new WireRenderer(this._wpSys_0));

    // Player
    this._player = new Player(130, 480, 40, 40);
    this._player.createListeners();
    this.entities = this._buildEntities();
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // ButtonPlatformLinkSystem
    this._bpSys_0 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_0,
        platforms: [{ platform: this._bpPlat_0_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 0 },
    );
    this._bpSys_1 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_1,
        platforms: [
          { platform: this._bpPlat_1_0, mode: "appear" },
          { platform: this._bpPlat_1_1, mode: "appear" },
          { platform: this._bpPlat_1_2, mode: "appear" },
        ],
      },
      this.collisionSystem,
      { startColorIndex: 1 },
    );
    this._bpSys_2 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_2,
        platforms: [{ platform: this._bpPlat_2_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 2 },
    );
    this._bpSys_3 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_3,
        platforms: [{ platform: this._bpPlat_3_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 3 },
    );
    this._bpSys_4 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_4,
        platforms: [{ platform: this._bpPlat_4_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 4 },
    );
    this._bpSys_5 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_5,
        platforms: [{ platform: this._bpPlat_5_0, mode: "appear" }],
      },
      this.collisionSystem,
      { startColorIndex: 5 },
    );
    this._bpSys_6 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_6,
        platforms: [{ platform: this._bpPlat_6_0, mode: "appear" }],
      },
      this.collisionSystem,
      { startColorIndex: 6 },
    );
    this._bpSys_7 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_7,
        platforms: [{ platform: this._bpPlat_7_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 7 },
    );
    this._bpSys_8 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_8,
        platforms: [{ platform: this._bpPlat_8_0, mode: "appear" }],
      },
      this.collisionSystem,
      { startColorIndex: 8 },
    );
    this._bpSys_9 = new ButtonPlatformLinkSystem(
      {
        button: this._bpBtn_9,
        platforms: [{ platform: this._bpPlat_9_0, mode: "disappear" }],
      },
      this.collisionSystem,
      { startColorIndex: 9 },
    );

    // 开发模式：地图编辑器（按 M 开关）
    this._mapEditor = new MapEditor(this);
  }

  _buildRooms(p) {
    const room0Enemy_19 = new Enemy(264, 80, 40, 40, { speed: 2 });
    room0Enemy_19._direction = 1;
    this._bsBtn_0 = new Button(600, 80, 34, 16);
    this._bsSpike_0 = new Spike(920, 430, 130, 20);
    this._bpBtn_0 = new Button(80, 320, 34, 16);
    this._bpPlat_0_0 = new Platform(380, 410, 30, 110);
    this._bpBtn_1 = new Button(500, 80, 34, 16);
    this._bpPlat_1_0 = new Platform(750, 410, 90, 20);
    this._bpPlat_1_1 = new Platform(550, 260, 80, 20);
    this._bpPlat_1_2 = new Platform(660, 340, 80, 20);
    this._bpBtn_2 = new Button(1280, 80, 34, 16);
    this._bpPlat_2_0 = new Platform(1210, 460, 30, 200);

    const room0 = new Room(
      [
        new Wall(1320, 80, 60, 40),
        new Wall(-100, 0, 120, 768),
        new Ground(0, 0, p.width, 80),
        new Ground(20, 370, 310, 40),
        new Ground(20, 80, 160, 240),
        new Platform(890, 400, 260, 30),
        new Platform(1250, 400, 360, 30),
        new Platform(900, 140, 310, 30),
        new Spike(380, 560, 20, 60),
        new Spike(380, 620, 20, 60),
        new Spike(830, 80, 410, 20),
        new Spike(1160, 170, 50, 16),
        new Wall(380, 80, 30, 330),
        new Wall(1210, 140, 30, 320),
        new CheckpointDemo2(450, 80, 40, 70, () => this._player),
        new CheckpointDemo2(1040, 420, 40, 70, () => this._player),
        new TeleportPoint(250, 410, 40, 70, () => this._player),
        new TeleportPoint(570, 280, 40, 70, () => this._player),
        new TeleportPoint(770, 430, 40, 70, () => this._player),
        new TeleportPoint(1100, 430, 40, 70, () => this._player),
        new TeleportPoint(900, 170, 40, 70, () => this._player),
        room0Enemy_19,
        this._bsBtn_0,
        this._bsSpike_0,
        this._bpBtn_0,
        this._bpPlat_0_0,
        this._bpBtn_1,
        this._bpPlat_1_0,
        this._bpPlat_1_1,
        this._bpPlat_1_2,
        this._bpBtn_2,
        this._bpPlat_2_0,
      ],
      { right: { targetRoomIndex: 1 } },
    );

    const room1Enemy_34 = new Enemy(1186, 230, 40, 40, { speed: 2 });
    room1Enemy_34._direction = 1;
    this._bsBtn_1 = new Button(244, 190, 34, 16);
    this._bsSpike_1 = new Spike(484, 430, 200, 16);
    this._wpBtn_0 = new Button(804, 190, 34, 16);
    this._wpPortal_0 = new Portal(1284, 500, 50, 50);
    this._bpBtn_3 = new Button(194, 430, 34, 16);
    this._bpPlat_3_0 = new Platform(244, 400, 70, 30);
    this._bpBtn_4 = new Button(244, 80, 34, 16);
    this._bpPlat_4_0 = new Platform(1074, 400, 80, 30);
    this._bpBtn_5 = new Button(934, 190, 34, 16);
    this._bpPlat_5_0 = new Platform(94, 140, 90, 20);
    this._bpBtn_6 = new Button(874, 190, 34, 16);
    this._bpPlat_6_0 = new Platform(94, 220, 100, 20);
    this._bpBtn_7 = new Button(34, 300, 34, 16);
    this._bpPlat_7_0 = new Platform(1154, 80, 30, 80);
    this._bpBtn_8 = new Button(764, 190, 34, 16);
    this._bpPlat_8_0 = new Platform(1184, 480, 160, 20);
    this._bpBtn_9 = new Button(304, 80, 34, 16);
    this._bpPlat_9_0 = new Platform(194, 80, 50, 80);

    const room1 = new Room(
      [
        new Wall(4, 300, 30, 100),
        new Wall(1346, 0, 120, 768),
        new Ground(0, 0, p.width, 80),
        new Ground(194, 160, 50, 240),
        new Ground(4, 280, 100, 20),
        new Ground(1274, 80, 80, 40),
        new Platform(244, 160, 340, 30),
        new Platform(244, 230, 150, 80),
        new Platform(314, 400, 760, 30),
        new Platform(1044, 130, 40, 30),
        new Platform(1184, 210, 40, 20),
        new Platform(674, 160, 370, 30),
        new Spike(354, 430, 40, 16),
        new Spike(314, 190, 260, 16),
        new Spike(4, 160, 190, 16),
        new Spike(964, 370, 20, 30),
        new Spike(964, 330, 20, 30),
        new Spike(964, 290, 20, 30),
        new Spike(964, 250, 20, 30),
        new Spike(1234, 430, 20, 36),
        new Wall(654, 160, 20, 240),
        new Wall(1154, 160, 30, 260),
        new Wall(1154, 420, 30, 400),
        new CheckpointDemo2(34, 430, 40, 70, () => this._player),
        new CheckpointDemo2(1084, 80, 40, 70, () => this._player),
        new CheckpointDemo2(774, 430, 40, 70, () => this._player),
        new TeleportPoint(714, 430, 40, 70, () => this._player),
        new TeleportPoint(124, 430, 40, 70, () => this._player),
        new TeleportPoint(34, 80, 40, 70, () => this._player),
        new TeleportPoint(1004, 190, 40, 70, () => this._player),
        new TeleportPoint(704, 190, 40, 70, () => this._player),
        new TeleportPoint(1294, 120, 40, 70, () => this._player),
        new TeleportPoint(1184, 500, 40, 70, () => this._player),
        room1Enemy_34,
        this._bsBtn_1,
        this._bsSpike_1,
        this._wpBtn_0,
        this._wpPortal_0,
        this._bpBtn_3,
        this._bpPlat_3_0,
        this._bpBtn_4,
        this._bpPlat_4_0,
        this._bpBtn_5,
        this._bpPlat_5_0,
        this._bpBtn_6,
        this._bpPlat_6_0,
        this._bpBtn_7,
        this._bpPlat_7_0,
        this._bpBtn_8,
        this._bpPlat_8_0,
        this._bpBtn_9,
        this._bpPlat_9_0,
      ],
      { left: { targetRoomIndex: 0 } },
    );

    return [room0, room1];
  }

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

  _applyWorldOffsetsToRooms(p) {
    for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
      const offsetX = roomIndex * p.width;
      for (const entity of this.rooms[roomIndex].entities) {
        entity.x += offsetX;
      }
    }
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
    this._bsSys_0?.update();
    this._bsSys_1?.update();
    this._wpSys_0?.update();
    this._bpSys_0?.update();
    this._bpSys_1?.update();
    this._bpSys_2?.update();
    this._bpSys_3?.update();
    this._bpSys_4?.update();
    this._bpSys_5?.update();
    this._bpSys_6?.update();
    this._bpSys_7?.update();
    this._bpSys_8?.update();
    this._bpSys_9?.update();
  }

  updateCollision(p = this.p, eventBus = this.eventBus) {
    this.collisionSystem.collisionEntry(eventBus);
    if (this._transition) {
      this._updateTransition(p);
      return;
    }
    this._checkRoomTransition(p);
  }

  clearLevel(p = this.p, eventBus = this.eventBus) {
    if (this._mapEditor) this._mapEditor.destroy();
    super.clearLevel(p, eventBus);
  }

  draw(p) {
    const cameraX = this._getCameraX(p);
    const sortedEntities = Array.from(this.entities).sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
    );

    p.push();
    p.translate(-cameraX, 0);
    for (const entity of sortedEntities) {
      entity.draw(p);
    }
    this._bpSys_0?.draw?.(p);
    this._bpSys_1?.draw?.(p);
    this._bpSys_2?.draw?.(p);
    this._bpSys_3?.draw?.(p);
    this._bpSys_4?.draw?.(p);
    this._bpSys_5?.draw?.(p);
    this._bpSys_6?.draw?.(p);
    this._bpSys_7?.draw?.(p);
    this._bpSys_8?.draw?.(p);
    this._bpSys_9?.draw?.(p);
    p.pop();

    this.recordSystem.draw && this.recordSystem.draw(p);

    // 开发模式：编辑器叠加绘制
    if (this._mapEditor) this._mapEditor.draw(p);
  }
}
