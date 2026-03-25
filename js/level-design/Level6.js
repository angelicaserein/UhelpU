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
  Spike,
} from "../game-entity-model/index.js";
import { CollisionSystem } from "../collision-system/CollisionSystem.js";
import { PhysicsSystem } from "../physics-system/PhysicsSystem.js";
import { RecordSystem } from "../record-system/RecordSystem.js";
import { BaseLevel } from "./BaseLevel.js";
import { Assets } from "../AssetsManager.js";
import { Room } from "./Room.js";
import { ButtonPlatformLinkSystem } from "../mechanism-system/ButtonPlatformLinkSystem.js";
import { t } from "../i18n.js";
import { Signboard } from "../game-entity-model/interactables/Signboard.js";
import { WindowPrompt } from "../ui/windows/WindowPrompt.js";

export class Level6 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this._activeRoomIndex = 0;
    this._replayer = null;
    this._transition = null;
    this._transitionDurationMs = 260;
    this._roomTitleOverlay = {
      active: false,
      startedAtMs: 0,
      totalDurationMs: 2500,
      fadeStartMs: 1300,
      titleKey: "",
    };

    this._jumpSignWindow = new WindowPrompt(p, "jump_sign_prompt", {
      imageUrl: "assets/images/tiles/Jump2.png",
      width: 580,
      padding: 24,
    });

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p);

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

    this._platformLinkSystem = new ButtonPlatformLinkSystem(
      [
        {
          button: this._room0Button4,
          platforms: [{ platform: this._room0DisappearPlatform4 }],
        },
        {
          button: this._room0Button5,
          platforms: [{ platform: this._room0DisappearPlatform5 }],
        },
        {
          button: this._room0Button6,
          platforms: [
            { platform: this._room0DisappearPlatform6, mode: "appear" },
          ],
        },
      ],
      this.collisionSystem,
    );
  }

  _buildRooms(p) {
    const wallThickness = 20;

    // 从 Level5 Room0 中 x > 1350 的实体，x 全部 -1320
    this._room0NormalPlatform3 = new Platform(-370, 80, 900, 240);

    this._room0Checkpoint2 = new Checkpoint(
      130,
      320,
      40,
      70,
      () => this._player,
    );
    this._room0RecordingPrompt = new TextPrompt(130, 370, this, {
      textKey: "level6_checkpoint_prompt",
      textSize: 20,
      width: 480,
      height: 150,
    });
    this._room0Button4 = new Button(380, 320, 20, 5, {
      color: { unpressed: [255, 60, 60], pressed: [180, 30, 30] },
    });
    this._room0DisappearPlatform4 = new Platform(530, 300, 150, 20);
    this._room0NormalPlatform6 = new Platform(630, 300, 650, 20);
    this._room0NormalPlatform8 = new Platform(730, 100, 80, 20);
    this._room0NormalPlatform9 = new Platform(880, 140, 80, 20);
    this._room0NormalPlatform10 = new Platform(1030, 200, 160, 20);
    this._room0NormalPlatform7 = new Platform(1260, 80, 20, 460);
    this._room0Checkpoint3 = new Checkpoint(
      680,
      560,
      40,
      70,
      () => this._player,
    );
    this._room0DisappearPlatform6 = new Platform(630, 540, 650, 20);
    this._room0Button6 = new Button(690, 320, 20, 5, {
      color: { unpressed: [255, 60, 60], pressed: [180, 30, 30] },
    });
    this._room0Button5 = new Button(1135, 220, 20, 5, {
      color: { unpressed: [255, 60, 60], pressed: [180, 30, 30] },
    });
    this._room0DisappearPlatform5 = new Platform(610, 300, 20, 300);

    const room0 = new Room(
      [
        new Wall(0, 0, wallThickness, p.height),
        new Ground(0, 0, p.width, 80),
        this._room0NormalPlatform3,
        this._room0Checkpoint2,
        this._room0RecordingPrompt,
        this._room0Button4,
        this._room0DisappearPlatform4,
        this._room0NormalPlatform6,
        this._room0NormalPlatform8,
        this._room0NormalPlatform9,
        this._room0NormalPlatform10,
        this._room0NormalPlatform7,
        this._room0Checkpoint3,
        this._room0DisappearPlatform6,
        this._room0Button6,
        this._room0Button5,
        this._room0DisappearPlatform5,
      ],
      { right: { targetRoomIndex: 1 } },
    );

    // 传送门铺满悬崖右边底部到右墙
    const portalSize = 50;
    const portalEntities = [];
    for (let px = 200; px + portalSize <= p.width - wallThickness; px += portalSize) {
      const pe = new Portal(px, 80, portalSize, portalSize);
      pe.openPortal();
      portalEntities.push(pe);
    }

    const room1 = new Room(
      [
        new Wall(p.width - wallThickness, 0, wallThickness, p.height),
        new Ground(0, 0, p.width, 80),
        new Spike(-100, 80, p.width - wallThickness, 20),
        // 左侧悬崖
        new Platform(0, 80, 200, 460),
        // 桥（从悬崖右边延伸，与悬崖同高）
        new Platform(200, 520, 200, 20),
        // Jump signboard 放在桥上
        new Signboard(220, 540, 65, 65, () => this._player, this.eventBus, { imageKey: "tileImage_Jump", onInteract: () => this._jumpSignWindow.open() }),
        ...portalEntities,
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
    if (roomIndex === 1) {
      this._roomTitleOverlay.active = true;
      this._roomTitleOverlay.startedAtMs = this.p?.millis
        ? this.p.millis()
        : performance.now();
      this._roomTitleOverlay.titleKey = "level6_room2_title";
    }
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
    if (this._jumpSignWindow) {
      this._jumpSignWindow.remove();
      this._jumpSignWindow = null;
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
    const bg = Assets.bgImageLevel6;
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

  _drawRoomTitleOverlay(p) {
    const overlay = this._roomTitleOverlay;
    if (!overlay.active || !overlay.titleKey) return;

    const nowMs = p?.millis ? p.millis() : performance.now();
    const elapsed = nowMs - overlay.startedAtMs;
    if (elapsed >= overlay.totalDurationMs) {
      overlay.active = false;
      return;
    }

    let alphaRate = 1;
    if (elapsed > overlay.fadeStartMs) {
      const fadeDuration = Math.max(1, overlay.totalDurationMs - overlay.fadeStartMs);
      alphaRate = 1 - (elapsed - overlay.fadeStartMs) / fadeDuration;
    }
    alphaRate = Math.max(0, Math.min(1, alphaRate));

    const centerY = p.height * 0.28;
    const bandH = Math.max(46, p.height * 0.072);
    const coreBandW = p.width * 0.54;
    const sideFadeOuterW = p.width * 0.3;
    const sideFadeInnerExtendW = p.width * 0.08;
    const sideFadeW = sideFadeOuterW + sideFadeInnerExtendW;
    const bandY = centerY - bandH * 0.5;
    const coreBandX = (p.width - coreBandW) * 0.5;
    const leftOuterX = coreBandX - sideFadeOuterW;
    const rightOuterX = coreBandX + coreBandW + sideFadeOuterW - 1;

    p.push();
    p.resetMatrix();
    p.noStroke();

    for (let i = 0; i < sideFadeW; i++) {
      const t_ = i / Math.max(1, sideFadeW - 1);
      const a = (1 - t_) * 108 * alphaRate;
      p.fill(255, 255, 255, a);
      p.rect(leftOuterX + i, bandY, 1, bandH, 0);
      p.rect(rightOuterX - i, bandY, 1, bandH, 0);
    }

    p.fill(255, 255, 255, 248 * alphaRate);
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);
    p.textStyle(p.BOLD);
    p.textSize(Math.max(26, Math.floor(p.width * 0.03)));
    p.text(t(overlay.titleKey), p.width * 0.5, centerY);
    p.pop();
  }

  _drawSea(p) {
    const seaLeft = p.width + 200;   // room1 起始 + 悬崖宽度
    const seaRight = p.width * 2 - 20; // room1 右墙
    const seaBottom = 80;
    const seaTop = 320;              // 海面高度
    const t = p.millis() * 0.001;

    p.noStroke();

    // 海洋主体
    p.fill(30, 110, 200, 220);
    p.rect(seaLeft, seaBottom, seaRight - seaLeft, seaTop - seaBottom);

    // 波浪层 1（浅蓝，较高）
    const steps = 80;
    const w = seaRight - seaLeft;
    p.fill(60, 160, 230, 200);
    p.beginShape();
    p.vertex(seaLeft, seaBottom);
    for (let i = 0; i <= steps; i++) {
      const wx = seaLeft + (i / steps) * w;
      const wy = seaTop
        + Math.sin(i * 0.3 + t * 2) * 10
        + Math.sin(i * 0.7 - t * 1.5) * 5;
      p.vertex(wx, wy);
    }
    p.vertex(seaRight, seaBottom);
    p.endShape(p.CLOSE);

    // 波浪层 2（深蓝，低20像素，增加层次感）
    const seaTop2 = seaTop - 20;
    p.fill(20, 70, 160, 210);
    p.beginShape();
    p.vertex(seaLeft, seaBottom);
    for (let i = 0; i <= steps; i++) {
      const wx = seaLeft + (i / steps) * w;
      const wy = seaTop2
        + Math.sin(i * 0.4 - t * 1.8) * 8
        + Math.sin(i * 0.9 + t * 1.2) * 4;
      p.vertex(wx, wy);
    }
    p.vertex(seaRight, seaBottom);
    p.endShape(p.CLOSE);
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
    this._drawSea(p);
    p.pop();
    this._drawRoomTitleOverlay(p);
    this.recordSystem.draw && this.recordSystem.draw(p);
  }
}
