// ButtonSpikeLinkSystem.js | 按鹁-地劉联动系统
// Button-spike linkage system: when entity steps on button, associated spikes move down by specified distance | 按鹁-地劉联动系统：实体踏到按鹁时，关联的地劉向下平移指定距离
// Auto-assign unified color for each button-spike group, no manual setting needed | 自动为每组 button-spike 分配统一颜色，无需手动设置

// 预定义颜色调色板，每组包含：按钮未按下色、按钮按下色、地刺色
// 同一组的 button 和 spike 颜色主色调一致，便于玩家识别对应关系
const COLOR_PALETTE = [
  { unpressed: [220, 60, 60], pressed: [255, 120, 120], spike: [220, 60, 60] }, // 红
  {
    unpressed: [50, 120, 220],
    pressed: [100, 170, 255],
    spike: [50, 120, 220],
  }, // 蓝
  { unpressed: [50, 190, 80], pressed: [100, 240, 130], spike: [50, 190, 80] }, // 绿
  {
    unpressed: [180, 60, 220],
    pressed: [220, 130, 255],
    spike: [180, 60, 220],
  }, // 紫
  {
    unpressed: [240, 160, 30],
    pressed: [255, 210, 100],
    spike: [240, 160, 30],
  }, // 橙
  {
    unpressed: [30, 200, 200],
    pressed: [100, 240, 240],
    spike: [30, 200, 200],
  }, // 青
  {
    unpressed: [230, 210, 40],
    pressed: [255, 240, 120],
    spike: [230, 210, 40],
  }, // 黄
  {
    unpressed: [230, 80, 160],
    pressed: [255, 150, 200],
    spike: [230, 80, 160],
  }, // 粉
];

export class ButtonSpikeLinkSystem {
  /**
   * @param {{button: Button, spikes: Array<{spike: Spike, retractDistance: number}>}} link
   *   Single linkage group: one button controls a group of spikes, each spike can specify move distance | 单组联动：一个按鹁控制一组地劉，每个地劉可指定下移距离
   *   spikes can also directly pass Spike object, then use default move distance (spike height + 10) | spikes 也可以直接传 Spike 对象，此时使用默认下移距离（地劉高度 + 10）
   *   System auto-assigns color by starting palette index, button and spike colors are consistent within group | 系统会自动按起始配色索引分配颜色，同组 button 和 spike 颜色一致
   * @param {Object} [options]
   * @param {number} [options.retractSpeed] - spike move-down speed (px/frame), default 3 | 地劉下移速度 (px/frame)，默认 3
   * @param {boolean} [options.autoReset] - whether spike auto-resets when button is released, default true | 按鹁松开后地劉是否自动复位，默认 true
   * @param {number} [options.resetSpeed] - reset move-up speed (px/frame), default 2 | 复位上移速度 (px/frame)，默认 2
   * @param {number} [options.startColorIndex] - palette starting index, default 0 | 配色起始索引，默认 0
   */
  constructor(link, options = {}) {
    this.retractSpeed = options.retractSpeed || 3;
    this.autoReset = options.autoReset !== undefined ? options.autoReset : true;
    this.resetSpeed = options.resetSpeed || 2;
    const paletteIndex =
      (((options.startColorIndex || 0) % COLOR_PALETTE.length) +
        COLOR_PALETTE.length) %
      COLOR_PALETTE.length;
    const palette = COLOR_PALETTE[paletteIndex];
    const { button, spikes } = link;

    if (!button.color) {
      button.color = {
        unpressed: palette.unpressed,
        pressed: palette.pressed,
      };
    }

    this._spikes = spikes.map((item) => {
      const spike = item.spike || item;
      const retractDistance = item.retractDistance || spike.collider.h + 10;

      if (!spike.color) {
        spike.color = palette.spike;
      }

      return {
        spike,
        originY: spike.y,
        offset: 0,
        retractDistance,
      };
    });

    this._button = button;
  }

  /**
   * Called every frame, drive spike movement animation | 每帧调用，驱动地劉平移动画
   */
  update() {
    const pressed = this._button.isPressed;
    for (const entry of this._spikes) {
      if (pressed) {
        entry.offset = Math.min(
          entry.offset + this.retractSpeed,
          entry.retractDistance,
        );
      } else if (this.autoReset) {
        entry.offset = Math.max(entry.offset - this.resetSpeed, 0);
      }
      entry.spike.y = entry.originY - entry.offset;
    }
  }

  /**
   * Reset all spikes to initial position | 重置所有地劉到初始位置
   */
  reset() {
    for (const entry of this._spikes) {
      entry.offset = 0;
      entry.spike.y = entry.originY;
    }
  }
}
