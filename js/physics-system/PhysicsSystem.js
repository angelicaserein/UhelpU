export class PhysicsSystem {
    constructor(entities) {
        this.entities = entities;
    }
    setEntities(entities) {
        this.entities = entities;
    }
    physicsEntry() {
        for(const entity of this.entities) {
            const m = entity.movementComponent;
            if(m) {
                // 初始化死亡效果（仅执行一次）
                if(entity.initDeathEffect) {
                    entity.initDeathEffect();
                }

                entity.headBlockedThisFrame = false;
                // 跟踪玩家离开分身的延迟帧数（给予1帧的缓冲）
                if (entity._replayerLeftFrameCount !== undefined && entity._replayerLeftFrameCount > 0) {
                    entity._replayerLeftFrameCount--;
                }
                // 检查是否需要标记玩家刚离开分身
                if (entity._wasStandingOnReplayer && !entity._currentlyOnReplayer) {
                    entity._replayerLeftFrameCount = 1;  // 1帧的缓冲
                }
                entity._currentlyOnReplayer = false;

                entity.prevX = entity.x;
                entity.prevY = entity.y;
                const blockedXLastFrame = entity.blockedXLastFrame === true;
                entity.blockedXLastFrame = false;
                // 每帧重置isOnGround，只有通过碰撞检测时才设置为true
                if(entity.controllerManager) {
                    const cc = entity.controllerManager.currentControlComponent;
                    // Coyote time: allow jump for several frames after leaving ground
                    if(cc.abilityCondition["jumpCooldown"] > 0) {
                        cc.abilityCondition["coyoteFrames"] = 0;
                    } else if(cc.abilityCondition["isOnGround"]) {
                        cc.abilityCondition["coyoteFrames"] = 6;
                    } else if(cc.abilityCondition["coyoteFrames"] > 0) {
                        cc.abilityCondition["coyoteFrames"]--;
                    }
                    cc.abilityCondition["wasOnGround"] = cc.abilityCondition["coyoteFrames"] > 0;
                    cc.abilityCondition["isOnGround"] = false;
                    if(cc.abilityCondition["jumpCooldown"] > 0) {
                        cc.abilityCondition["jumpCooldown"]--;
                    }
                    if(!blockedXLastFrame && !entity.lockControlThisFrame) {
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
}