const ABILITY_KEYS = Object.freeze({
  COYOTE_FRAMES: "coyoteFrames",
  IS_ON_GROUND: "isOnGround",
  JUMP_COOLDOWN: "jumpCooldown",
  WAS_ON_GROUND: "wasOnGround",
});

const SUPPORT_TYPES = Object.freeze({
  PUSHING: "pushing",
  STANDING: "standing",
  SUPPORT: "support",
});

const REPLAYER_LEAVE_BUFFER_FRAMES = 1;
const DEFAULT_COYOTE_FRAMES = 6;
const JUMP_TAKEOFF_COOLDOWN = 6;

function hasMovement(entity) {
  return !!entity?.movementComponent;
}

function decrementReplayerLeaveBuffer(entity) {
  if (
    entity._replayerLeftFrameCount !== undefined &&
    entity._replayerLeftFrameCount > 0
  ) {
    entity._replayerLeftFrameCount--;
  }
}

function refreshReplayerStandingState(entity) {
  decrementReplayerLeaveBuffer(entity);

  if (entity._wasStandingOnReplayer && !entity._currentlyOnReplayer) {
    entity._replayerLeftFrameCount = REPLAYER_LEAVE_BUFFER_FRAMES;
  }

  entity._currentlyOnReplayer = false;
}

function updateGroundAbilityState(controlComponent) {
  const ability = controlComponent.abilityCondition;

  if (ability[ABILITY_KEYS.JUMP_COOLDOWN] > 0) {
    ability[ABILITY_KEYS.COYOTE_FRAMES] = 0;
  } else if (ability[ABILITY_KEYS.IS_ON_GROUND]) {
    ability[ABILITY_KEYS.COYOTE_FRAMES] = DEFAULT_COYOTE_FRAMES;
  } else if (ability[ABILITY_KEYS.COYOTE_FRAMES] > 0) {
    ability[ABILITY_KEYS.COYOTE_FRAMES]--;
  }

  ability[ABILITY_KEYS.WAS_ON_GROUND] = ability[ABILITY_KEYS.COYOTE_FRAMES] > 0;
  ability[ABILITY_KEYS.IS_ON_GROUND] = false;

  if (ability[ABILITY_KEYS.JUMP_COOLDOWN] > 0) {
    ability[ABILITY_KEYS.JUMP_COOLDOWN]--;
  }
}

function integrateMovement(entity) {
  const movement = entity.movementComponent;
  movement.velY = movement.velY + movement.accY;
  movement.velX = movement.velX + movement.accX;
  entity.x = entity.x + movement.velX;
  entity.y = entity.y + movement.velY;
}

function appendMapList(map, key, value) {
  if (!key || !value) return;

  let list = map.get(key);
  if (!list) {
    list = [];
    map.set(key, list);
  }
  list.push(value);
}

function isTakeoffFrame(entity) {
  return !!(
    entity.controllerManager &&
    entity.controllerManager.currentControlComponent.abilityCondition[
      ABILITY_KEYS.JUMP_COOLDOWN
    ] === JUMP_TAKEOFF_COOLDOWN
  );
}

export class PhysicsSystem {
  constructor(entities) {
    this.entities = entities;
  }
  setEntities(entities) {
    this.entities = entities;
  }
  physicsEntry() {
    for (const entity of this.entities) {
      if (!hasMovement(entity)) continue;

      // 初始化死亡效果（仅执行一次）
      if (entity.initDeathEffect) {
        entity.initDeathEffect();
      }

      entity.headBlockedThisFrame = false;
      refreshReplayerStandingState(entity);

      entity.prevX = entity.x;
      entity.prevY = entity.y;
      const blockedXLastFrame = entity.blockedXLastFrame === true;
      entity.blockedXLastFrame = false;

      // 每帧重置isOnGround，只有通过碰撞检测时才设置为true
      if (entity.controllerManager) {
        const controlComponent =
          entity.controllerManager.currentControlComponent;
        updateGroundAbilityState(controlComponent);

        if (!blockedXLastFrame && !entity.lockControlThisFrame) {
          entity.controllerManager.tick();
        }
      }

      integrateMovement(entity);
    }
  }

  // [FIX] velX链修复：完整 BFS 从底层向上传播 velX，替换原有两阶段 flat 遍历。
  velXPropagationEntry() {
    // 第一步：构建 supporter → riders[] 邻接表
    // standing：entity 站在 _supportingEntity 头上 → ridersOf[supporter].push(entity)
    // pushing：entity 在顶着 _supportingEntity    → ridersOf[entity].push(_supportingEntity)
    const ridersOf = new Map();

    for (const entity of this.entities) {
      if (!hasMovement(entity)) continue;
      if (
        entity._supportingType === SUPPORT_TYPES.STANDING &&
        entity._supportingEntity
      ) {
        appendMapList(ridersOf, entity._supportingEntity, entity);
      } else if (
        entity._supportingType === SUPPORT_TYPES.PUSHING &&
        entity._supportingEntity
      ) {
        appendMapList(ridersOf, entity, entity._supportingEntity);
      }
    }

    // 第二步：找根节点（链底层）：support 或 pushing 类型的实体
    const roots = [];
    for (const entity of this.entities) {
      if (!hasMovement(entity)) continue;
      if (
        entity._supportingType === SUPPORT_TYPES.SUPPORT ||
        entity._supportingType === SUPPORT_TYPES.PUSHING
      ) {
        roots.push(entity);
      }
    }

    // 第三步：BFS 从根节点向上传播 velX
    const queue = [...roots];
    const visited = new Set();
    const movedRiders = new Set();

    while (queue.length > 0) {
      const supporter = queue.shift();
      if (!supporter || visited.has(supporter)) continue;
      visited.add(supporter);

      const riders = ridersOf.get(supporter);
      if (!riders || riders.length === 0) continue;

      const supporterDeltaX =
        supporter._lastFrameDeltaX ?? supporter.movementComponent.velX;

      for (const rider of riders) {
        if (
          !rider ||
          !hasMovement(rider) ||
          visited.has(rider) ||
          movedRiders.has(rider)
        )
          continue;

        // [FIX] velX链修复：跳跃起飞帧切断该 rider 分支，不影响其他同层 rider。
        if (isTakeoffFrame(rider)) continue;

        // 直接改位置，避免被 controller.tick() 覆盖 velX。
        rider.x += supporterDeltaX;
        movedRiders.add(rider);
        queue.push(rider);
      }
    }
  }
}
