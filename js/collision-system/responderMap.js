import { ColliderShape, ColliderType } from "./enumerator.js";
import { EventTypes } from "../event-system/EventTypes.js";

export const responderMap = {
    "DYNAMIC-STATIC": (a, b, msg) => basicBlockResponse(a, b, msg),
    "DYNAMIC-DYNAMIC": (a, b, msg) => dynDynBlockResponse(a, b, msg),
    "DYNAMIC-TRIGGER": (a, b, eventBus) => dynTriResponse(a, b, eventBus),
}

function basicBlockResponse(a, b, msg) {
    // 敌人碰撞处理
    if (b && b.type === "enemy") {
        if (msg === "bottom") {
            // 踩踏敌人头顶：弹跳 + 敌人死亡
            a.movementComponent.velY = 17.5;  // 踩踏弹跳速度 (1.75x normal jump)
            a.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
            b.triggerDeath();  // 敌人死亡
            return;
        } else if (msg === "left" || msg === "right" || msg === "top") {
            // 侧面或正面碰撞：Player死亡，Replayer无作用
            if (a.type === "player") {
                a.triggerDeath("enemy");  // Player死亡
            }
            // Replayer侧面碰撞无作用
            return;
        }
    }

    // 原有的平台碰撞逻辑
    if(msg === "left" || msg === "right") {
        a.movementComponent.velX = 0;
        a.blockedXLastFrame = true;
    } else {
        if(msg === "top") {
            a.headBlockedThisFrame = true;
        }
        if(msg === "bottom") {
            // 静态地板需要清零速度，防止持续下沉
            a.movementComponent.velY = 0;
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
