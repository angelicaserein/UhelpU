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
    // 第一步：构建 supporter → rider 的反向映射
    // standing：entity 站在 _supportingEntity 头上 → riderOf[supporter] = entity
    // pushing：entity 在顶着 _supportingEntity    → riderOf[entity]     = _supportingEntity
    const riderOf = new Map();
    for (const entity of this.entities) {
      if (!entity.movementComponent) continue;
      if (entity._supportingType === "standing" && entity._supportingEntity) {
        riderOf.set(entity._supportingEntity, entity);
      } else if (
        entity._supportingType === "pushing" &&
        entity._supportingEntity
      ) {
        riderOf.set(entity, entity._supportingEntity);
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
    const visited = new Set(roots);

    while (queue.length > 0) {
      const supporter = queue.shift();
      const rider = riderOf.get(supporter);
      if (!rider || visited.has(rider)) continue;

      // [FIX] velX链修复：跳跃起飞帧切断整条链，不传递也不继续往上
      const isJumping =
        rider.controllerManager &&
        rider.controllerManager.currentControlComponent.abilityCondition[
          "jumpCooldown"
        ] === 6;
      if (isJumping) continue;

      if (!rider.movementComponent) continue;

      if (supporter._supportingType === "pushing") {
        // [FIX] standing跟随：supporter 下方支撑 rider（如 player 站着 replayer 踩在上面）。
        // 与 standing 分支同理：rider 有 controller 会每帧覆盖 velX，必须直接改 x。
        const supporterDeltaX =
          supporter._lastFrameDeltaX ?? supporter.movementComponent.velX;
        rider.x += supporterDeltaX;
      } else {
        // [FIX] standing跟随：box 由 DD resolver 直接修改 x 位置，velX 恒为 0 无法反映真实移动。
        // 改用上一帧的实际位移量 _lastFrameDeltaX，准确捕捉 box 被推动时的真实水平位移。
        // [FIX] standing跟随：不能加到 velX，因为 controller.tick() 每帧都会覆盖 velX=0，
        // 直接加到 rider.x，确保位移在本帧生效，不被 controller 覆盖。
        const supporterDeltaX =
          supporter._lastFrameDeltaX ?? supporter.movementComponent.velX;
        rider.x += supporterDeltaX;
      }

      visited.add(rider);
      queue.push(rider);
    }
  }
}
