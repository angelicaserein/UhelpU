export class PhysicsSystem {
  constructor(entities) {
    this.entities = entities;
  }
  setEntities(entities) {
    this.entities = entities;
  }
  physicsEntry() {
    for (const entity of this.entities) {
      const m = entity.movementComponent;
      if (m) {
        // 初始化死亡效果（仅执行一次）
        if (entity.initDeathEffect) {
          entity.initDeathEffect();
        }

        entity.headBlockedThisFrame = false;
        // 跟踪玩家离开分身的延迟帧数（给予1帧的缓冲）
        if (
          entity._replayerLeftFrameCount !== undefined &&
          entity._replayerLeftFrameCount > 0
        ) {
          entity._replayerLeftFrameCount--;
        }
        // 检查是否需要标记玩家刚离开分身
        if (entity._wasStandingOnReplayer && !entity._currentlyOnReplayer) {
          entity._replayerLeftFrameCount = 1; // 1帧的缓冲
        }
        entity._currentlyOnReplayer = false;

        entity.prevX = entity.x;
        entity.prevY = entity.y;
        const blockedXLastFrame = entity.blockedXLastFrame === true;
        entity.blockedXLastFrame = false;
        // 每帧重置isOnGround，只有通过碰撞检测时才设置为true
        if (entity.controllerManager) {
          const cc = entity.controllerManager.currentControlComponent;
          // Coyote time: allow jump for several frames after leaving ground
          if (cc.abilityCondition["jumpCooldown"] > 0) {
            cc.abilityCondition["coyoteFrames"] = 0;
          } else if (cc.abilityCondition["isOnGround"]) {
            cc.abilityCondition["coyoteFrames"] = 6;
          } else if (cc.abilityCondition["coyoteFrames"] > 0) {
            cc.abilityCondition["coyoteFrames"]--;
          }
          cc.abilityCondition["wasOnGround"] =
            cc.abilityCondition["coyoteFrames"] > 0;
          cc.abilityCondition["isOnGround"] = false;
          if (cc.abilityCondition["jumpCooldown"] > 0) {
            cc.abilityCondition["jumpCooldown"]--;
          }
          if (!blockedXLastFrame && !entity.lockControlThisFrame) {
            entity.controllerManager.tick();
          }
        }
        m.velY = m.velY + m.accY;
        m.velX = m.velX + m.accX;
        entity.x = entity.x + m.velX;
        entity.y = entity.y + m.velY;
      }
    }
  }

  // [FIX] velX链修复：完整 BFS 从底层向上传播 velX，替换原有两阶段 flat 遍历。
  velXPropagationEntry() {
    // 第一步：构建 supporter → riders[] 邻接表
    // standing：entity 站在 _supportingEntity 头上 → ridersOf[supporter].push(entity)
    // pushing：entity 在顶着 _supportingEntity    → ridersOf[entity].push(_supportingEntity)
    const ridersOf = new Map();
    const appendRider = (supporter, rider) => {
      if (!supporter || !rider) return;
      let list = ridersOf.get(supporter);
      if (!list) {
        list = [];
        ridersOf.set(supporter, list);
      }
      list.push(rider);
    };

    for (const entity of this.entities) {
      if (!entity.movementComponent) continue;
      if (entity._supportingType === "standing" && entity._supportingEntity) {
        appendRider(entity._supportingEntity, entity);
      } else if (
        entity._supportingType === "pushing" &&
        entity._supportingEntity
      ) {
        appendRider(entity, entity._supportingEntity);
      }
    }

    // 第二步：找根节点（链底层）：support 或 pushing 类型的实体
    const roots = [];
    for (const entity of this.entities) {
      if (!entity.movementComponent) continue;
      if (
        entity._supportingType === "support" ||
        entity._supportingType === "pushing"
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
          !rider.movementComponent ||
          visited.has(rider) ||
          movedRiders.has(rider)
        )
          continue;

        // [FIX] velX链修复：跳跃起飞帧切断该 rider 分支，不影响其他同层 rider。
        const isJumping =
          rider.controllerManager &&
          rider.controllerManager.currentControlComponent.abilityCondition[
            "jumpCooldown"
          ] === 6;
        if (isJumping) continue;

        // 直接改位置，避免被 controller.tick() 覆盖 velX。
        rider.x += supporterDeltaX;
        movedRiders.add(rider);
        queue.push(rider);
      }
    }
  }
}
