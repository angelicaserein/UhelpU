/**
 * EditorUI — Editor bottom toolbar UI
 * EditorUI — 编辑器底部工具栏 UI
 *
 * Responsible for:
 * 负责:
 *   - Draw bottom toolbar (Ground / Portal buttons, current status hint, save button)
 *   - 绘制底部工具栏 (地面 / 传送门按钮, 当前状态提示, 保存按钮)
 *   - Ground width/height sliders
 *   - 地面宽度/高度滑块
 *   - Handle mouse clicks in toolbar area
 *   - 处理工具栏区域中的鼠标点击
 *
 * All drawing and coordinates executed in **screen space** (p5 original coordinates, not flipped).
 * 所有绘图和坐标在**屏幕空间**中执行 (p5 原始坐标, 未翻转)。
 */

import {
  EntityTool,
  TOOLBAR_HEIGHT,
  CAMERA_MOVE_SPEED,
} from "./EditorConfig.js";

// ── Internal layout constants ──────────────────────────────────────────────
// 内部布局常量
// ── First row button size | 第一行按钮大小
// ── Second row button size slightly smaller | 第二行按钮大小略小
const BTN_W = 110;
const BTN_H = 36;
const BTN_W2 = 100;
const BTN_H2 = 30;
const BTN_GAP = 14;
const BTN_GAP2 = 10;
const BTN_Y_OFFSET = 4; // First row button distance from toolbar top | 第一行按钮到工具栏顶部的距离

const SAVE_BTN_W = 90;
const SAVE_BTN_H = 36;

const CAM_BTN_W = 44;
const CAM_BTN_H = 44;

