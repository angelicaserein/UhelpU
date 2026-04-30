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

function getResolvedDeltaY(entity) {
  if (!entity) return 0;
  return entity.prevY !== undefined ? entity.y - entity.prevY : 0;
}

function syncVerticalVelocity(entity, sourceDeltaY, offset = 0) {
  if (!entity?.movementComponent) return;
  entity.movementComponent.velY = sourceDeltaY + offset;
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
// 辅助函数：处理箱子的碰撞响应（作为动态对象）
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
  // 垂直容差使关系在短暂分类抖动时保持稳定。
  const nearHeadContact =
    Math.abs(boxBottomY - pusherTopY) <= HEAD_PUSH_VERTICAL_TOLERANCE;

  const pusherLeft = pusher.x;
  const pusherRight = pusher.x + pusher.collider.w;
  const boxLeft = box.x;
  const boxRight = box.x + box.collider.w;

  // Horizontal tolerance avoids relation drop on exact-edge switch frames.
  // 水平容差避免在精确边界切换帧时关系丢失。
  const overlapX =
    pusherLeft < boxRight + HEAD_PUSH_HORIZONTAL_TOLERANCE &&
    pusherRight > boxLeft - HEAD_PUSH_HORIZONTAL_TOLERANCE;

  return nearHeadContact && overlapX;
}

function basicBlockResponse(a, b, msg) {
  // Box collision with static platform
  // 箱子与静态平台的碰撞
  if (isBox(a)) {
    handleBoxCollision(a, b, msg);
    return;
  }

  // Enemy collision handling (being stomped) - ignore already-dead enemies.
  // 敌人（被踩踏）碰撞处理 - 忽略已死敌人
  if (isEnemy(b)) {
    // Check if enemy is already dead; dead enemies can no longer be interacted with.
    // 检查敌人是否已死，已死的敌人无法再被互动
    if (isDead(b)) {
      return;
    }

    if (msg === COLLISION_MSGS.BOTTOM) {
      // Stomp on enemy's head: bounce + enemy death.
      // 踩踏敌人头顶：弹跳 + 敌人死亡
      a.movementComponent.velY = STOMP_BOUNCE_VEL_Y; // 踩踏弹跳速度 (1.75x normal jump)
      markGrounded(a, 0);
      b.triggerDeath(); // Enemy death | 敌人死亡
      return;
    } else if (
      msg === COLLISION_MSGS.LEFT ||
      msg === COLLISION_MSGS.RIGHT ||
      msg === COLLISION_MSGS.TOP
    ) {
      // Side or frontal collision: Player dies, Replayer unaffected.
      // 侧面或正面碰撞：Player死亡，Replayer无作用
      if (isPlayer(a)) {
        a.triggerDeath("enemy"); // Player dies | Player死亡
      }
      // Side collision has no effect on Replayer.
      // Replayer侧面碰撞无作用
      return;
    }
  }

  // Enemy collision with obstacles — reverse direction on left/right collision.
  // 敌人对障碍物的碰撞处理 - 左右碰撞时调头
  if (isEnemy(a)) {
    if (msg === COLLISION_MSGS.LEFT) {
      a.blockedLeftThisFrame = true;
    } else if (msg === COLLISION_MSGS.RIGHT) {
      a.blockedRightThisFrame = true;
    }
    // Enemy handles vertical collision as DYNAMIC entity.
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
        const supportLeft = b.x;
        const supportRight = b.x + b.collider.w;
        a._supportLeft = Number.isFinite(a._supportLeft)
          ? Math.min(a._supportLeft, supportLeft)
          : supportLeft;
        a._supportRight = Number.isFinite(a._supportRight)
          ? Math.max(a._supportRight, supportRight)
          : supportRight;
      }
    }
    return;
  }

  // Original platform collision logic (Player and other DYNAMIC objects).
  // 原有的平台碰撞逻辑（Player等DYNAMIC对象）
  if (msg === COLLISION_MSGS.LEFT || msg === COLLISION_MSGS.RIGHT) {
    a.movementComponent.velX = 0;
    a.blockedXLastFrame = true;
  } else {
    if (msg === COLLISION_MSGS.TOP) {
      a.headBlockedThisFrame = true;
      // On head collision, zero out upward velocity to prevent sticking.
      // 头顶碰撞时，清零向上的速度，防止黏住
      if (a.movementComponent.velY > 0) {
        a.movementComponent.velY = 0;
      }
    }
    if (msg === COLLISION_MSGS.BOTTOM) {
      // If player just separated from replayer (still in buffer period), allow continued falling.
      // 如果玩家刚从分身上分离（仍在缓冲期），允许继续下落
      if ((a._replayerLeftFrameCount || 0) > 0) {
        // During buffer period: do not modify velocity or ground state, but clear flags to avoid loops.
        // 延迟期内：不改变速度和地面状态，但清零标志避免循环
        a._wasStandingOnReplayer = false;
        a._replayerLeftFrameCount = 0;
        return;
      }
      // Static floor requires zeroing velocity to prevent continuous sinking.
      // 静态地板需要清零速度，防止持续下沉
      a.movementComponent.velY = 0;
      markGrounded(a, 0);
      // Clear replayer-related flags on landing.
      // 落地时清除分身相关标志
      a._wasStandingOnReplayer = false;
      a._replayerLeftFrameCount = 0;
    }
  }
}

