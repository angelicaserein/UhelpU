import { GameEntity } from "../base/GameEntity.js";
import { KeyBindingManager } from "../../key-binding-system/KeyBindingManager.js";

/**
 * Key Prompt - Display hollow white key prompt
 * 按键提示 - 显示按键镂空白色提示
 * Calculate transparency based on distance to player (appear when close, fade when far)
 * 根据与玩家的距离计算透明度（靠近显现，远离渐隐）
 *
 * Support two modes:
 * 支持两种模式：
 * 1. Manually specify keys array (fixed labels)
 * 1. 手动指定 keys 数组（固定标签）
 * 2. Specify intent (auto fetch from KeyBindingManager and follow binding changes)
 * 2. 指定 intent（自动从 KeyBindingManager 获取并跟随绑定变更）
 */
export class KeyPrompt extends GameEntity {
  /**
   * @param {number} x - Game coordinate x | 游戏坐标 x
   * @param {number} y - Game coordinate y | 游戏坐标 y
   * @param {BaseLevel} level - Parent level | 所属关卡
   * @param {{keys?: Array<{col:number,row:number,label:string}>, intent?: string}} options - Configuration options | 配置选项
   */
  constructor(x, y, level = null, options = {}) {
    super(x, y);
    this.type = "keyprompt";
    this.level = level;
    this.zIndex = -3; // 在木牌上方，交互物下方

    // Transparency related
    // 透明度相关
    this._currentAlpha = 0;
    this._targetAlpha = 0;
    // Transparency change speed
    // 透明度变化速度

    this._fadeSpeed = 2; // Transparency change speed | 距离相关（像素）
    this._showDistance = 50; // Start showing distance | 开始显示的距离
    this._hideDistance = 150; // Completely hidden distance | 完全隐藏的距离

    // Keyboard layout size
    // 键盘布局尺寸
    this._keySize = 28;
    this._keySpacing = 6;
    this._keyStrokeWeight = 2;
    this._keyColor = [255, 255, 255]; // white | 白色

    // intent mode: auto fetch label from KeyBindingManager and follow binding changes
    // intent 模式：从 KeyBindingManager 自动获取标签并跟随绑定变更
    this._intent = options.intent || null;
    this._onBindingChange = null;

    if (this._intent) {
      this._keyBindingManager = KeyBindingManager.getInstance();
      this.keys = [{ col: 0, row: 0, label: "" }];
      this._updateLabelFromBinding();
      this._onBindingChange = () => this._updateLabelFromBinding();
      this._keyBindingManager.onChange(this._onBindingChange);
    } else {
      // Default layout:
      // 默认布局：
      //  ASD
      //   W
      this.keys = options.keys || [
        { col: 0, row: 0, label: "A" },
        { col: 1, row: 0, label: "S" },
        { col: 2, row: 0, label: "D" },
        { col: 1, row: 1, label: "W" },
      ];
    }
  }

  /**
   * Update label from KeyBindingManager (intent mode)
   * 从 KeyBindingManager 更新 label（intent 模式）
   */
  _updateLabelFromBinding() {
    const keyCode = this._keyBindingManager.getKeyByIntent(this._intent);
    if (this.keys.length > 0) {
      this.keys[0].label = KeyBindingManager.keyCodeToLabel(keyCode);
    }
  }

  /**
   * Clean up binding change listener
   * 清理绑定变更监听
   */
  clearListeners() {
    if (this._onBindingChange && this._keyBindingManager) {
      this._keyBindingManager.offChange(this._onBindingChange);
      this._onBindingChange = null;
    }
  }

