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
        this._entityMgr.selected !== null,
    );

    // ── 世界空间绘制 ────────────────────────────────────
    // 此时 LevelManager 已经做了 flipY（Y 轴已翻转），
    // 只需再加上摄像机平移即可进入世界坐标系
    p.push();
    p.translate(-cameraX, 0);

    // 绘制房间边界和自动墙壁指示
    this._drawRoomBoundaries(p);

    // 绘制已放置的实体
    this._entityMgr.draw(p);

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
      this._entityMgr.place(
        this._ui.activeTool,
        this._preview.previewX,
        this._preview.previewY,
        this._preview.previewW,
        this._preview.previewH,
      );
    }
  }

  _onMouseDragged() {
    if (!this._active) return;
    if (this._ui.handleMouseDragged(this._p.mouseX, this._p.mouseY)) return;

    // 拖拽调整大小
    if (this._entityMgr.isResizing()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateResize(worldX, worldY);
    }
  }

  _onMouseReleased() {
    if (!this._active) return;
    this._ui.handleMouseReleased();
    this._entityMgr.endResize();
  }

  // ══════════════════════════════════════════════════════════════
  // 导出
  // ══════════════════════════════════════════════════════════════

  async _handleSave() {
    const entities = this._entityMgr.getAll();
    if (entities.length === 0) {
      this._ui.showToast("没有放置任何实体");
      return;
    }
    const code = await EditorExporter.copyToClipboard(
      entities,
      this._roomCount,
      this._p.width,
      this._p.height,
    );
    this._ui.showToast(`✅ 已复制 ${entities.length} 个实体的代码到剪贴板`);
    console.log("[MapEditor] 导出代码:\n" + code);
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
