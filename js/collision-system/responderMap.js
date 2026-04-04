import { ColliderShape, ColliderType } from "./enumerator.js";
import { EventTypes } from "../event-system/EventTypes.js";

export const responderMap = {
    "DYNAMIC-STATIC": (a, msg) => basicBlockResponse(a, msg),
    "DYNAMIC-DYNAMIC": (a, b, msg) => dynDynBlockResponse(a, b, msg),
    "DYNAMIC-TRIGGER": (a, b, eventBus) => dynTriResponse(a, b, eventBus),
}

function basicBlockResponse(a, msg) {
    if(msg === "left" || msg === "right") {
        a.movementComponent.velX = 0;
        a.blockedXLastFrame = true;
    } else {
        if(msg === "top") {
            a.headBlockedThisFrame = true;
        }
        if(msg === "bottom") {
            a.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
            a.controllerManager.currentControlComponent.abilityCondition["groundVelY"] = 0;
        }
    }
}

function dynDynBlockResponse(a, b, msg) {
    if(msg === "allowed collision") {
        return;
    }
    if(msg === "a_on_b") {
        // a 踩在 b 头上 - 只设置地面标志，不修改速度，让碰撞检测处理约束
        if(a.headBlockedThisFrame && b.movementComponent.velY > 0) {
            b.movementComponent.velY = 0;
            b.headBlockedThisFrame = true;
        }
        a.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
        a.controllerManager.currentControlComponent.abilityCondition["groundVelY"] = b.movementComponent ? b.movementComponent.velY : 0;
    } else if(msg === "b_on_a") {
        // b 踩在 a 头上 - 只设置地面标志，不修改速度，让碰撞检测处理约束
        if(b.headBlockedThisFrame && a.movementComponent.velY > 0) {
            a.movementComponent.velY = 0;
            a.headBlockedThisFrame = true;
        }
        b.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
        b.controllerManager.currentControlComponent.abilityCondition["groundVelY"] = a.movementComponent ? a.movementComponent.velY : 0;
    }
    return;
}
function dynTriResponse(a, b, eventBus) {
    //level2
    if((a.type === "player" || (a.type === "replayer" && a.isReplaying)) && b.type === "button") {
        b.pressButton();
        return;
    }
    if(a.type === "player" && b.type === "spike") {
        // 触发死亡状态而不是直接结算
        a.triggerDeath('spike');
        return;
    }
    if(a.type === "player" && b.type === "portal") {
        if(b.isOpen) {
            eventBus && eventBus.publish(EventTypes.AUTO_RESULT, "autoResult1");
        }
        return;
    }
}
