// ButtonPlatformLinkSystem.js
// 按钮-消失平台联动系统：踩下按钮时平台碰撞瞬间消失，贴图保留但透明度降低
// 自动为每组 button-platform 分配统一颜色，按钮填色 + 平台彩色轮廓

// 预定义颜色调色板，同组 button 和 platform 颜色主色调一致
const COLOR_PALETTE = [
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
  {
    unpressed: [230, 210, 40],
    pressed: [255, 240, 120],
    outline: [230, 210, 40],
  }, // 黄
];

export class ButtonPlatformLinkSystem {
  /**
   * @param {Array<{button: Button, platforms: Array<{platform: BasePlatform, mode?: string}>}>} links
   *   每组联动：一个按钮控制一组平台
   *   - platform: 平台实体
   *   - mode: "disappear"(默认) 踩下按钮时平台消失 | "appear" 踩下按钮时平台出现
   *   系统会自动为每组分配不同颜色，同组 button 和 platform 轮廓颜色一致
   * @param {CollisionSystem} collisionSystem - 碰撞系统引用，用于 colliderType 切换后自动重新分区
   */
  constructor(links, collisionSystem) {
    this._collisionSystem = collisionSystem;
    this._links = links.map(({ button, platforms }, groupIndex) => {
      // 自动分配颜色（循环使用调色板）
      const palette = COLOR_PALETTE[groupIndex % COLOR_PALETTE.length];

      // 仅在 button 没有手动设置颜色时才自动赋色
      if (!button.color) {
        button.color = {
          unpressed: palette.unpressed,
          pressed: palette.pressed,
        };
      }

      return {
        button,
        outlineColor: palette.outline,
        platforms: platforms.map((item) => {
          const platform = item.platform || item;
          const mode = item.mode || "disappear";
          const gone = mode === "appear";
          // 记录原始碰撞类型（在修改之前）
          const origColliderType = platform.collider.colliderType;
          // 初始化时立即同步碰撞和绘制状态
          platform._hidden = gone;
          if (gone) {
            platform.collider.colliderType = "TRIGGER";
          }
          // 接管平台的 draw，防止关卡主循环重复绘制
          const originalDraw = platform.draw.bind(platform);
          platform.draw = () => {};

          return {
            platform,
            mode,
            gone,
            _origColliderType: origColliderType,
            _originalDraw: originalDraw,
          };
        }),
      };
    });
    // 初始化后立即重新分区，确保 appear 模式的平台一开始就没有碰撞
    if (this._collisionSystem) {
      this._collisionSystem.partitionEntitiesByType();
    }
  }

  /**
   * 每帧调用，根据按钮状态瞬间切换平台碰撞
   */
  update() {
    let changed = false;
    for (const link of this._links) {
      const pressed = link.button.isPressed;
      for (const entry of link.platforms) {
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
    }
    // colliderType 发生变化时自动重新分区，保证碰撞系统下一帧正确
    if (changed && this._collisionSystem) {
      this._collisionSystem.partitionEntitiesByType();
    }
  }

  /**
   * 在 draw 阶段调用：
   *   - 正常平台：原样绘制 + 彩色轮廓
   *   - 消失平台：20% 透明度绘制 + 20% 透明度轮廓
   *   系统已接管平台 draw，关卡无需额外处理 _hidden
   * @param {p5} p - p5 实例
   */
  draw(p) {
    for (const link of this._links) {
      const [r, g, b] = link.outlineColor;
      for (const entry of link.platforms) {
        const plat = entry.platform;
        const w = plat.collider.w;
        const h = plat.collider.h;

        if (entry.gone) {
          // 消失的平台以 20% 透明度绘制贴图
          p.push();
          p.tint(255, 51);
          entry._originalDraw(p);
          p.noTint();
          p.pop();
        } else {
          // 正常状态：原样绘制
          entry._originalDraw(p);
        }

        // 绘制彩色轮廓
        p.push();
        p.noFill();
        const alpha = entry.gone ? 51 : 200;
        p.stroke(r, g, b, alpha);
        p.strokeWeight(3);
        p.rect(plat.x, plat.y, w, h);
        p.pop();
      }
    }
  }

  /**
   * 重置所有平台到初始状态
   */
  reset() {
    for (const link of this._links) {
      for (const entry of link.platforms) {
        entry.gone = entry.mode === "appear";
        entry.platform._hidden = entry.gone;
        entry.platform.collider.colliderType = entry._origColliderType;
      }
    }
    if (this._collisionSystem) {
      this._collisionSystem.partitionEntitiesByType();
    }
  }
}
