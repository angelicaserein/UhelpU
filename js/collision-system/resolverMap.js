import { ColliderShape, ColliderType } from "./enumerator.js";

export const resolverMap = {
  // "DYNAMIC-DYNAMIC": (a, b) => resolveBoth(a, b),
  "DYNAMIC-STATIC-RECTANGLE-RECTANGLE": (a, b) => resolveFirst(a, b),
  "DYNAMIC-DYNAMIC-RECTANGLE-RECTANGLE": (a, b) => resolveDynDyn(a, b),
};

function resolveFirst(a, b) {
  let collisionMsg = "";

  const prevY = a.prevY !== undefined ? a.prevY : a.y;
  const prevX = a.prevX !== undefined ? a.prevX : a.x;

  const prevBottom = prevY;
  const prevTop = prevY + a.collider.h;
  const currBottom = a.y;
  const currTop = a.y + a.collider.h;
  const staBottom = b.y;
  const staTop = b.y + b.collider.h;
  const staLeft = b.x;
  const staRight = b.x + b.collider.w;
  const prevRight = prevX + a.collider.w;
  const prevLeft = prevX;
  const currRight = a.x + a.collider.w;
  const currLeft = a.x;

  const crossedFromAbove = prevBottom >= staTop && currBottom < staTop;
  const crossedFromBelow = prevTop <= staBottom && currTop > staBottom;
  // X轴帧穿越：防止高速水平移动时被错判为vertical碰撞
  const crossedFromLeft = prevRight <= staLeft && currRight > staLeft;
  const crossedFromRight = prevLeft >= staRight && currLeft < staRight;

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
  let vectorX = a.x + a.collider.w / 2 - (b.x + b.collider.w / 2);
  let vectorY = a.y + a.collider.h / 2 - (b.y + b.collider.h / 2);
  let combinedHalfWidths = a.collider.w / 2 + b.collider.w / 2;
  let combinedHalfHeights = a.collider.h / 2 + b.collider.h / 2;
  let overlapX = combinedHalfWidths - Math.abs(vectorX);
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
  const aPrevY = a.prevY !== undefined ? a.prevY : a.y;
  const bPrevY = b.prevY !== undefined ? b.prevY : b.y;
  const aPrevX = a.prevX !== undefined ? a.prevX : a.x;
  const bPrevX = b.prevX !== undefined ? b.prevX : b.x;

  const aPrevBottom = aPrevY;
  const aPrevTop = aPrevY + a.collider.h;
  const bPrevBottom = bPrevY;
  const bPrevTop = bPrevY + b.collider.h;

  const aPrevRight = aPrevX + a.collider.w;
  const aPrevLeft = aPrevX;
  const bPrevRight = bPrevX + b.collider.w;
  const bPrevLeft = bPrevX;

  const aCurrRight = a.x + a.collider.w;
  const aCurrLeft = a.x;
  const bCurrRight = b.x + b.collider.w;
  const bCurrLeft = b.x;

  // A 上一帧在 B 上方：A 踩 B 头，A 精确吸附到 B 顶部
  if (aPrevBottom >= bPrevTop) {
    if (a.headBlockedThisFrame) {
      // A 被平台顶住时，改为压回下方的 B，防止 A/B 互相穿模重叠
      b.y = a.y - b.collider.h;
    } else {
      a.y = b.y + b.collider.h;
    }
    return "a_on_b";
  }

  // B 上一帧在 A 上方：B 踩 A 头，B 精确吸附到 A 顶部
  if (bPrevBottom >= aPrevTop) {
    if (b.headBlockedThisFrame) {
      // B 被平台顶住时，改为压回下方的 A，防止 A/B 互相穿模重叠
      a.y = b.y - a.collider.h;
    } else {
      b.y = a.y + a.collider.h;
    }
    return "b_on_a";
  }

  // 侧面碰撞：检测box推动
  // A 从左边推入 B（A 向右推 B)
  if (b.type === "box" && aPrevRight <= bPrevLeft && aCurrRight > bCurrLeft) {
    // b 被从左边推动
    b.x = a.x + a.collider.w;
    return "allowed collision";
  }
  // A 从右边推入 B（A 向左推 B）
  if (b.type === "box" && aPrevLeft >= bPrevRight && aCurrLeft < bCurrRight) {
    // b 被从右边推动
    b.x = a.x - b.collider.w;
    return "allowed collision";
  }

  // B 从左边推入 A（B 向右推 A）
  if (a.type === "box" && bPrevRight <= aPrevLeft && bCurrRight > aCurrLeft) {
    // a 被从左边推动
    a.x = b.x + b.collider.w;
    return "allowed collision";
  }
  // B 从右边推入 A（B 向左推 A）
  if (a.type === "box" && bPrevLeft >= aPrevRight && bCurrLeft < aCurrRight) {
    // a 被从右边推动
    a.x = b.x - a.collider.w;
    return "allowed collision";
  }

  const vectorX = a.x + a.collider.w / 2 - (b.x + b.collider.w / 2);
  const vectorY = a.y + a.collider.h / 2 - (b.y + b.collider.h / 2);
  const overlapX = a.collider.w / 2 + b.collider.w / 2 - Math.abs(vectorX);
  const overlapY = a.collider.h / 2 + b.collider.h / 2 - Math.abs(vectorY);

  const isPusherA = a.type === "player" || a.type === "replayer";
  const isPusherB = b.type === "player" || b.type === "replayer";
  const isPusherBoxPair =
    (isPusherA && b.type === "box") || (isPusherB && a.type === "box");
  const isBoxBoxPair = a.type === "box" && b.type === "box";

  // Deterministic lateral fallback for chain pushes:
  // if side overlap remains after crossing checks, snap by previous-frame side relation.
  if ((isPusherBoxPair || isBoxBoxPair) && overlapX > 0 && overlapY > 0) {
    const verticallyStacked =
      aPrevBottom >= bPrevTop || bPrevBottom >= aPrevTop;

    // Do not consume vertical stack cases (standing/on-head), let other branches handle them.
    if (!verticallyStacked) {
      const aWasLeftOfB = aPrevRight <= bPrevLeft || aPrevX < bPrevX;
      const bWasLeftOfA = bPrevRight <= aPrevLeft || bPrevX < aPrevX;

      if (aWasLeftOfB && !bWasLeftOfA) {
        b.x = a.x + a.collider.w;
        return "allowed collision";
      }
      if (bWasLeftOfA && !aWasLeftOfB) {
        a.x = b.x + b.collider.w;
        return "allowed collision";
      }

      // Tie-breaker for exact same prevX: separate by current center direction.
      if (vectorX <= 0) {
        b.x = a.x + a.collider.w;
      } else {
        a.x = b.x + b.collider.w;
      }
      return "allowed collision";
    }
  }

  // 左右方向的相交保留，不做垂直分离
  return "allowed collision";
}
