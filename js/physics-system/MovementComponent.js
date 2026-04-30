/**
 * @fileoverview Stores the velocity and acceleration state for a game entity.
 * 存储游戏实体的速度和加速度状态。
 * Consumed by the physics system each frame to compute the entity's next position.
 * 每帧由物理系统消耗以计算实体的下一帧位置。
 */

/**
 * Data component holding the 2-D motion state of an entity.
 * 保存实体二维运动状态的数据组件。
 * All values are in pixels-per-frame (velocity) or pixels-per-frame² (acceleration).
 * 所有属性均以像素/帧（速度）或像素/帧²（加速度）为单位。
 * The y-axis is inverted at render time: positive velY moves the entity upward on screen.
 * y 轴在渲染时翻转：正 velY 使实体在屏幕上向上移动。
 */
export class MovementComponent {
    /**
     * @param {number} velX - Horizontal velocity (positive = right).
     * @param {number} velY - Vertical velocity (positive = up in screen space after y-flip).
     * @param {number} accX - Horizontal acceleration applied each frame.
     * @param {number} accY - Vertical acceleration (gravity is applied here as a negative value).
     */
    constructor(velX, velY, accX, accY) {
        this.velX = velX;
        this.velY = velY;
        this.accX = accX;
        this.accY = accY;
    }
}
