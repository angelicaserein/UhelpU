/**
 * EditorPreview — Mouse hover preview (semi-transparent dashed frame)
 *
 * Based on current selected tool and mouse position, draw preview of entity to be placed in world space.
 * Coordinates snap to GRID_SIZE grid.
 */

import {
  EntityTool,
  GRID_SIZE,
  PORTAL_SIZE,
  PREVIEW_ALPHA,
  PLATFORM_DEFAULTS,
  SPIKE_DEFAULTS,
  WALL_DEFAULTS,
  WIRE_PORTAL_DEFAULTS,
  BTN_SPIKE_DEFAULTS,
  BTN_PLATFORM_DEFAULTS,
  NPC_SIZE,
  SIGNBOARD_SIZE,
  CHECKPOINT_SIZE,
  TEXT_PROMPT_DEFAULTS,
  ENEMY_DEFAULTS,
  TELEPORT_POINT_SIZE,
  BOX_DEFAULTS,
} from "./EditorConfig.js";

export class EditorPreview {
  constructor() {
    /** Last computed preview world coordinate and size */
    this.previewX = 0;
    this.previewY = 0;
    this.previewW = 0;
    this.previewH = 0;
    this.visible = false;
  }

  /**
   * Update preview position based on screen mouse position.
   *
   * @param {number} screenMX   Screen space mouse X
   * @param {number} screenMY   Screen space mouse Y
   * @param {number} canvasH    Canvas height
   * @param {number} cameraX    Current camera X offset (world coordinates)
   * @param {string} tool       Current tool type (EntityTool)
   * @param {number} groundW    Current Ground width (only valid in Ground mode)
   * @param {number} groundH    Current Ground height (only valid in Ground mode)
   * @param {boolean} insideToolbar Is mouse over toolbar
   */
  update(
    screenMX,
    screenMY,
    canvasH,
    cameraX,
    tool,
    groundW,
    groundH,
    insideToolbar,
  ) {
    if (insideToolbar || tool === EntityTool.SPAWN) {
      this.visible = false;
      return;
    }

    // Screen → world coordinates (Y axis flipped)
    const worldX = screenMX + cameraX;
    const worldY = canvasH - screenMY;

    if (tool === EntityTool.GROUND) {
      this.previewW = groundW;
      this.previewH = groundH;
    } else if (tool === EntityTool.PLATFORM) {
      this.previewW = PLATFORM_DEFAULTS.width;
      this.previewH = PLATFORM_DEFAULTS.height;
    } else if (tool === EntityTool.SPIKE) {
      this.previewW = SPIKE_DEFAULTS.width;
      this.previewH = SPIKE_DEFAULTS.height;
    } else if (tool === EntityTool.WALL) {
      this.previewW = WALL_DEFAULTS.width;
      this.previewH = WALL_DEFAULTS.height;
    } else if (tool === EntityTool.WIRE_PORTAL) {
    } else if (tool === EntityTool.BOX) {
      this.previewW = BOX_DEFAULTS.width;
      this.previewH = BOX_DEFAULTS.height;
    } else if (tool === EntityTool.WIRE_PORTAL) {
      this.previewW = WIRE_PORTAL_DEFAULTS.buttonWidth;
      this.previewH = WIRE_PORTAL_DEFAULTS.buttonHeight;
    } else if (tool === EntityTool.BTN_SPIKE) {
      this.previewW = BTN_SPIKE_DEFAULTS.buttonWidth;
      this.previewH = BTN_SPIKE_DEFAULTS.buttonHeight;
    } else if (tool === EntityTool.BTN_PLATFORM) {
      this.previewW = BTN_PLATFORM_DEFAULTS.buttonWidth;
      this.previewH = BTN_PLATFORM_DEFAULTS.buttonHeight;
    } else if (tool === EntityTool.NPC) {
      this.previewW = NPC_SIZE.width;
      this.previewH = NPC_SIZE.height;
    } else if (tool === EntityTool.SIGNBOARD) {
      this.previewW = SIGNBOARD_SIZE.width;
      this.previewH = SIGNBOARD_SIZE.height;
    } else if (tool === EntityTool.TEXT_PROMPT) {
      this.previewW = TEXT_PROMPT_DEFAULTS.width;
      this.previewH = TEXT_PROMPT_DEFAULTS.height;
    } else if (tool === EntityTool.CHECKPOINT) {
      this.previewW = CHECKPOINT_SIZE.width;
      this.previewH = CHECKPOINT_SIZE.height;
    } else if (tool === EntityTool.TELEPORT_POINT) {
      this.previewW = TELEPORT_POINT_SIZE.width;
      this.previewH = TELEPORT_POINT_SIZE.height;
    } else if (tool === EntityTool.ENEMY) {
      this.previewW = ENEMY_DEFAULTS.width;
      this.previewH = ENEMY_DEFAULTS.height;
    } else {
      this.previewW = PORTAL_SIZE.width;
      this.previewH = PORTAL_SIZE.height;
    }

    // Snap to grid, using entity center as anchor
    this.previewX = this._snap(worldX - this.previewW / 2);
    this.previewY = this._snap(worldY - this.previewH / 2);

    this.visible = true;
  }

