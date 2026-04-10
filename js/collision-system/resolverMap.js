import { ColliderShape, ColliderType } from "./enumerator.js";

export const resolverMap = {
    // "DYNAMIC-DYNAMIC": (a, b) => resolveBoth(a, b),
    "DYNAMIC-STATIC-RECTANGLE-RECTANGLE": (a, b) => resolveFirst(a, b),
    "DYNAMIC-DYNAMIC-RECTANGLE-RECTANGLE": (a, b) => resolveDynDyn(a, b),
}

function resolveFirst(a, b) {
    let collisionMsg = "";

    const prevY = (a.prevY !== undefined) ? a.prevY : a.y;
    const prevX = (a.prevX !== undefined) ? a.prevX : a.x;

    const prevBottom = prevY;
    const prevTop    = prevY + a.collider.h;
    const currBottom = a.y;
    const currTop    = a.y + a.collider.h;
    const staBottom  = b.y;
    const staTop     = b.y + b.collider.h;
    const staLeft    = b.x;
    const staRight   = b.x + b.collider.w;
    const prevRight  = prevX + a.collider.w;
    const prevLeft   = prevX;
    const currRight  = a.x + a.collider.w;
    const currLeft   = a.x;

    const crossedFromAbove = prevBottom >= staTop  && currBottom < staTop;
    const crossedFromBelow = prevTop    <= staBottom && currTop    > staBottom;
    // X轴帧穿越：防止高速水平移动时被错判为vertical碰撞
    const crossedFromLeft  = prevRight  <= staLeft  && currRight  > staLeft;
    const crossedFromRight = prevLeft   >= staRight && currLeft   < staRight;

    // Y轴穿越优先：落地 / 顶头
    if (crossedFromAbove) {
        collisionMsg = "bottom";
        // 如果玩家刚从分身上分离（仍在缓冲帧内），延迟应用碰撞修正
        if ((a._replayerLeftFrameCount || 0) > 0) {
            // 这一帧不修正位置，让玩家继续下落
            return collisionMsg;
        }
        a.y = staTop;
        a.prevY = a.y;
        return collisionMsg;
    }
    if (crossedFromBelow) {
        collisionMsg = "top";
        a.y = staBottom - a.collider.h;
        a.prevY = a.y;
        return collisionMsg;
    }
    // X轴穿越：从侧面高速撞入
    if (crossedFromLeft) {
        collisionMsg = "right";
        a.x = staLeft - a.collider.w;
        return collisionMsg;
    }
    if (crossedFromRight) {
        collisionMsg = "left";
        a.x = staRight;
        return collisionMsg;
    }

    // Fallback：玩家在上一帧已经与平台重叠（极罕见），用最小重叠量弹出
    let vectorX = (a.x + a.collider.w / 2) - (b.x + b.collider.w / 2);
    let vectorY = (a.y + a.collider.h / 2) - (b.y + b.collider.h / 2);
    let combinedHalfWidths  = a.collider.w / 2 + b.collider.w / 2;
    let combinedHalfHeights = a.collider.h / 2 + b.collider.h / 2;
    let overlapX = combinedHalfWidths  - Math.abs(vectorX);
    let overlapY = combinedHalfHeights - Math.abs(vectorY);

    if (overlapX <= overlapY) {
        if (vectorX > 0) {
            collisionMsg = "left";
            a.x = a.x + overlapX;
        } else {
            collisionMsg = "right";
            a.x = a.x - overlapX;
        }
    } else {
        if (vectorY > 0) {
            // 玩家中心在平台中心上方 → 落在平台顶上
            collisionMsg = "bottom";
            a.y = staTop;
        } else {
            // 玩家中心在平台中心下方 → 推到平台底下
            collisionMsg = "top";
            a.y = b.y - a.collider.h;
        }
        a.prevY = a.y;
    }
    return collisionMsg;
}

function resolveDynDyn(a, b) {
    const aPrevY = (a.prevY !== undefined) ? a.prevY : a.y;
    const bPrevY = (b.prevY !== undefined) ? b.prevY : b.y;

    const aPrevBottom = aPrevY;
    const aPrevTop = aPrevY + a.collider.h;
    const bPrevBottom = bPrevY;
    const bPrevTop = bPrevY + b.collider.h;

    // A 上一帧在 B 上方：A 踩 B 头，A 精确吸附到 B 顶部
    if(aPrevBottom >= bPrevTop) {
        if(a.headBlockedThisFrame) {
            // A 被平台顶住时，改为压回下方的 B，防止 A/B 互相穿模重叠
            b.y = a.y - b.collider.h;
        } else {
            a.y = b.y + b.collider.h;
        }
        return "a_on_b";
    }

    // B 上一帧在 A 上方：B 踩 A 头，B 精确吸附到 A 顶部
    if(bPrevBottom >= aPrevTop) {
        if(b.headBlockedThisFrame) {
            // B 被平台顶住时，改为压回下方的 A，防止 A/B 互相穿模重叠
            a.y = b.y - a.collider.h;
        } else {
            b.y = a.y + a.collider.h;
        }
        return "b_on_a";
    }

    // 左右方向的相交保留，不做垂直分离
    return "allowed collision";
}