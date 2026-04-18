import {
  Player,
  Ground,
  Wall,
  Spike,
  Portal,
  Button,
  Platform,
  Box,
  NPCDemo2,
  SignboardDemo2,
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

export class Level2 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";
    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    // ButtonSpikeLinkSystem
    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: this._bsBtn_0, spikes: [this._bsSpike_0] },
      { startColorIndex: 0 },
    );

    // BtnWirePortalSystem
    this._wpSys_0 = new BtnWirePortalSystem({
      button: this._wpBtn_0,
      portal: this._wpPortal_0,
    });
    this.rooms[0].entities.add(new WireRenderer(this._wpSys_0));

    // Player
    this._player = new Player(240, 500, 40, 40);
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
  }

  _buildRooms(p) {
    const room0Portal_9 = new Portal(610, 160, 50, 50);
    room0Portal_9.openPortal();
    const room0Enemy_18 = new Enemy(346, 150, 40, 40, { speed: 2 });
    room0Enemy_18._direction = 1;
    this._bsBtn_0 = new Button(800, 400, 34, 16);
    this._bsSpike_0 = new Spike(1000, 400, 100, 20);
    this._wpBtn_0 = new Button(900, 120, 34, 16);
    this._wpPortal_0 = new Portal(1100, 120, 50, 50);
    this._bpBtn_0 = new Button(850, 280, 34, 16);
    this._bpPlat_0_0 = new Platform(1050, 280, 160, 30);

    const room0 = new Room(
      [
        new Wall(-100, 0, 120, 768),
        new Ground(0, 0, p.width, 80),
        new Ground(260, 210, 200, 40),
        new Ground(330, 310, 200, 40),
        new Ground(270, 110, 200, 40),
        new Platform(550, 310, 160, 30),
        new Spike(530, 260, 100, 20),
        new Wall(740, 60, 20, 400),
        new Box(830, 80, 40, 40),
        room0Portal_9,
        new NPCDemo2(370, 340, 40, 40, {
          getPlayer: () => this._player,
          eventBus: this.eventBus,
          npcId: "todo_npc_id",
          dialogueLines: ["todo_npc_line_1", "todo_npc_line_2"],
          exhaustedLine: "todo_npc_exhausted",
        }),
        new SignboardDemo2(
          620,
          80,
          100,
          65,
          () => this._player,
          this.eventBus,
          { textKey: "todo_signboard_text_key" },
        ),
        new CheckpointDemo2(340, 230, 40, 70, () => this._player),
        new TeleportPoint(450, 350, 40, 70, () => this._player),
        new TeleportPoint(40, 80, 40, 70, () => this._player),
        new TeleportPoint(90, 80, 40, 70, () => this._player),
        new TeleportPoint(170, 80, 40, 70, () => this._player),
        new TeleportPoint(540, 110, 40, 70, () => this._player),
        room0Enemy_18,
        this._bsBtn_0,
        this._bsSpike_0,
        this._wpBtn_0,
        this._wpPortal_0,
        this._bpBtn_0,
        this._bpPlat_0_0,
      ],
      { right: { targetRoomIndex: 1 } },
    );

    const room1 = new Room(
      [new Wall(1346, 0, 120, 768), new Ground(0, 0, p.width, 80)],
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
      const offsetX = roomIndex * 1366;
      for (const entity of this.rooms[roomIndex].entities) {
        entity.x += offsetX;
      }
    }
  }

  updatePhysics() {
    super.updatePhysics();
    this._bsSys_0?.update();
    this._wpSys_0?.update();
    this._bpSys_0?.update();
  }

  draw(p) {
    super.draw(p);
    this._bpSys_0?.draw?.(p);
  }
}
