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
        const cooldown = a.controllerManager.currentControlComponent.abilityCondition["jumpCooldown"] || 0;
        // 跳跃冷却期间忽略碰撞约束，保证跳跃速度和高度一致
        if(cooldown <= 0) {
            a.movementComponent.velY = 0;
        }
        if(msg === "top") {
            a.headBlockedThisFrame = true;
        }
        if(msg === "bottom") {
            if(cooldown <= 0) {
                a.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
                a.controllerManager.currentControlComponent.abilityCondition["groundVelY"] = 0;
            }
        }
    }
}

function dynDynBlockResponse(a, b, msg) {
    if(msg === "allowed collision") {
        return;
    }
    if(msg === "a_on_b") {
        // a 踩在 b 头上
        const cooldownA = a.controllerManager.currentControlComponent.abilityCondition["jumpCooldown"] || 0;
        // 跳跃冷却期间忽略碰撞约束，保证跳跃速度和高度一致
        if(cooldownA > 0) {
            return;
        }

        if(a.movementComponent.velY <= 0) {
            a.movementComponent.velY = 0;
        }
        // a 顶头被平台挡住时，b 的上冲必须被截断，否则会出现异常加速度/挤压
        if(a.headBlockedThisFrame && b.movementComponent.velY > 0) {
            b.movementComponent.velY = 0;
            b.headBlockedThisFrame = true;
        }
        // 只有不在跳跃冷却期内才允许落地
        a.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
        a.controllerManager.currentControlComponent.abilityCondition["groundVelY"] = b.movementComponent ? b.movementComponent.velY : 0;
    } else if(msg === "b_on_a") {
        // b 踩在 a 头上
        const cooldownB = b.controllerManager.currentControlComponent.abilityCondition["jumpCooldown"] || 0;
        // 跳跃冷却期间忽略碰撞约束，保证跳跃速度和高度一致
        if(cooldownB > 0) {
            return;
        }

        if(b.movementComponent.velY <= 0) {
            b.movementComponent.velY = 0;
        }
        // b 顶头被平台挡住时，a 的上冲必须被截断，否则会出现异常加速度/挤压
        if(b.headBlockedThisFrame && a.movementComponent.velY > 0) {
            a.movementComponent.velY = 0;
            a.headBlockedThisFrame = true;
        }
        // 只有不在跳跃冷却期内才允许落地
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
