//输入层，意图层，动作层，物理层
import { BasicEventProcesser } from "./EventProcesser.js";
import { BasicIntentResolver } from "./IntentResolver.js";
import { BasicActionValidator } from "./ActionValidator.js";
import { BasicPhysicsApplier } from "./PhysicsApplier.js";

class ControlMode {
    constructor() {

    }
    controlPipeline() {

    }
}

export class BasicControlMode extends ControlMode{//基础控制模式（地面，无惯性）
    constructor(controlComponent, movementComponent) {
        super();
        this.controlComponent = controlComponent;
        this.movementComponent = movementComponent;

        this.eventProcesser = new BasicEventProcesser();
        this.intentResolver = new BasicIntentResolver();
        this.actionValidator = new BasicActionValidator();
        this.physicsApplier = new BasicPhysicsApplier();

        this.movementComponent.accY = this.controlComponent.gravity;

    }
    controlPipeline(event) {
        if(!event.hasOwnProperty("isReplay")) {
            const processedEvent = this.eventProcesser.process(event);
            if(processedEvent) {
                const intent = this.intentResolver.resolve(processedEvent);
                const action = this.actionValidator.validate(intent, this.controlComponent);
                this.physicsApplier.apply(action, this.controlComponent, this.movementComponent);
            }
        }
    }
    tick() {
        const intent = this.intentResolver.getCurrentIntent();
        const action = this.actionValidator.validate(intent, this.controlComponent);
        this.physicsApplier.apply(action, this.controlComponent, this.movementComponent);
    }
}
export class BasicControlModeReplayer extends ControlMode{//基础控制模式（地面，无惯性）
    constructor(controlComponent, movementComponent) {
        super();
        this.controlComponent = controlComponent;
        this.movementComponent = movementComponent;

        this.eventProcesser = new BasicEventProcesser();
        this.intentResolver = new BasicIntentResolver();
        this.actionValidator = new BasicActionValidator();
        this.physicsApplier = new BasicPhysicsApplier();

        this.movementComponent.accY = this.controlComponent.gravity;
    }
    controlPipeline(event) {
        if(event.hasOwnProperty("isReplay")) {
            const processedEvent = this.eventProcesser.process(event);
            if(processedEvent) {
                const intent = this.intentResolver.resolve(processedEvent);
                const action = this.actionValidator.validate(intent, this.controlComponent);
                this.physicsApplier.apply(action, this.controlComponent, this.movementComponent);
            }
        }
    }
    tick() {
        const intent = this.intentResolver.getCurrentIntent();
        const action = this.actionValidator.validate(intent, this.controlComponent);
        this.physicsApplier.apply(action, this.controlComponent, this.movementComponent);
    }
}