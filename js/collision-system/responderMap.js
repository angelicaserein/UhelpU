import { ColliderShape, ColliderType } from "./enumerator.js";
import { EventTypes } from "../event-system/EventTypes.js";
import { AudioManager } from "../AudioManager.js";

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
        a.movementComponent.velY = 0;
        if(msg === "top") {
            a.headBlockedThisFrame = true;
        }
        if(msg === "bottom") {
            a.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
        }
    }
}

function dynDynBlockResponse(a, b, msg) {
    if(msg === "allowed collision") {
        return;
    }
    if(msg === "a_on_b") {
        // a 踩在 b 头上
        if(a.movementComponent.velY <= 0) {
            a.movementComponent.velY = 0;
        }
        // a 顶头被平台挡住时，b 的上冲必须被截断，否则会出现异常加速度/挤压
        if(a.headBlockedThisFrame && b.movementComponent.velY > 0) {
            b.movementComponent.velY = 0;
            b.headBlockedThisFrame = true;
        }
        a.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
    } else if(msg === "b_on_a") {
        // b 踩在 a 头上
        if(b.movementComponent.velY <= 0) {
            b.movementComponent.velY = 0;
        }
        // b 顶头被平台挡住时，a 的上冲必须被截断，否则会出现异常加速度/挤压
        if(b.headBlockedThisFrame && a.movementComponent.velY > 0) {
            a.movementComponent.velY = 0;
            a.headBlockedThisFrame = true;
        }
        b.controllerManager.currentControlComponent.abilityCondition["isOnGround"] = true;
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
        console.log("[Portal Collision] Player hit portal! isOpen:", b.isOpen);
        if(b.isOpen) {
            console.log("[Portal Collision] Portal is OPEN - triggering victory!");
            // Play victory sound and start suction animation
            AudioManager.playSFX("victory");

            // Start player suction animation towards portal
            if (a.startSuckedInAnimation && typeof a.startSuckedInAnimation === 'function') {
              console.log("[Portal Collision] Starting suction animation");
              a.startSuckedInAnimation(
                null,
                b.x + b.collider.w / 2,
                b.y + b.collider.h / 2,
                1000
              );
            }

            console.log("[Portal Collision] Publishing AUTO_RESULT");
            eventBus && eventBus.publish(EventTypes.AUTO_RESULT, "autoResult1");
        } else {
            console.log("[Portal Collision] Portal is CLOSED - ignoring");
        }
        return;
    }
}

