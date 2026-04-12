import { ColliderShape, ColliderType } from "./enumerator.js";
import { EventTypes } from "../event-system/EventTypes.js";

export const responderMap = {
  "DYNAMIC-STATIC": (a, b, msg) => basicBlockResponse(a, b, msg),
  "DYNAMIC-DYNAMIC": (a, b, msg) => dynDynBlockResponse(a, b, msg),
  "DYNAMIC-TRIGGER": (a, b, eventBus) => dynTriResponse(a, b, eventBus),
};

// Helper: Handle box collision response (as DYNAMIC object)
function handleBoxCollision(boxEntity, otherEntity, msg) {
  if (msg === "left" || msg === "right") {
    boxEntity.movementComponent.velX = 0;
    boxEntity.blockedXLastFrame = true;
  } else if (msg === "top") {
    boxEntity.headBlockedThisFrame = true;
    if (boxEntity.movementComponent.velY > 0) {
      boxEntity.movementComponent.velY = 0;
    }
  } else if (msg === "bottom") {
    boxEntity.movementComponent.velY = 0;
  }
}

function applyHeadPushSupportRelation(pusher, box) {
  box._supportingEntity = pusher;
  box._supportingType = "standing";
  pusher._supportingEntity = box;
  pusher._supportingType = "pushing";
}

function shouldKeepHeadPushRelation(pusher, box) {
  if (!pusher || !box || !pusher.collider || !box.collider) return false;

  const pusherTopY = pusher.y + pusher.collider.h;
  const boxBottomY = box.y;

  // Vertical tolerance keeps relation stable across short classify jitter.
  const verticalTolerance = 8;
  const nearHeadContact =
    Math.abs(boxBottomY - pusherTopY) <= verticalTolerance;

  const pusherLeft = pusher.x;
  const pusherRight = pusher.x + pusher.collider.w;
  const boxLeft = box.x;
  const boxRight = box.x + box.collider.w;

  // Horizontal tolerance avoids relation drop on exact-edge switch frames.
  const horizontalTolerance = 6;
  const overlapX =
    pusherLeft < boxRight + horizontalTolerance &&
    pusherRight > boxLeft - horizontalTolerance;

  return nearHeadContact && overlapX;
}