export class EditorUI {
  /**
   * @param {number} canvasWidth | 画布宽度
   * @param {number} canvasHeight | 画布高度
   */
  constructor(canvasWidth, canvasHeight) {
    this._cw = canvasWidth;
    this._ch = canvasHeight;

    /** 当前选中的工具 | Current selected tool */
    this.activeTool = EntityTool.GROUND;

    /** 保存按钮点击回调（由 MapEditor 注入）| Save button click callback (injected by MapEditor) */
    this.onSave = null;

    /** toast 提示 | Toast message */
    this._toast = null; // { text, endTime } | {文本, 结束时间}

    /** Camera direction button press state | 摄像机方向按钮按住状态 */
    this._camLeftPressed = false;
    this._camRightPressed = false;

    /** BtnPlatform platform count (1~8) | BtnPlatform 平台数量（1~8） */
    this.btnPlatformCount = 1;

    /** Current selected BtnPlatform composite entity mode list | 当前选中的 BtnPlatform 复合实体模式列表 */
    this.btnPlatformModes = null;
    this._btnPlatformModeButtons = [];
    this._btnPlatformModePanel = null;
    this.onToggleBtnPlatformMode = null;

    // ── Pre-calculate button rectangles ──────────────────────────────────
    const toolbarTop = this._ch - TOOLBAR_HEIGHT;
    const startX = 20;

    this._btnGround = {
      x: startX,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnPortal = {
      x: startX + BTN_W + BTN_GAP,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnPlatform = {
      x: startX + (BTN_W + BTN_GAP) * 2,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnSpike = {
      x: startX + (BTN_W + BTN_GAP) * 3,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnWall = {
      x: startX + (BTN_W + BTN_GAP) * 4,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnWirePortal = {
      x: startX + (BTN_W + BTN_GAP) * 5,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnBtnSpike = {
      x: startX + (BTN_W + BTN_GAP) * 6,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnBtnPlatform = {
      x: startX + (BTN_W + BTN_GAP) * 7,
      y: toolbarTop + BTN_Y_OFFSET,
      w: BTN_W,
      h: BTN_H,
    };
    this._btnBox = {
      x: startX + (BTN_W2 + BTN_GAP2) * 7,
      y: toolbarTop + BTN_Y_OFFSET + BTN_H + 4,
      w: BTN_W2,
      h: BTN_H2,
    };

    // Second row buttons
    const row2Top = toolbarTop + BTN_Y_OFFSET + BTN_H + 4;
    this._btnNpc = {
      x: startX,
      y: row2Top,
      w: BTN_W2,
      h: BTN_H2,
    };
    this._btnSignboard = {
      x: startX + BTN_W2 + BTN_GAP2,
      y: row2Top,
      w: BTN_W2,
      h: BTN_H2,
    };
    this._btnCheckpoint = {
      x: startX + (BTN_W2 + BTN_GAP2) * 2,
      y: row2Top,
      w: BTN_W2,
      h: BTN_H2,
    };
    this._btnEnemy = {
      x: startX + (BTN_W2 + BTN_GAP2) * 3,
      y: row2Top,
      w: BTN_W2,
      h: BTN_H2,
    };
    this._btnTextPrompt = {
      x: startX + (BTN_W2 + BTN_GAP2) * 4,
      y: row2Top,
      w: BTN_W2,
      h: BTN_H2,
    };
    this._btnSpawn = {
      x: startX + (BTN_W2 + BTN_GAP2) * 5,
      y: row2Top,
      w: BTN_W2,
      h: BTN_H2,
    };
    this._btnTeleportPoint = {
      x: startX + (BTN_W2 + BTN_GAP2) * 6,
      y: row2Top,
      w: BTN_W2,
      h: BTN_H2,
    };

    // BtnPlatform platform count +/- buttons (second row, right of Spawn button)
    const PLAT_COUNT_BTN_W = 28;
    const platCountStartX = this._btnSpawn.x + BTN_W2 + BTN_GAP2 + 10;
    this._btnPlatCountMinus = {
      x: platCountStartX,
      y: row2Top,
      w: PLAT_COUNT_BTN_W,
      h: BTN_H2,
    };
    this._btnPlatCountPlus = {
      x: platCountStartX + PLAT_COUNT_BTN_W + 4 + 30 + 4,
      y: row2Top,
      w: PLAT_COUNT_BTN_W,
      h: BTN_H2,
    };
    this._platCountLabelX = platCountStartX + PLAT_COUNT_BTN_W + 4 + 15;
    this._platCountLabelY = row2Top + BTN_H2 / 2;

    // Save button — right side
    this._btnSave = {
      x: this._cw - SAVE_BTN_W - 20,
      y: toolbarTop + BTN_Y_OFFSET,
      w: SAVE_BTN_W,
      h: BTN_H,
    };

    // Upload button — left of save button
    this._btnUpload = {
      x: this._btnSave.x - SAVE_BTN_W - BTN_GAP,
      y: toolbarTop + BTN_Y_OFFSET,
      w: SAVE_BTN_W,
      h: BTN_H,
    };

    // Camera left/right movement buttons — both sides of screen vertically centered (in toolbar upper area)
    const camBtnY = (this._ch - TOOLBAR_HEIGHT) / 2 - CAM_BTN_H / 2;
    this._btnCamLeft = {
      x: 6,
      y: camBtnY,
      w: CAM_BTN_W,
      h: CAM_BTN_H,
    };
    this._btnCamRight = {
      x: this._cw - CAM_BTN_W - 6,
      y: camBtnY,
      w: CAM_BTN_W,
      h: CAM_BTN_H,
    };

    // Room management buttons — left of upload button (整体左移一格)
    const ROOM_BTN_W = 80;
    this._btnDelRoom = {
      x: this._btnUpload.x - ROOM_BTN_W - BTN_GAP,
      y: toolbarTop + BTN_Y_OFFSET,
      w: ROOM_BTN_W,
      h: BTN_H,
    };
    this._btnAddRoom = {
      x: this._btnDelRoom.x - ROOM_BTN_W - BTN_GAP,
      y: toolbarTop + BTN_Y_OFFSET,
      w: ROOM_BTN_W,
      h: BTN_H,
    };

    /** Save and upload callbacks (injected by MapEditor) */
    this.onSave = null;
    this.onUpload = null;

    /** Room management callbacks (injected by MapEditor) */
    this.onAddRoom = null;
    this.onDelRoom = null;

    /** Current room count (used for display, set by MapEditor) */
    this.roomCount = 2;

    this._rebuildBtnPlatformModeButtons();
  }

  // ══════════════════════════════════════════════════════════════
  // Draw | 绘制
  // ══════════════════════════════════════════════════════════════

  draw(p) {
    p.push();
    p.resetMatrix(); // Back to screen space

    const toolbarTop = this._ch - TOOLBAR_HEIGHT;

    // Toolbar background
    p.fill(30, 30, 35, 220);
    p.noStroke();
    p.rect(0, toolbarTop, this._cw, TOOLBAR_HEIGHT);
    p.stroke(80);
    p.strokeWeight(1);
    p.line(0, toolbarTop, this._cw, toolbarTop);

    // Ground button
    this._drawButton(
      p,
      this._btnGround,
      "Ground",
      this.activeTool === EntityTool.GROUND,
    );
    // Portal button
    this._drawButton(
      p,
      this._btnPortal,
      "Portal",
      this.activeTool === EntityTool.PORTAL,
    );
    // Platform button
    this._drawButton(
      p,
      this._btnPlatform,
      "Platform",
      this.activeTool === EntityTool.PLATFORM,
    );
    // Spike button
    this._drawButton(
      p,
      this._btnSpike,
      "Spike",
      this.activeTool === EntityTool.SPIKE,
      [180, 60, 60],
    );
    // Wall button
    this._drawButton(
      p,
      this._btnWall,
      "Wall",
      this.activeTool === EntityTool.WALL,
      [100, 100, 120],
    );
    // WirePortal button
    this._drawButton(
      p,
      this._btnWirePortal,
      "WirePortal",
      this.activeTool === EntityTool.WIRE_PORTAL,
      [180, 100, 240],
    );
    // BtnSpike button
    this._drawButton(
      p,
      this._btnBtnSpike,
      "BtnSpike",
      this.activeTool === EntityTool.BTN_SPIKE,
      [240, 160, 30],
    );
    // BtnPlatform button
    this._drawButton(
      p,
      this._btnBtnPlatform,
      "BtnPlat",
      this.activeTool === EntityTool.BTN_PLATFORM,
      [60, 180, 140],
    );
    // Box button
    this._drawButton(
      p,
      this._btnBox,
      "Box",
      this.activeTool === EntityTool.BOX,
      [200, 140, 100],
    );
    // NPC button
    this._drawButton(
      p,
      this._btnNpc,
      "NPC",
      this.activeTool === EntityTool.NPC,
      [60, 200, 220],
    );
    // Signboard button
    this._drawButton(
      p,
      this._btnSignboard,
      "Signboard",
      this.activeTool === EntityTool.SIGNBOARD,
      [200, 160, 80],
    );
    // Checkpoint button
    this._drawButton(
      p,
      this._btnCheckpoint,
      "Checkpoint",
      this.activeTool === EntityTool.CHECKPOINT,
      [200, 80, 180],
    );
    // Enemy button
    this._drawButton(
      p,
      this._btnEnemy,
      "Enemy",
      this.activeTool === EntityTool.ENEMY,
      [100, 200, 100],
    );
    // TextPrompt button
    this._drawButton(
      p,
      this._btnTextPrompt,
      "TxtPrompt",
      this.activeTool === EntityTool.TEXT_PROMPT,
      [100, 220, 200],
    );
    // Spawn button
    this._drawButton(
      p,
      this._btnSpawn,
      "⌖ Spawn",
      this.activeTool === EntityTool.SPAWN,
      [255, 180, 0],
    );
    // TeleportPoint button
    this._drawButton(
      p,
      this._btnTeleportPoint,
      "TelePort",
      this.activeTool === EntityTool.TELEPORT_POINT,
      [100, 180, 255],
    );

    // BtnPlatform platform count control (only show when BtnPlatform tool is active)
    if (this.activeTool === EntityTool.BTN_PLATFORM) {
      // Title
      p.fill(180, 220, 255);
      p.noStroke();
      p.textSize(11);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(
        "Platform Count",
        this._platCountLabelX,
        this._btnPlatCountMinus.y - 2,
      );

      // - button
      this._drawButton(p, this._btnPlatCountMinus, "−", false, [180, 80, 80]);
      // Count display
      p.fill(255);
      p.noStroke();
      p.textSize(15);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(
        this.btnPlatformCount,
        this._platCountLabelX,
        this._platCountLabelY,
      );
      // + button
      this._drawButton(p, this._btnPlatCountPlus, "+", false, [80, 180, 80]);
    }

    if (this.btnPlatformModes && this.btnPlatformModes.length > 0) {
      this._drawBtnPlatformModePanel(p);
    }

    // Status hint
    const statusX = this._btnSpawn.x + BTN_W2 + 20;
    const statusY = toolbarTop + TOOLBAR_HEIGHT / 2 + 8;
    p.fill(200);
    p.noStroke();
    p.textSize(13);
    p.textAlign(p.LEFT, p.CENTER);
    const toolLabel =
      this.activeTool === EntityTool.GROUND
        ? "Ground (Ground)"
        : this.activeTool === EntityTool.PLATFORM
          ? "Platform (Platform)"
          : this.activeTool === EntityTool.SPIKE
            ? "Spike (Spike)"
            : this.activeTool === EntityTool.WALL
              ? "Wall (Wall)"
              : this.activeTool === EntityTool.WIRE_PORTAL
                ? "Button Portal (WirePortal)"
                : this.activeTool === EntityTool.BTN_SPIKE
                  ? "Button Spike (BtnSpike)"
                  : this.activeTool === EntityTool.BTN_PLATFORM
                    ? `Button Disappearing Platform ×${this.btnPlatformCount} (BtnPlatform)`
                    : this.activeTool === EntityTool.NPC
                      ? "NPC"
                      : this.activeTool === EntityTool.SIGNBOARD
                        ? "Signboard (Signboard)"
                        : this.activeTool === EntityTool.TEXT_PROMPT
                          ? "Text Prompt (TextPrompt)"
                          : this.activeTool === EntityTool.CHECKPOINT
                            ? "Checkpoint (Checkpoint)"
                            : this.activeTool === EntityTool.ENEMY
                              ? "Enemy (Enemy)"
                              : this.activeTool === EntityTool.SPAWN
                                ? "Spawn Point (Spawn)"
                                : this.activeTool === EntityTool.TELEPORT_POINT
                                  ? "Teleport Point (TeleportPoint)"
                                  : "Portal (Portal)";
    p.text(`Placing: ${toolLabel}`, statusX, statusY);

    if (this.activeTool === EntityTool.ENEMY) {
      p.fill(170, 220, 170);
      p.textSize(12);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(
        "Tip: After placing, select enemy and press F to flip direction",
        statusX,
        statusY + 18,
      );
    }

    // Save button
    this._drawButton(p, this._btnSave, "💾 Save", false, [60, 180, 100]);

    // Upload button
    this._drawButton(p, this._btnUpload, "☁ Upload", false, [60, 120, 220]);

    // Room management buttons
    this._drawButton(p, this._btnAddRoom, "+ Room", false, [60, 140, 180]);
    this._drawButton(p, this._btnDelRoom, "- Room", false, [180, 100, 60]);

    // Room count label
    p.fill(180, 220, 255);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(
      `Rooms: ${this.roomCount}`,
      (this._btnAddRoom.x + this._btnDelRoom.x + this._btnDelRoom.w) / 2,
      this._btnAddRoom.y - 2,
    );

    // Camera left/right movement buttons
    this._drawCamButton(p, this._btnCamLeft, "◀", this._camLeftPressed);
    this._drawCamButton(p, this._btnCamRight, "▶", this._camRightPressed);

    // toast
    if (this._toast && Date.now() < this._toast.endTime) {
      this._drawToast(p, this._toast.text);
    } else {
      this._toast = null;
    }

    p.pop();
  }

  _drawButton(p, rect, label, active, baseColor) {
    const hover = this._insideRect(p.mouseX, p.mouseY, rect);
    if (active) {
      p.fill(70, 140, 220);
    } else if (baseColor) {
      p.fill(
        hover ? baseColor[0] + 30 : baseColor[0],
        hover ? baseColor[1] + 30 : baseColor[1],
        hover ? baseColor[2] + 30 : baseColor[2],
      );
    } else {
      p.fill(hover ? 75 : 55, hover ? 75 : 55, hover ? 80 : 60);
    }
    p.stroke(100);
    p.strokeWeight(1);
    p.rect(rect.x, rect.y, rect.w, rect.h, 6);
    p.fill(240);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  /** Draw camera direction button */
  _drawCamButton(p, rect, label, pressed) {
    const hover = this._insideRect(p.mouseX, p.mouseY, rect);
    if (pressed) {
      p.fill(70, 140, 220, 200);
    } else {
      p.fill(hover ? 80 : 45, hover ? 80 : 45, hover ? 85 : 50, 180);
    }
    p.stroke(120, 120, 130);
    p.strokeWeight(1);
    p.rect(rect.x, rect.y, rect.w, rect.h, 8);
    p.fill(240);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }

  _drawToast(p, text) {
    const tw = p.textWidth(text) + 40;
    const th = 34;
    const tx = (this._cw - tw) / 2;
    const ty = this._ch - TOOLBAR_HEIGHT - 50;
    p.fill(40, 40, 45, 230);
    p.stroke(80, 180, 120);
    p.strokeWeight(1);
    p.rect(tx, ty, tw, th, 8);
    p.fill(120, 230, 150);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(text, tx + tw / 2, ty + th / 2);
  }

  // ══════════════════════════════════════════════════════════════
  // Interaction | 交互
  // ══════════════════════════════════════════════════════════════

  /** Mouse press event (screen coordinates). Returns true means event consumed by toolbar. | 鼠标按下事件 (屏幕坐标)。返回 true 表示工具栏使用了事件。 */
  handleMousePressed(mx, my) {
    if (this._btnPlatformModePanel) {
      for (const btn of this._btnPlatformModeButtons) {
        if (this._insideRect(mx, my, btn.rect)) {
          if (this.onToggleBtnPlatformMode) {
            this.onToggleBtnPlatformMode(btn.platformIdx);
          }
          return true;
        }
      }
      if (this._insideRect(mx, my, this._btnPlatformModePanel)) {
        return true;
      }
    }

    // Camera left move button
    if (this._insideRect(mx, my, this._btnCamLeft)) {
      this._camLeftPressed = true;
      return true;
    }
    // Camera right move button
    if (this._insideRect(mx, my, this._btnCamRight)) {
      this._camRightPressed = true;
      return true;
    }
    // Ground button
    if (this._insideRect(mx, my, this._btnGround)) {
      this.activeTool = EntityTool.GROUND;
      return true;
    }
    // Portal button
    if (this._insideRect(mx, my, this._btnPortal)) {
      this.activeTool = EntityTool.PORTAL;
      return true;
    }
    // Platform button
    if (this._insideRect(mx, my, this._btnPlatform)) {
      this.activeTool = EntityTool.PLATFORM;
      return true;
    }
    // Spike button
    if (this._insideRect(mx, my, this._btnSpike)) {
      this.activeTool = EntityTool.SPIKE;
      return true;
    }
    // Wall button
    if (this._insideRect(mx, my, this._btnWall)) {
      this.activeTool = EntityTool.WALL;
      return true;
    }
    // WirePortal button
    if (this._insideRect(mx, my, this._btnWirePortal)) {
      this.activeTool = EntityTool.WIRE_PORTAL;
      return true;
    }
    // BtnSpike button
    if (this._insideRect(mx, my, this._btnBtnSpike)) {
      this.activeTool = EntityTool.BTN_SPIKE;
      return true;
    }
    // BtnPlatform button
    if (this._insideRect(mx, my, this._btnBtnPlatform)) {
      this.activeTool = EntityTool.BTN_PLATFORM;
      return true;
    }
    // Box button
    if (this._insideRect(mx, my, this._btnBox)) {
      this.activeTool = EntityTool.BOX;
      return true;
    }
    // BtnPlatform platform count +/- buttons
    if (
      this.activeTool === EntityTool.BTN_PLATFORM &&
      this._insideRect(mx, my, this._btnPlatCountMinus)
    ) {
      if (this.btnPlatformCount > 1) this.btnPlatformCount--;
      return true;
    }
    if (
      this.activeTool === EntityTool.BTN_PLATFORM &&
      this._insideRect(mx, my, this._btnPlatCountPlus)
    ) {
      if (this.btnPlatformCount < 8) this.btnPlatformCount++;
      return true;
    }
    // NPC button
    if (this._insideRect(mx, my, this._btnNpc)) {
      this.activeTool = EntityTool.NPC;
      return true;
    }
    // Signboard button
    if (this._insideRect(mx, my, this._btnSignboard)) {
      this.activeTool = EntityTool.SIGNBOARD;
      return true;
    }
    // Checkpoint button
    if (this._insideRect(mx, my, this._btnCheckpoint)) {
      this.activeTool = EntityTool.CHECKPOINT;
      return true;
    }
    // Enemy button
    if (this._insideRect(mx, my, this._btnEnemy)) {
      this.activeTool = EntityTool.ENEMY;
      return true;
    }
    // TextPrompt button
    if (this._insideRect(mx, my, this._btnTextPrompt)) {
      this.activeTool = EntityTool.TEXT_PROMPT;
      return true;
    }
    // Spawn button
    if (this._insideRect(mx, my, this._btnSpawn)) {
      this.activeTool = EntityTool.SPAWN;
      return true;
    }
    // TeleportPoint button
    if (this._insideRect(mx, my, this._btnTeleportPoint)) {
      this.activeTool = EntityTool.TELEPORT_POINT;
      return true;
    }
    // Add room button
    if (this._insideRect(mx, my, this._btnAddRoom)) {
      if (this.onAddRoom) this.onAddRoom();
      return true;
    }
    // Delete room button
    if (this._insideRect(mx, my, this._btnDelRoom)) {
      if (this.onDelRoom) this.onDelRoom();
      return true;
    }
    // Save button
    if (this._insideRect(mx, my, this._btnSave)) {
      if (this.onSave) this.onSave();
      return true;
    }
    // Upload button
    if (this._insideRect(mx, my, this._btnUpload)) {
      if (this.onUpload) this.onUpload();
      return true;
    }
    // Click in toolbar area → consume event but no action
    if (my >= this._ch - TOOLBAR_HEIGHT) return true;
    return false;
  }

  /** Mouse drag (screen coordinates) */
  handleMouseDragged(_mx, _my) {
    return false;
  }

  /** Mouse release */
  handleMouseReleased() {
    this._camLeftPressed = false;
    this._camRightPressed = false;
  }

  /**
   * Get current camera move direction (called each frame)
   * @returns {number} -1 move left, +1 move right, 0 none
   */
  getCameraMoveDirection() {
    if (this._camLeftPressed) return -1;
    if (this._camRightPressed) return 1;
    return 0;
  }

  /** Show toast hint */
  showToast(text, durationMs = 2000) {
    this._toast = { text, endTime: Date.now() + durationMs };
  }

  /** Whether mouse is inside toolbar area */
  isInsideToolbar(mx, my) {
    return my >= this._ch - TOOLBAR_HEIGHT;
  }

  // ── Internal utility methods ──────────────────────────────────

  _insideRect(mx, my, rect) {
    return (
      mx >= rect.x &&
      mx <= rect.x + rect.w &&
      my >= rect.y &&
      my <= rect.y + rect.h
    );
  }

  isInsideBtnPlatformInspector(mx, my) {
    return !!(
      this._btnPlatformModePanel &&
      this._insideRect(mx, my, this._btnPlatformModePanel)
    );
  }

  setBtnPlatformInspector(record) {
    if (record && record.tool === EntityTool.BTN_PLATFORM) {
      this.btnPlatformModes = (record.platformLinks || []).map(
        (link) => link.mode || "disappear",
      );
    } else {
      this.btnPlatformModes = null;
    }
    this._rebuildBtnPlatformModeButtons();
  }

  _rebuildBtnPlatformModeButtons() {
    this._btnPlatformModeButtons = [];
    this._btnPlatformModePanel = null;
    if (!this.btnPlatformModes || this.btnPlatformModes.length === 0) return;

    const columns = 4;
    const btnW = 120;
    const btnH = 26;
    const gap = 8;
    const padding = 12;
    const rows = Math.ceil(this.btnPlatformModes.length / columns);
    const panelW =
      Math.min(this.btnPlatformModes.length, columns) * btnW +
      Math.max(0, Math.min(this.btnPlatformModes.length, columns) - 1) * gap +
      padding * 2;
    const panelH = rows * btnH + Math.max(0, rows - 1) * gap + 34 + padding * 2;
    const panelX = 20;
    const panelY = this._ch - TOOLBAR_HEIGHT - panelH - 12;

    this._btnPlatformModePanel = {
      x: panelX,
      y: panelY,
      w: panelW,
      h: panelH,
    };

    this.btnPlatformModes.forEach((mode, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      this._btnPlatformModeButtons.push({
        platformIdx: index,
        mode,
        rect: {
          x: panelX + padding + col * (btnW + gap),
          y: panelY + padding + 28 + row * (btnH + gap),
          w: btnW,
          h: btnH,
        },
      });
    });
  }

  _drawBtnPlatformModePanel(p) {
    p.fill(24, 28, 34, 230);
    p.stroke(70, 110, 130, 220);
    p.strokeWeight(1);
    p.rect(
      this._btnPlatformModePanel.x,
      this._btnPlatformModePanel.y,
      this._btnPlatformModePanel.w,
      this._btnPlatformModePanel.h,
      10,
    );

    p.fill(190, 225, 255);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      "BtnPlatform Mode",
      this._btnPlatformModePanel.x + 12,
      this._btnPlatformModePanel.y + 10,
    );

    for (const btn of this._btnPlatformModeButtons) {
      const active = btn.mode === "appear";
      this._drawButton(
        p,
        btn.rect,
        `P${btn.platformIdx + 1}: ${btn.mode}`,
        false,
        active ? [110, 95, 210] : [60, 180, 140],
      );
    }
  }
}
