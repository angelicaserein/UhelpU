import {
  Player,
  Replayer,
  Ground,
  Wall,
  Portal,
  Button,
  Platform,
  TextPrompt,
  Checkpoint,
} from "../game-entity-model/index.js";
import { CollisionSystem } from "../collision-system/CollisionSystem.js";
import { PhysicsSystem } from "../physics-system/PhysicsSystem.js";
import { RecordSystem } from "../record-system/RecordSystem.js";
import { BaseLevel } from "./BaseLevel.js";
import { Assets } from "../AssetsManager.js";
import { Room } from "./Room.js";
import { ButtonPlatformLinkSystem } from "../mechanism-system/ButtonPlatformLinkSystem.js";
import { AchievementToast } from "../achievement system/AchievementToast.js";
import { AchievementData } from "../achievement system/AchievementData.js";
import { WindowPrompt } from "../ui/windows/WindowPrompt.js";

export class Level5 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this._activeRoomIndex = 0;
    this._replayer = null;
    this._transition = null;
    this._transitionDurationMs = 260;

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

    this._achievementToast = new AchievementToast(p);
    this._jailHintWindow = new WindowPrompt(p, "level5_jail_hint_window", {
      width: 420,
      fontSize: 17,
    });

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

    // 按钮-消失平台联动系统（必须在 collisionSystem 之后创建）
    this._platformLinkSystem = new ButtonPlatformLinkSystem(
      [
        {
          button: this._room0Button,
          platforms: [
            { platform: this._room0DisappearPlatform, mode: "appear" },
            { platform: this._room0DisappearPlatform1b, mode: "appear" },
          ],
        },
        {
          button: this._room0Button2,
          platforms: [{ platform: this._room0DisappearPlatform2 }],
        },
        {
          button: this._room0Button3,
          platforms: [{ platform: this._room0DisappearPlatform3 }],
        },
        {
          button: this._room0Button4,
          platforms: [{ platform: this._room0DisappearPlatform4 }],
        },
        {
          button: this._room0Button5,
          platforms: [{ platform: this._room0DisappearPlatform5 }],
        },
      ],
      this.collisionSystem,
    );
  }

  _buildRooms(p) {
    const wallThickness = 20;

    // ---- Room 0 ----
    this._room0Button = new Button(450, 80, 20, 5, {
      // 参数：Button(x, y, w, h, options) — x=起始横坐标, y=起始纵坐标, w=宽度, h=高度
      color: { unpressed: [255, 60, 60], pressed: [180, 30, 30] },
    });
    this._room0DisappearPlatform = new Platform(350, 180, 110, 20); //每个平台的参数：Platform(x, y, w, h) — x=起始横坐标, y=起始纵坐标, w=宽度, h=高度
    this._room0DisappearPlatform1b = new Platform(460, 240, 110, 20); // 第一组第二个消失平台，在第一个上方
    // ▼ 贴地消失平台：Platform(x, y, w, h) — x=起始横坐标, y=80(地面高度), w=宽度, h=高度
    this._room0GroundPlatform = new Platform(250, 80, 100, 120);

    // 右侧第二组：正常平台 + 按钮 + 消失平台
    this._room0NormalPlatform2 = new Platform(570, 80, 200, 240);
    this._room0Button2 = new Button(700, 320, 20, 5, {
      color: { unpressed: [255, 60, 60], pressed: [180, 30, 30] },
    });
    // 第二个按钮左侧的存档点
    this._room0Checkpoint = new Checkpoint(
      1050,
      320,
      40,
      70,
      () => this._player,
    );
    this._room0DisappearPlatform2 = new Platform(770, 300, 120, 20);
    this._room0NormalPlatform3 = new Platform(950, 80, 900, 240); //参数：Platform(x, y, w, h) — x=起始横坐标, y=80(地面高度), w=宽度, h=高度

    // 第三组：按钮在第二和第三正常平台中间地面上，消失平台在第三正常平台右边
    this._room0Button3 = new Button(850, 80, 20, 5, {
      color: { unpressed: [255, 60, 60], pressed: [180, 30, 30] },
    });
    this._room0DisappearPlatform3 = new Platform(1300, 300, 20, 300);

    // 存档点与右侧平台中间的提示
    this._room0PauseHintPrompt = new TextPrompt(1000, 350, this, {
      textKey: "level5_pause_hint",
      textSize: 20,
    });

    // x=1450 处的存档点
    this._room0Checkpoint2 = new Checkpoint(
      1450,
      320,
      40,
      70,
      () => this._player,
    );

    // 第二存档点上方的提示
    this._room0RecordingPrompt = new TextPrompt(1450, 370, this, {
      textKey: "level5_recording_prompt",
      textSize: 20,
    });

    // 第四组：按钮 + 消失平台
    this._room0Button4 = new Button(1700, 320, 20, 5, {
      color: { unpressed: [255, 60, 60], pressed: [180, 30, 30] },
    });
    this._room0DisappearPlatform4 = new Platform(1850, 300, 150, 20);

    // 第五组：正常平台 + 3个跳台
    this._room0NormalPlatform6 = new Platform(1950, 300, 650, 20);
    this._room0NormalPlatform8 = new Platform(2050, 100, 80, 20);
    this._room0NormalPlatform9 = new Platform(2200, 140, 80, 20);
    this._room0NormalPlatform10 = new Platform(2350, 200, 160, 20);

    // 第六组：正常平台 + 按钮 + 消失平台
    this._room0NormalPlatform7 = new Platform(2580, 80, 20, 220);
    this._room0Button5 = new Button(2455, 220, 20, 5, {
      color: { unpressed: [255, 60, 60], pressed: [180, 30, 30] },
    });
    this._room0DisappearPlatform5 = new Platform(2580, 300, 20, 300);

    // 第三个按钮上方的提示 + 成就触发
    this._room0JailPrompt = new TextPrompt(720, 100, this, {
      textKey: "level5_jail_prompt",
      textSize: 20,
      onTrigger: () => {
        if (
          !AchievementData.isUnlocked("prisoner") &&
          !this._room0Checkpoint.activated
        ) {
          AchievementData.unlock("prisoner");
          this._achievementToast.show("achievement_unlocked");
          this._jailHintWindow.open();
        }
      },
    });

    const room0 = new Room(
      [
        new Wall(0, 0, wallThickness, p.height),
        new Ground(0, 0, p.width, 80),
        this._room0Button,
        this._room0DisappearPlatform,
        this._room0DisappearPlatform1b,
        this._room0GroundPlatform,
        this._room0NormalPlatform2,
        this._room0Button2,
        this._room0Checkpoint,
        this._room0PauseHintPrompt,
        this._room0DisappearPlatform2,
        this._room0NormalPlatform3,
        this._room0Button3,
        this._room0DisappearPlatform3,
        this._room0JailPrompt,
        this._room0Checkpoint2,
        this._room0RecordingPrompt,
        this._room0Button4,
        this._room0DisappearPlatform4,
        this._room0NormalPlatform6,
        this._room0NormalPlatform8,
        this._room0NormalPlatform9,
        this._room0NormalPlatform10,
        this._room0NormalPlatform7,
        this._room0Button5,
        this._room0DisappearPlatform5,
      ],
      {
        right: { targetRoomIndex: 1 },
      },
    );

    // ---- Room 1 ----
    const portal = new Portal(p.width - 100, 80, 50, 50);
    portal.openPortal();

    const room1 = new Room(
      [
        new Wall(p.width - wallThickness, 0, wallThickness, p.height),
        new Ground(0, 0, p.width, 80),
        portal,
      ],
      {
        left: { targetRoomIndex: 0 },
      },
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
    if (this._achievementToast) {
      this._achievementToast.remove();
      this._achievementToast = null;
    }
    if (this._jailHintWindow) {
      this._jailHintWindow.remove();
      this._jailHintWindow = null;
    }
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
    const bg = Assets.bgImageLevel5;
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
      if (entity.update && typeof entity.update === "function") {
        entity.update(this.p);
      }
    }
  }

  updateCollision(p = this.p, eventBus = this.eventBus) {
    this.collisionSystem.collisionEntry(eventBus);
    this._platformLinkSystem.update();

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
      if (
        entity.type !== "spike" &&
        entity.type !== "ground" &&
        !entity._hidden
      ) {
        entity.draw(p);
      }
    }

    this._platformLinkSystem.draw(p);

    p.pop();

    this.recordSystem.draw && this.recordSystem.draw(p);
  }
}