  /**
   * Draw preview frame in world space.
   * When called, p5 transformation should already be in flipped + translated world coordinate system.
   */
  draw(p, tool) {
    if (!this.visible) return;

    p.push();
    p.noFill();
    p.strokeWeight(2);

    if (tool === EntityTool.GROUND) {
      p.stroke(120, 200, 120, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(120, 200, 120, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.PLATFORM) {
      p.stroke(180, 180, 100, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(180, 180, 100, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.SPIKE) {
      p.stroke(220, 80, 80, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(220, 80, 80, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.WALL) {
      p.stroke(140, 140, 160, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(140, 140, 160, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.BOX) {
      p.stroke(200, 140, 100, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(200, 140, 100, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.WIRE_PORTAL) {
      // Button preview (purple)
      p.stroke(180, 100, 240, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
    } else if (tool === EntityTool.TEXT_PROMPT) {
      p.stroke(100, 220, 200, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(100, 220, 200, PREVIEW_ALPHA * 0.35);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
      p.noStroke();
      p.fill(180, 100, 240, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);

      // Portal preview (offset position)
      const portalX = this.previewX + WIRE_PORTAL_DEFAULTS.offsetX;
      const portalY = this.previewY;
      const portalW = WIRE_PORTAL_DEFAULTS.portalWidth;
      const portalH = WIRE_PORTAL_DEFAULTS.portalHeight;
      p.stroke(180, 100, 240, PREVIEW_ALPHA);
      this._dashedRect(p, portalX, portalY, portalW, portalH, 8);
      p.noStroke();
      p.fill(180, 100, 240, PREVIEW_ALPHA * 0.3);
      p.rect(portalX, portalY, portalW, portalH);

      // Connection line
      p.stroke(180, 100, 240, PREVIEW_ALPHA * 0.6);
      p.strokeWeight(1);
      this._dashedLine(
        p,
        this.previewX + this.previewW / 2,
        this.previewY + this.previewH,
        portalX + portalW / 2,
        portalY + portalH,
        6,
      );
      p.strokeWeight(2);
    } else if (tool === EntityTool.BTN_SPIKE) {
      // Button preview (orange)
      p.stroke(240, 160, 30, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(240, 160, 30, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);

      // Spike preview (offset position)
      const spikeX = this.previewX + BTN_SPIKE_DEFAULTS.offsetX;
      const spikeY = this.previewY;
      const spikeW = BTN_SPIKE_DEFAULTS.spikeWidth;
      const spikeH = BTN_SPIKE_DEFAULTS.spikeHeight;
      p.stroke(240, 160, 30, PREVIEW_ALPHA);
      this._dashedRect(p, spikeX, spikeY, spikeW, spikeH, 8);
      p.noStroke();
      p.fill(240, 160, 30, PREVIEW_ALPHA * 0.3);
      p.rect(spikeX, spikeY, spikeW, spikeH);

      // Connection line
      p.stroke(240, 160, 30, PREVIEW_ALPHA * 0.6);
      p.strokeWeight(1);
      this._dashedLine(
        p,
        this.previewX + this.previewW / 2,
        this.previewY + this.previewH,
        spikeX + spikeW / 2,
        spikeY + spikeH,
        6,
      );
      p.strokeWeight(2);
    } else if (tool === EntityTool.BTN_PLATFORM) {
      // Button preview (cyan/green)
      p.stroke(60, 180, 140, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(60, 180, 140, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);

      // Platform preview (offset position)
      const platX = this.previewX + BTN_PLATFORM_DEFAULTS.offsetX;
      const platY = this.previewY;
      const platW = BTN_PLATFORM_DEFAULTS.platformWidth;
      const platH = BTN_PLATFORM_DEFAULTS.platformHeight;
      p.stroke(60, 180, 140, PREVIEW_ALPHA);
      this._dashedRect(p, platX, platY, platW, platH, 8);
      p.noStroke();
      p.fill(60, 180, 140, PREVIEW_ALPHA * 0.3);
      p.rect(platX, platY, platW, platH);

      // Connection line
      p.stroke(60, 180, 140, PREVIEW_ALPHA * 0.6);
      p.strokeWeight(1);
      this._dashedLine(
        p,
        this.previewX + this.previewW / 2,
        this.previewY + this.previewH,
        platX + platW / 2,
        platY + platH,
        6,
      );
      p.strokeWeight(2);
    } else if (tool === EntityTool.NPC) {
      p.stroke(60, 200, 220, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(60, 200, 220, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.SIGNBOARD) {
      p.stroke(200, 160, 80, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(200, 160, 80, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.CHECKPOINT) {
      p.stroke(200, 80, 180, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(200, 80, 180, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.TELEPORT_POINT) {
      p.stroke(100, 180, 255, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(100, 180, 255, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else if (tool === EntityTool.ENEMY) {
      p.stroke(100, 200, 100, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(100, 200, 100, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    } else {
      p.stroke(100, 160, 255, PREVIEW_ALPHA);
      this._dashedRect(
        p,
        this.previewX,
        this.previewY,
        this.previewW,
        this.previewH,
        8,
      );
      p.noStroke();
      p.fill(100, 160, 255, PREVIEW_ALPHA * 0.4);
      p.rect(this.previewX, this.previewY, this.previewW, this.previewH);
    }

    // Coordinate annotation
    p.push();
    p.translate(this.previewX, this.previewY + this.previewH);
    p.scale(1, -1); // Flip back to normal text direction
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text(
      `(${this.previewX}, ${this.previewY})  ${this.previewW}×${this.previewH}`,
      2,
      2,
    );
    p.pop();

    p.pop();
  }

  // ── Internal utilities ──────────────────────────────────────────────

  _snap(v) {
    return Math.round(v / GRID_SIZE) * GRID_SIZE;
  }

  /** Draw dashed rectangle using short line segments */
  _dashedRect(p, x, y, w, h, dashLen) {
    this._dashedLine(p, x, y, x + w, y, dashLen);
    this._dashedLine(p, x + w, y, x + w, y + h, dashLen);
    this._dashedLine(p, x + w, y + h, x, y + h, dashLen);
    this._dashedLine(p, x, y + h, x, y, dashLen);
  }

  _dashedLine(p, x1, y1, x2, y2, dashLen) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(len / dashLen);
    const ux = dx / len;
    const uy = dy / len;
    for (let i = 0; i < steps; i += 2) {
      const sx = x1 + ux * dashLen * i;
      const sy = y1 + uy * dashLen * i;
      const ex = x1 + ux * dashLen * Math.min(i + 1, steps);
      const ey = y1 + uy * dashLen * Math.min(i + 1, steps);
      p.line(sx, sy, ex, ey);
    }
  }
}
