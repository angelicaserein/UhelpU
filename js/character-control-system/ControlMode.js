/**
 * @fileoverview Control mode classes that implement the input → physics pipeline.
 * 实现输入→物理流水线的控制模式类。
 * Each controllable character owns one ControlMode instance. The pipeline is:
 * 每个可控角色拥有一个 ControlMode 实例，流水线为：
 *   raw event → EventProcesser → IntentResolver → ActionValidator → PhysicsApplier
 *   原始事件 → EventProcesser → IntentResolver → ActionValidator → PhysicsApplier
 */

import { BasicEventProcesser } from "./EventProcesser.js";
import { BasicIntentResolver } from "./IntentResolver.js";
import { BasicActionValidator } from "./ActionValidator.js";
import { BasicPhysicsApplier } from "./PhysicsApplier.js";

class ControlMode {
  constructor() {}
  controlPipeline() {}
}

/**
 * Standard ground-movement control mode (no inertia).
 * 标准地面移动控制模式（无惯性）。
 * Used by both the player and the replay ghost — pass `isReplayer = true`
 * 玩家与回放幽灵均使用此模式——幽灵传入 `isReplayer = true`，
 * for the ghost so it only responds to replay events, not live keyboard input.
 * 使其仅响应回放事件而非实时键盘输入。
 */
export class BasicControlMode extends ControlMode {
  /**
   * @param {BasicControlComponent} controlComponent
   * @param {MovementComponent}     movementComponent
   * @param {boolean}               [isReplayer=false] - true for the replay ghost character.
   * 回放幽灵角色时为 true。
   */
  constructor(controlComponent, movementComponent, isReplayer = false) {
    super();
    this.controlComponent = controlComponent;
    this.movementComponent = movementComponent;
    this.isReplayer = isReplayer;

    this.eventProcesser = new BasicEventProcesser();
    this.intentResolver = new BasicIntentResolver();
    this.actionValidator = new BasicActionValidator();
    this.physicsApplier = new BasicPhysicsApplier();

    this.movementComponent.accY = this.controlComponent.gravity;
  }

  controlPipeline(event) {
    // Live events have no "isReplay" property; replay events do.
    // 实时事件没有 "isReplay" 属性，回放事件有。
    // Each mode only handles the type of event it was configured for.
    // 每种模式只处理其配置类型的事件。
    const isReplay = event.hasOwnProperty("isReplay");
    if (isReplay !== this.isReplayer) return;

    const processedEvent = this.eventProcesser.process(event);
    if (processedEvent) {
      const intent = this.intentResolver.resolve(processedEvent);
      const action = this.actionValidator.validate(
        intent,
        this.controlComponent,
      );
      this.physicsApplier.apply(
        action,
        this.controlComponent,
        this.movementComponent,
      );
    }
  }

  tick() {
    const intent = this.intentResolver.getCurrentIntent();
    const action = this.actionValidator.validate(intent, this.controlComponent);
    this.physicsApplier.apply(
      action,
      this.controlComponent,
      this.movementComponent,
    );
  }
}

/**
 * Alias for `BasicControlMode` with `isReplayer = true`.
 * 设置 `isReplayer = true` 的 `BasicControlMode` 别名。
 * Kept as a named export so existing call sites in ControllerManager need no changes.
 * 保留为命名导出，以便 ControllerManager 中的调用处无需修改。
 */
export class BasicControlModeReplayer extends BasicControlMode {
  constructor(controlComponent, movementComponent) {
    super(controlComponent, movementComponent, true);
  }
}
