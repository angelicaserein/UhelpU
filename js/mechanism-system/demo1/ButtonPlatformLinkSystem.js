// ButtonPlatformLinkSystem.js
// 按钮-消失平台联动系统：踩下按钮时平台碰撞瞬间消失，贴图保留但透明度降低

export class ButtonPlatformLinkSystem {
  /**
   * @param {Array<{button: Button, platforms: Array<{platform: BasePlatform, mode?: string}>}>} links
   *   每组联动：一个按钮控制一组平台
   *   - platform: 平台实体
   *   - mode: "disappear"(默认) 踩下按钮时平台消失 | "appear" 踩下按钮时平台出现
   * @param {CollisionSystem} collisionSystem - 碰撞系统引用，用于 colliderType 切换后自动重新分区
   */
  constructor(links, collisionSystem) {
    this._collisionSystem = collisionSystem;
    this._links = links.map(({ button, platforms }) => ({
      button,
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
        return {
          platform,
          mode,
          gone,
          _origColliderType: origColliderType,
        };
      }),
    }));
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
   * 在 draw 阶段调用，消失的平台以 30% 透明度绘制
   * @param {p5} p - p5 实例
   */
  draw(p) {
    for (const link of this._links) {
      for (const entry of link.platforms) {
        if (!entry.gone) continue; // 未消失的平台由正常绘制流程处理
        p.push();
        p.tint(255, 37); // 30% of 255 ≈ 77//255表示完全不透明，0表示完全透明，77表示30%透明度
        entry.platform.draw(p);
        p.noTint();
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
