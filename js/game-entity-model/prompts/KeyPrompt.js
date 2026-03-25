import { GameEntity } from "../base/GameEntity.js";

/**
 * 按键提示 — 显示按键镂空白色提示
 * 根据与玩家的距离计算透明度（靠近显现，远离渐隐）
 */
export class KeyPrompt extends GameEntity {
  /**
   * @param {number} x - 游戏坐标 x
   * @param {number} y - 游戏坐标 y
   * @param {BaseLevel} level - 所属关卡
   * @param {{keys?: Array<{col:number,row:number,label:string}>}} options - 提示布局配置
   */
  constructor(x, y, level = null, options = {}) {
    super(x, y);
    this.type = "keyprompt";
    this.level = level;
    this.zIndex = -1; // 在木牌上方，玩家下方

    // 透明度相关
    this._currentAlpha = 0;
    this._targetAlpha = 0;
    this._fadeSpeed = 2; // 透明度变化速度

    // 距离相关（像素）
    this._showDistance = 50; // 开始显示的距离
    this._hideDistance = 150; // 完全隐藏的距离

    // 键盘布局尺寸
    this._keySize = 28;
    this._keySpacing = 6;
    this._keyStrokeWeight = 2;
    this._keyColor = [255, 255, 255]; // 白色

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

  /**
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

    // 计算与玩家中心的距离
    const playerCenterX = player.x + (player.collider?.w || 0) / 2;
    const playerCenterY = player.y + (player.collider?.h || 0) / 2;
    const bounds = this._getLayoutBounds();
    const promptCenterX = this.x + bounds.width / 2;
    const promptCenterY = this.y + bounds.height / 2;
    const dx = playerCenterX - promptCenterX;
    const dy = playerCenterY - promptCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 基于距离计算目标透明度
    if (distance < this._showDistance) {
      this._targetAlpha = 1;
    } else if (distance > this._hideDistance) {
      this._targetAlpha = 0;
    } else {
      // 线性插值
      this._targetAlpha =
        1 -
        (distance - this._showDistance) /
          (this._hideDistance - this._showDistance);
    }

    // 平滑过渡透明度
    if (Math.abs(this._currentAlpha - this._targetAlpha) > 0.01) {
      this._currentAlpha += (this._targetAlpha - this._currentAlpha) * 0.1;
    } else {
      this._currentAlpha = this._targetAlpha;
    }
  }

  /**
   * 绘制按键提示（镂空白色）
   */
  draw(p) {
    if (this._currentAlpha < 0.01) return;

    p.push();
    p.translate(this.x, this.y);

    const alpha = Math.floor(this._currentAlpha * 255);
    const strokeCol = this._keyColor;

    for (const key of this.keys) {
      this._drawKey(p, key.col, key.row, key.label, strokeCol, alpha);
    }

    p.pop();
  }

  /**
   * 绘制单个键按钮（镂空矩形 + 文字）
   * 文字自动补偿游戏全局Y轴翻转，保持正确方向
   * @param {p5} p - p5 实例
   * @param {number} col - 列数（0=左, 1=中, 2=右）
   * @param {number} row - 行数（0=上, 1=下）
   * @param {string} label - 按键文字
   * @param {array} color - RGB 颜色
   * @param {number} alpha - 透明度 0-255
   */
  _drawKey(p, col, row, label, color, alpha) {
    const x = col * (this._keySize + this._keySpacing);
    const y = row * (this._keySize + this._keySpacing);

    // 绘制矩形框（镂空）
    p.push();
    p.stroke(color[0], color[1], color[2], alpha);
    p.strokeWeight(this._keyStrokeWeight);
    p.noFill();
    p.rect(x, y, this._keySize, this._keySize, 2);
    p.pop();

    // 绘制文字（需要反向Y轴翻转以补偿全局翻转）
    p.push();
    p.translate(x + this._keySize / 2, y + this._keySize / 2);
    p.scale(1, -1); // 反向Y轴翻转以补偿游戏全局翻转
    p.translate(-(x + this._keySize / 2), -(y + this._keySize / 2));

    p.fill(color[0], color[1], color[2], alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.text(label, x + this._keySize / 2, y + this._keySize / 2);
    p.pop();
  }

  /**
   * 计算当前按键布局的包围盒尺寸
   */
  _getLayoutBounds() {
    if (!this.keys.length) {
      return { width: this._keySize, height: this._keySize };
    }

    let maxCol = 0;
    let maxRow = 0;
    for (const key of this.keys) {
      if (key.col > maxCol) maxCol = key.col;
      if (key.row > maxRow) maxRow = key.row;
    }

    return {
      width: (maxCol + 1) * this._keySize + maxCol * this._keySpacing,
      height: (maxRow + 1) * this._keySize + maxRow * this._keySpacing,
    };
  }
}
