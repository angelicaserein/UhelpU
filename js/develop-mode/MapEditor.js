/**
 * MapEditor — 极简地图实体编辑器（主协调器）
 *
 * 使用方法：
 *   在需要编辑的关卡（如 Level10）中：
 *   1. import { MapEditor } from "../../develop-mode/MapEditor.js";
 *   2. 在构造函数末尾: this._mapEditor = new MapEditor(this);
 *   3. 在 draw() 末尾:  this._mapEditor.draw(p);
 *
 *   进入关卡后按 M 开启/关闭编辑模式。
 *
 * 设计原则：
 *   - 不修改 Level10 原有逻辑，仅在渲染层叠加
 *   - 所有编辑器 UI 在屏幕空间绘制（resetMatrix）
 *   - 所有实体预览/已放置实体在世界空间绘制（与关卡相同坐标系）
 */

import { EditorUI } from "./EditorUI.js";
import { EditorPreview } from "./EditorPreview.js";
import { EditorEntityManager } from "./EditorEntityManager.js";
import { EditorExporter } from "./EditorExporter.js";
import {
  GROUND_DEFAULTS,
  PLATFORM_DEFAULTS,
  SPIKE_DEFAULTS,
  CAMERA_MOVE_SPEED,
  DEFAULT_ROOM_COUNT,
  WALL_THICKNESS,
  SPAWN_MARKER_SIZE,
  SPAWN_DEFAULTS,
  GRID_SIZE,
  EntityTool,
} from "./EditorConfig.js";

export class MapEditor {
  /**
   * @param {object} level  — 宿主关卡实例（需要有 p, _getCameraX 等属性/方法）
   */
  constructor(level) {
    this._level = level;
    this._p = level.p;
    this._active = false;

    this._ui = new EditorUI(this._p.width, this._p.height);
    this._preview = new EditorPreview();
    this._entityMgr = new EditorEntityManager(level);

    /** 编辑器手动摄像机偏移（叠加在关卡摄像机之上，单位：世界像素） */
    this._cameraOffset = 0;

    // 玩家出生点（从关卡的 _player 读取初始值，若无则使用默认值）
    const player = level._player;
    this._spawnX = player ? player._startX : SPAWN_DEFAULTS.x;
    this._spawnY = player ? player._startY : SPAWN_DEFAULTS.y;
    this._spawnPlayerW =
      player && player.collider ? player.collider.w : SPAWN_DEFAULTS.playerW;
    this._spawnPlayerH =
      player && player.collider ? player.collider.h : SPAWN_DEFAULTS.playerH;
    /** 是否正在拖拽出生点标记 */
    this._draggingSpawn = false;
    this._spawnDragOffsetX = 0;
    this._spawnDragOffsetY = 0;

    // 劫持关卡的 _getCameraX，让关卡自身的 draw/clearCanvas 也应用编辑器偏移
    this._originalGetCameraX =
      typeof level._getCameraX === "function"
        ? level._getCameraX.bind(level)
        : null;
    if (this._originalGetCameraX) {
      const editor = this;
      level._getCameraX = (p) => {
        const base = editor._originalGetCameraX(p);
        return editor._active ? base + editor._cameraOffset : base;
      };
    }

    // 房间管理
    this._roomCount = DEFAULT_ROOM_COUNT;
    this._ui.roomCount = this._roomCount;
    this._ui.onAddRoom = () => this._addRoom();
    this._ui.onDelRoom = () => this._deleteRoom();

    // 注入保存回调
    this._ui.onSave = () => this._handleSave();

    // 绑定键盘/鼠标事件
    this._boundKeyPressed = (e) => this._onKeyPressed(e);
    this._boundMousePressed = () => this._onMousePressed();
    this._boundMouseDragged = () => this._onMouseDragged();
    this._boundMouseReleased = () => this._onMouseReleased();

    // 用 p5 实例注册事件（不覆盖原有事件，用 addEventListener）
    document.addEventListener("keydown", this._boundKeyPressed);
    const canvas = this._p.canvas || this._p.drawingContext?.canvas;
    if (canvas) {
      canvas.addEventListener("mousedown", this._boundMousePressed);
      canvas.addEventListener("mousemove", this._boundMouseDragged);
      canvas.addEventListener("mouseup", this._boundMouseReleased);
    }
  }

  /** 编辑器是否激活 */
  get active() {
    return this._active;
  }

  /** 外部直接激活编辑器（跳过同帧的 M 键 toggle） */
  activate() {
    this._active = true;
    this._skipNextToggle = true;
  }

