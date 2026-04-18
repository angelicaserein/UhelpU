/**
 * MapEditor — Minimal map entity editor (main coordinator)
 *
 * Usage:
 *   In the level you want to edit (e.g. Level10):
 *   1. import { MapEditor } from "../../develop-mode/MapEditor.js";
 *   2. At the end of constructor: this._mapEditor = new MapEditor(this);
 *   3. At the end of draw():  this._mapEditor.draw(p);
 *
 * Design principles:
 *   - Do not modify Level10's original logic, only overlay on render layer
 *   - All editor UI drawn in screen space (resetMatrix)
 *   - All entity previews/placed entities drawn in world space (same coordinate system as level)
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

const EDITOR_SESSION_STORE = new Map();

export class MapEditor {
  /**
   * @param {object} level - Host level instance (must have p, _getCameraX properties/methods)
   */
  constructor(level) {
    this._level = level;
    this._p = level.p;
    this._active = false;

    this._ui = new EditorUI(this._p.width, this._p.height);
    this._preview = new EditorPreview();
    this._entityMgr = new EditorEntityManager(level);
    this._sessionKey = this._getSessionKey();

    /** Editor manual camera offset (stacked on level camera, unit: world pixels) */
    this._cameraOffset = 0;

    // Player spawn point (read initial value from level._player, use default if not present)
    const player = level._player;
    this._spawnX = player ? player._startX : SPAWN_DEFAULTS.x;
    this._spawnY = player ? player._startY : SPAWN_DEFAULTS.y;
    this._spawnPlayerW =
      player && player.collider ? player.collider.w : SPAWN_DEFAULTS.playerW;
    this._spawnPlayerH =
      player && player.collider ? player.collider.h : SPAWN_DEFAULTS.playerH;
    /** Whether currently dragging spawn marker */
    this._draggingSpawn = false;
    this._spawnDragOffsetX = 0;
    this._spawnDragOffsetY = 0;

    // Hijack level's _getCameraX so level's draw/clearCanvas also applies editor offset
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

    // Room management
    this._roomCount = DEFAULT_ROOM_COUNT;
    this._ui.roomCount = this._roomCount;
    this._ui.onAddRoom = () => this._addRoom();
    this._ui.onDelRoom = () => this._deleteRoom();
    this._ui.onToggleBtnPlatformMode = (platformIdx) =>
      this._toggleSelectedBtnPlatformMode(platformIdx);

    // Inject save callback
    this._ui.onSave = () => this._handleSave();

    // Bind keyboard/mouse events
    this._boundKeyPressed = (e) => this._onKeyPressed(e);
    this._boundMousePressed = () => this._onMousePressed();
    this._boundMouseDragged = () => this._onMouseDragged();
    this._boundMouseReleased = () => this._onMouseReleased();

    // Register events with p5 instance (don't override existing events, use addEventListener)
    document.addEventListener("keydown", this._boundKeyPressed);
    const canvas = this._p.canvas || this._p.drawingContext?.canvas;
    if (canvas) {
      canvas.addEventListener("mousedown", this._boundMousePressed);
      canvas.addEventListener("mousemove", this._boundMouseDragged);
      canvas.addEventListener("mouseup", this._boundMouseReleased);
    }

    this._restoreSessionSnapshot();
  }

  /** Whether editor is active */
  get active() {
    return this._active;
  }

  /** Externally activate editor (skip M key toggle on same frame) */
  activate() {
    this._active = true;
    this._skipNextToggle = true;
  }

  // ══════════════════════════════════════════════════════════════
  // Draw each frame — called at end of Level's draw()
  // ══════════════════════════════════════════════════════════════

  /**
   * @param {object} p - p5 instance
   */
  draw(p) {
    if (!this._active) return;

    // Each frame accumulate camera offset based on button press state
    const camDir = this._ui.getCameraMoveDirection();
    if (camDir !== 0) {
      this._cameraOffset += camDir * CAMERA_MOVE_SPEED;
    }

    const cameraX = this._getCameraX(p);

    // ── Update preview position ─────────────────────────────────────
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
        this._entityMgr.isDragging() ||
        this._entityMgr.selected !== null,
    );

    // ── Update mechanism system placed by editor ───────────────────────────
    for (const rec of this._entityMgr.getAll()) {
      if (rec.platformLinkSystem) rec.platformLinkSystem.update();
    }

    // ── Draw in world space ────────────────────────────────────
    // At this point LevelManager has already done flipY (Y axis already flipped),
    // just need to add camera translation to enter world coordinates
    p.push();
    p.translate(-cameraX, 0);

    // Draw room boundaries and auto-wall indicators
    this._drawRoomBoundaries(p);

    // Draw spawn marker
    this._drawSpawnMarker(p);

    // Draw placed entities
    this._entityMgr.draw(p);

    // Draw semi-transparent effect of disappearing platforms
    for (const rec of this._entityMgr.getAll()) {
      if (rec.platformLinkSystem) rec.platformLinkSystem.draw(p);
    }

    // Draw preview
    this._preview.draw(p, this._ui.activeTool);

    // Draw grid helper lines (lightweight)
    this._drawGrid(p, cameraX);

    p.pop();

    // ── Draw UI in screen space ──────────────────────────────
    this._ui.setBtnPlatformInspector(this._entityMgr.selected);
    this._ui.draw(p);

    // Edit mode badge
    this._drawEditorBadge(p);
  }

  // ══════════════════════════════════════════════════════════════
  // Event handling
  // ══════════════════════════════════════════════════════════════

  _onKeyPressed(e) {
    // M key toggle edit mode
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

    // Ctrl+Z undo
    if (e.ctrlKey && (e.key === "z" || e.key === "Z")) {
      this._entityMgr.undoLast();
      return;
    }

    // F key flip direction of selected Enemy
    if ((e.key === "f" || e.key === "F") && this._entityMgr.selected) {
      const selected = this._entityMgr.selected;
      if (selected.tool === EntityTool.ENEMY) {
        selected.direction = selected.direction === 1 ? -1 : 1;
        selected.gameEntity._direction = selected.direction;
        this._ui.showToast(
          `Enemy direction switched to ${selected.direction === 1 ? "→" : "←"}`,
        );
      }
      return;
    }

    // E key edit text of selected TextPrompt
    if ((e.key === "e" || e.key === "E") && this._entityMgr.selected) {
      const selected = this._entityMgr.selected;
      if (selected.tool === EntityTool.TEXT_PROMPT) {
        const currentText = selected.gameEntity?.textKey || "";
        const nextText = window.prompt("Edit TextPrompt text:", currentText);
        if (nextText !== null) {
          this._entityMgr.setTextPromptText(selected, nextText);
          this._ui.showToast("TextPrompt text updated");
        }
      }
      return;
    }

    // Delete clear all
    if (e.key === "Delete") {
      this._entityMgr.clear();
      this._ui.showToast("All editor entities cleared");
    }
  }

  _onMousePressed() {
    if (!this._active) return;

    const p = this._p;
    const mx = p.mouseX;
    const my = p.mouseY;

    this._ui.setBtnPlatformInspector(this._entityMgr.selected);

    // Let UI handle first (buttons)
    const preserveSelection = this._ui.isInsideBtnPlatformInspector(mx, my);
    if (this._ui.handleMousePressed(mx, my)) {
      if (!preserveSelection) {
        this._entityMgr.deselect();
      }
      return;
    }

    // Screen → world coordinates
    const cameraX = this._getCameraX(p);
    const worldX = mx + cameraX;
    const worldY = p.height - my;

    // 0) Check if clicked on spawn marker → start dragging
    if (this._isInsideSpawnMarker(worldX, worldY)) {
      this._draggingSpawn = true;
      this._spawnDragOffsetX = worldX - this._spawnX;
      this._spawnDragOffsetY = worldY - this._spawnY;
      this._entityMgr.deselect();
      return;
    }

    // 0.5) Spawn tool mode: click blank area to reset spawn point
    if (this._ui.activeTool === EntityTool.SPAWN) {
      this._spawnX = Math.round(worldX / GRID_SIZE) * GRID_SIZE;
      this._spawnY = Math.round(worldY / GRID_SIZE) * GRID_SIZE;
      this._applySpawnToPlayer();
      this._ui.showToast(`Spawn set to (${this._spawnX}, ${this._spawnY})`);
      return;
    }

    // 1) Check if clicked on delete button of an entity
    const delTarget = this._entityMgr.getDeleteBtnHit(worldX, worldY);
    if (delTarget) {
      this._entityMgr.remove(delTarget);
      this._ui.showToast("Entity deleted");
      return;
    }

    // 2) Check if clicked on drag handle of selected entity
    const handle = this._entityMgr.getHandleAt(worldX, worldY);
    if (handle) {
      this._entityMgr.startResize(handle);
      return;
    }

    // 2.5) Check if clicked on WirePortal sub-entity (button or portal) → start dragging
    const wpHit = this._entityMgr.findWirePortalSubEntity(worldX, worldY);
    if (wpHit) {
      this._entityMgr.startMove(wpHit.record, wpHit.entity, worldX, worldY);
      return;
    }

    // 2.6) Check if clicked on BtnSpike spike adjustment handle → start resizing
    const bsHandleHit = this._entityMgr.getBtnSpikeHandleAt(worldX, worldY);
    if (bsHandleHit) {
      this._entityMgr.startBtnSpikeResize(
        bsHandleHit.record,
        bsHandleHit.handle,
      );
      return;
    }

    // 2.7) Check if clicked on BtnSpike sub-entity (button or spike) → start dragging
    const bsHit = this._entityMgr.findBtnSpikeSubEntity(worldX, worldY);
    if (bsHit) {
      this._entityMgr.startMove(bsHit.record, bsHit.entity, worldX, worldY);
      return;
    }

    // 2.8) Check if clicked on BtnPlatform platform adjustment handle → start resizing
    const bpHandleHit = this._entityMgr.getBtnPlatformHandleAt(worldX, worldY);
    if (bpHandleHit) {
      this._entityMgr.select(bpHandleHit.record);
      this._entityMgr.startBtnPlatformResize(
        bpHandleHit.record,
        bpHandleHit.handle,
        bpHandleHit.platformIdx,
      );
      return;
    }

    // 2.9) Check if clicked on BtnPlatform sub-entity (button or platform) → start dragging
    const bpHit = this._entityMgr.findBtnPlatformSubEntity(worldX, worldY);
    if (bpHit) {
      this._entityMgr.select(bpHit.record);
      this._entityMgr.startMove(bpHit.record, bpHit.entity, worldX, worldY);
      return;
    }

    // 2.10) Check if clicked on draggable entity (Ground/Platform/Spike/Wall/NPC/Signboard/Checkpoint/Portal) → start dragging
    const dragTarget = this._entityMgr.findDraggableAt(worldX, worldY);
    if (dragTarget) {
      this._entityMgr.select(dragTarget);
      this._entityMgr.startDrag(dragTarget, worldX, worldY);
      return;
    }

    // 3) Check if clicked on placed Ground → select
    const found = this._entityMgr.findAt(worldX, worldY);
    if (found) {
      this._entityMgr.select(found);
      return;
    }

    // 4) With entity selected, click blank area → deselect only, return to placement mode
    if (this._entityMgr.selected) {
      this._entityMgr.deselect();
      return;
    }

    // 5) No entity selected, click blank area → place new entity
    if (this._preview.visible) {
      const options = {};
      if (this._ui.activeTool === EntityTool.BTN_PLATFORM) {
        options.platformCount = this._ui.btnPlatformCount;
      }
      if (this._ui.activeTool === EntityTool.TEXT_PROMPT) {
        const text = window.prompt(
          "Enter TextPrompt text (can edit later with E):",
          "todo_text_prompt",
        );
        if (text === null) {
          return;
        }
        options.textKey = text;
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

    // Drag spawn marker
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

    // Drag to resize
    if (this._entityMgr.isResizing()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateResize(worldX, worldY);
    }

    // Drag to resize BtnSpike spike
    if (this._entityMgr.isBtnSpikeResizing()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateBtnSpikeResize(worldX, worldY);
    }

    // Drag to resize BtnPlatform platform
    if (this._entityMgr.isBtnPlatformResizing()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateBtnPlatformResize(worldX, worldY);
    }

    // Drag WirePortal / BtnSpike sub-entity
    if (this._entityMgr.isMoving()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateMove(worldX, worldY);
    }

    // Drag entire entity
    if (this._entityMgr.isDragging()) {
      const cameraX = this._getCameraX(this._p);
      const worldX = this._p.mouseX + cameraX;
      const worldY = this._p.height - this._p.mouseY;
      this._entityMgr.updateDrag(worldX, worldY);
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
    this._entityMgr.endDrag();
  }

  // ══════════════════════════════════════════════════════════════
  // Export
  // ══════════════════════════════════════════════════════════════

  async _handleSave() {
    const rawLevelClassName = window.prompt("Enter level class name:", "LevelX");
    if (rawLevelClassName === null) {
      return;
    }

    const levelClassName =
      EditorExporter.normalizeLevelClassName(rawLevelClassName);
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
      levelClassName,
    );
    this._ui.showToast(`Complete ${levelClassName}.js copied to clipboard`);
    console.log("[MapEditor] Exported code:\n" + code);
  }

  _toggleSelectedBtnPlatformMode(platformIdx) {
    const record = this._entityMgr.selected;
    if (!record || record.tool !== EntityTool.BTN_PLATFORM) return;
    const mode = this._entityMgr.toggleBtnPlatformMode(record, platformIdx);
    if (!mode) return;
    this._ui.setBtnPlatformInspector(record);
    this._ui.showToast(`Platform ${platformIdx + 1} switched to ${mode}`);
  }

  // ══════════════════════════════════════════════════════════════
  // Spawn point management
  // ══════════════════════════════════════════════════════════════

  /** Check if world coordinates are inside spawn marker range */
  _isInsideSpawnMarker(worldX, worldY) {
    const half = SPAWN_MARKER_SIZE + 6;
    return (
      worldX >= this._spawnX - half &&
      worldX <= this._spawnX + this._spawnPlayerW + half &&
      worldY >= this._spawnY - half &&
      worldY <= this._spawnY + this._spawnPlayerH + half
    );
  }

  /** Apply spawn point to level's Player entity */
  _applySpawnToPlayer() {
    const player = this._level._player;
    if (!player) return;
    player.x = this._spawnX;
    player.y = this._spawnY;
    player._startX = this._spawnX;
    player._startY = this._spawnY;
  }

  /** Draw spawn marker (world space, already in push/translate) */
  _drawSpawnMarker(p) {
    const sx = this._spawnX;
    const sy = this._spawnY;
    const pw = this._spawnPlayerW;
    const ph = this._spawnPlayerH;
    const m = SPAWN_MARKER_SIZE;

    // Player outline dashed frame
    p.stroke(255, 180, 0, 200);
    p.strokeWeight(2);
    p.noFill();
    this._drawDashedRect(p, sx, sy, pw, ph);

    // Crosshair marker (center at player bottom center)
    const cx = sx + pw / 2;
    const cy = sy;
    p.stroke(255, 100, 0, 240);
    p.strokeWeight(3);
    p.line(cx - m, cy, cx + m, cy);
    p.line(cx, cy - m, cx, cy + m);

    // Small circle
    p.noFill();
    p.stroke(255, 180, 0, 200);
    p.strokeWeight(2);
    p.ellipse(cx, cy, m * 1.4, m * 1.4);

    // Coordinate label (need to flip Y back so text displays normally)
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

  /** Draw dashed rectangle (world space) */
  _drawDashedRect(p, x, y, w, h) {
    this._drawDashedLine(p, x, y, x + w, y);
    this._drawDashedLine(p, x + w, y, x + w, y + h);
    this._drawDashedLine(p, x + w, y + h, x, y + h);
    this._drawDashedLine(p, x, y + h, x, y);
  }

  // ══════════════════════════════════════════════════════════════
  // Internal draw helpers
  // ══════════════════════════════════════════════════════════════

  /**
   * Get current camera X (compatible with multi-room levels and single-room levels without camera)
   */
  _getCameraX(p) {
    if (typeof this._level._getCameraX === "function") {
      return this._level._getCameraX(p);
    }
    return this._active ? this._cameraOffset : 0;
  }

  // ══════════════════════════════════════════════════════════════
  // Room management
  // ══════════════════════════════════════════════════════════════

  _addRoom() {
    this._roomCount++;
    this._ui.roomCount = this._roomCount;
    this._ui.showToast(`Room added, total ${this._roomCount} rooms`);
  }

  _deleteRoom() {
    if (this._roomCount <= 1) {
      this._ui.showToast("At least 1 room required");
      return;
    }
    this._roomCount--;
    this._ui.roomCount = this._roomCount;
    this._ui.showToast(`Room deleted, total ${this._roomCount} rooms`);
  }

  /** Draw room boundary dashed lines and auto-wall indicators (world space) */
  _drawRoomBoundaries(p) {
    const roomWidth = this._p.width;
    const wallThick = WALL_THICKNESS;
    const h = this._p.height;

    // Auto-wall semi-transparent indicator
    p.noStroke();
    p.fill(100, 100, 160, 50);
    p.rect(0, 0, wallThick, h);
    p.rect(this._roomCount * roomWidth - wallThick, 0, wallThick, h);

    // Room boundary dashed lines
    for (let i = 0; i <= this._roomCount; i++) {
      const bx = i * roomWidth;
      p.stroke(255, 200, 0, 160);
      p.strokeWeight(2);
      this._drawDashedLine(p, bx, 0, bx, h);
    }

    // Room labels
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

  /** Draw dashed line */
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

  /** Draw lightweight grid (visible area only) */
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

  /** Editor mode badge top-left */
  _drawEditorBadge(p) {
    p.push();
    p.resetMatrix();
    p.fill(220, 60, 60, 200);
    p.noStroke();
    p.rect(0, 0, 170, 28, 0, 0, 8, 0);
    p.fill(255);
    p.textSize(13);
    p.textAlign(p.LEFT, p.CENTER);
    p.text("🛠 Edit Mode  [M] Close", 8, 14);
    p.pop();
  }

  // ══════════════════════════════════════════════════════════════
  // Cleanup
  // ══════════════════════════════════════════════════════════════

  destroy() {
    this._saveSessionSnapshot();

    // Restore level's original _getCameraX
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

  _getSessionKey() {
    return (
      this._level.__editorPersistenceKey ||
      this._level.__levelIndex ||
      this._level.constructor.name
    );
  }

  _saveSessionSnapshot() {
    if (!this._sessionKey) return;
    EDITOR_SESSION_STORE.set(this._sessionKey, {
      active: this._active,
      cameraOffset: this._cameraOffset,
      roomCount: this._roomCount,
      spawn: {
        x: this._spawnX,
        y: this._spawnY,
        w: this._spawnPlayerW,
        h: this._spawnPlayerH,
      },
      records: this._entityMgr.serializeRecords(),
    });
  }

  _restoreSessionSnapshot() {
    if (!this._sessionKey) return;
    const snapshot = EDITOR_SESSION_STORE.get(this._sessionKey);
    if (!snapshot) return;

    this._active = !!snapshot.active;
    this._cameraOffset = snapshot.cameraOffset || 0;
    this._roomCount = snapshot.roomCount || this._roomCount;
    this._ui.roomCount = this._roomCount;

    if (snapshot.spawn) {
      this._spawnX = snapshot.spawn.x;
      this._spawnY = snapshot.spawn.y;
      this._spawnPlayerW = snapshot.spawn.w;
      this._spawnPlayerH = snapshot.spawn.h;
      this._applySpawnToPlayer();
    }

    this._entityMgr.restoreRecords(snapshot.records || []);
  }
}
