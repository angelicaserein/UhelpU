class ControlComponent {
    constructor() {

    }
}

export class BasicControlComponent extends ControlComponent {
    constructor() {
        super();
        this.moveSpeed = 4;
        this.jumpSpeed = 10;
        this.gravity = -0.5;
        this.abilityCondition = {
            "isOnGround": false,
            "wasOnGround": false,
            "groundVelY": 0,
            "jumpCooldown": 0,
            "coyoteFrames": 0,
        }
    }
}