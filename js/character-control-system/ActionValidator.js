class ActionValidator {
    constructor() {

    }
    validate() {

    }
}
export class BasicActionValidator extends ActionValidator {
    constructor() {
        super();

    }
    validate(intent, controlComponent) {
        const action = new Set();
        if(intent.has("wantsLeft")) {
            action.add("movesLeft");
        } else if(intent.has("wantsRight")) {
            action.add("movesRight");
        } else if(intent.has("wantsStopX")) {
            action.add("stopX");
        }

        //意图是否能变成真正的动作，比如跳跃受到isOnGround限制
        if(intent.has("wantsJump") && controlComponent.abilityCondition["wasOnGround"]) {
            action.add("jump");
        }
        return action;
    }
}