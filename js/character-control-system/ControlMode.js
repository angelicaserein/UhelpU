/**
 * @fileoverview Control mode classes that implement the input → physics pipeline.
 * Each controllable character owns one ControlMode instance. The pipeline is:
 *   raw event → EventProcesser → IntentResolver → ActionValidator → PhysicsApplier
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
 * Used by both the player and the replay ghost — pass `isReplayer = true`
 * for the ghost so it only responds to replay events, not live keyboard input.
 */
export class BasicControlMode extends ControlMode {
    /**
     * @param {BasicControlComponent} controlComponent
     * @param {MovementComponent}     movementComponent
     * @param {boolean}               [isReplayer=false] - true for the replay ghost character.
     */
    constructor(controlComponent, movementComponent, isReplayer = false) {
        super();
        this.controlComponent  = controlComponent;
        this.movementComponent = movementComponent;
        this.isReplayer        = isReplayer;

        this.eventProcesser  = new BasicEventProcesser();
        this.intentResolver  = new BasicIntentResolver();
        this.actionValidator = new BasicActionValidator();
        this.physicsApplier  = new BasicPhysicsApplier();

        this.movementComponent.accY = this.controlComponent.gravity;
    }

    controlPipeline(event) {
        // Live events have no "isReplay" property; replay events do.
        // Each mode only handles the type of event it was configured for.
        const isReplay = event.hasOwnProperty("isReplay");
        if (isReplay !== this.isReplayer) return;

        const processedEvent = this.eventProcesser.process(event);
        if (processedEvent) {
            const intent = this.intentResolver.resolve(processedEvent);
            const action = this.actionValidator.validate(intent, this.controlComponent);
            this.physicsApplier.apply(action, this.controlComponent, this.movementComponent);
        }
    }

    tick() {
        const intent = this.intentResolver.getCurrentIntent();
        const action = this.actionValidator.validate(intent, this.controlComponent);
        this.physicsApplier.apply(action, this.controlComponent, this.movementComponent);
    }
}

/**
 * Alias for `BasicControlMode` with `isReplayer = true`.
 * Kept as a named export so existing call sites in ControllerManager need no changes.
 */
export class BasicControlModeReplayer extends BasicControlMode {
    constructor(controlComponent, movementComponent) {
        super(controlComponent, movementComponent, true);
    }
}
