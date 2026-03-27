/**
 * EditorUI — 编辑器底部工具栏 UI
 *
 * 负责：
 *   - 绘制底部工具栏（Ground / Portal 按钮、当前状态提示、保存按钮）
 *   - Ground 宽度/高度滑块
 *   - 处理工具栏区域的鼠标点击
 *
 * 所有绘制和坐标均在 **屏幕空间**（p5 原始坐标，未翻转）执行。
 */

import {
  EntityTool,
  TOOLBAR_HEIGHT,
  CAMERA_MOVE_SPEED,
} from "./EditorConfig.js";

// ── 内部布局常量 ──────────────────────────────────────────────
// ── 第一行按钮尺寸
// ── 第二行按钮尺寸稍小
const BTN_W = 110;
const BTN_H = 36;
const BTN_W2 = 100;
const BTN_H2 = 30;
const BTN_GAP = 14;
const BTN_GAP2 = 10;
const BTN_Y_OFFSET = 4; // 第一行按钮距工具栏顶部

const SAVE_BTN_W = 90;
const SAVE_BTN_H = 36;

const CAM_BTN_W = 44;
const CAM_BTN_H = 44;

export class EditorUI {
  /**
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  constructor(canvasWidth, canvasHeight) {
    this._cw = canvasWidth;
    this._ch = canvasHeight;

    /** 当前选中的工具 */
    this.activeTool = EntityTool.GROUND;

    /** 保存按钮点击回调（由 MapEditor 注入） */
    this.onSave = null;

    /** toast 提示 */
    this._toast = null; // { text, endTime }

    /** 摄像机方向按钮按住状态 */
    this._camLeftPressed = false;
    this._camRightPressed = false;

    /** BtnPlatform 平台数量（1~8） */
    this.btnPlatformCount = 1;

    // ── 预计算按钮矩形 ──────────────────────────────────────
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

    // 第二行按钮
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
    this._btnSpawn = {
      x: startX + (BTN_W2 + BTN_GAP2) * 3,
      y: row2Top,
      w: BTN_W2,
      h: BTN_H2,
    };

    // BtnPlatform 平台数量 +/- 按钮（第二行，Spawn 按钮右侧）
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

    // 保存按钮 — 右侧
    this._btnSave = {
      x: this._cw - SAVE_BTN_W - 20,
      y: toolbarTop + BTN_Y_OFFSET,
      w: SAVE_BTN_W,
      h: BTN_H,
    };

    // 摄像机左/右移动按钮 — 屏幕左右两侧垂直居中（在工具栏上方区域）
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

    // 房间管理按钮 — 保存按钮左侧
    const ROOM_BTN_W = 80;
    this._btnDelRoom = {
      x: this._btnSave.x - ROOM_BTN_W - BTN_GAP,
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

    /** 房间管理回调（由 MapEditor 注入） */
    this.onAddRoom = null;
    this.onDelRoom = null;

    /** 当前房间数量（用于显示，由 MapEditor 设置） */
    this.roomCount = 2;
  }

  // ══════════════════════════════════════════════════════════════
  // 绘制
  // ══════════════════════════════════════════════════════════════

