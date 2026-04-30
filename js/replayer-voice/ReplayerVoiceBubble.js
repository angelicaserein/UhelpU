const FONT_STACK = '"HYPixel11", "PixelFont", "Courier New", monospace';

export class ReplayerVoiceBubble {
  constructor(options = {}) {
    this.durationMs = options.durationMs ?? 4000;
    this.enterDurationMs =
      options.enterDurationMs ?? Math.round((20 / 60) * 1000);
    this.exitDurationMs = options.exitDurationMs ?? 260;
    this.labelText = options.labelText ?? "幻影";
    this._openChatHandler =
      typeof options.onOpenChat === "function" ? options.onOpenChat : null;
    this.text = "";
    this.isVisible = false;
    this._phase = "hidden";
    this._enterStartedAt = 0;
    this._exitStartedAt = 0;
    this._hideTimer = null;
    this._interactiveBounds = null;
    this._isHovered = false;
  }

  setLabelText(labelText) {
    this.labelText = typeof labelText === "string" ? labelText : this.labelText;
    // Note: label text is set in constructor
  }

  setOpenChatHandler(handler) {
    this._openChatHandler = typeof handler === "function" ? handler : null;
  }

  setHovered(isHovered) {
    this._isHovered =
      Boolean(isHovered) && this.isVisible && Boolean(this.text);
  }

  updateInteraction(p) {
    if (!p || !this.isVisible || !this.text || !this._interactiveBounds) {
      this._isHovered = false;
      return false;
    }

    const mouseX = Number.isFinite(p.mouseX) ? p.mouseX : -Infinity;
    const mouseY = Number.isFinite(p.mouseY) ? p.mouseY : -Infinity;
    this._isHovered = this.containsPoint(mouseX, mouseY);
    return this._isHovered;
  }

  containsPoint(x, y) {
    // Early return if bubble not visible or has no text | 气泡不可见或没有文本时提前返回
    if (!this.isVisible || !this.text || !this._interactiveBounds) {
      return false;
    }

    return (
      x >= this._interactiveBounds.left &&
      x <= this._interactiveBounds.right &&
      y >= this._interactiveBounds.top &&
      y <= this._interactiveBounds.bottom
    );
  }

  handleClick(x, y) {
    if (!this.containsPoint(x, y) || !this._openChatHandler) {
      return false;
    }

    this._openChatHandler();
    return true;
  }

  showBubble(text) {
    const nextText = typeof text === "string" ? text.trim() : "";
    if (!nextText) {
      this.hideBubble();
      return;
    }

    this.text = nextText;
    this.isVisible = true;
    this._phase = "entering";
    this._enterStartedAt = performance.now();
    this._exitStartedAt = 0;

    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
    }

