import { ColliderShape, ColliderType } from "./enumerator.js";

const ENTITY_TYPES = Object.freeze({
  BOX: "box",
  PLAYER: "player",
  REPLAYER: "replayer",
});

const COLLISION_MSGS = Object.freeze({
  ALLOWED: "allowed collision",
  A_ON_B: "a_on_b",
  B_ON_A: "b_on_a",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
  TOP: "top",
});

function getPrevCoord(entity, axis) {
  const prevKey = axis === "x" ? "prevX" : "prevY";
  return entity[prevKey] !== undefined ? entity[prevKey] : entity[axis];
}

function getBoundsAt(entity, x, y) {
  return {
    left: x,
    right: x + entity.collider.w,
    bottom: y,
    top: y + entity.collider.h,
  };
}

function getPrevBounds(entity) {
  return getBoundsAt(
    entity,
    getPrevCoord(entity, "x"),
    getPrevCoord(entity, "y"),
  );
}

function getCurrBounds(entity) {
  return getBoundsAt(entity, entity.x, entity.y);
}

function getCenterOverlap(a, b) {
  const vectorX = a.x + a.collider.w / 2 - (b.x + b.collider.w / 2);
  const vectorY = a.y + a.collider.h / 2 - (b.y + b.collider.h / 2);
  const overlapX = a.collider.w / 2 + b.collider.w / 2 - Math.abs(vectorX);
  const overlapY = a.collider.h / 2 + b.collider.h / 2 - Math.abs(vectorY);

  return { vectorX, vectorY, overlapX, overlapY };
}

function isType(entity, type) {
  return !!entity && entity.type === type;
}

function isBox(entity) {
  return isType(entity, ENTITY_TYPES.BOX);
}

function isPusher(entity) {
  return (
    isType(entity, ENTITY_TYPES.PLAYER) || isType(entity, ENTITY_TYPES.REPLAYER)
  );
}

function placeEntityOnTop(entity, supporter) {
  entity.y = supporter.y + supporter.collider.h;
}

function placeEntityBelow(entity, blocker) {
  entity.y = blocker.y - entity.collider.h;
}

function resolveVerticalFallback(a, b, overlap) {
  if (overlap.vectorY > 0) {
    a.y = b.y + b.collider.h;
    a.prevY = a.y;
    return COLLISION_MSGS.BOTTOM;
  }

  a.y = b.y - a.collider.h;
  a.prevY = a.y;
  return COLLISION_MSGS.TOP;
}

function tryResolveLateralBoxPush(a, b, aPrev, bPrev, aCurr, bCurr) {
  if (isBox(b) && aPrev.right <= bPrev.left && aCurr.right > bCurr.left) {
    b.x = a.x + a.collider.w;
    return COLLISION_MSGS.ALLOWED;
  }

  if (isBox(b) && aPrev.left >= bPrev.right && aCurr.left < bCurr.right) {
    b.x = a.x - b.collider.w;
    return COLLISION_MSGS.ALLOWED;
  }

  if (isBox(a) && bPrev.right <= aPrev.left && bCurr.right > aCurr.left) {
    a.x = b.x + b.collider.w;
    return COLLISION_MSGS.ALLOWED;
  }

  if (isBox(a) && bPrev.left >= aPrev.right && bCurr.left < aCurr.right) {
    a.x = b.x - a.collider.w;
    return COLLISION_MSGS.ALLOWED;
  }

  return null;
}

export const resolverMap = {
  // "DYNAMIC-DYNAMIC": (a, b) => resolveBoth(a, b),
  "DYNAMIC-STATIC-RECTANGLE-RECTANGLE": (a, b) => resolveFirst(a, b),
  "DYNAMIC-DYNAMIC-RECTANGLE-RECTANGLE": (a, b) => resolveDynDyn(a, b),
};