  // ══════════════════════════════════════════════════════════════
  // 每帧绘制 — 在 Level 的 draw() 结束后调用
  // ══════════════════════════════════════════════════════════════

  /**
   * @param {object} p — p5 实例
   */
  draw(p) {
    if (!this._active) return;

    // 每帧根据按钮按住状态累加摄像机偏移
    const camDir = this._ui.getCameraMoveDirection();
    if (camDir !== 0) {
      this._cameraOffset += camDir * CAMERA_MOVE_SPEED;
    }

    const cameraX = this._getCameraX(p);

    // ── 更新预览位置 ─────────────────────────────────────
    this._preview.update(
      p.mouseX,
      p.mouseY,
      p.height,
      cameraX,
      this._ui.activeTool,
      GROUND_DEFAULTS.width,
      GROUND_DEFAULTS.height,
      this._ui.isInsideToolbar(p.mouseX, p.mouseY) ||
        this._entityMgr.isResizing() ||
        this._entityMgr.isBtnSpikeResizing() ||
        this._entityMgr.isBtnPlatformResizing() ||
        this._entityMgr.isMoving() ||
        this._entityMgr.selected !== null,
    );

    // ── 更新编辑器放置的机制系统 ───────────────────────────
    for (const rec of this._entityMgr.getAll()) {
      if (rec.platformLinkSystem) rec.platformLinkSystem.update();
    }

    // ── 世界空间绘制 ────────────────────────────────────
    // 此时 LevelManager 已经做了 flipY（Y 轴已翻转），
    // 只需再加上摄像机平移即可进入世界坐标系
    p.push();
    p.translate(-cameraX, 0);

    // 绘制房间边界和自动墙壁指示
    this._drawRoomBoundaries(p);

    // 绘制出生点标记
    this._drawSpawnMarker(p);

    // 绘制已放置的实体
    this._entityMgr.draw(p);

    // 绘制消失平台的半透明效果
    for (const rec of this._entityMgr.getAll()) {
      if (rec.platformLinkSystem) rec.platformLinkSystem.draw(p);
    }

    // 绘制预览
    this._preview.draw(p, this._ui.activeTool);

    // 绘制网格辅助线（轻量）
    this._drawGrid(p, cameraX);

    p.pop();

    // ── 屏幕空间绘制 UI ──────────────────────────────────
    this._ui.draw(p);

    // 编辑模式标识
    this._drawEditorBadge(p);
  }

  // ══════════════════════════════════════════════════════════════
  // 事件处理
  // ══════════════════════════════════════════════════════════════

  _onKeyPressed(e) {
    // M 键切换编辑模式
    if (e.key === "m" || e.key === "M") {
      if (this._skipNextToggle) {
        this._skipNextToggle = false;
        return;
      }
      this._active = !this._active;
      if (!this._active) this._cameraOffset = 0;
      return;
    }

    if (!this._active) return;

    // Ctrl+Z 撤销
    if (e.ctrlKey && (e.key === "z" || e.key === "Z")) {
      this._entityMgr.undoLast();
      return;
    }

    // Delete / Backspace 清空全部
    if (e.key === "Delete") {
      this._entityMgr.clear();
      this._ui.showToast("已清空所有编辑器实体");
      return;
    }

    // 1/2/3/4 快捷切换工具
    if (e.key === "1") {
      this._ui.activeTool = "ground";
      return;
    }
    if (e.key === "2") {
      this._ui.activeTool = "portal";
      return;
    }
    if (e.key === "3") {
      this._ui.activeTool = "platform";
      return;
    }
    if (e.key === "4") {
      this._ui.activeTool = "spike";
      return;
    }
    if (e.key === "5") {
      this._ui.activeTool = "wall";
      return;
    }
    if (e.key === "6") {
      this._ui.activeTool = "wirePortal";
      return;
    }
    if (e.key === "7") {
      this._ui.activeTool = "btnSpike";
      return;
    }
    if (e.key === "8") {
      this._ui.activeTool = "btnPlatform";
      return;
    }
    if (e.key === "9") {
      this._ui.activeTool = "npc";
      return;
    }
    if (e.key === "0") {
      this._ui.activeTool = "checkpoint";
      return;
    }
    if (e.key === "-") {
      this._ui.activeTool = EntityTool.SPAWN;
      return;
    }
  }

