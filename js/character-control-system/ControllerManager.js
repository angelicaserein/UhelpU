import { BasicControlMode, BasicControlModeReplayer } from "./ControlMode.js";
import { BasicControlComponent } from "./ControlComponent.js";
import { isGamePaused } from "../game-runtime/GamePauseState.js";

const controlModeMap = {
  BasicMode: BasicControlMode,
  BasicModeReplayer: BasicControlModeReplayer,
};
const controlComponentMap = {
  BasicMode: BasicControlComponent,
  BasicModeReplayer: BasicControlComponent,
};

/**
 * Manages input handling and control-mode switching for a single controllable character.
 * 管理单个可控角色的输入处理与控制模式切换。
 * Each character (player, replay ghost, AI) owns its own ControllerManager instance so
 * 每个角色（玩家、回放幽灵、AI）拥有独立的 ControllerManager 实例，
 * their input pipelines remain independent.
 * 以保持各自的输入流水线相互独立。
 */
export class ControllerManager {
  /**
   * @param {string}            defaultControlMode  - Key into controlModeMap / controlComponentMap
   *                                                  (e.g. "BasicMode" or "BasicModeReplayer").
   * controlModeMap / controlComponentMap 中的键（例如 "BasicMode" 或 "BasicModeReplayer"）。
   * @param {MovementComponent} movementComponent   - The movement data component for the owning character.
   * 所属角色的移动数据组件。
   */
  constructor(defaultControlMode, movementComponent) {
    this.movementComponent = movementComponent;

    const ControlComponentClass = controlComponentMap[defaultControlMode];
    this.owner = null; // Points to the owning character object. | 指向所有者角色对象
    this.currentControlComponent = new ControlComponentClass();

    const ControlModeClass = controlModeMap[defaultControlMode];
    this.currentControlMode = new ControlModeClass(
      this.currentControlComponent,
      this.movementComponent,
    );

    this._keydownHandler = (event) => this.controlEntry(event);
    this._keyupHandler = (event) => this.controlEntry(event);
  }

  createListeners() {
    window.addEventListener("keydown", this._keydownHandler);
    window.addEventListener("keyup", this._keyupHandler);
  }

  clearListeners() {
    window.removeEventListener("keydown", this._keydownHandler);
    window.removeEventListener("keyup", this._keyupHandler);
  }
  switchMode(controlMode) {
    const ControlComponentClass = controlComponentMap[controlMode];
    this.currentControlComponent = new ControlComponentClass();

    const ControlModeClass = controlModeMap[controlMode];
    this.currentControlMode = new ControlModeClass(
      this.currentControlComponent,
      this.movementComponent,
    );
  }

  controlEntry(event) {
    if (isGamePaused()) {
      this.resetInputState();
      return;
    }
    // Disable control when the character is dead.
    // 死亡时禁用控制
    if (this.owner && this.owner.deathState && this.owner.deathState.isDead) {
      return;
    }

    // Timer system: notify on first key press.
    // 计时系统：首次按键时通知
    if (
      event.type === "keydown" &&
      this.owner &&
      typeof this.owner.notifyFirstInput === "function"
    ) {
      this.owner.notifyFirstInput();
    }

    this.currentControlMode.controlPipeline(event);
  }

  resetInputState() {
    const mode = this.currentControlMode;
    const processor = mode && mode.eventProcesser;
    const resolver = mode && mode.intentResolver;
    if (processor && processor.pressedKeys) {
      processor.pressedKeys.clear();
    }
    if (resolver && resolver.conflictResolver) {
      resolver.conflictResolver["left"] = false;
      resolver.conflictResolver["right"] = false;
    }
    // Prevent residual horizontal velocity from before the pause causing movement after resume with no input.
    // 防止暂停前的水平速度残留，导致恢复后无输入仍继续移动
    if (this.movementComponent) {
      this.movementComponent.velX = 0;
      if (typeof this.movementComponent.accX !== "undefined") {
        this.movementComponent.accX = 0;
      }
    }
  }

  tick() {
    if (isGamePaused()) return;
    if (this.owner && this.owner.deathState && this.owner.deathState.isDead)
      return;
    if (
      this.currentControlMode &&
      typeof this.currentControlMode.tick === "function"
    ) {
      this.currentControlMode.tick();
    }
  }
}