function basicBlockResponse(a, b, msg) {
  // Box collision with static platform
  if (a && a.type === "box") {
    handleBoxCollision(a, b, msg);
    return;
  }

  // 敌人（被踩踏）碰撞处理 - 忽略已死敌人
  if (b && b.type === "enemy") {
    // 检查敌人是否已死，已死的敌人无法再被互动
    if (b.deathState && b.deathState.isDead) {
      return;
    }

    if (msg === "bottom") {
      // 踩踏敌人头顶：弹跳 + 敌人死亡
      a.movementComponent.velY = 17.5; // 踩踏弹跳速度 (1.75x normal jump)
      a.controllerManager.currentControlComponent.abilityCondition[
        "isOnGround"
      ] = true;
      b.triggerDeath(); // 敌人死亡
      return;
    } else if (msg === "left" || msg === "right" || msg === "top") {
      // 侧面或正面碰撞：Player死亡，Replayer无作用
      if (a.type === "player") {
        a.triggerDeath("enemy"); // Player死亡
      }
      // Replayer侧面碰撞无作用
      return;
    }
  }

  // 敌人对障碍物的碰撞处理 - 左右碰撞时调头
  if (a && a.type === "enemy") {
    if (msg === "left") {
      a.blockedLeftThisFrame = true;
    } else if (msg === "right") {
      a.blockedRightThisFrame = true;
    }
    // 敌人作为DYNAMIC处理垂直碰撞
    if (msg === "top") {
      if (a.movementComponent.velY > 0) {
        a.movementComponent.velY = 0;
      }
    }
    if (msg === "bottom") {
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
  if (msg === "left" || msg === "right") {
    a.movementComponent.velX = 0;
    a.blockedXLastFrame = true;
  } else {
    if (msg === "top") {
      a.headBlockedThisFrame = true;
      // 头顶碰撞时，清零向上的速度，防止黏住
      if (a.movementComponent.velY > 0) {
        a.movementComponent.velY = 0;
      }
    }
    if (msg === "bottom") {
      // 如果玩家刚从分身上分离（仍在缓冲期），允许继续下落
      if ((a._replayerLeftFrameCount || 0) > 0) {
        // 延迟期内：不改变速度和地面状态，但清零标志避免循环
        a._wasStandingOnReplayer = false;
        a._replayerLeftFrameCount = 0;
        return;
      }
      // 静态地板需要清零速度，防止持续下沉
      a.movementComponent.velY = 0;
      a.controllerManager.currentControlComponent.abilityCondition[
        "isOnGround"
      ] = true;
      a.controllerManager.currentControlComponent.abilityCondition[
        "groundVelY"
      ] = 0;
      // 落地时清除分身相关标志
      a._wasStandingOnReplayer = false;
      a._replayerLeftFrameCount = 0;
    }
  }
}

function dynDynBlockResponse(a, b, msg) {
  // Player vs Enemy: 踩踏判定与受伤判定
  if (a && b && a.type === "player" && b.type === "enemy") {
    if (b.deathState && b.deathState.isDead) {
      return;
    }

    if (msg === "a_on_b") {
      // 玩家踩到敌人：弹跳 + 敌人死亡
      if (a.movementComponent) {
        a.movementComponent.velY = 17.5;
      }
      if (a.controllerManager && a.controllerManager.currentControlComponent) {
        a.controllerManager.currentControlComponent.abilityCondition[
          "isOnGround"
        ] = true;
      }
      if (typeof b.triggerDeath === "function") {
        b.triggerDeath();
      }
      return;
    }

    // 侧碰或被敌人踩到都判玩家死亡
    if (msg === "allowed collision" || msg === "b_on_a") {
      if (typeof a.triggerDeath === "function") {
        a.triggerDeath("enemy");
      }
      return;
    }
  }

  // Replayer vs Enemy: 分身可以踩敌人，但侧碰不会死亡
  if (a && b && a.type === "replayer" && b.type === "enemy") {
    if (b.deathState && b.deathState.isDead) {
      return;
    }

    if (msg === "a_on_b") {
      // 分身踩到敌人：弹跳 + 敌人死亡
      if (a.movementComponent) {
        a.movementComponent.velY = 17.5;
      }
      if (a.controllerManager && a.controllerManager.currentControlComponent) {
        a.controllerManager.currentControlComponent.abilityCondition[
          "isOnGround"
        ] = true;
      }
      if (typeof b.triggerDeath === "function") {
        b.triggerDeath();
      }
      return;
    }

    // 分身侧碰敌人：无作用（不会死）
    if (msg === "allowed collision" || msg === "b_on_a") {
      return;
    }
  }

  // Player/Replayer pushing Box (lateral collision)
  if (
    a &&
    b &&
    (a.type === "player" || a.type === "replayer") &&
    b.type === "box"
  ) {
    if (msg === "allowed collision") {
      // Keep pushing chain in jump direction-switch frames when head contact still exists.
      if (shouldKeepHeadPushRelation(a, b)) {
        applyHeadPushSupportRelation(a, b);
      }
      return;
    }
    if (msg === "a_on_b") {
      // a 踩在 box 头上
      if (a.controllerManager && a.controllerManager.currentControlComponent) {
        a.controllerManager.currentControlComponent.abilityCondition[
          "isOnGround"
        ] = true;
        a.controllerManager.currentControlComponent.abilityCondition[
          "groundVelY"
        ] = b.movementComponent ? b.movementComponent.velY : 0;
      }
      // [FIX] 落地速度异常：重力每帧累积到 velY，走下边缘时爆发成超快下落。
      // 同步 velY 为实体当前速度（静止时为0），防止累积，离开时从自然重力起步。
      if (a.movementComponent) {
        a.movementComponent.velY = b.movementComponent
          ? b.movementComponent.velY
          : 0;
      }
      // [NEW] 支撑链velX传递：记录 a 站在 box 上的支撑关系
      a._supportingEntity = b;
      a._supportingType = "standing";
      // [FIX] velX链修复：b 是下方支撑者，记录 support 让 BFS 能以它为根节点向上传递
      b._supportingEntity = null;
      b._supportingType = "support";
    } else if (msg === "b_on_a") {
      // box 踩在 a 头上（rare, but handle it)
      if (b.controllerManager && b.controllerManager.currentControlComponent) {
        b.controllerManager.currentControlComponent.abilityCondition[
          "isOnGround"
        ] = true;
        b.controllerManager.currentControlComponent.abilityCondition[
          "groundVelY"
        ] = a.movementComponent ? a.movementComponent.velY : 0;
      }
      // [FIX] 落地速度异常：同上，b 站在 box 上时同步 velY 防止重力累积。
      if (b.movementComponent) {
        b.movementComponent.velY = a.movementComponent
          ? a.movementComponent.velY
          : 0;
      }
      // [NEW] 支撑链velX传递：记录 b 站在 a 上（a 顶推 b）的支撑关系
      applyHeadPushSupportRelation(a, b);
    }
    return;
  }

  // Box pushing Box
  if (a && b && a.type === "box" && b.type === "box") {
    if (msg === "allowed collision") {
      return;
    }
    if (msg === "a_on_b") {
      // a 踩在 b 头上
      if (a.movementComponent && b.movementComponent) {
        a.movementComponent.velY = 0;
        b.movementComponent.velY = Math.max(b.movementComponent.velY, 0);
      }
      // [NEW] 支撑链velX传递：记录上方 box 站在下方 box 上的支撑关系
      a._supportingEntity = b;
      a._supportingType = "standing";
      // [FIX] velX链修复：b 是下方支撑者，记录 support 让 BFS 能以它为根节点向上传递
      b._supportingEntity = null;
      b._supportingType = "support";
    } else if (msg === "b_on_a") {
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

  if (msg === "allowed collision") {
    return;
  }
  if (msg === "a_on_b") {
    // a 踩在 b 头上 - 只设置地面标志，不修改速度，让碰撞检测处理约束
    if (a.headBlockedThisFrame && b.movementComponent.velY > 0) {
      b.movementComponent.velY = 0;
      b.headBlockedThisFrame = true;
    }
    if (a.controllerManager && a.controllerManager.currentControlComponent) {
      a.controllerManager.currentControlComponent.abilityCondition[
        "isOnGround"
      ] = true;
      a.controllerManager.currentControlComponent.abilityCondition[
        "groundVelY"
      ] = b.movementComponent ? b.movementComponent.velY : 0;
    }
    // [FIX] 落地速度异常：重力每帧累积到 velY，走下边缘时爆发成超快下落。
    // 同步 velY 为实体当前速度，防止累积，离开时从自然重力起步。
    // [FIX] 分身空中跳跃时player无法跳跃：完全同步 velY 会让 player 与 replayer
    // 每帧位移量完全相同，导致 AABB 无重叠 → isOnGround 永远不被设置 →
    // coyote time 耗尽后跳不起来。偏移 -1 确保 player 每帧比 replayer 慢 1px，
    // 产生持续微小穿模，碰撞检测可正常触发 isOnGround = true。
    if (a.movementComponent) {
      a.movementComponent.velY =
        (b.movementComponent ? b.movementComponent.velY : 0) - 1;
    }
    // 标记玩家正在踩在分身上，这样当分身离开时我们知道玩家需要下落
    if (b.type === "replayer") {
      a._currentlyOnReplayer = true;
      a._wasStandingOnReplayer = true;
    }
    // [NEW] 支撑链velX传递：记录 a 站在 b 上的支撑关系
    a._supportingEntity = b;
    a._supportingType = "standing";
    // [FIX] velX链修复：b 是下方支撑者，记录 support 让 BFS 能以它为根节点向上传递
    b._supportingEntity = null;
    b._supportingType = "support";
  } else if (msg === "b_on_a") {
    // b 踩在 a 头上 - 只设置地面标志，不修改速度，让碰撞检测处理约束
    if (b.headBlockedThisFrame && a.movementComponent.velY > 0) {
      a.movementComponent.velY = 0;
      a.headBlockedThisFrame = true;
    }
    if (b.controllerManager && b.controllerManager.currentControlComponent) {
      b.controllerManager.currentControlComponent.abilityCondition[
        "isOnGround"
      ] = true;
      b.controllerManager.currentControlComponent.abilityCondition[
        "groundVelY"
      ] = a.movementComponent ? a.movementComponent.velY : 0;
    }
    // [FIX] 落地速度异常：同上，b 站在动态实体上时同步 velY 防止重力累积。
    if (b.movementComponent) {
      b.movementComponent.velY = a.movementComponent
        ? a.movementComponent.velY
        : 0;
    }
    // 标记玩家正在踩在分身上
    if (a.type === "replayer" && b.type === "player") {
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
  if (
    (a.type === "player" || (a.type === "replayer" && a.isReplaying)) &&
    b.type === "button"
  ) {
    b.pressButton();
    return;
  }

  // 敌人可以踩按钮
  if (a.type === "enemy" && b.type === "button") {
    b.pressButton();
    return;
  }

  // 箱子可以踩按钮
  if (a.type === "box" && b.type === "button") {
    b.pressButton();
    return;
  }

  if (a.type === "player" && b.type === "spike") {
    // 触发死亡状态而不是直接结算
    a.triggerDeath("spike");
    return;
  }

  // 敌人碰到地刺也会死亡
  if (a.type === "enemy" && b.type === "spike") {
    a.triggerDeath("spike");
    return;
  }

  if (a.type === "player" && b.type === "portal") {
    if (b.isOpen) {
      eventBus && eventBus.publish(EventTypes.AUTO_RESULT, "autoResult1");
    }
    return;
  }
}
