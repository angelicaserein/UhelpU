// ButtonSpikeLinkSystem.js
// 按钮-地刺联动系统：实体踩到按钮时，关联的地刺向下平移指定距离
// 自动为每组 button-spike 分配统一颜色，无需手动设置

// 预定义颜色调色板，每组包含：按钮未按下色、按钮按下色、地刺色
// 同一组的 button 和 spike 颜色主色调一致，便于玩家识别对应关系
const COLOR_PALETTE = [
  { unpressed: [220, 60, 60],   pressed: [255, 120, 120], spike: [220, 60, 60]   }, // 红
  { unpressed: [50, 120, 220],  pressed: [100, 170, 255], spike: [50, 120, 220]  }, // 蓝
  { unpressed: [50, 190, 80],   pressed: [100, 240, 130], spike: [50, 190, 80]   }, // 绿
  { unpressed: [180, 60, 220],  pressed: [220, 130, 255], spike: [180, 60, 220]  }, // 紫
  { unpressed: [240, 160, 30],  pressed: [255, 210, 100], spike: [240, 160, 30]  }, // 橙
  { unpressed: [30, 200, 200],  pressed: [100, 240, 240], spike: [30, 200, 200]  }, // 青
  { unpressed: [230, 210, 40],  pressed: [255, 240, 120], spike: [230, 210, 40]  }, // 黄
  { unpressed: [230, 80, 160],  pressed: [255, 150, 200], spike: [230, 80, 160]  }, // 粉
];

export class ButtonSpikeLinkSystem {
  /**
   * @param {Array<{button: Button, spikes: Array<{spike: Spike, retractDistance: number}>}>} links
   *   每组联动：一个按钮控制一组地刺，每个地刺可指定下移距离
   *   spikes 也可以直接传 Spike 对象，此时使用默认下移距离（地刺高度 + 10）
   *   系统会自动为每组分配不同颜色，同组 button 和 spike 颜色一致
   * @param {Object} [options]
   * @param {number} [options.retractSpeed] - 地刺下移速度 (px/frame)，默认 3
   * @param {boolean} [options.autoReset] - 按钮松开后地刺是否自动复位，默认 true
   * @param {number} [options.resetSpeed] - 复位上移速度 (px/frame)，默认 2
   */
  constructor(links, options = {}) {
    this.retractSpeed = options.retractSpeed || 3;
    this.autoReset = options.autoReset !== undefined ? options.autoReset : true;
    this.resetSpeed = options.resetSpeed || 2;

    // 内部状态：记录每组地刺的原始位置、当前偏移和自定义下移距离
    this._links = links.map(({ button, spikes }, groupIndex) => {
      // 自动分配颜色（循环使用调色板）
      const palette = COLOR_PALETTE[groupIndex % COLOR_PALETTE.length];

      // 仅在 button/spike 没有手动设置颜色时才自动赋色
      if (!button.color) {
        button.color = {
          unpressed: palette.unpressed,
          pressed: palette.pressed,
        };
      }

      const spikeEntries = spikes.map((item) => {
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

      return { button, spikes: spikeEntries };
    });
  }

  /**
   * 每帧调用，驱动地刺平移动画
   */
  update() {
    for (const link of this._links) {
      const pressed = link.button.isPressed;
      for (const entry of link.spikes) {
        if (pressed) {
          // 按钮被踩下 → 地刺往下移动到自定义距离
          entry.offset = Math.min(
            entry.offset + this.retractSpeed,
            entry.retractDistance,
          );
        } else if (this.autoReset) {
          // 按钮松开 → 地刺复位
          entry.offset = Math.max(entry.offset - this.resetSpeed, 0);
        }
        // 更新地刺实际位置
        entry.spike.y = entry.originY - entry.offset;
      }
    }
  }

  /**
   * 重置所有地刺到初始位置
   */
  reset() {
    for (const link of this._links) {
      for (const entry of link.spikes) {
        entry.offset = 0;
        entry.spike.y = entry.originY;
      }
    }
  }
}
