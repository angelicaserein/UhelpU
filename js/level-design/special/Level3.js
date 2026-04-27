import {
  Player,
  Ground,
  Wall,
  Spike,
  Portal,
  Button,
  Platform,
  TextPrompt,
  CheckpointDemo2,
  Enemy,
  WireRenderer,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { Room } from "../Room.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";

export class Level3 extends BaseLevel {
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
    this._player = new Player(520, 370, 40, 40);
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
    const room0Enemy_7 = new Enemy(312, 320, 40, 40, { speed: 2 });
    room0Enemy_7._direction = 1;
    this._bsBtn_0 = new Button(450, 180, 34, 16);
    this._bsSpike_0 = new Spike(650, 180, 80, 16);
    this._wpBtn_0 = new Button(710, 110, 34, 16);
    this._wpPortal_0 = new Portal(910, 110, 50, 50);
    this._bpBtn_0 = new Button(360, 80, 34, 16);
    this._bpPlat_0_0 = new Platform(560, 80, 160, 30);

    const room0 = new Room(
      [
        new Wall(-100, 0, 120, 768),
        new Ground(0, 0, p.width, 80),
        new Ground(230, 280, 200, 40),
        new Ground(440, 140, 200, 40),
        new Spike(250, 90, 80, 16),
        new TextPrompt(460, 200, this, {
          textKey: "haha",
          width: 280,
          height: 72,
          textSize: 14,
          lineHeight: 18,
        }),
        new CheckpointDemo2(400, 90, 40, 70, () => this._player),
        room0Enemy_7,
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