function dynDynBlockResponse(a, b, msg) {
  // Player/Replayer vs Enemy: stomp judgment and damage judgment.
  // Player/Replayer vs Enemy: 踩踏判定与受伤判定
  if (isPlayerOrReplayer(a) && isEnemy(b)) {
    if (handleCharacterEnemyDynamicCollision(a, b, msg)) {
      return;
    }
  }

  // Player/Replayer pushing Box (lateral collision)
  // 玩家/分身推动箱子（侧向碰撞）
  if (isPlayerOrReplayer(a) && isBox(b)) {
    if (msg === COLLISION_MSGS.ALLOWED) {
      // Keep pushing chain in jump direction-switch frames when head contact still exists.
      // 在头部接触仍存在的跳跃方向切换帧内保持推链。
      if (shouldKeepHeadPushRelation(a, b)) {
        applyHeadPushSupportRelation(a, b);
      }
      return;
    }
    if (msg === COLLISION_MSGS.A_ON_B) {
      // a is standing on top of the box.
      // a 踩在 box 头上
      markGrounded(a, getResolvedDeltaY(b));
      // [FIX] Landing velocity anomaly: gravity accumulates into velY each frame, bursting into super-fast falling when walking off an edge.
      // [FIX] 落地速度异常：重力每帧累积到 velY，走下边缘时爆发成超快下落。
      // Sync velY to entity's current velocity (0 when stationary) to prevent accumulation; fall from natural gravity when leaving.
      // 同步 velY 为实体当前速度（静止时为0），防止累积，离开时从自然重力起步。
      syncVerticalVelocity(a, getResolvedDeltaY(b));
      // [NEW] VelX chain propagation: record support relation of a standing on box.
      // [NEW] 支撑链vlX传递：记录 a 站在 box 上的支撑关系
      setStandingSupportRelation(a, b);
    } else if (msg === COLLISION_MSGS.B_ON_A) {
      // box is standing on top of a (rare, but handle it).
      // box 踩在 a 头上（rare, but handle it)
      markGrounded(b, getResolvedDeltaY(a));
      // [FIX] Landing velocity anomaly: same as above, sync velY when b is on box to prevent gravity accumulation.
      // [FIX] 落地速度异常：同上，b 站在 box 上时同步 velY 防止重力累积。
      syncVerticalVelocity(b, getResolvedDeltaY(a));
      // [NEW] VelX chain propagation: record support relation of b standing on a (a head-pushes b).
      // [NEW] 支撑链velX传递：记录 b 站在 a 上（a 顶推 b）的支撑关系
      applyHeadPushSupportRelation(a, b);
    }
    return;
  }

  // Box pushing Box
  // 箱子推动箱子
  if (isBox(a) && isBox(b)) {
    if (msg === COLLISION_MSGS.ALLOWED) {
      return;
    }
    if (msg === COLLISION_MSGS.A_ON_B) {
      // a is standing on top of b.
      // a 踩在 b 头上
      if (a.movementComponent && b.movementComponent) {
        a.movementComponent.velY = 0;
        b.movementComponent.velY = Math.max(b.movementComponent.velY, 0);
      }
      // [NEW] VelX chain propagation: record support relation of upper box standing on lower box.
      // [NEW] 支撑链vlX传递：记录上方 box 站在下方 box 上的支撑关系
      setStandingSupportRelation(a, b);
    } else if (msg === COLLISION_MSGS.B_ON_A) {
      // b is standing on top of a.
      // b 踩在 a 头上
      if (a.movementComponent && b.movementComponent) {
        b.movementComponent.velY = 0;
        a.movementComponent.velY = Math.max(a.movementComponent.velY, 0);
      }
      // [NEW] VelX chain propagation: record support relation of upper box standing on lower box.
      // [NEW] 支撑链vlX传递：记录上方 box 站在下方 box 上的支撑关系
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
    // a is standing on b's head — only set ground flag, do not modify velocity; let collision detection handle constraints.
    // a 踩在 b 头上 - 只设置地面标志，不修改速度，让碰撞检测处理约束
    if (a.headBlockedThisFrame && b.movementComponent.velY > 0) {
      b.movementComponent.velY = 0;
      b.headBlockedThisFrame = true;
    }
    markGrounded(a, getResolvedDeltaY(b));
    // [FIX] Landing velocity anomaly: gravity accumulates into velY each frame, bursting into super-fast falling when walking off an edge.
    // [FIX] 落地速度异常：重力每帧累积到 velY，走下边缘时爆发成超快下落。
    // Sync velY to entity's current velocity to prevent accumulation; fall from natural gravity when leaving.
    // 同步 velY 为实体当前速度，防止累积，离开时从自然重力起步。
    // [FIX] Player unable to jump while replayer is airborne: fully syncing velY makes player and replayer move identically each frame,
    // [FIX] 分身空中跳跃时player无法跳跃：完全同步 velY 会让 player 与 replayer
    // causing AABB to have no overlap → isOnGround never gets set → unable to jump after coyote time expires.
    // 每帧位移量完全相同，导致 AABB 无重叠 → isOnGround 永远不被设置 →
    // Offset -1 ensures player moves 1px slower than replayer each frame, creating persistent minor clipping so collision detection can normally trigger isOnGround = true.
    // coyote time 耗尽后跳不起来。偏移 -1 确保 player 每帧比 replayer 慢 1px，产生持续微小穿模，碰撞检测可正常触发 isOnGround = true。
    syncVerticalVelocity(a, getResolvedDeltaY(b), -1);
    // Mark player as standing on replayer, so when replayer leaves we know player needs to fall.
    // 标记玩家正在踩在分身上，这样当分身离开时我们知道玩家需要下落
    if (isReplayer(b)) {
      a._currentlyOnReplayer = true;
      a._wasStandingOnReplayer = true;
    }
    // [NEW] VelX chain propagation: record support relation of a standing on b.
    // [NEW] 支撑链vlX传递：记录 a 站在 b 上的支撑关系
    setStandingSupportRelation(a, b);
  } else if (msg === COLLISION_MSGS.B_ON_A) {
    // b is standing on a's head — only set ground flag, do not modify velocity; let collision detection handle constraints.
    // b 踩在 a 头上 - 只设置地面标志，不修改速度，让碰撞检测处理约束
    if (b.headBlockedThisFrame && a.movementComponent.velY > 0) {
      a.movementComponent.velY = 0;
      a.headBlockedThisFrame = true;
    }
    markGrounded(b, getResolvedDeltaY(a));
    // [FIX] Landing velocity anomaly: same as above, sync velY when b is on a dynamic entity to prevent gravity accumulation.
    // [FIX] 落地速度异常：同上，b 站在动态实体上时同步 velY 防止重力累积。
    syncVerticalVelocity(b, getResolvedDeltaY(a));
    // Mark player as standing on replayer.
    // 标记玩家正在踩在分身上
    if (isReplayer(a) && isPlayer(b)) {
      b._currentlyOnReplayer = true;
      b._wasStandingOnReplayer = true;
    }
    // [NEW] VelX chain propagation: record support relation of b standing on a (a head-pushes b).
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
  // 关卡2相关交互
  if ((isPlayer(a) || (isReplayer(a) && a.isReplaying)) && isButton(b)) {
    b.pressButton();
    return;
  }
  // Enemies can press buttons.
  // 敌人可以踩按鈕
  if (isEnemy(a) && isButton(b)) {
    b.pressButton();
    return;
  }
  // Boxes can press buttons.
  // 箱子可以踩按鈕
  if (isBox(a) && isButton(b)) {
    b.pressButton();
    return;
  }

  if (isPlayer(a) && isSpike(b)) {
    // Trigger death state rather than directly settling.
    // 触发死亡状态而不是直接结算
    a.triggerDeath("spike");
    return;
  }

  // Enemies also die when hitting spikes.
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
