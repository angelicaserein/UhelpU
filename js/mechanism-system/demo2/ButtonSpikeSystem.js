// ButtonSpikeLinkSystem.js
// 按钮-地刺联动系统：实体踩到按钮时，关联的地刺向下平移指定距离

export class ButtonSpikeLinkSystem {
  /**
   * @param {Array<{button: Button, spikes: Array<{spike: Spike, retractDistance: number}>}>} links
   *   每组联动：一个按钮控制一组地刺，每个地刺可指定下移距离
   *   spikes 也可以直接传 Spike 对象，此时使用默认下移距离（地刺高度 + 10）
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
    this._links = links.map(({ button, spikes }) => ({
      button,
      spikes: spikes.map((item) => {
        // 支持直接传 Spike 对象或 { spike, retractDistance } 格式
        const spike = item.spike || item;
        const retractDistance = item.retractDistance || spike.collider.h + 10;
        return {
          spike,
          originY: spike.y,
          offset: 0,
          retractDistance,
        };
      }),
    }));
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