  /**
   * Update each frame: calculate distance to player, update transparency
   * 每帧更新：计算与玩家的距离，更新透明度
   */
  update(p) {
    if (!this.level || this._hidden) {
      this._currentAlpha = 0;
      return;
    }

    const player = this.level.getPlayer();
    if (!player) {
      this._targetAlpha = 0;
      return;
    }

    // Calculate distance to player center
    // 计算与玩家中心的距离
    const playerCenterX = player.x + (player.collider?.w || 0) / 2;
    const playerCenterY = player.y + (player.collider?.h || 0) / 2;
    const bounds = this._getLayoutBounds();
    const promptCenterX = this.x + bounds.width / 2;
    const promptCenterY = this.y + bounds.height / 2;
    const dx = playerCenterX - promptCenterX;
    const dy = playerCenterY - promptCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate target transparency based on distance
    // 基于距离计算目标透明度
    if (distance < this._showDistance) {
      this._targetAlpha = 1;
    } else if (distance > this._hideDistance) {
      this._targetAlpha = 0;
    } else {
      // Linear interpolation
      // 线性插值
      this._targetAlpha =
        1 -
        (distance - this._showDistance) /
          (this._hideDistance - this._showDistance);
    }

    // Smooth transition of transparency
    // 平滑过渡透明度
    if (Math.abs(this._currentAlpha - this._targetAlpha) > 0.01) {
      this._currentAlpha += (this._targetAlpha - this._currentAlpha) * 0.1;
    } else {
      this._currentAlpha = this._targetAlpha;
    }
  }

  /**
   * Draw key prompt (hollow white)
   * 绘制按键提示（镓空白色）
   */
  draw(p) {
    if (this._currentAlpha < 0.01) return;

    p.push();
    p.translate(this.x, this.y);

    const alpha = Math.floor(this._currentAlpha * 255);
    const strokeCol = this._keyColor;

    for (const key of this.keys) {
      const width = key.width || this._keySize;
      this._drawKey(p, key.col, key.row, key.label, strokeCol, alpha, width);
    }

    p.pop();
  }

  /**
   * Draw single key button (hollow rectangle + text)
   * 绘制单个键按钮（镂空矩形 + 文字）
   * Text auto-compensates for global Y-axis flip, keeps correct direction
   * 文字自动补偿游戏全局Y轴翻转，保持正确方向
   * @param {p5} p - p5 instance | p5 实例
   * @param {number} col - Column (0=left, 1=center, 2=right) | 列数（0=左, 1=中, 2=右）
   * @param {number} row - Row (0=up, 1=down) | 行数（0=上, 1=下）
   * @param {string} label - Key text | 按键文字
   * @param {array} color - RGB color | RGB 颜色
   * @param {number} alpha - Transparency 0-255 | 透明度 0-255
   * @param {number} width - Key width (optional, default keySize) | 按键宽度（可选，默认 keySize）
   */
  _drawKey(p, col, row, label, color, alpha, width = this._keySize) {
    const x = col * (this._keySize + this._keySpacing);
    const y = row * (this._keySize + this._keySpacing);
    // Draw rectangle frame (hollow)    // 绘制矩形框（镂空）
    p.push();
    p.stroke(color[0], color[1], color[2], alpha);
    p.strokeWeight(this._keyStrokeWeight);
    p.noFill();
    p.rect(x, y, width, this._keySize, 2);
    p.pop();
    // Draw text (need reverse Y-axis flip to compensate for global flip)    // 绘制文字（需要反向Y轴翻转以补偿全局翻转）
    p.push();
    p.translate(x + width / 2, y + this._keySize / 2);
    p.scale(1, -1); // 反向Y轴翻转以补偿游戏全局翻转
    p.translate(-(x + width / 2), -(y + this._keySize / 2));

    p.fill(color[0], color[1], color[2], alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.text(label, x + width / 2, y + this._keySize / 2);
    p.pop();
  }

  /**
   * Calculate bounding box size of current key layout
   * 计算当前按键布局的包围盒尺寸
   */
  _getLayoutBounds() {
    if (!this.keys.length) {
      return { width: this._keySize, height: this._keySize };
    }

    let maxCol = 0;
    let maxRow = 0;
    let totalWidth = 0;

    for (const key of this.keys) {
      if (key.col > maxCol) maxCol = key.col;
      if (key.row > maxRow) maxRow = key.row;
      const keyWidth = key.width || this._keySize;
      const keyRightEdge =
        key.col * (this._keySize + this._keySpacing) + keyWidth;
      if (keyRightEdge > totalWidth) totalWidth = keyRightEdge;
    }

    return {
      width: totalWidth,
      height: (maxRow + 1) * this._keySize + maxRow * this._keySpacing,
    };
  }
}
