/**
 * PortalTransition - Manages the portal win-state transition effect
 *
 * Three phases:
 * 1. SUCKED_IN_AND_SHRINK (0-1500ms):
 *    - Player rotates and shrinks, moving towards portal center
 *    - Circular vignette appears, center follows player
 *    - Vignette shrinks from full screen to a point
 *    - Circle interior shows game, exterior is black
 *
 * 2. BLACK_SCREEN (1500-duration):
 *    - Complete black screen (vignette is now a point)
 *    - Next level loads
 *
 * 3. EXPAND (next level active):
 *    - From a point at new player spawn, vignette expands outward
 *    - Circle interior shows new game, exterior is black
 *    - Expands until full screen is visible
 */
export class PortalTransition {
  constructor() {
    this.isActive = false;
    this.startTime = null;
    this.mode = null; // 'exit' or 'enter'

    // Phase timings
    this.TOTAL_EXIT_DURATION = 1500; // SUCKED_IN + SHRINK both happen during this
    this.PHASE_FADE_IN = 1000;       // For ENTER mode

    // Vignette state
    this.vignetteCenter = { x: 0, y: 0 };
    this.vignetteRadius = 0;
    this.maxVignetteRadius = 0;
  }

  /**
   * Start EXIT transition (player reaches portal)
   * @param {number} playerX - Player center x
   * @param {number} playerY - Player center y
   * @param {number} maxRadius - Full-screen radius
   */
  startExit(playerX, playerY, maxRadius) {
    this.isActive = true;
    this.mode = 'exit';
    this.startTime = performance.now();
    this.vignetteCenter = { x: playerX, y: playerY };
    this.vignetteRadius = maxRadius;
    this.maxVignetteRadius = maxRadius;
  }

  /**
   * Start ENTER transition (new level loaded)
   * @param {number} newPlayerX - New player spawn x
   * @param {number} newPlayerY - New player spawn y
   * @param {number} maxRadius - Full-screen radius
   */
  startEnter(newPlayerX, newPlayerY, maxRadius) {
    this.isActive = true;
    this.mode = 'enter';
    this.startTime = performance.now();
    this.vignetteCenter = { x: newPlayerX, y: newPlayerY };
    this.vignetteRadius = 0; // Start from a point
    this.maxVignetteRadius = maxRadius;
  }

  /**
   * Update and return current phase
   * @returns {string} 'exit_active', 'enter_active', or 'done'
   */
  update() {
    if (!this.isActive || !this.startTime) return 'done';

    const now = performance.now();
    const elapsed = now - this.startTime;

    if (this.mode === 'exit') {
      if (elapsed < this.TOTAL_EXIT_DURATION) {
        // Shrink vignette from full to point over 1500ms
        const progress = elapsed / this.TOTAL_EXIT_DURATION;
        this.vignetteRadius = this.maxVignetteRadius * (1 - progress);
        return 'exit_active';
      } else {
        this.isActive = false;
        this.vignetteRadius = 0;
        return 'done';
      }
    } else if (this.mode === 'enter') {
      if (elapsed < this.PHASE_FADE_IN) {
        // Expand vignette from point to full over 1000ms
        const progress = elapsed / this.PHASE_FADE_IN;
        this.vignetteRadius = this.maxVignetteRadius * progress;
        return 'enter_active';
      } else {
        this.isActive = false;
        this.vignetteRadius = this.maxVignetteRadius;
        return 'done';
      }
    }

    return 'done';
  }

  /**
   * Apply vignette mask to game rendering
   * Call before drawing game: creates circular clip region
   * Call after with restoreClip() to restore
   *
   * Returns true if clipping was applied, false if full screen
   */
  applyClip(p) {
    if (!this.isActive || this.vignetteRadius < 0) {
      return false; // No clipping needed
    }

    if (this.vignetteRadius <= 0) {
      // Complete black - no game visible
      p.clear(); // Clear to transparent
      return false;
    }

    // Create circular clipping region
    // Game will only render inside this circle
    p.push();
    p.resetMatrix();

    // Draw black background first
    p.background(0);

    p.pop();

    // Now apply circular clip via mask
    const cx = this.vignetteCenter.x;
    const cy = this.vignetteCenter.y;
    const r = this.vignetteRadius;

    // Create a mask graphics to define clipping region
    const maskGraphics = p.createGraphics(p.width, p.height);
    maskGraphics.background(0); // Transparent

    // Draw white circle (visible region)
    maskGraphics.fill(255);
    maskGraphics.noStroke();
    maskGraphics.circle(cx, cy, r * 2);

    // Soft edges via alpha
    const edgeWidth = 50;
    for (let i = 1; i <= edgeWidth; i++) {
      const alpha = (edgeWidth - i) / edgeWidth * 255;
      maskGraphics.fill(255, alpha);
      maskGraphics.circle(cx, cy, (r + i) * 2);
    }

    // Apply mask
    p.image(maskGraphics, 0, 0);
    maskGraphics.remove();

    return true;
  }

  /**
   * Draw vignette overlay on screen
   * Circle interior shows game, exterior is black
   */
  drawOverlay(p, screenWidth, screenHeight) {
    if (!this.isActive) return;

    // Debug
    if (!this._debugLogged) {
      console.log("[PortalTransition.drawOverlay] Drawing vignette, radius:", this.vignetteRadius, "center:", this.vignetteCenter);
      this._debugLogged = true;
    }

    p.push();
    p.noStroke();

    const cx = this.vignetteCenter.x;
    const cy = this.vignetteCenter.y;
    const r = this.vignetteRadius;

    if (r <= 1) {
      // Completely black
      p.fill(0);
      p.rect(0, 0, screenWidth, screenHeight);
    } else {
      // Black background
      p.fill(0);
      p.rect(0, 0, screenWidth, screenHeight);

      // Clear circle (show the inside) with soft edges
      const edgeWidth = 50;

      // Draw concentric circles with decreasing opacity
      // Starting from outermost edge moving inward
      for (let i = edgeWidth; i >= 0; i--) {
        // Blend from black (at edge) to transparent (inside circle)
        const alpha = Math.floor((i / edgeWidth) * 220);
        const radius = r + i;

        p.fill(0, 0, 0, alpha);
        p.circle(cx, cy, radius * 2);
      }

      // Clear the center completely (show game)
      p.fill(255, 255, 255, 0); // Transparent
      p.circle(cx, cy, r * 2);
    }

    p.pop();
  }
}