  _onMousePressed() {
    if (!this._active) return;

    const p = this._p;
    const mx = p.mouseX;
    const my = p.mouseY;

    // 先让 UI 处理（按钮）
    if (this._ui.handleMousePressed(mx, my)) {
      this._entityMgr.deselect();
      return;
    }

    // 屏幕 → 世界坐标
    const cameraX = this._getCameraX(p);
    const worldX = mx + cameraX;
    const worldY = p.height - my;

    // 0) 检查是否点击了出生点标记 → 开始拖拽
    if (this._isInsideSpawnMarker(worldX, worldY)) {
      this._draggingSpawn = true;
      this._spawnDragOffsetX = worldX - this._spawnX;
      this._spawnDragOffsetY = worldY - this._spawnY;
      this._entityMgr.deselect();
      return;
    }

    // 0.5) Spawn 工具模式：点击空白区域重新设置出生点
    if (this._ui.activeTool === EntityTool.SPAWN) {
      this._spawnX = Math.round(worldX / GRID_SIZE) * GRID_SIZE;
      this._spawnY = Math.round(worldY / GRID_SIZE) * GRID_SIZE;
      this._applySpawnToPlayer();
      this._ui.showToast(`出生点已设置为 (${this._spawnX}, ${this._spawnY})`);
      return;
    }

    // 1) 检查是否点击了某个实体的删除按钮
    const delTarget = this._entityMgr.getDeleteBtnHit(worldX, worldY);
    if (delTarget) {
      this._entityMgr.remove(delTarget);
      this._ui.showToast("已删除实体");
      return;
    }

    // 2) 检查是否点击了选中实体的拖拽手柄
    const handle = this._entityMgr.getHandleAt(worldX, worldY);
    if (handle) {
      this._entityMgr.startResize(handle);
      return;
    }

    // 2.5) 检查是否点击了 WirePortal 的子实体（按钮或传送门） → 开始拖动
    const wpHit = this._entityMgr.findWirePortalSubEntity(worldX, worldY);
    if (wpHit) {
      this._entityMgr.startMove(wpHit.record, wpHit.entity, worldX, worldY);
      return;
    }

    // 2.6) 检查是否点击了 BtnSpike 地刺的调整手柄 → 开始调整大小
    const bsHandleHit = this._entityMgr.getBtnSpikeHandleAt(worldX, worldY);
    if (bsHandleHit) {
      this._entityMgr.startBtnSpikeResize(
        bsHandleHit.record,
        bsHandleHit.handle,
      );
      return;
    }

    // 2.7) 检查是否点击了 BtnSpike 的子实体（按钮或地刺） → 开始拖动
    const bsHit = this._entityMgr.findBtnSpikeSubEntity(worldX, worldY);
    if (bsHit) {
      this._entityMgr.startMove(bsHit.record, bsHit.entity, worldX, worldY);
      return;
    }

    // 2.8) 检查是否点击了 BtnPlatform 平台的调整手柄 → 开始调整大小
    const bpHandleHit = this._entityMgr.getBtnPlatformHandleAt(worldX, worldY);
    if (bpHandleHit) {
      this._entityMgr.startBtnPlatformResize(
        bpHandleHit.record,
        bpHandleHit.handle,
        bpHandleHit.platformIdx,
      );
      return;
    }

    // 2.9) 检查是否点击了 BtnPlatform 的子实体（按钮或平台） → 开始拖动
    const bpHit = this._entityMgr.findBtnPlatformSubEntity(worldX, worldY);
    if (bpHit) {
      this._entityMgr.startMove(bpHit.record, bpHit.entity, worldX, worldY);
      return;
    }

    // 3) 检查是否点击了已放置的 Ground → 选中
    const found = this._entityMgr.findAt(worldX, worldY);
    if (found) {
      this._entityMgr.select(found);
      return;
    }

    // 4) 有选中实体时，点击空白区域 → 仅取消选中，回到放置模式
    if (this._entityMgr.selected) {
      this._entityMgr.deselect();
      return;
    }

    // 5) 没有选中实体时，点击空白区域 → 放置新实体
    if (this._preview.visible) {
      const options = {};
      if (this._ui.activeTool === EntityTool.BTN_PLATFORM) {
        options.platformCount = this._ui.btnPlatformCount;
      }
      this._entityMgr.place(
        this._ui.activeTool,
        this._preview.previewX,
        this._preview.previewY,
        this._preview.previewW,
        this._preview.previewH,
        options,
      );
    }
  }

