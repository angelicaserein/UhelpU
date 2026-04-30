/**
 * Base class for all game entities.
 * 所有游戏实体的基类。
 * Every entity placed in a Level's entity set should extend this class.
 * 水平实体集中的每个实体都应继承此类。
 *
 * Lifecycle contract:
 * 生命周期约定：
 *   update(p)   — called once per frame before collision (game logic, animation timers)
 *   update(p)   — 每帧碰撞前调用一次（游戏逻辑、动画计时器）
 *   draw(p)     — called once per frame after collision (pure rendering, no state mutation)
 *   draw(p)     — 每帧碰撞后调用一次（纯渲染，不得改变状态）
 *   onDestroy() — called when the entity is removed from the level (clean up listeners, timers)
 *   onDestroy() — 实体从关卡移除时调用（清理监听器、计时器）
 */
export class GameEntity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.zIndex = 0; // lower values drawn first (background), higher drawn last (foreground) | 较小值先绘制（背景），较大值后绘制（前景）
  }

  /**
   * Per-frame logic update. Override in subclasses.
   * 每帧逻辑更新，在子类中覆盖实现。
   */
  update(_p) {}

  /**
   * Per-frame rendering. Override in subclasses. Must NOT mutate game state.
   * 每帧渲染，在子类中覆盖实现。不得改变游戏状态。
   */
  draw(_p) {}

  /**
   * Cleanup hook called when entity is removed from the level.
   * 实体从关卡移除时调用的清理钉子。
   */
  onDestroy() {}
}
