/**
 * PortalTransition - Manages the portal win-state transition effect
 *
 * Phases:
 * 1. SUCKED_IN (0-1000ms): Player rotates, shrinks, gets pulled into portal
 *    - Circular vignette follows player center, stays at full size
 *    - Sound effect plays at start
 *    - Game continues to display
 *
 * 2. FADE_OUT (1000-1500ms): Circular vignette shrinks from player center to point
 *    - Screen transitions to full black
 *    - Game still displays but is covered by shrinking mask
 *
 * 3. FADE_IN (TRANSITION_FINISHED-TRANSITION_FINISHED+1000ms):
 *    - Vignette expands from point at new player spawn
 *    - Used when loading next level from WinPage
 */
export class PortalTransition {
  constructor() {
    // Transition states
    this.isActive = false;
    this.startTime = null;
    this.mode = null; // 'exit' or 'enter'

    // Timings (ms)
    this.PHASE_SUCKED_IN = 1000;    // Portal sucking in phase
    this.PHASE_FADE_OUT = 500;      // Vignette shrinking phase (1000-1500)
    this.SUCKED_OUT_DURATION = this.PHASE_SUCKED_IN + this.PHASE_FADE_OUT; // Total for exit (1500ms)

    // Enter phase duration
    this.PHASE_FADE_IN = 1000;      // Vignette expanding phase for new level

    // Vignette state
    this.vignetteCenter = { x: 0, y: 0 };
    this.vignetteRadius = 0;
    this.maxVignetteRadius = 0;
  }

  /**
   * Start the transition when player reaches portal (EXIT mode)
   * @param {number} playerX - Player's x position at portal contact
   * @param {number} playerY - Player's y position at portal contact
   * @param {number} maxRadius - Maximum vignette radius (usually screen diagonal / 2)
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
   * Start the enter transition when loading new level (ENTER mode)
   * @param {number} newPlayerX - New player spawn x
   * @param {number} newPlayerY - New player spawn y
   */
  startEnter(newPlayerX, newPlayerY) {
    this.isActive = true;
    this.mode = 'enter';
    this.startTime = performance.now();
    this.vignetteCenter = { x: newPlayerX, y: newPlayerY };
    this.vignetteRadius = 0;
    this.maxVignetteRadius = Math.max(800,
      Math.hypot(newPlayerX - 400, newPlayerY - 300) * 1.5);
  }

  /**
   * Update transition state
   * @returns {string} Current phase: 'sucked_in', 'fade_out', 'fade_in', or 'done'
   */
  update() {
    if (!this.isActive || !this.startTime) return 'done';

    const now = performance.now();
    const elapsed = now - this.startTime;

    if (this.mode === 'exit') {
      if (elapsed < this.PHASE_SUCKED_IN) {
        return 'sucked_in';
      } else if (elapsed < this.SUCKED_OUT_DURATION) {
        // Shrink vignette to point
        const phaseProgress = (elapsed - this.PHASE_SUCKED_IN) / this.PHASE_FADE_OUT;
        this.vignetteRadius = this.maxVignetteRadius * (1 - phaseProgress);
        return 'fade_out';
      } else {
        this.isActive = false;
        return 'done';
      }
    } else if (this.mode === 'enter') {
      if (elapsed < this.PHASE_FADE_IN) {
        // Expand vignette from point
        const phaseProgress = elapsed / this.PHASE_FADE_IN;
        this.vignetteRadius = this.maxVignetteRadius * phaseProgress;
        return 'fade_in';
      } else {
        this.isActive = false;
        return 'done';
      }
    }

    return 'done';
  }

  /**
   * Check if EXIT transition's fade_out phase has started
   */
  shouldUnloadLevelSoon() {
    if (!this.isActive || this.mode !== 'exit' || !this.startTime) return false;
    const elapsed = performance.now() - this.startTime;
    return elapsed >= this.PHASE_SUCKED_IN * 0.8; // Start unloading near end of sucked_in
  }

  /**
   * Draw the vignette effect
   * @param {p5} p - p5 instance
   * @param {number} screenWidth - Canvas width
   * @param {number} screenHeight - Canvas height
   */
  draw(p, screenWidth, screenHeight) {
    if (!this.isActive || this.vignetteRadius < 0.5) {
      // If vignette is completely gone, fill screen with black
      if (this.isActive && this.vignetteRadius < 0.5) {
        p.fill(0);
        p.noStroke();
        p.rect(0, 0, screenWidth, screenHeight);
      }
      return;
    }

    p.push();
    p.resetMatrix();

    // Draw black background
    p.background(0);

    // Draw circular soft-edged vignette (revealed area)
    const edgeWidth = 40;
    const radius = this.vignetteRadius;
    const cx = this.vignetteCenter.x;
    const cy = this.vignetteCenter.y;

    // Draw concentric circles with gradient edges for smooth transition
    p.noStroke();
    for (let i = edgeWidth; i >= 0; i--) {
      const alpha = Math.floor((i / edgeWidth) * 180);
      const currentRadius = radius + i;
      p.fill(0, 0, 0, 255 - alpha);
      p.circle(cx, cy, currentRadius * 2);
    }

    // Draw main visible circle (fully transparent inside)
    p.fill(255, 255, 255, 0);
    p.noStroke();
    p.circle(cx, cy, radius * 2);

    p.pop();
  }
}