    this._hideTimer = setTimeout(() => {
      this._startExit();
    }, this.durationMs);
  }

  hideBubble() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }

    this.text = "";
    this.isVisible = false;
    this._phase = "hidden";
    this._enterStartedAt = 0;
    this._exitStartedAt = 0;
    this._interactiveBounds = null;
    this._isHovered = false;
  }

  draw(p) {
    if (!this.isVisible || !this.text || !p) {
      return;
    }

    const canvasWidth = Number.isFinite(p.width) ? p.width : 0;
    const canvasHeight = Number.isFinite(p.height) ? p.height : 0;
    if (canvasWidth <= 0 || canvasHeight <= 0) {
      return;
    }

    const animation = this._getAnimationState();
    if (!animation.visible) {
      return;
    }

    const bubbleMaxWidth = Math.min(800, Math.max(260, canvasWidth - 48));
    const paddingX = 18;
    const paddingTop = 8;
    const paddingBottom = 10;
    const labelHeight = 20;
    const labelWidth = 72;
    const lineHeight = 16;
    const textSize = 14;
    const radius = 10;
    const maxBubbleHeight = 80;
    const textTopGap = 6;
    const innerWidth = bubbleMaxWidth - paddingX * 2;

    p.push();
    if (typeof p.resetMatrix === "function") {
      p.resetMatrix();
    }

    this._applyTextStyle(p, textSize, lineHeight);
    const maxTextBlockHeight = Math.max(
      lineHeight,
      maxBubbleHeight - paddingTop - labelHeight - textTopGap - paddingBottom,
    );
    const maxLineCount = Math.max(
      1,
      Math.floor(maxTextBlockHeight / lineHeight),
    );
    const lines = this._wrapText(p, this.text, innerWidth).slice(
      0,
      maxLineCount,
    );
    const textBlockHeight = Math.max(lineHeight, lines.length * lineHeight);
    const bubbleHeight =
      paddingTop + labelHeight + textTopGap + textBlockHeight + paddingBottom;
    const baseX = canvasWidth / 2;
    const left = Math.round(baseX - bubbleMaxWidth / 2);
    const top = Math.round(canvasHeight - bubbleHeight - animation.offsetY);
    const right = left + bubbleMaxWidth;
    const bottom = top + bubbleHeight;
    const labelLeft = left + 14;
    const labelTop = top + paddingTop;

    this._interactiveBounds = {
      left,
      top,
      right,
      bottom,
    };
    this.updateInteraction(p);
    // Debug logging for hover state | 调试悬停状态的日志记录
    console.log(
      "hover:",
      this._isHovered,
      "mouseX:",
      p.mouseX,
      "mouseY:",
      p.mouseY,
    );
    const borderAlphaBoost = this._isHovered ? 1 : 0;

    p.noStroke();
    p.fill(12, 10, 31, 45 * animation.alpha);
    p.rect(left + 6, top + 8, bubbleMaxWidth, bubbleHeight, radius);

    p.stroke(98, 255, 234, (70 + 60 * borderAlphaBoost) * animation.alpha);
    p.strokeWeight(4);
    p.noFill();
    p.rect(left, top, bubbleMaxWidth, bubbleHeight, radius);

    p.stroke(192, 170, 255, (215 + 40 * borderAlphaBoost) * animation.alpha);
    p.strokeWeight(1.5);
    p.fill(24, 16, 47, 236 * animation.alpha);
    p.rect(left, top, bubbleMaxWidth, bubbleHeight, radius);

    p.noStroke();
    p.fill(
      34 + 10 * borderAlphaBoost,
      24 + 8 * borderAlphaBoost,
      67,
      215 * animation.alpha,
    );
    p.rect(left + 8, top + 8, bubbleMaxWidth - 16, bubbleHeight - 16, 6);

    p.noStroke();
    p.fill(20, 16, 44, 246 * animation.alpha);
    p.rect(labelLeft, labelTop, labelWidth, labelHeight, 4);
    p.stroke(125, 231, 255, 220 * animation.alpha);
    p.strokeWeight(1.25);
    p.noFill();
    p.rect(labelLeft, labelTop, labelWidth, labelHeight, 4);

    p.noStroke();
    p.fill(228, 247, 255, 255 * animation.alpha);
    this._applyTextStyle(p, 13, 16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(
      this.labelText,
      labelLeft + labelWidth / 2,
      labelTop + labelHeight / 2 + 1,
    );

    this._applyTextStyle(p, textSize, lineHeight);
    p.textAlign(p.LEFT, p.TOP);
    p.fill(225, 248, 255, 255 * animation.alpha);
    p.text(
      lines.join("\n"),
      left + paddingX,
      top + paddingTop + labelHeight + textTopGap,
    );

    p.fill(122, 232, 255, 130 * animation.alpha);
    p.rect(left + 12, bottom - 10, 56, 2);
    p.fill(201, 173, 255, 105 * animation.alpha);
    p.rect(right - 74, bottom - 10, 62, 2);

    if (this._isHovered) {
      p.noStroke();
      p.fill(122, 232, 255, 110 * animation.alpha);
      p.rect(right - 142, labelTop + 4, 112, 12, 3);
      p.fill(18, 14, 38, 245 * animation.alpha);
      this._applyTextStyle(p, 10, 12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("CLICK TO TALK", right - 86, labelTop + 10);
    }

    p.pop();
  }

  destroy() {
    this.hideBubble();
  }

  _startExit() {
    if (!this.isVisible || this._phase === "exiting") {
      return;
    }

    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }

    this._phase = "exiting";
    this._exitStartedAt = performance.now();
  }

  _getAnimationState() {
    if (!this.isVisible || this._phase === "hidden") {
      return { visible: false, alpha: 0, offsetY: 0 };
    }

    const now = performance.now();

    if (this._phase === "entering") {
      const progress = this._clamp01(
        (now - this._enterStartedAt) / this.enterDurationMs,
      );
      if (progress >= 1) {
        this._phase = "visible";
      }
      return {
        visible: true,
        alpha: progress,
        offsetY: (1 - progress) * 28,
      };
    }

    if (this._phase === "exiting") {
      const progress = this._clamp01(
        (now - this._exitStartedAt) / this.exitDurationMs,
      );
      if (progress >= 1) {
        this.hideBubble();
        return { visible: false, alpha: 0, offsetY: 0 };
      }
      return {
        visible: true,
        alpha: 1 - progress,
        offsetY: 0,
      };
    }

    return { visible: true, alpha: 1, offsetY: 0 };
  }

  _wrapText(p, text, maxWidth) {
    const paragraphs = String(text).split(/\n+/);
    const lines = [];

    for (const paragraph of paragraphs) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push("");
        continue;
      }

      let currentLine = "";
      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (p.textWidth(candidate) <= maxWidth) {
          currentLine = candidate;
          continue;
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        if (p.textWidth(word) <= maxWidth) {
          currentLine = word;
          continue;
        }

        const fragments = this._breakLongToken(p, word, maxWidth);
        for (let index = 0; index < fragments.length - 1; index += 1) {
          lines.push(fragments[index]);
        }
        currentLine = fragments[fragments.length - 1] || "";
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines.length > 0 ? lines : [""];
  }

  _breakLongToken(p, token, maxWidth) {
    const chars = Array.from(token);
    const fragments = [];
    let current = "";

    for (const char of chars) {
      const candidate = current + char;
      if (current && p.textWidth(candidate) > maxWidth) {
        fragments.push(current);
        current = char;
      } else {
        current = candidate;
      }
    }

    if (current) {
      fragments.push(current);
    }

    return fragments.length > 0 ? fragments : [token];
  }

  _applyTextStyle(p, textSize, lineHeight) {
    if (typeof p.textFont === "function") {
      p.textFont(FONT_STACK);
    }
    if (p.drawingContext) {
      p.drawingContext.font = `${textSize}px ${FONT_STACK}`;
    }
    p.textSize(textSize);
    p.textLeading(lineHeight);
  }

  _clamp01(value) {
    return Math.min(1, Math.max(0, value));
  }
}