function resolveFirst(a, b) {
  let collisionMsg = "";

  const prevBounds = getPrevBounds(a);
  const currBounds = getCurrBounds(a);
  const staticBounds = getCurrBounds(b);

  const crossedFromAbove =
    prevBounds.bottom >= staticBounds.top &&
    currBounds.bottom < staticBounds.top;
  const crossedFromBelow =
    prevBounds.top <= staticBounds.bottom &&
    currBounds.top > staticBounds.bottom;
  // X轴帧穿越：防止高速水平移动时被错判为vertical碰撞
  const crossedFromLeft =
    prevBounds.right <= staticBounds.left &&
    currBounds.right > staticBounds.left;
  const crossedFromRight =
    prevBounds.left >= staticBounds.right &&
    currBounds.left < staticBounds.right;

  // Y轴穿越优先：落地 / 顶头
  if (crossedFromAbove) {
    collisionMsg = COLLISION_MSGS.BOTTOM;
    // 如果玩家刚从分身上分离（仍在缓冲帧内），延迟应用碰撞修正
    if ((a._replayerLeftFrameCount || 0) > 0) {
      // 这一帧不修正位置，让玩家继续下落
      return collisionMsg;
    }
    a.y = staticBounds.top;
    a.prevY = a.y;
    return collisionMsg;
  }
  if (crossedFromBelow) {
    collisionMsg = COLLISION_MSGS.TOP;
    a.y = staticBounds.bottom - a.collider.h;
    a.prevY = a.y;
    return collisionMsg;
  }
  // X轴穿越：从侧面高速撞入
  if (crossedFromLeft) {
    collisionMsg = COLLISION_MSGS.RIGHT;
    a.x = staticBounds.left - a.collider.w;
    return collisionMsg;
  }
  if (crossedFromRight) {
    collisionMsg = COLLISION_MSGS.LEFT;
    a.x = staticBounds.right;
    return collisionMsg;
  }

  // Fallback：玩家在上一帧已经与平台重叠（极罕见），用最小重叠量弹出
  const overlap = getCenterOverlap(a, b);

  if (overlap.overlapX <= overlap.overlapY) {
    if (overlap.vectorX > 0) {
      collisionMsg = COLLISION_MSGS.LEFT;
      a.x = a.x + overlap.overlapX;
    } else {
      collisionMsg = COLLISION_MSGS.RIGHT;
      a.x = a.x - overlap.overlapX;
    }
  } else {
    collisionMsg = resolveVerticalFallback(a, b, overlap);
  }
  return collisionMsg;
}

function resolveDynDyn(a, b) {
  const aPrev = getPrevBounds(a);
  const bPrev = getPrevBounds(b);
  const aCurr = getCurrBounds(a);
  const bCurr = getCurrBounds(b);

  // A 上一帧在 B 上方：A 踩 B 头，A 精确吸附到 B 顶部
  if (aPrev.bottom >= bPrev.top) {
    if (a.headBlockedThisFrame) {
      // A 被平台顶住时，改为压回下方的 B，防止 A/B 互相穿模重叠
      placeEntityBelow(b, a);
    } else {
      placeEntityOnTop(a, b);
    }
    return COLLISION_MSGS.A_ON_B;
  }

  // B 上一帧在 A 上方：B 踩 A 头，B 精确吸附到 A 顶部
  if (bPrev.bottom >= aPrev.top) {
    if (b.headBlockedThisFrame) {
      // B 被平台顶住时，改为压回下方的 A，防止 A/B 互相穿模重叠
      placeEntityBelow(a, b);
    } else {
      placeEntityOnTop(b, a);
    }
    return COLLISION_MSGS.B_ON_A;
  }

  // 侧面碰撞：检测box推动
  const boxPushMsg = tryResolveLateralBoxPush(a, b, aPrev, bPrev, aCurr, bCurr);
  if (boxPushMsg) {
    return boxPushMsg;
  }

  const overlap = getCenterOverlap(a, b);

  const isPusherBoxPair =
    (isPusher(a) && isBox(b)) || (isPusher(b) && isBox(a));
  const isBoxBoxPair = isBox(a) && isBox(b);

  // Deterministic lateral fallback for chain pushes:
  // if side overlap remains after crossing checks, snap by previous-frame side relation.
  if (
    (isPusherBoxPair || isBoxBoxPair) &&
    overlap.overlapX > 0 &&
    overlap.overlapY > 0
  ) {
    const verticallyStacked =
      aPrev.bottom >= bPrev.top || bPrev.bottom >= aPrev.top;

    // Do not consume vertical stack cases (standing/on-head), let other branches handle them.
    if (!verticallyStacked) {
      const aPrevX = getPrevCoord(a, "x");
      const bPrevX = getPrevCoord(b, "x");
      const aWasLeftOfB = aPrev.right <= bPrev.left || aPrevX < bPrevX;
      const bWasLeftOfA = bPrev.right <= aPrev.left || bPrevX < aPrevX;

      if (aWasLeftOfB && !bWasLeftOfA) {
        b.x = a.x + a.collider.w;
        return COLLISION_MSGS.ALLOWED;
      }
      if (bWasLeftOfA && !aWasLeftOfB) {
        a.x = b.x + b.collider.w;
        return COLLISION_MSGS.ALLOWED;
      }

      // Tie-breaker for exact same prevX: separate by current center direction.
      if (overlap.vectorX <= 0) {
        b.x = a.x + a.collider.w;
      } else {
        a.x = b.x + b.collider.w;
      }
      return COLLISION_MSGS.ALLOWED;
    }
  }

  // 左右方向的相交保留，不做垂直分离
  return COLLISION_MSGS.ALLOWED;
}
