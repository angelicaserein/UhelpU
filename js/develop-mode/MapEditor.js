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
    this._entityMgr = new EditorEntityManager();

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

  // ══════════════════════════════════════════════════════════════
  // 每帧绘制 — 在 Level 的 draw() 结束后调用
  // ══════════════════════════════════════════════════════════════

  /**
   * @param {object} p — p5 实例
   */
  draw(p) {
    if (!this._active) return;

    const cameraX = this._getCameraX(p);

    // ── 更新预览位置 ─────────────────────────────────────
    this._preview.update(
      p.mouseX,
      p.mouseY,
      p.height,
      cameraX,
      this._ui.activeTool,
      this._ui.groundWidth,
      this._ui.groundHeight,
      this._ui.isInsideToolbar(p.mouseX, p.mouseY),
    );

    // ── 世界空间绘制（翻转 + 摄像机） ────────────────────
    // 此时 LevelManager 已经做了 flipY + translate(-cameraX, 0)
    // 但 Level10.draw() 自己也做了 push/translate/pop
    // 所以这里需要自己处理完整的变换
    p.push();
    p.translate(0, p.height);
    p.scale(1, -1);
    p.translate(-cameraX, 0);

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
      this._active = !this._active;
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

    // 1/2 快捷切换工具
    if (e.key === "1") {
      this._ui.activeTool = "ground";
      return;
    }
    if (e.key === "2") {
      this._ui.activeTool = "portal";
      return;
    }
  }

  _onMousePressed() {
    if (!this._active) return;

    const p = this._p;
    const mx = p.mouseX;
    const my = p.mouseY;

    // 先让 UI 处理（按钮/滑块）
    if (this._ui.handleMousePressed(mx, my)) return;

    // 点击画布 → 放置实体
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
    this._ui.handleMouseDragged(this._p.mouseX, this._p.mouseY);
  }

  _onMouseReleased() {
    if (!this._active) return;
    this._ui.handleMouseReleased();
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
    const code = await EditorExporter.copyToClipboard(entities);
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
    return 0;
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
    document.removeEventListener("keydown", this._boundKeyPressed);
    const canvas = this._p.canvas || this._p.drawingContext?.canvas;
    if (canvas) {
      canvas.removeEventListener("mousedown", this._boundMousePressed);
      canvas.removeEventListener("mousemove", this._boundMouseDragged);
      canvas.removeEventListener("mouseup", this._boundMouseReleased);
    }
  }
}
