// ButtonSpikeLinkSystem.js
// 按钮-地刺联动系统：实体踩到按钮时，关联的地刺向下平移指定距离

export class ButtonSpikeLinkSystem {
  /**
   * @param {Array<{button: Button, spikes: Array<{spike: Spike, retractDistance: number}>}>} links
   *   Each group of linkage: one button controls a group of spikes, each spike can specify move distance
   *   每组联动：一个按鹁控制一组地劉，每个地劉可指定下移距离
   *   spikes can also directly pass Spike object, then use default move distance (spike height + 10)
   *   spikes 也可以直接传 Spike 对象，此时使用默认下移距离（地劉高度 + 10）
   * @param {Object} [options]
   * @param {number} [options.retractSpeed] - spike move-down speed (px/frame), default 3 | 地劉下移速度 (px/frame)，默认 3
   * @param {boolean} [options.autoReset] - whether spike auto-resets when button is released, default true | 按鹁松开后地劉是否自动复位，默认 true
   * @param {number} [options.resetSpeed] - reset move-up speed (px/frame), default 2 | 复位上移速度 (px/frame)，默认 2
   */
  constructor(links, options = {}) {
    this.retractSpeed = options.retractSpeed || 3;
    this.autoReset = options.autoReset !== undefined ? options.autoReset : true;
    this.resetSpeed = options.resetSpeed || 2;

    // Internal state: record original position, current offset and custom move distance for each spike | 内部状态：记录每组地劉的原始位置、当前偏移和自定义下移距离
    this._links = links.map(({ button, spikes }) => ({
      button,
      spikes: spikes.map((item) => {
        // Support passing Spike object directly or { spike, retractDistance } format | 支持直接传 Spike 对象或 { spike, retractDistance } 格式
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
   * Called every frame, drive spike movement animation | 每帧调用，驱动地劉平移动画
   */
  update() {
    for (const link of this._links) {
      const pressed = link.button.isPressed;
      for (const entry of link.spikes) {
        if (pressed) {
          // Button pressed → spikes move down to custom distance | 按鹁被踏下 → 地劉往下移动到自定义距离
          entry.offset = Math.min(
            entry.offset + this.retractSpeed,
            entry.retractDistance,
          );
        } else if (this.autoReset) {
          // Button released → spikes reset | 按鹁松开 → 地劉复位
          entry.offset = Math.max(entry.offset - this.resetSpeed, 0);
        }
        // Update spike actual position | 更新地劉实际位置
        entry.spike.y = entry.originY - entry.offset;
      }
    }
  }

  /**
   * Reset all spikes to initial position | 重置所有地劉到初始位置
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
