import {
  Player,
  Ground,
  Wall,
  Platform,
  Portal,
  Button,
  Spike,
  NPCDemo2,
  CheckpointDemo2,
  Enemy,
  WireRenderer,
} from "../../game-entity-model/index.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";
import { Assets } from "../../AssetsManager.js";
import { BaseLevel } from "../BaseLevel.js";
import { Room } from "../Room.js";
import { MapEditor } from "../../develop-mode/MapEditor.js";

export class Level3 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";
    this._activeRoomIndex = 0;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);
    this._initMechanismSystems();

    this._player = new Player(340, 590, 40, 40);
    this._player.createListeners();

    this.entities = this._buildEntities();
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
    this._initButtonPlatformSystems();

    // ── 开发模式：地图编辑器（按 M 开关） ──
    this._mapEditor = new MapEditor(this);
  }

  _buildRooms(p) {
    const wallThickness = 20;
    const roomWidth = p.width;

    this._bpBtn_0 = new Button(600, 170, 34, 16);
    this._bpPlat_0_0 = new Platform(590, 340, 110, 30);

    this._bpBtn_1 = new Button(860, 600, 34, 16);
    this._bpPlat_1_0 = new Platform(850, 180, 50, 200);

    this._bpBtn_2 = new Button(1180, 510, 34, 16);
    this._bpPlat_2_0 = new Platform(1120, 100, 160, 30);

    this._bpBtn_3 = new Button(1020, 80, 34, 16);
    this._bpPlat_3_0 = new Platform(1120, 400, 160, 30);

    this._bpBtn_4 = new Button(1020, 230, 34, 16);
    this._bpPlat_4_0 = new Platform(1120, 480, 160, 30);

    this._wpBtn_0 = new Button(1150, 340, 38, 16);
    this._wpPortal_0 = new Portal(714, 80, 50, 50);

    this._bsBtn_0 = new Button(894, 490, 34, 16);
    this._bsSpike_0 = new Spike(184, 440, 90, 20);

    this._bsBtn_1 = new Button(214, 440, 34, 16);
    this._bsSpike_1 = new Spike(964, 490, 180, 20);

    this._bsBtn_2 = new Button(1264, 80, 34, 16);
    this._bsSpike_2 = new Spike(784, 80, 370, 20);

    this._bsBtn_3 = new Button(1114, 260, 34, 16);
    this._bsSpike_3 = new Spike(824, 410, 160, 20);

    this._bpBtn_5 = new Button(54, 80, 34, 16);
    this._bpPlat_5_0 = new Platform(134, 120, 160, 30);

    this._bpBtn_6 = new Button(94, 80, 34, 16);
    this._bpPlat_6_0 = new Platform(184, 180, 160, 30);

    this._bpBtn_7 = new Button(134, 80, 34, 16);
    this._bpPlat_7_0 = new Platform(244, 240, 160, 30);

    this._bpBtn_8 = new Button(174, 80, 34, 16);
    this._bpPlat_8_0 = new Platform(294, 300, 160, 30);

    this._bpBtn_9 = new Button(214, 80, 34, 16);
    this._bpPlat_9_0 = new Platform(334, 350, 160, 30);

    this._bpBtn_10 = new Button(254, 80, 34, 16);
    this._bpPlat_10_0 = new Platform(384, 410, 160, 30);

    this._bpBtn_11 = new Button(294, 80, 34, 16);
    this._bpPlat_11_0 = new Platform(414, 460, 160, 30);

    this._bpBtn_12 = new Button(744, 490, 34, 16);
    this._bpPlat_12_0 = new Platform(84, 520, 80, 20);

    this._bpBtn_13 = new Button(794, 490, 34, 16);
    this._bpPlat_13_0 = new Platform(134, 510, 80, 20);

    this._bpBtn_14 = new Button(844, 490, 34, 16);
    this._bpPlat_14_0 = new Platform(184, 500, 90, 20);

    this._bpBtn_15 = new Button(1024, 190, 34, 16);
    this._bpPlat_15_0 = new Platform(1114, 390, 100, 20);

    this._bpBtn_16 = new Button(1114, 190, 34, 16);
    this._bpPlat_16_0 = new Platform(804, 390, 270, 20);

    this._bpBtn_17 = new Button(1024, 340, 34, 16);
    this._bpPlat_17_0 = new Platform(694, 310, 290, 30);

    this._bpBtn_18 = new Button(800, 190, 68, 16); //x是最左边位置，y是最上边位置，宽高是平台的宽高
    this._bpPlat_18_0 = new Platform(994, 250, 70, 20);

    this._bpBtn_19 = new Button(714, 270, 34, 16);
    this._bpPlat_19_0 = new Platform(734, 210, 30, 20);

    this._bpBtn_20 = new Button(834, 270, 34, 16);
    this._bpPlat_20_0 = new Platform(734, 190, 30, 20);

    const room0 = new Room(
      [
        new Wall(-100, 0, wallThickness + 100, 768),
        new Ground(0, 0, roomWidth, 80),
        new Ground(350, 80, 90, 90),
        new Ground(900, 570, 40, 250),
        new Ground(590, 80, 310, 90),
        new Ground(20, 240, 150, 140),
        new Platform(20, 80, 330, 30),
        new Platform(700, 400, 190, 30),
        new Platform(850, 450, 50, 150),
        new Platform(1100, 530, 30, 30),
        new Platform(1270, 530, 30, 30),
        new Platform(260, 240, 60, 20),
        new Platform(170, 240, 90, 80),
        new Platform(120, 440, 130, 20),
        new Platform(250, 510, 250, 20),
        new Platform(470, 530, 30, 200),
        new Platform(40, 140, 40, 20),
        new Platform(110, 170, 40, 20),
        new Platform(180, 140, 40, 20),
        new Platform(2580, 310, 30, 180),
        new Spike(1120, 80, 160, 20),
        new Spike(1120, 380, 160, 20),
        new NPCDemo2(270, 110, 40, 40, {
          getPlayer: () => this._player,
          eventBus: this.eventBus,
          npcId: "hard_level3_npc",
          dialogueLines: ["hard_level3_npc_line1", "hard_level3_npc_line2"],
          exhaustedLine: "hard_level3_npc_exhausted",
        }),
        new CheckpointDemo2(370, 170, 40, 70, () => this._player),
        new CheckpointDemo2(950, 80, 40, 70, () => this._player),
        new Enemy(488, 80, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(506, 80, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(548, 80, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(550, 80, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(446, 80, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(520, 80, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(530, 80, 40, 40, { speed: 2, direction: 1 }), //参数530是敌人初始位置的x坐标，80是y坐标，40是宽度，40是高度，{ speed: 2, direction: 1 }是一个对象，表示敌人的移动速度和方向
        new Enemy(820, 430, 40, 40, { speed: 2, direction: 2 }),
        new Enemy(720, 430, 40, 40, { speed: 2, direction: 2 }),
        new Enemy(740, 430, 40, 40, { speed: 2, direction: 2 }),
        new Enemy(700, 430, 40, 40, { speed: 2, direction: 2 }),
        new Enemy(780, 430, 40, 40, { speed: 2, direction: 2 }),
        new Enemy(704, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(760, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(762, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(724, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(738, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(820, 430, 40, 40, { speed: 2, direction: 2 }),
        new Enemy(720, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(740, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(700, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(780, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(1142, 510, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(1150, 510, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(1130, 510, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(1142, 510, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(1140, 510, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(1194, 510, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(1208, 510, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(800, 430, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(760, 430, 40, 40, { speed: 2, direction: 2 }),
        new Enemy(460, 80, 40, 40, { speed: 2, direction: 2 }), //derection: 2表示敌人初始向左移动，direction: 1表示敌人初始向右移动
        new Enemy(172, 459.5, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(38, 160, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(112, 190, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(182, 160, 40, 40, { speed: 2, direction: 1 }),
        this._bpBtn_0,
        this._bpPlat_0_0,
        this._bpBtn_1,
        this._bpPlat_1_0,
        this._bpBtn_2,
        this._bpPlat_2_0,
        this._bpBtn_3,
        this._bpPlat_3_0,
        this._bpBtn_4,
        this._bpPlat_4_0,
      ],
      { right: { targetRoomIndex: 1 } },
    );

    const room1 = new Room(
      [
        new Wall(roomWidth - wallThickness, 0, wallThickness + 100, 768),
        new Ground(0, 0, roomWidth, 80),
        new Platform(34, 530, 80, 20),
        new Platform(184, 420, 90, 20),
        new Platform(694, 460, 520, 30),
        new Platform(694, 390, 110, 20),
        new Platform(1074, 340, 40, 120),
        new Platform(1016, 310, 240, 30),
        new Platform(1074, 190, 40, 120),
        new Platform(694, 160, 530, 30),
        new Platform(1114, 240, 50, 20),
        new Platform(984, 340, 30, 50),
        new Platform(774, 340, 30, 50),
        new Platform(884, 340, 30, 50),
        new Platform(694, 250, 70, 20),
        new Platform(814, 250, 70, 20),
        new Platform(924, 250, 70, 20),
        new Platform(964, 190, 30, 60),
        new Wall(574, 90, 125, 400), //x,
        new CheckpointDemo2(614, 490, 40, 70, () => this._player),
        new CheckpointDemo2(1174, 490, 40, 70, () => this._player),
        new Enemy(730, 340, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(814, 340, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(1124, 410, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(694, 190, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(914, 340, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(728, 410, 40, 40, { speed: 2, direction: 1 }),
        new Enemy(58, 550, 40, 40, { speed: 2, direction: 1 }),
        this._wpBtn_0,
        this._wpPortal_0,
        this._bsBtn_0,
        this._bsSpike_0,
        this._bsBtn_1,
        this._bsSpike_1,
        this._bsBtn_2,
        this._bsSpike_2,
        this._bsBtn_3,
        this._bsSpike_3,
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
        this._bpBtn_10,
        this._bpPlat_10_0,
        this._bpBtn_11,
        this._bpPlat_11_0,
        this._bpBtn_12,
        this._bpPlat_12_0,
        this._bpBtn_13,
        this._bpPlat_13_0,
        this._bpBtn_14,
        this._bpPlat_14_0,
        this._bpBtn_15,
        this._bpPlat_15_0,
        this._bpBtn_16,
        this._bpPlat_16_0,
        this._bpBtn_17,
        this._bpPlat_17_0,
        this._bpBtn_18,
        this._bpPlat_18_0,
        this._bpBtn_19,
        this._bpPlat_19_0,
        this._bpBtn_20,
        this._bpPlat_20_0,
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
      new ButtonSpikeLinkSystem(
        { button: this._bsBtn_2, spikes: [this._bsSpike_2] },
        { startColorIndex: 2 },
      ),
      new ButtonSpikeLinkSystem(
        { button: this._bsBtn_3, spikes: [this._bsSpike_3] },
        { startColorIndex: 3 },
      ),
    ];
  }

  _initButtonPlatformSystems() {
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
          platforms: [{ platform: this._bpPlat_5_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 0 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_6,
          platforms: [{ platform: this._bpPlat_6_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 2 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_7,
          platforms: [{ platform: this._bpPlat_7_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 3 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_8,
          platforms: [{ platform: this._bpPlat_8_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 4 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_9,
          platforms: [{ platform: this._bpPlat_9_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 5 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_10,
          platforms: [{ platform: this._bpPlat_10_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 6 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_11,
          platforms: [{ platform: this._bpPlat_11_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 7 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_12,
          platforms: [{ platform: this._bpPlat_12_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 7 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_13,
          platforms: [{ platform: this._bpPlat_13_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 8 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_14,
          platforms: [{ platform: this._bpPlat_14_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 9 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_15,
          platforms: [{ platform: this._bpPlat_15_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 10 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_16,
          platforms: [{ platform: this._bpPlat_16_0, mode: "appear" }],
        },
        this.collisionSystem,
        { startColorIndex: 12 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_17,
          platforms: [{ platform: this._bpPlat_17_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 12 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_18,
          platforms: [{ platform: this._bpPlat_18_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 13 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_19,
          platforms: [{ platform: this._bpPlat_19_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 14 },
      ),
      new ButtonPlatformLinkSystem(
        {
          button: this._bpBtn_20,
          platforms: [{ platform: this._bpPlat_20_0, mode: "disappear" }],
        },
        this.collisionSystem,
        { startColorIndex: 15 },
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
    this.cleanupDeadEnemies();
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

    // ── 开发模式：编辑器叠加绘制 ──
    if (this._mapEditor) this._mapEditor.draw(p);
  }
}
