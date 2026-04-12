import {
  Player,
  Ground,
  Wall,
  Platform,
  Portal,
  Button,
  Spike,
  CheckpointDemo2,
  WireRenderer,
} from "../../game-entity-model/index.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";
import { Assets } from "../../AssetsManager.js";
import { BaseLevel } from "../BaseLevel.js";
import { Room } from "../Room.js";

export class Level2 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";
    this._activeRoomIndex = 0;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);
    this._initMechanismSystems();

    this._player = new Player(120, 500, 40, 40);
    this._player.createListeners();

    this.entities = this._buildEntities();
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
    this._initButtonPlatformSystems();
  }

  _buildRooms(p) {
    const wallThickness = 20;
    const roomWidth = p.width;

    this._bsBtn_0 = new Button(1020, 80, 34, 16);
    this._bsSpike_0 = new Spike(1160, 380, 140, 20);
    this._bsBtn_1 = new Button(504, 380, 34, 16);
    this._bsSpike_1 = new Spike(254, 380, 210, 20);

    this._wpBtn_0 = new Button(1014, 80, 34, 16);
    this._wpPortal_0 = new Portal(1284, 80, 50, 50);

    this._bpBtn_0 = new Button(320, 226, 34, 16);
    this._bpPlat_0_0 = new Platform(360, 230, 30, 100);
    this._bpPlat_0_1 = new Platform(290, 330, 100, 30);
    this._bpPlat_0_2 = new Platform(290, 230, 30, 100);

    this._bpBtn_1 = new Button(500, 230, 34, 16);
    this._bpPlat_1_0 = new Platform(460, 230, 30, 40);
    this._bpPlat_1_1 = new Platform(460, 270, 120, 30);
    this._bpPlat_1_2 = new Platform(550, 230, 30, 40);

    this._bpBtn_2 = new Button(740, 80, 34, 16);
    this._bpPlat_2_0 = new Platform(640, 280, 230, 30);

    this._bpBtn_3 = new Button(920, 380, 34, 16);
    this._bpPlat_3_0 = new Platform(990, 350, 100, 30);

    this._bpBtn_4 = new Button(104, 380, 34, 16);
    this._bpPlat_4_0 = new Platform(184, 380, 70, 50);

    this._bpBtn_5 = new Button(744, 380, 34, 16);
    this._bpPlat_5_0 = new Platform(814, 350, 90, 30);

    this._bpBtn_6 = new Button(674, 130, 34, 16);
    this._bpPlat_6_0 = new Platform(1254, 380, 40, 190);

    this._bpBtn_7 = new Button(1004, 300, 34, 16);
    this._bpPlat_7_0 = new Platform(1044, 270, 300, 30);

    const room0 = new Room(
      [
        new Wall(0, 0, wallThickness, 768),
        new Ground(0, 0, roomWidth, 80),
        new Ground(230, 80, 410, 150),
        new Ground(870, 80, 120, 300),
        new Ground(1090, 70, 276, 310),
        new CheckpointDemo2(1310, 380, 40, 70, () => this._player),
        this._bsBtn_0,
        this._bsSpike_0,
        this._bpBtn_0,
        this._bpPlat_0_0,
        this._bpPlat_0_1,
        this._bpPlat_0_2,
        this._bpBtn_1,
        this._bpPlat_1_0,
        this._bpPlat_1_1,
        this._bpPlat_1_2,
        this._bpBtn_2,
        this._bpPlat_2_0,
        this._bpBtn_3,
        this._bpPlat_3_0,
      ],
      { right: { targetRoomIndex: 1 } },
    );

    const room1 = new Room(
      [
        new Wall(roomWidth - wallThickness, 0, wallThickness, 768),
        new Ground(0, 0, roomWidth, 80),
        new Ground(0, 70, 654, 310),
        new Ground(904, 80, 40, 300),
        new Platform(534, 380, 60, 50),
        new Platform(654, 350, 160, 30),
        new Platform(734, 270, 170, 30),
        new Platform(654, 190, 200, 30),
        new Platform(654, 80, 80, 50),
        new Platform(1254, 570, 40, 170),
        new Platform(944, 350, 350, 30),
        new Platform(1004, 270, 40, 30),
        new Spike(714, 220, 100, 20),
        new Spike(774, 300, 100, 20),
        new Spike(774, 80, 100, 20),
        new Spike(1014, 80, 190, 20),
        new Wall(304, 440, 20, 400),
        new CheckpointDemo2(674, 380, 40, 70, () => this._player),
        new CheckpointDemo2(1284, 300, 40, 70, () => this._player),
        this._wpBtn_0,
        this._wpPortal_0,
        this._bsBtn_1,
        this._bsSpike_1,
        this._bpBtn_4,
        this._bpPlat_4_0,
        this._bpBtn_5,
        this._bpPlat_5_0,
        this._bpBtn_6,
        this._bpPlat_6_0,
        this._bpBtn_7,
        this._bpPlat_7_0,
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

  _initMechanismSystems() {
    this._wpSystems = [
      new BtnWirePortalSystem({
        button: this._wpBtn_0,
        portal: this._wpPortal_0,
      }),
    ];
    this.rooms[1].entities.add(new WireRenderer(this._wpSystems[0]));

    this._bsSystems = [
      new ButtonSpikeLinkSystem(
        { button: this._bsBtn_0, spikes: [this._bsSpike_0] },
        { startColorIndex: 0 },
      ),
      new ButtonSpikeLinkSystem(
        { button: this._bsBtn_1, spikes: [this._bsSpike_1] },
        { startColorIndex: 1 },
      ),
    ];
  }

  _initButtonPlatformSystems() {
    this._bpSystems = [
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_0,
          platforms: [
            { platform: this._bpPlat_0_0, mode: "appear" },
            { platform: this._bpPlat_0_1, mode: "appear" },
            { platform: this._bpPlat_0_2, mode: "appear" },
          ],
        },
        this.collisionSystem,
        { startColorIndex: 0 },
      ),
      new ButtonPlatformLinkSystem(
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
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_2,
          platforms: [{ platform: this._bpPlat_2_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 2 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_3,
          platforms: [{ platform: this._bpPlat_3_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 3 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_4,
          platforms: [{ platform: this._bpPlat_4_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 4 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_5,
          platforms: [{ platform: this._bpPlat_5_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 5 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_6,
          platforms: [{ platform: this._bpPlat_6_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 6 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_7,
          platforms: [{ platform: this._bpPlat_7_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 7 },
      ),
    ];
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
    for (const system of this._wpSystems) {
      system.update();
    }
    for (const system of this._bsSystems) {
      system.update();
    }
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
    const sortedEntities = Array.from(this.entities).sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0),
    );

    p.push();
    p.translate(-cameraX, 0);
    for (const entity of sortedEntities) {
      entity.draw(p);
    }
    for (const system of this._bpSystems) {
      system.draw(p);
    }
    p.pop();

    this.recordSystem.draw && this.recordSystem.draw(p);
  }
}