  draw(p) {
    p.push();
    p.resetMatrix(); // 回到屏幕空间

    const toolbarTop = this._ch - TOOLBAR_HEIGHT;

    // 工具栏背景
    p.fill(30, 30, 35, 220);
    p.noStroke();
    p.rect(0, toolbarTop, this._cw, TOOLBAR_HEIGHT);
    p.stroke(80);
    p.strokeWeight(1);
    p.line(0, toolbarTop, this._cw, toolbarTop);

    // Ground 按钮
    this._drawButton(
      p,
      this._btnGround,
      "Ground",
      this.activeTool === EntityTool.GROUND,
    );
    // Portal 按钮
    this._drawButton(
      p,
      this._btnPortal,
      "Portal",
      this.activeTool === EntityTool.PORTAL,
    );
    // Platform 按钮
    this._drawButton(
      p,
      this._btnPlatform,
      "Platform",
      this.activeTool === EntityTool.PLATFORM,
    );
    // Spike 按钮
    this._drawButton(
      p,
      this._btnSpike,
      "Spike",
      this.activeTool === EntityTool.SPIKE,
      [180, 60, 60],
    );
    // Wall 按钮
    this._drawButton(
      p,
      this._btnWall,
      "Wall",
      this.activeTool === EntityTool.WALL,
      [100, 100, 120],
    );
    // WirePortal 按钮
    this._drawButton(
      p,
      this._btnWirePortal,
      "WirePortal",
      this.activeTool === EntityTool.WIRE_PORTAL,
      [180, 100, 240],
    );
    // BtnSpike 按钮
    this._drawButton(
      p,
      this._btnBtnSpike,
      "BtnSpike",
      this.activeTool === EntityTool.BTN_SPIKE,
      [240, 160, 30],
    );
    // BtnPlatform 按钮
    this._drawButton(
      p,
      this._btnBtnPlatform,
      "BtnPlat",
      this.activeTool === EntityTool.BTN_PLATFORM,
      [60, 180, 140],
    );
    // NPC 按钮
    this._drawButton(
      p,
      this._btnNpc,
      "NPC",
      this.activeTool === EntityTool.NPC,
      [60, 200, 220],
    );
    // Signboard 按钮
    this._drawButton(
      p,
      this._btnSignboard,
      "Signboard",
      this.activeTool === EntityTool.SIGNBOARD,
      [200, 160, 80],
    );
    // Checkpoint 按钮
    this._drawButton(
      p,
      this._btnCheckpoint,
      "Checkpoint",
      this.activeTool === EntityTool.CHECKPOINT,
      [200, 80, 180],
    );
    // Spawn 按钮
    this._drawButton(
      p,
      this._btnSpawn,
      "⌖ Spawn",
      this.activeTool === EntityTool.SPAWN,
      [255, 180, 0],
    );

    // BtnPlatform 平台数量控制（仅在 BtnPlatform 工具激活时显示）
    if (this.activeTool === EntityTool.BTN_PLATFORM) {
      // 标题
      p.fill(180, 220, 255);
      p.noStroke();
      p.textSize(11);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text("平台数量", this._platCountLabelX, this._btnPlatCountMinus.y - 2);

      // - 按钮
      this._drawButton(p, this._btnPlatCountMinus, "−", false, [180, 80, 80]);
      // 数量显示
      p.fill(255);
      p.noStroke();
      p.textSize(15);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(
        this.btnPlatformCount,
        this._platCountLabelX,
        this._platCountLabelY,
      );
      // + 按钮
      this._drawButton(p, this._btnPlatCountPlus, "+", false, [80, 180, 80]);
    }

    // 状态提示
    const statusX = this._btnSpawn.x + BTN_W2 + 20;
    const statusY = toolbarTop + TOOLBAR_HEIGHT / 2 + 8;
    p.fill(200);
    p.noStroke();
    p.textSize(13);
    p.textAlign(p.LEFT, p.CENTER);
    const toolLabel =
      this.activeTool === EntityTool.GROUND
        ? "地面 (Ground)"
        : this.activeTool === EntityTool.PLATFORM
          ? "平台 (Platform)"
          : this.activeTool === EntityTool.SPIKE
            ? "地刺 (Spike)"
            : this.activeTool === EntityTool.WALL
              ? "墙壁 (Wall)"
              : this.activeTool === EntityTool.WIRE_PORTAL
                ? "按钮传送门 (WirePortal)"
                : this.activeTool === EntityTool.BTN_SPIKE
                  ? "按钮地刺 (BtnSpike)"
                  : this.activeTool === EntityTool.BTN_PLATFORM
                    ? `按钮消失平台 ×${this.btnPlatformCount} (BtnPlatform)`
                    : this.activeTool === EntityTool.NPC
                      ? "NPC"
                      : this.activeTool === EntityTool.SIGNBOARD
                        ? "木牌 (Signboard)"
                        : this.activeTool === EntityTool.CHECKPOINT
                          ? "存档点 (Checkpoint)"
                          : this.activeTool === EntityTool.SPAWN
                            ? "出生点 (Spawn)"
                            : "传送门 (Portal)";
    p.text(`正在放置：${toolLabel}`, statusX, statusY);

    // 保存按钮
    this._drawButton(p, this._btnSave, "💾 保存", false, [60, 180, 100]);

    // 房间管理按钮
    this._drawButton(p, this._btnAddRoom, "+ Room", false, [60, 140, 180]);
    this._drawButton(p, this._btnDelRoom, "- Room", false, [180, 100, 60]);

    // 房间数量标签
    p.fill(180, 220, 255);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(
      `Rooms: ${this.roomCount}`,
      (this._btnAddRoom.x + this._btnDelRoom.x + this._btnDelRoom.w) / 2,
      this._btnAddRoom.y - 2,
    );

    // 摄像机左右移动按钮
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

  /** 绘制摄像机方向按钮 */
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
  // 交互
  // ══════════════════════════════════════════════════════════════

  /** 鼠标按下事件（屏幕坐标）。返回 true 表示事件被工具栏消费。 */
  handleMousePressed(mx, my) {
    // 摄像机左移按钮
    if (this._insideRect(mx, my, this._btnCamLeft)) {
      this._camLeftPressed = true;
      return true;
    }
    // 摄像机右移按钮
    if (this._insideRect(mx, my, this._btnCamRight)) {
      this._camRightPressed = true;
      return true;
    }
    // Ground 按钮
    if (this._insideRect(mx, my, this._btnGround)) {
      this.activeTool = EntityTool.GROUND;
      return true;
    }
    // Portal 按钮
    if (this._insideRect(mx, my, this._btnPortal)) {
      this.activeTool = EntityTool.PORTAL;
      return true;
    }
    // Platform 按钮
    if (this._insideRect(mx, my, this._btnPlatform)) {
      this.activeTool = EntityTool.PLATFORM;
      return true;
    }
    // Spike 按钮
    if (this._insideRect(mx, my, this._btnSpike)) {
      this.activeTool = EntityTool.SPIKE;
      return true;
    }
    // Wall 按钮
    if (this._insideRect(mx, my, this._btnWall)) {
      this.activeTool = EntityTool.WALL;
      return true;
    }
    // WirePortal 按钮
    if (this._insideRect(mx, my, this._btnWirePortal)) {
      this.activeTool = EntityTool.WIRE_PORTAL;
      return true;
    }
    // BtnSpike 按钮
    if (this._insideRect(mx, my, this._btnBtnSpike)) {
      this.activeTool = EntityTool.BTN_SPIKE;
      return true;
    }
    // BtnPlatform 按钮
    if (this._insideRect(mx, my, this._btnBtnPlatform)) {
      this.activeTool = EntityTool.BTN_PLATFORM;
      return true;
    }
    // BtnPlatform 平台数量 +/- 按钮
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
    // NPC 按钮
    if (this._insideRect(mx, my, this._btnNpc)) {
      this.activeTool = EntityTool.NPC;
      return true;
    }
    // Signboard 按钮
    if (this._insideRect(mx, my, this._btnSignboard)) {
      this.activeTool = EntityTool.SIGNBOARD;
      return true;
    }
    // Checkpoint 按钮
    if (this._insideRect(mx, my, this._btnCheckpoint)) {
      this.activeTool = EntityTool.CHECKPOINT;
      return true;
    }
    // Spawn 按钮
    if (this._insideRect(mx, my, this._btnSpawn)) {
      this.activeTool = EntityTool.SPAWN;
      return true;
    }
    // 添加房间按钮
    if (this._insideRect(mx, my, this._btnAddRoom)) {
      if (this.onAddRoom) this.onAddRoom();
      return true;
    }
    // 删除房间按钮
    if (this._insideRect(mx, my, this._btnDelRoom)) {
      if (this.onDelRoom) this.onDelRoom();
      return true;
    }
    // 保存按钮
    if (this._insideRect(mx, my, this._btnSave)) {
      if (this.onSave) this.onSave();
      return true;
    }
    // 点击在工具栏区域内 → 消费事件但不做动作
    if (my >= this._ch - TOOLBAR_HEIGHT) return true;
    return false;
  }

  /** 鼠标拖拽（屏幕坐标） */
  handleMouseDragged(_mx, _my) {
    return false;
  }

  /** 鼠标释放 */
  handleMouseReleased() {
    this._camLeftPressed = false;
    this._camRightPressed = false;
  }

  /**
   * 获取当前摄像机移动方向（每帧调用）
   * @returns {number} -1 左移, +1 右移, 0 无
   */
  getCameraMoveDirection() {
    if (this._camLeftPressed) return -1;
    if (this._camRightPressed) return 1;
    return 0;
  }

  /** 显示 toast 提示 */
  showToast(text, durationMs = 2000) {
    this._toast = { text, endTime: Date.now() + durationMs };
  }

  /** 鼠标是否在工具栏区域内 */
  isInsideToolbar(mx, my) {
    return my >= this._ch - TOOLBAR_HEIGHT;
  }

  // ── 内部工具方法 ──────────────────────────────────────────

  _insideRect(mx, my, rect) {
    return (
      mx >= rect.x &&
      mx <= rect.x + rect.w &&
      my >= rect.y &&
      my <= rect.y + rect.h
    );
  }
}
