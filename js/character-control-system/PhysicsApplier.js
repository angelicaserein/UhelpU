class PhysicsApplier {
    constructor() {
        
    }
    apply() {

    }
}
export class BasicPhysicsApplier extends PhysicsApplier {
    constructor() {
        super();
    }
    apply(action, controlComponent, movementComponent) {
        if(action.has("movesLeft")) {
            movementComponent.velX = -controlComponent.moveSpeed;
        } else if(action.has("movesRight")) {
            movementComponent.velX = controlComponent.moveSpeed;
        } else if(action.has("stopX")) {
            movementComponent.velX = 0;
        }

        if(action.has("jump")) {
            movementComponent.velY = controlComponent.jumpSpeed;
            controlComponent.abilityCondition["isOnGround"] = false;
        }
        //this.printControlComponent(movementComponent);
    }
    printControlComponent(movementComponent) {
        console.log(performance.now());
        console.log("velX: " + movementComponent.velX);
        console.log("velY: " + movementComponent.velY);
        console.log("accX: " + movementComponent.accX);
        console.log("accY: " + movementComponent.accY);
    }
}