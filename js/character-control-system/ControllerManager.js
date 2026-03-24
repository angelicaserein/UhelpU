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

export class ControllerManager {
  //多例模式，每个可操控角色拥有一个实例，比如主角、过去自己、敌人、ai控制）
  constructor(defaultControlMode, movementComponent) {
    this.movementComponent = movementComponent;

    const ControlComponentClass = controlComponentMap[defaultControlMode];
    this.owner = null; // 指向所有者角色对象
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
    // 死亡时禁用控制
    if (this.owner && this.owner.deathState && this.owner.deathState.isDead) {
      return;
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
