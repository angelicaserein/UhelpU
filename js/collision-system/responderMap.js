import { ColliderShape, ColliderType } from "./enumerator.js";
import { EventTypes } from "../event-system/EventTypes.js";

const ENTITY_TYPES = Object.freeze({
  BOX: "box",
  BUTTON: "button",
  ENEMY: "enemy",
  PLAYER: "player",
  PORTAL: "portal",
  REPLAYER: "replayer",
  SPIKE: "spike",
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

const SUPPORT_TYPES = Object.freeze({
  PUSHING: "pushing",
  STANDING: "standing",
  SUPPORT: "support",
});

const STOMP_BOUNCE_VEL_Y = 17.5;
const HEAD_PUSH_VERTICAL_TOLERANCE = 8;
const HEAD_PUSH_HORIZONTAL_TOLERANCE = 6;

function isType(entity, type) {
  return !!entity && entity.type === type;
}

function isPlayer(entity) {
  return isType(entity, ENTITY_TYPES.PLAYER);
}

function isReplayer(entity) {
  return isType(entity, ENTITY_TYPES.REPLAYER);
}

function isPlayerOrReplayer(entity) {
  return isPlayer(entity) || isReplayer(entity);
}

function isEnemy(entity) {
  return isType(entity, ENTITY_TYPES.ENEMY);
}

function isBox(entity) {
  return isType(entity, ENTITY_TYPES.BOX);
}

function isButton(entity) {
  return isType(entity, ENTITY_TYPES.BUTTON);
}

function isSpike(entity) {
  return isType(entity, ENTITY_TYPES.SPIKE);
}

function isPortal(entity) {
  return isType(entity, ENTITY_TYPES.PORTAL);
}

function isDead(entity) {
  return !!(entity && entity.deathState && entity.deathState.isDead);
}

function markGrounded(entity, groundVelY) {
  if (!entity?.controllerManager?.currentControlComponent) return;

  entity.controllerManager.currentControlComponent.abilityCondition[
    "isOnGround"
  ] = true;
  entity.controllerManager.currentControlComponent.abilityCondition[
    "groundVelY"
  ] = groundVelY;
}

function syncVerticalVelocity(entity, sourceVelY, offset = 0) {
  if (!entity?.movementComponent) return;
  entity.movementComponent.velY = sourceVelY + offset;
}

function setStandingSupportRelation(rider, supporter) {
  rider._supportingEntity = supporter;
  rider._supportingType = SUPPORT_TYPES.STANDING;
  supporter._supportingEntity = null;
  supporter._supportingType = SUPPORT_TYPES.SUPPORT;
}

function stompEnemy(stomper, enemy) {
  if (stomper.movementComponent) {
    stomper.movementComponent.velY = STOMP_BOUNCE_VEL_Y;
  }
  markGrounded(stomper, 0);
  if (typeof enemy.triggerDeath === "function") {
    enemy.triggerDeath();
  }
}

function handleCharacterEnemyDynamicCollision(character, enemy, msg) {
  if (!character || !enemy || !isEnemy(enemy) || isDead(enemy)) {
    return false;
  }

  if (msg === COLLISION_MSGS.A_ON_B) {
    stompEnemy(character, enemy);
    return true;
  }

  if (msg === COLLISION_MSGS.ALLOWED || msg === COLLISION_MSGS.B_ON_A) {
    if (isPlayer(character) && typeof character.triggerDeath === "function") {
      character.triggerDeath("enemy");
    }
    return true;
  }

  return false;
}

export const responderMap = {
  "DYNAMIC-STATIC": (a, b, msg) => basicBlockResponse(a, b, msg),
  "DYNAMIC-DYNAMIC": (a, b, msg) => dynDynBlockResponse(a, b, msg),
  "DYNAMIC-TRIGGER": (a, b, eventBus) => dynTriResponse(a, b, eventBus),
};

// Helper: Handle box collision response (as DYNAMIC object)
function handleBoxCollision(boxEntity, otherEntity, msg) {
  if (msg === COLLISION_MSGS.LEFT || msg === COLLISION_MSGS.RIGHT) {
    boxEntity.movementComponent.velX = 0;
    boxEntity.blockedXLastFrame = true;
  } else if (msg === COLLISION_MSGS.TOP) {
    boxEntity.headBlockedThisFrame = true;
    if (boxEntity.movementComponent.velY > 0) {
      boxEntity.movementComponent.velY = 0;
    }
  } else if (msg === COLLISION_MSGS.BOTTOM) {
    boxEntity.movementComponent.velY = 0;
  }
}

function applyHeadPushSupportRelation(pusher, box) {
  box._supportingEntity = pusher;
  box._supportingType = SUPPORT_TYPES.STANDING;
  pusher._supportingEntity = box;
  pusher._supportingType = SUPPORT_TYPES.PUSHING;
}

function shouldKeepHeadPushRelation(pusher, box) {
  if (!pusher || !box || !pusher.collider || !box.collider) return false;

  const pusherTopY = pusher.y + pusher.collider.h;
  const boxBottomY = box.y;

  // Vertical tolerance keeps relation stable across short classify jitter.
  const nearHeadContact =
    Math.abs(boxBottomY - pusherTopY) <= HEAD_PUSH_VERTICAL_TOLERANCE;

  const pusherLeft = pusher.x;
  const pusherRight = pusher.x + pusher.collider.w;
  const boxLeft = box.x;
  const boxRight = box.x + box.collider.w;

  // Horizontal tolerance avoids relation drop on exact-edge switch frames.
  const overlapX =
    pusherLeft < boxRight + HEAD_PUSH_HORIZONTAL_TOLERANCE &&
    pusherRight > boxLeft - HEAD_PUSH_HORIZONTAL_TOLERANCE;

  return nearHeadContact && overlapX;
}

function basicBlockResponse(a, b, msg) {
  // Box collision with static platform
  if (isBox(a)) {
    handleBoxCollision(a, b, msg);
    return;
  }

  // 敌人（被踩踏）碰撞处理 - 忽略已死敌人
  if (isEnemy(b)) {
    // 检查敌人是否已死，已死的敌人无法再被互动
    if (isDead(b)) {
      return;
    }

    if (msg === COLLISION_MSGS.BOTTOM) {
      // 踩踏敌人头顶：弹跳 + 敌人死亡
      a.movementComponent.velY = STOMP_BOUNCE_VEL_Y; // 踩踏弹跳速度 (1.75x normal jump)
      markGrounded(a, 0);
      b.triggerDeath(); // 敌人死亡
      return;
    } else if (
      msg === COLLISION_MSGS.LEFT ||
      msg === COLLISION_MSGS.RIGHT ||
      msg === COLLISION_MSGS.TOP
    ) {
      // 侧面或正面碰撞：Player死亡，Replayer无作用
      if (isPlayer(a)) {
        a.triggerDeath("enemy"); // Player死亡
      }
      // Replayer侧面碰撞无作用
      return;
    }
  }

  // 敌人对障碍物的碰撞处理 - 左右碰撞时调头
  if (isEnemy(a)) {
    if (msg === COLLISION_MSGS.LEFT) {
      a.blockedLeftThisFrame = true;
    } else if (msg === COLLISION_MSGS.RIGHT) {
      a.blockedRightThisFrame = true;
    }
    // 敌人作为DYNAMIC处理垂直碰撞
    if (msg === COLLISION_MSGS.TOP) {
      if (a.movementComponent.velY > 0) {
        a.movementComponent.velY = 0;
      }
    }
    if (msg === COLLISION_MSGS.BOTTOM) {
      a.movementComponent.velY = 0;
      a.blockedBottomThisFrame = true;
      if (b && b.collider) {
        a._supportLeft = b.x;
        a._supportRight = b.x + b.collider.w;
      }
    }
    return;
  }

  // 原有的平台碰撞逻辑（Player等DYNAMIC对象）
  if (msg === COLLISION_MSGS.LEFT || msg === COLLISION_MSGS.RIGHT) {
    a.movementComponent.velX = 0;
    a.blockedXLastFrame = true;
  } else {
    if (msg === COLLISION_MSGS.TOP) {
      a.headBlockedThisFrame = true;
      // 头顶碰撞时，清零向上的速度，防止黏住
      if (a.movementComponent.velY > 0) {
        a.movementComponent.velY = 0;
      }
    }
    if (msg === COLLISION_MSGS.BOTTOM) {
      // 如果玩家刚从分身上分离（仍在缓冲期），允许继续下落
      if ((a._replayerLeftFrameCount || 0) > 0) {
        // 延迟期内：不改变速度和地面状态，但清零标志避免循环
        a._wasStandingOnReplayer = false;
        a._replayerLeftFrameCount = 0;
        return;
      }
      // 静态地板需要清零速度，防止持续下沉
      a.movementComponent.velY = 0;
      markGrounded(a, 0);
      // 落地时清除分身相关标志
      a._wasStandingOnReplayer = false;
      a._replayerLeftFrameCount = 0;
    }
  }
}

function dynDynBlockResponse(a, b, msg) {
  // Player/Replayer vs Enemy: 踩踏判定与受伤判定
  if (isPlayerOrReplayer(a) && isEnemy(b)) {
    if (handleCharacterEnemyDynamicCollision(a, b, msg)) {
      return;
    }
  }

  // Player/Replayer pushing Box (lateral collision)
  if (isPlayerOrReplayer(a) && isBox(b)) {
    if (msg === COLLISION_MSGS.ALLOWED) {
      // Keep pushing chain in jump direction-switch frames when head contact still exists.
      if (shouldKeepHeadPushRelation(a, b)) {
        applyHeadPushSupportRelation(a, b);
      }
      return;
    }
    if (msg === COLLISION_MSGS.A_ON_B) {
      // a 踩在 box 头上
      markGrounded(a, b.movementComponent ? b.movementComponent.velY : 0);
      // [FIX] 落地速度异常：重力每帧累积到 velY，走下边缘时爆发成超快下落。
      // 同步 velY 为实体当前速度（静止时为0），防止累积，离开时从自然重力起步。
      syncVerticalVelocity(
        a,
        b.movementComponent ? b.movementComponent.velY : 0,
      );
      // [NEW] 支撑链velX传递：记录 a 站在 box 上的支撑关系
      setStandingSupportRelation(a, b);
    } else if (msg === COLLISION_MSGS.B_ON_A) {
      // box 踩在 a 头上（rare, but handle it)
      markGrounded(b, a.movementComponent ? a.movementComponent.velY : 0);
      // [FIX] 落地速度异常：同上，b 站在 box 上时同步 velY 防止重力累积。
      syncVerticalVelocity(
        b,
        a.movementComponent ? a.movementComponent.velY : 0,
      );
      // [NEW] 支撑链velX传递：记录 b 站在 a 上（a 顶推 b）的支撑关系
      applyHeadPushSupportRelation(a, b);
    }
    return;
  }

  // Box pushing Box
  if (isBox(a) && isBox(b)) {
    if (msg === COLLISION_MSGS.ALLOWED) {
      return;
    }
    if (msg === COLLISION_MSGS.A_ON_B) {
      // a 踩在 b 头上
      if (a.movementComponent && b.movementComponent) {
        a.movementComponent.velY = 0;
        b.movementComponent.velY = Math.max(b.movementComponent.velY, 0);
      }
      // [NEW] 支撑链velX传递：记录上方 box 站在下方 box 上的支撑关系
      setStandingSupportRelation(a, b);
    } else if (msg === COLLISION_MSGS.B_ON_A) {
      // b 踩在 a 头上
      if (a.movementComponent && b.movementComponent) {
        b.movementComponent.velY = 0;
        a.movementComponent.velY = Math.max(a.movementComponent.velY, 0);
      }
      // [NEW] 支撑链velX传递：记录上方 box 站在下方 box 上の支撑关系
      b._supportingEntity = a;
      b._supportingType = "standing";
      a._supportingEntity = b;
      a._supportingType = "pushing";
    }
    return;
  }

  if (msg === COLLISION_MSGS.ALLOWED) {
    return;
  }
  if (msg === COLLISION_MSGS.A_ON_B) {
    // a 踩在 b 头上 - 只设置地面标志，不修改速度，让碰撞检测处理约束
    if (a.headBlockedThisFrame && b.movementComponent.velY > 0) {
      b.movementComponent.velY = 0;
      b.headBlockedThisFrame = true;
    }
    markGrounded(a, b.movementComponent ? b.movementComponent.velY : 0);
    // [FIX] 落地速度异常：重力每帧累积到 velY，走下边缘时爆发成超快下落。
    // 同步 velY 为实体当前速度，防止累积，离开时从自然重力起步。
    // [FIX] 分身空中跳跃时player无法跳跃：完全同步 velY 会让 player 与 replayer
    // 每帧位移量完全相同，导致 AABB 无重叠 → isOnGround 永远不被设置 →
    // coyote time 耗尽后跳不起来。偏移 -1 确保 player 每帧比 replayer 慢 1px，
    // 产生持续微小穿模，碰撞检测可正常触发 isOnGround = true。
    syncVerticalVelocity(
      a,
      b.movementComponent ? b.movementComponent.velY : 0,
      -1,
    );
    // 标记玩家正在踩在分身上，这样当分身离开时我们知道玩家需要下落
    if (isReplayer(b)) {
      a._currentlyOnReplayer = true;
      a._wasStandingOnReplayer = true;
    }
    // [NEW] 支撑链velX传递：记录 a 站在 b 上的支撑关系
    setStandingSupportRelation(a, b);
  } else if (msg === COLLISION_MSGS.B_ON_A) {
    // b 踩在 a 头上 - 只设置地面标志，不修改速度，让碰撞检测处理约束
    if (b.headBlockedThisFrame && a.movementComponent.velY > 0) {
      a.movementComponent.velY = 0;
      a.headBlockedThisFrame = true;
    }
    markGrounded(b, a.movementComponent ? a.movementComponent.velY : 0);
    // [FIX] 落地速度异常：同上，b 站在动态实体上时同步 velY 防止重力累积。
    syncVerticalVelocity(b, a.movementComponent ? a.movementComponent.velY : 0);
    // 标记玩家正在踩在分身上
    if (isReplayer(a) && isPlayer(b)) {
      b._currentlyOnReplayer = true;
      b._wasStandingOnReplayer = true;
    }
    // [NEW] 支撑链velX传递：记录 b 站在 a 上（a 顶推 b）的支撑关系
    b._supportingEntity = a;
    b._supportingType = "standing";
    a._supportingEntity = b;
    a._supportingType = "pushing";
  }
  return;
}
function dynTriResponse(a, b, eventBus) {
  //level2
  if ((isPlayer(a) || (isReplayer(a) && a.isReplaying)) && isButton(b)) {
    b.pressButton();
    return;
  }

  // 敌人可以踩按钮
  if (isEnemy(a) && isButton(b)) {
    b.pressButton();
    return;
  }

  // 箱子可以踩按钮
  if (isBox(a) && isButton(b)) {
    b.pressButton();
    return;
  }

  if (isPlayer(a) && isSpike(b)) {
    // 触发死亡状态而不是直接结算
    a.triggerDeath("spike");
    return;
  }

  // 敌人碰到地刺也会死亡
  if (isEnemy(a) && isSpike(b)) {
    a.triggerDeath("spike");
    return;
  }

  if (isPlayer(a) && isPortal(b)) {
    if (b.isOpen) {
      eventBus && eventBus.publish(EventTypes.AUTO_RESULT, "autoResult1");
    }
    return;
  }
}
