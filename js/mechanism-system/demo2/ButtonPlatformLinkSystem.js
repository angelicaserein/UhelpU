// ButtonPlatformLinkSystem.js | 按鹁-消失平台联动系统
// Button-disappearing platform linkage system: when button is pressed, platform collision disappears instantly, sprite remains but opacity is reduced | 按鹁-消失平台联动系统：踏下按鹁时平台碰撞瞬閴消失，贴图保留但透明度降低
// Auto-assign unified color for each button-platform group, button fill color + platform color outline | 自动为每组 button-platform 分配统一颜色，按鹁填色 + 平台彩色轮廓

// Predefined color palette, same button and platform primary color for same group | 预定义颜色调色板，同组 button 和 platform 颜色主色调一致
const COLOR_PALETTE = [
  {
    unpressed: [230, 210, 40],
    pressed: [255, 240, 120],
    outline: [230, 210, 40],
  }, // 黄
  {
    unpressed: [230, 80, 160],
    pressed: [255, 150, 200],
    outline: [230, 80, 160],
  }, // 粉
  {
    unpressed: [220, 60, 60],
    pressed: [255, 120, 120],
    outline: [220, 60, 60],
  }, // 红
  {
    unpressed: [50, 120, 220],
    pressed: [100, 170, 255],
    outline: [50, 120, 220],
  }, // 蓝
  {
    unpressed: [50, 190, 80],
    pressed: [100, 240, 130],
    outline: [50, 190, 80],
  }, // 绿
  {
    unpressed: [180, 60, 220],
    pressed: [220, 130, 255],
    outline: [180, 60, 220],
  }, // 紫
  {
    unpressed: [240, 160, 30],
    pressed: [255, 210, 100],
    outline: [240, 160, 30],
  }, // 橙
  {
    unpressed: [30, 200, 200],
    pressed: [100, 240, 240],
    outline: [30, 200, 200],
  }, // 青
];

export class ButtonPlatformLinkSystem {
  /**
   * @param {{button: Button, platforms: Array<{platform: BasePlatform, mode?: string}>}} link
   *   Single linkage group: one button controls a group of platforms
   *   单组联动：一个按鹁控制一组平台
   *   - platform: platform entity | 平台实体
   *   - mode: "disappear"(default) platform disappears when button pressed | "appear" platform appears when button pressed | "disappear"(默认) 踏下按鹁时平台消失 | "appear" 踏下按鹁时平台出现
   *   System auto-assigns color by starting palette index, button and platform outline colors are consistent within group | 系统会自动按起始配色索引分配颜色，同组 button 和 platform 轮廓颜色一致
   * @param {CollisionSystem} collisionSystem - collision system reference, auto-repartition after colliderType switch | 碰撞系统引用，用于 colliderType 切换后自动重新分区
   * @param {Object} [options]
   * @param {number} [options.startColorIndex] - palette starting index, default 0 | 配色起始索引，默认 0
   */
  constructor(link, collisionSystem, options = {}) {
    this._collisionSystem = collisionSystem;
    const paletteIndex =
      (((options.startColorIndex || 0) % COLOR_PALETTE.length) +
        COLOR_PALETTE.length) %
      COLOR_PALETTE.length;
    const palette = COLOR_PALETTE[paletteIndex];
    const { button, platforms } = link;

    if (!button.color) {
      button.color = {
        unpressed: palette.unpressed,
        pressed: palette.pressed,
      };
    }

    this._button = button;
    this._outlineColor = palette.outline;
    this._platforms = platforms.map((item) => {
      const platform = item.platform || item;
      const mode = item.mode || "disappear";
      const gone = mode === "appear";
      const origColliderType = platform.collider.colliderType;
      platform._hidden = gone;
      if (gone) {
        platform.collider.colliderType = "TRIGGER";
      }
      const originalDraw = platform.draw.bind(platform);
      platform.draw = () => {}; // System takes over platform drawing

      return {
        platform,
        mode,
        gone,
        _origColliderType: origColliderType,
        _originalDraw: originalDraw,
      };
    });
    // After initialization, repartition immediately to ensure appear-mode platforms have no collision from the start | 初始化后立即重新分区，确保 appear 模式的平台一开始就没有碰撞
    if (this._collisionSystem) {
      this._collisionSystem.partitionEntitiesByType();
    }
  }

  /**
   * Called every frame, instantly switch platform collision based on button state | 每帧调用，根据按鹁状态瞬閴切换平台碰撞
   */
  update() {
    let changed = false;
    const pressed = this._button.isPressed;
    for (const entry of this._platforms) {
      const wasGone = entry.gone;
      entry.gone =
        (entry.mode === "disappear" && pressed) ||
        (entry.mode === "appear" && !pressed);

      entry.platform._hidden = entry.gone;
      if (entry.gone) {
        entry.platform.collider.colliderType = "TRIGGER";
      } else {
        entry.platform.collider.colliderType = entry._origColliderType;
      }
      if (wasGone !== entry.gone) changed = true;
    }
    // colliderType changed — auto repartition to ensure collision system works correctly next frame | colliderType 发生变化时自动重新分区，保证碰撞系统下一帧正确
    if (changed && this._collisionSystem) {
      this._collisionSystem.partitionEntitiesByType();
    }
  }

  /**
   * Called during draw phase:
   *   - Normal platforms: draw as-is + color outline | 正常平台：原样绘制 + 彩色轮廓
   *   - Disappearing platforms: draw with 20% opacity + 20% opacity outline | 消失平台：20% 透明度绘制 + 20% 透明度轮廓
   *   System has taken over platform draw, level doesn't need extra _hidden handling | 系统已接管平台 draw，关卡无需馉外处理 _hidden
   * @param {p5} p - p5 instance | p5 实例
   */
  draw(p) {
    const [r, g, b] = this._outlineColor;
    for (const entry of this._platforms) {
      const plat = entry.platform;
      const w = plat.collider.w;
      const h = plat.collider.h;

      if (entry.gone) {
        p.push();
        p.tint(255, 51);
        entry._originalDraw(p);
        p.noTint();
        p.pop();
      } else {
        entry._originalDraw(p);
      }

      p.push();
      p.noFill();
      const alpha = entry.gone ? 51 : 200;
      p.stroke(r, g, b, alpha);
      p.strokeWeight(3);
      p.rect(plat.x, plat.y, w, h);
      p.pop();
    }
  }

  /**
   * Reset all platforms to initial state | 重置所有平台到初始状态
   */
  reset() {
    for (const entry of this._platforms) {
      entry.gone = entry.mode === "appear";
      entry.platform._hidden = entry.gone;
      entry.platform.collider.colliderType = entry._origColliderType;
    }
    if (this._collisionSystem) {
      this._collisionSystem.partitionEntitiesByType();
    }
  }
}
