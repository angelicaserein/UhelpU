import { t } from "../../i18n/index.js";
import { Assets } from "../../AssetsManager.js";
import { KeyPrompt } from "./KeyPrompt.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";

export class TextPrompt extends KeyPrompt {
  /**
   * @param {number} x - Game coordinate x | 游戏坐标 x
   * @param {number} y - Game coordinate y | 游戏坐标 y
   * @param {BaseLevel} level - Parent level | 所属关卡
   * @param {object} options - Configuration options | 配置选项
   * @param {() => boolean} [options.visibilityFn] - Returns true when this prompt should be visible | 当此提示应显示时返回 true
   */
  constructor(x, y, level = null, options = {}) {
    super(x, y, level, { keys: [] });
    this.type = "textprompt";
    this.textKey = options.textKey || "";
    this._boxWidth = options.width || 280;
    this._boxHeight = options.height || 72;
    this._textSizeValue = options.textSize || 14;
    this._lineHeight =
      options.lineHeight || Math.round(this._textSizeValue * 1.3);
    this._textColor = options.color || [255, 255, 255];
    this._visibilityFn = options.visibilityFn || null;
    this._showDistance = options.showDistance || 50;
    this._hideDistance = options.hideDistance || 150;
    this._onTrigger = options.onTrigger || null;
    this._wasVisible = false;
  }

  update(p) {
    if (this._visibilityFn && !this._visibilityFn()) {
      this._targetAlpha = 0;
      this._currentAlpha = 0;
      this._wasVisible = false;
      return;
    }
    super.update(p);

    const isVisible = this._targetAlpha > 0;
    if (isVisible && !this._wasVisible && this._onTrigger) {
      this._onTrigger();
    }
    this._wasVisible = isVisible;
  }

  draw(p) {
    if (this._currentAlpha < 0.01 || !this.textKey) return;

    const alpha = Math.floor(this._currentAlpha * 255);
    const label = KeyBindingManager.resolveKeyPlaceholders(t(this.textKey));

    p.push();
    p.translate(this.x, this.y + this._boxHeight);
    p.scale(1, -1);
    p.fill(this._textColor[0], this._textColor[1], this._textColor[2], alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) {
      p.textFont(Assets.customFont);
    }
    p.textSize(this._textSizeValue);
    p.textStyle(p.BOLD);
    p.textLeading(this._lineHeight);
    p.text(label, 0, 0, this._boxWidth, this._boxHeight);
    p.pop();
  }

  _getLayoutBounds() {
    return {
      width: this._boxWidth,
      height: this._boxHeight,
    };
  }
}
