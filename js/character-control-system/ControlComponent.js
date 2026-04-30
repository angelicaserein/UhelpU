/**
 * @fileoverview Control parameter components for player and AI characters.
 * 玩家与 AI 角色的控制参数组件。
 * A ControlComponent holds tuneable movement constants (speed, jump force, gravity)
 * 每个 ControlComponent 存储可调的移动常量（速度、跳跃力、重力）
 * and per-frame ability state (coyote time, jump cooldown, ground detection).
 * 以及每帧的能力状态（土狼时间、跳跃冷却、地面检测）。
 */

/**
 * Abstract base — extend this to create custom control profiles.
 * 抄象基类，继承此类以创建自定义控制配置。
 */
class ControlComponent {
  constructor() {}
}

/**
 * Standard control parameters used by the human player and replay ghost.
 * 人类玩家与回放幽灵共用的标准控制参数。
 * All numeric constants are in pixels-per-frame units and were tuned for the
 * game's 60 fps update loop.
 * 所有数值常量均以像素/帧为单位，针对游戏 60 fps 更新循环调优。
 */
export class BasicControlComponent extends ControlComponent {
  constructor() {
    super();
    /** Horizontal movement speed in pixels per frame. | 水平移动速度，单位：像素/帧。 */
    this.moveSpeed = 4;
    /** Initial vertical velocity applied when the player jumps. | 玩家跳跃时施加的初始纵向速度。 */
    this.jumpSpeed = 10;
    /** Downward acceleration applied every frame (negative = pulls entity down). | 每帧向下施加的加速度（负值表示向下拉）。 */
    this.gravity = -0.5;

    /**
     * Runtime state updated each frame by the physics/control pipeline.
     * 由物理/控制流水线在每帧更新的运行时状态。
     * @property {boolean} isOnGround   - True when the entity is standing on a surface.
     * 实体站立在表面上时为 true。
     * @property {boolean} wasOnGround  - Ground state from the previous frame (used for landing events).
     * 上一帧的地面状态（用于落地事件）。
     * @property {number}  groundVelY   - Vertical velocity of the platform the entity is standing on.
     * 实体所站平台的纵向速度。
     * @property {number}  jumpCooldown - Frames remaining before the entity can jump again.
     * 实体再次可跳跃前剩余的冷却帧数。
     * @property {number}  coyoteFrames - Frames left in the coyote-time window (allows jumping
     *                                    briefly after walking off a ledge).
     * 土狼时间窗口内剩余帧数（允许走出边缘后短暂跳跃）。
     */
    this.abilityCondition = {
      isOnGround: false,
      wasOnGround: false,
      groundVelY: 0,
      jumpCooldown: 0,
      coyoteFrames: 0,
    };
  }
}