  _onMouseDragged() {
    if (!this._active) return;
    if (this._ui.handleMouseDragged(this._p.mouseX, this._p.mouseY)) return;

    // 拖拽出生点标记
    if (this._draggingSpawn) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._spawnX =
        Math.round((worldX - this._spawnDragOffsetX) / GRID_SIZE) * GRID_SIZE;
      this._spawnY =
        Math.round((worldY - this._spawnDragOffsetY) / GRID_SIZE) * GRID_SIZE;
      this._applySpawnToPlayer();
      return;
    }

    // 拖拽调整大小
    if (this._entityMgr.isResizing()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateResize(worldX, worldY);
    }

    // 拖拽调整 BtnSpike 地刺大小
    if (this._entityMgr.isBtnSpikeResizing()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateBtnSpikeResize(worldX, worldY);
    }

    // 拖拽调整 BtnPlatform 平台大小
    if (this._entityMgr.isBtnPlatformResizing()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateBtnPlatformResize(worldX, worldY);
    }

    // 拖动 WirePortal / BtnSpike 子实体
    if (this._entityMgr.isMoving()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateMove(worldX, worldY);
    }
  }

  _onMouseReleased() {
    if (!this._active) return;
    this._ui.handleMouseReleased();
    if (this._draggingSpawn) {
      this._draggingSpawn = false;
    }
    this._entityMgr.endResize();
    this._entityMgr.endBtnSpikeResize();
    this._entityMgr.endBtnPlatformResize();
    this._entityMgr.endMove();
  }

  // ══════════════════════════════════════════════════════════════
  // 导出
  // ══════════════════════════════════════════════════════════════

  async _handleSave() {
    const entities = this._entityMgr.getAll();
    const code = await EditorExporter.copyToClipboard(
      entities,
      this._roomCount,
      this._p.width,
      this._p.height,
      {
        x: this._spawnX,
        y: this._spawnY,
        w: this._spawnPlayerW,
        h: this._spawnPlayerH,
      },
    );
    this._ui.showToast(`✅ 已复制代码到剪贴板（含出生点）`);
    console.log("[MapEditor] 导出代码:\n" + code);
  }

  // ══════════════════════════════════════════════════════════════
  // 出生点管理
  // ══════════════════════════════════════════════════════════════

  /** 判断世界坐标是否在出生点标记范围内 */
  _isInsideSpawnMarker(worldX, worldY) {
    const half = SPAWN_MARKER_SIZE + 6;
    return (
      worldX >= this._spawnX - half &&
      worldX <= this._spawnX + this._spawnPlayerW + half &&
      worldY >= this._spawnY - half &&
      worldY <= this._spawnY + this._spawnPlayerH + half
    );
  }

  /** 将出生点应用到关卡的 Player 实体 */
  _applySpawnToPlayer() {
    const player = this._level._player;
    if (!player) return;
    player.x = this._spawnX;
    player.y = this._spawnY;
    player._startX = this._spawnX;
    player._startY = this._spawnY;
  }

  /** 绘制出生点标记（世界空间，已在 push/translate 内） */
  _drawSpawnMarker(p) {
    const sx = this._spawnX;
    const sy = this._spawnY;
    const pw = this._spawnPlayerW;
    const ph = this._spawnPlayerH;
    const m = SPAWN_MARKER_SIZE;

    // 玩家轮廓虚线框
    p.stroke(255, 180, 0, 200);
    p.strokeWeight(2);
    p.noFill();
    this._drawDashedRect(p, sx, sy, pw, ph);

    // 十字线标记（中心在玩家底部中点）
    const cx = sx + pw / 2;
    const cy = sy;
    p.stroke(255, 100, 0, 240);
    p.strokeWeight(3);
    p.line(cx - m, cy, cx + m, cy);
    p.line(cx, cy - m, cx, cy + m);

    // 小圆圈
    p.noFill();
    p.stroke(255, 180, 0, 200);
    p.strokeWeight(2);
    p.ellipse(cx, cy, m * 1.4, m * 1.4);

    // 坐标标签（需要翻转 Y 回来让文字正常显示）
    p.push();
    p.translate(sx, sy + ph + 14);
    p.scale(1, -1);
    p.fill(255, 180, 0);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`Spawn (${sx}, ${sy})`, 0, 0);
    p.pop();
  }

  /** 绘制虚线矩形（世界空间） */
  _drawDashedRect(p, x, y, w, h) {
    this._drawDashedLine(p, x, y, x + w, y);
    this._drawDashedLine(p, x + w, y, x + w, y + h);
    this._drawDashedLine(p, x + w, y + h, x, y + h);
    this._drawDashedLine(p, x, y + h, x, y);
  }

  // ══════════════════════════════════════════════════════════════
  // 内部绘制辅助
  // ══════════════════════════════════════════════════════════════

  /**
   * 获取当前摄像机 X（兼容多房间关卡和单房间关卡的无相机情况）
   */
  _getCameraX(p) {
    if (typeof this._level._getCameraX === "function") {
      return this._level._getCameraX(p);
    }
    return this._active ? this._cameraOffset : 0;
  }

  // ══════════════════════════════════════════════════════════════
  // 房间管理
  // ══════════════════════════════════════════════════════════════

  _addRoom() {
    this._roomCount++;
    this._ui.roomCount = this._roomCount;
    this._ui.showToast(`已添加房间，当前 ${this._roomCount} 个房间`);
  }

  _deleteRoom() {
    if (this._roomCount <= 1) {
      this._ui.showToast("至少需要 1 个房间");
      return;
    }
    this._roomCount--;
    this._ui.roomCount = this._roomCount;
    this._ui.showToast(`已删除最后一个房间，当前 ${this._roomCount} 个房间`);
  }

  /** 绘制房间边界虚线和自动墙壁指示（世界空间） */
  _drawRoomBoundaries(p) {
    const roomWidth = this._p.width;
    const wallThick = WALL_THICKNESS;
    const h = this._p.height;

    // 自动墙壁半透明指示
    p.noStroke();
    p.fill(100, 100, 160, 50);
    p.rect(0, 0, wallThick, h);
    p.rect(this._roomCount * roomWidth - wallThick, 0, wallThick, h);

    // 房间边界虚线
    for (let i = 0; i <= this._roomCount; i++) {
      const bx = i * roomWidth;
      p.stroke(255, 200, 0, 160);
      p.strokeWeight(2);
      this._drawDashedLine(p, bx, 0, bx, h);
    }

    // 房间标签
    for (let i = 0; i < this._roomCount; i++) {
      const cx = i * roomWidth + roomWidth / 2;
      const ly = h - 40;
      p.push();
      p.translate(cx, ly);
      p.scale(1, -1);
      p.fill(255, 200, 0, 140);
      p.noStroke();
      p.textSize(18);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`Room ${i}`, 0, 0);
      p.pop();
    }
  }

  /** 绘制虚线 */
  _drawDashedLine(p, x1, y1, x2, y2, dashLen = 10, gapLen = 8) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = dashLen + gapLen;
    const ux = dx / dist;
    const uy = dy / dist;
    for (let d = 0; d < dist; d += step) {
      const sx = x1 + d * ux;
      const sy = y1 + d * uy;
      const ex = x1 + Math.min(d + dashLen, dist) * ux;
      const ey = y1 + Math.min(d + dashLen, dist) * uy;
      p.line(sx, sy, ex, ey);
    }
  }

  /** 绘制轻量网格（仅可视区域） */
  _drawGrid(p, cameraX) {
    const gridSize = 50;
    const startX = Math.floor(cameraX / gridSize) * gridSize;
    const endX = cameraX + p.width;

    p.stroke(255, 255, 255, 20);
    p.strokeWeight(0.5);

    for (let gx = startX; gx <= endX; gx += gridSize) {
      p.line(gx, 0, gx, p.height);
    }
    for (let gy = 0; gy <= p.height; gy += gridSize) {
      p.line(startX, gy, endX, gy);
    }
  }

  /** 左上角编辑模式标识 */
  _drawEditorBadge(p) {
    p.push();
    p.resetMatrix();
    p.fill(220, 60, 60, 200);
    p.noStroke();
    p.rect(0, 0, 170, 28, 0, 0, 8, 0);
    p.fill(255);
    p.textSize(13);
    p.textAlign(p.LEFT, p.CENTER);
    p.text("🛠 编辑模式  [M] 关闭", 8, 14);
    p.pop();
  }

  // ══════════════════════════════════════════════════════════════
  // 清理
  // ══════════════════════════════════════════════════════════════

  destroy() {
    // 恢复关卡原始的 _getCameraX
    if (this._originalGetCameraX) {
      this._level._getCameraX = this._originalGetCameraX;
    }
    document.removeEventListener("keydown", this._boundKeyPressed);
    const canvas = this._p.canvas || this._p.drawingContext?.canvas;
    if (canvas) {
      canvas.removeEventListener("mousedown", this._boundMousePressed);
      canvas.removeEventListener("mousemove", this._boundMouseDragged);
      canvas.removeEventListener("mouseup", this._boundMouseReleased);
    }
  }
}
