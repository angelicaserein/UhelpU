import { detectorMap } from "./detectorMap.js";
import { resolverMap } from "./resolverMap.js";
import { responderMap } from "./responderMap.js";

export class CollisionSystem {
  constructor(entities, eventBus) {
    this.entities = entities;
    this.eventBus = eventBus;
    this._dynamicEntities = [];
    this._staticEntities = [];
    this._triggerEntities = [];
    this.partitionEntitiesByType();
  }

  collisionEntry(eventBus = this.eventBus) {
    // [NEW] 支撑链velX传递：每帧开始清空支撑关系，由本帧碰撞检测重新建立
    for (const dyn of this._dynamicEntities) {
      dyn._supportingEntity = null;
      dyn._supportingType = null;
    }

    const replayer = this.getReplayer();
    const replayerActive = replayer && replayer.isReplaying;
    const player = replayerActive ? this.getPlayer() : null;

    // Two passes of DD + DS: push replayer before platform check, then re-check after platform resolves
    for (let pass = 0; pass < 2; pass++) {
      if (replayerActive) this.processDynamicDynamicPair(player, replayer);
      for (const dyn of this._dynamicEntities) {
        for (const sta of this._staticEntities) {
          this.processDynamicStaticPair(dyn, sta);
        }
      }
    }

    // Final DD pass to guarantee no overlap before render
    if (replayerActive) this.processDynamicDynamicPair(player, replayer);

    // Player collision detection with enemies (DYNAMIC-DYNAMIC pairs)
    const player2 = this.getPlayer();
    if (player2) {
      for (const dyn of this._dynamicEntities) {
        if (dyn.type === "enemy" && dyn !== player2) {
          this.processEnemyPlayerPair(player2, dyn);
        }
      }
    }

    // [FIX] 推箱穿模：DD 推箱 → DS 弹回 → 再次 DD 会用旧 prevX 把箱子重新推进墙。
    // 改为：记录 DS 前后箱子的 x 位移量，把同等位移施加给 player，彻底消除重叠，不再做第三次 DD。
    const player3 = this.getPlayer();
    if (player3) {
      for (const dyn of this._dynamicEntities) {
        if (dyn.type === "box" && dyn !== player3) {
          this.processDynamicDynamicPair(player3, dyn);
          // [FIX] 推箱穿模：DD 推完箱子后立即补一次 DS，防止箱子停在墙内
          const boxXBeforeDS = dyn.x;
          for (const sta of this._staticEntities) {
            this.processDynamicStaticPair(dyn, sta);
          }
          // [FIX] 推箱穿模：DS 把箱子弹回时，将同等修正量施加给 player，防止 player 陷入箱内，
          // 且不再做第三次 DD（第三次 DD 会用旧 prevX 把箱子重新推回墙里）
          const boxCorrection = dyn.x - boxXBeforeDS;
          if (boxCorrection !== 0) {
            player3.x += boxCorrection;
            if (player3.movementComponent) player3.movementComponent.velX = 0;
          }
          this.pushPusherOutOfBoxIfOverlapping(player3, dyn);
        }
      }

      this.maintainHeadPushSupportRelations(player3);
    }

    // Replayer collision detection with enemies (DYNAMIC-DYNAMIC pairs)
    const replayer2 = this.getReplayer();
    if (replayer2 && replayer2.isReplaying) {
      for (const dyn of this._dynamicEntities) {
        if (dyn.type === "enemy" && dyn !== replayer2) {
          this.processEnemyReplayerPair(replayer2, dyn);
        }
      }
    }

    // [FIX] 推箱穿模：replayer 推箱子与玩家推箱子同理，DD 后补 DS，再用位移量修正 replayer
    const replayer3 = this.getReplayer();
    if (replayer3 && replayer3.isReplaying) {
      for (const dyn of this._dynamicEntities) {
        if (dyn.type === "box" && dyn !== replayer3) {
          this.processDynamicDynamicPair(replayer3, dyn);
          // [FIX] 推箱穿模：DD 推完箱子后立即补一次 DS，防止箱子停在墙内
          const boxXBeforeDS = dyn.x;
          for (const sta of this._staticEntities) {
            this.processDynamicStaticPair(dyn, sta);
          }
          // [FIX] 推箱穿模：DS 把箱子弹回时，将同等修正量施加给 replayer，防止 replayer 陷入箱内
          const boxCorrection = dyn.x - boxXBeforeDS;
          if (boxCorrection !== 0) {
            replayer3.x += boxCorrection;
            if (replayer3.movementComponent)
              replayer3.movementComponent.velX = 0;
          }
          this.pushPusherOutOfBoxIfOverlapping(replayer3, dyn);
        }
      }

      this.maintainHeadPushSupportRelations(replayer3);
    }

    // Keep all box colliders physically solid against both boxes and static world.
    this.stabilizeBoxCollisions();

    // Final guard: if box stabilization moved boxes into pusher, separate them immediately.
    if (player3 && player3._supportingType === "pushing") {
      this.resolvePusherOverlapsWithBoxes(player3);
    }
    if (
      replayer3 &&
      replayer3.isReplaying &&
      replayer3._supportingType === "pushing"
    ) {
      this.resolvePusherOverlapsWithBoxes(replayer3);
    }

    // Enemy collision detection with other DYNAMIC/STATIC entities (platforms, walls, etc.)
    for (const dyn of this._dynamicEntities) {
      if (dyn.type === "enemy") {
        for (const sta of this._staticEntities) {
          if (dyn !== sta && sta.type !== "spike") {
            this.processDynamicStaticPair(dyn, sta);
          }
        }
      }
    }

    // 每帧重置所有按钮状态，碰撞检测时会重新按下仍被踩到的按钮
    for (const tri of this._triggerEntities) {
      if (tri.type === "button" && tri.isPressed) {
        tri.releaseButton();
      }
    }

    for (const dyn of this._dynamicEntities) {
      for (const tri of this._triggerEntities) {
        this.processDynamicTriggerPair(dyn, tri, eventBus);
      }
    }

    // Enemy collision detection with TRIGGER entities (buttons, spikes, etc.)
    for (const sta of this._staticEntities) {
      if (sta.type === "enemy") {
        for (const tri of this._triggerEntities) {
          this.processEnemyTriggerPair(sta, tri, eventBus);
        }
      }
    }

    // [FIX] standing跟随：box 由 DD resolver 直接修改 x 位置而非 velX，
    // 记录本帧实际位移量供下帧 velXPropagationEntry 使用（box.velX 恒为 0，不能反映真实移动）
    for (const dyn of this._dynamicEntities) {
      dyn._lastFrameDeltaX = dyn.x - dyn.prevX;
    }
  }
  getReplayer() {
    for (const dyn of this._dynamicEntities) {
      if (dyn.type === "replayer") {
        return dyn;
      }
    }
    return null;
  }
  getPlayer() {
    for (const dyn of this._dynamicEntities) {
      if (dyn.type === "player") {
        return dyn;
      }
    }
    return null;
  }
  setEntities(entities) {
    this.entities = entities;
    this.partitionEntitiesByType();
  }

  partitionEntitiesByType() {
    this._dynamicEntities.length = 0;
    this._staticEntities.length = 0;
    this._triggerEntities.length = 0;

    for (const entity of this.entities) {
      // Skip entities without a collider (e.g., KeyPrompt which is purely visual)
      if (!entity.collider) {
        continue;
      }

      switch (entity.collider.colliderType) {
        case "DYNAMIC":
          this._dynamicEntities.push(entity);
          break;
        case "STATIC":
          this._staticEntities.push(entity);
          break;
        case "TRIGGER":
          this._triggerEntities.push(entity);
          break;
      }
    }
  }

  processDynamicStaticPair(dyn, sta) {
    // 死亡的角色无视所有平台碰撞
    if (dyn.deathState && dyn.deathState.isDead) {
      return;
    }

    // 死敌人的碰撞被忽略
    if (sta.type === "enemy" && sta.deathState && sta.deathState.isDead) {
      return;
    }

    const dynShape = dyn.collider.colliderShape;
    const staShape = sta.collider.colliderShape;

    const typePair = "DYNAMIC-STATIC";
    const shapePair = `${dynShape}-${staShape}`;
    const fullKey = `${typePair}-${shapePair}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(dyn, sta); //dynamic-static
    if (detectResult) {
      //如果发生碰撞，执行if语句，如果没有则跳过
      //第二步：碰撞修复
      const resolveFunc = resolverMap[fullKey];

      const collisionMsg = resolveFunc(dyn, sta);

      const responseFunc = responderMap[typePair];
      responseFunc(dyn, sta, collisionMsg);
    }
  }

  processDynamicDynamicPair(a, b) {
    if (!a || !b || !a.collider || !b.collider) {
      return;
    }

    // 死亡实体不参与 DD
    if (a.deathState && a.deathState.isDead) {
      return;
    }
    if (b.deathState && b.deathState.isDead) {
      return;
    }

    const aShape = a.collider.colliderShape;
    const bShape = b.collider.colliderShape;

    const typePair = "DYNAMIC-DYNAMIC";
    const shapePair = `${aShape}-${bShape}`;
    const fullKey = `${typePair}-${shapePair}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(a, b); //dynamic-dynamic

    if (detectResult) {
      const resolveFunc = resolverMap[fullKey];
      const collisionMsg = resolveFunc(a, b);

      const responseFunc = responderMap[typePair];
      responseFunc(a, b, collisionMsg);
    }
  }

  processAllBoxPairs() {
    const boxes = this._dynamicEntities.filter((dyn) => dyn.type === "box");
    if (boxes.length < 2) return;

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        this.processDynamicDynamicPair(a, b);
      }
    }
  }

  processAllBoxStaticPairs() {
    const boxes = this._dynamicEntities.filter((dyn) => dyn.type === "box");
    if (boxes.length === 0 || this._staticEntities.length === 0) return;

    for (const box of boxes) {
      for (const sta of this._staticEntities) {
        this.processDynamicStaticPair(box, sta);
      }
    }
  }

  stabilizeBoxCollisions() {
    // Iterate to converge chain pushes: box-box influences box-static and vice versa.
    for (let i = 0; i < 4; i++) {
      this.processAllBoxPairs();
      this.processAllBoxStaticPairs();
      this.enforceBoxNoPenetrationWithStatics();
    }
  }

  enforceBoxNoPenetrationWithStatics() {
    const boxes = this._dynamicEntities.filter((dyn) => dyn.type === "box");
    if (boxes.length < 2) return;

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (!this.isOverlapping(a, b)) continue;

        const vectorX = a.x + a.collider.w / 2 - (b.x + b.collider.w / 2);
        const vectorY = a.y + a.collider.h / 2 - (b.y + b.collider.h / 2);
        const overlapX =
          a.collider.w / 2 + b.collider.w / 2 - Math.abs(vectorX);
        const overlapY =
          a.collider.h / 2 + b.collider.h / 2 - Math.abs(vectorY);

        if (overlapX <= 0 || overlapY <= 0) continue;

        const aBlockedByStatic = this.isEntityOverlappingAnyStatic(a);
        const bBlockedByStatic = this.isEntityOverlappingAnyStatic(b);

        if (overlapX <= overlapY) {
          const dir = vectorX >= 0 ? 1 : -1;
          if (aBlockedByStatic && !bBlockedByStatic) {
            b.x -= dir * overlapX;
          } else if (bBlockedByStatic && !aBlockedByStatic) {
            a.x += dir * overlapX;
          } else {
            const push = dir * (overlapX / 2);
            a.x += push;
            b.x -= push;
          }
        } else {
          const dir = vectorY >= 0 ? 1 : -1;
          if (aBlockedByStatic && !bBlockedByStatic) {
            b.y -= dir * overlapY;
          } else if (bBlockedByStatic && !aBlockedByStatic) {
            a.y += dir * overlapY;
          } else {
            const push = dir * (overlapY / 2);
            a.y += push;
            b.y -= push;
          }
        }
      }
    }
  }

  isEntityOverlappingAnyStatic(entity) {
    if (!entity || !entity.collider) return false;
    for (const sta of this._staticEntities) {
      const shapePair = `${entity.collider.colliderShape}-${sta.collider.colliderShape}`;
      const detectFunc = detectorMap[shapePair];
      if (!detectFunc) continue;
      if (detectFunc(entity, sta)) return true;
    }
    return false;
  }

  isOverlapping(a, b) {
    const shapePair = `${a.collider.colliderShape}-${b.collider.colliderShape}`;
    const detectFunc = detectorMap[shapePair];
    if (!detectFunc) return false;
    return detectFunc(a, b);
  }

  resolvePusherOverlapsWithBoxes(pusher) {
    if (!pusher || !pusher.collider) return;
    // Only apply this guard during active head-push state.
    if (pusher._supportingType !== "pushing") return;

    // Unpushed boxes should behave like regular platforms: never side-eject from them.
    const pushedBox = pusher._supportingEntity;
    if (!pushedBox || pushedBox.type !== "box") return;

    this.pushPusherOutOfBoxIfOverlapping(pusher, pushedBox);
  }

  pushPusherOutOfBoxIfOverlapping(pusher, box) {
    if (!pusher || !box || !pusher.collider || !box.collider) return;
    if (!this.isOverlapping(pusher, box)) return;

    const pusherPrevY = pusher.prevY !== undefined ? pusher.prevY : pusher.y;
    const boxPrevY = box.prevY !== undefined ? box.prevY : box.y;
    const pusherBottom = pusher.y;
    const boxTop = box.y + box.collider.h;
    const pusherPrevBottom = pusherPrevY;
    const pusherPrevTop = pusherPrevY + pusher.collider.h;
    const boxPrevBottom = boxPrevY;
    const boxPrevTop = boxPrevY + box.collider.h;

    // Landing protection: if pusher is on/near top of box, keep vertical stack resolution intact.
    const landingTolerance = 8;
    const pusherCenterY = pusher.y + pusher.collider.h / 2;
    const boxCenterY = box.y + box.collider.h / 2;
    const nearTopLanding = pusherBottom >= boxTop - landingTolerance;
    const upperHalfRelativeToBox = pusherCenterY >= boxCenterY;
    if (nearTopLanding && upperHalfRelativeToBox) return;

    // Preserve standing/stacking semantics: do not override vertical placement.
    const verticallyStacked =
      pusherPrevBottom >= boxPrevTop || boxPrevBottom >= pusherPrevTop;
    if (verticallyStacked) return;

    const vectorX =
      pusher.x + pusher.collider.w / 2 - (box.x + box.collider.w / 2);
    const overlapX =
      pusher.collider.w / 2 + box.collider.w / 2 - Math.abs(vectorX);
    if (overlapX <= 0) return;

    const vectorY =
      pusher.y + pusher.collider.h / 2 - (box.y + box.collider.h / 2);
    const overlapY =
      pusher.collider.h / 2 + box.collider.h / 2 - Math.abs(vectorY);
    if (overlapY <= 0) return;

    // Only resolve clear side-penetration; ignore vertical/top contacts.
    if (overlapX >= overlapY) return;

    // Side-penetration guard only: resolve on X axis.
    pusher.x += vectorX >= 0 ? overlapX : -overlapX;

    if (pusher.movementComponent) {
      pusher.movementComponent.velX = 0;
    }
  }
  processDynamicTriggerPair(dyn, tri, eventBus = this.eventBus) {
    const dynShape = dyn.collider.colliderShape;
    const triShape = tri.collider.colliderShape;

    const typePair = "DYNAMIC-TRIGGER";
    const shapePair = `${dynShape}-${triShape}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(dyn, tri); //dynamic-static
    if (detectResult) {
      //如果发生碰撞，执行if语句，如果没有则跳过
      const responseFunc = responderMap[typePair];
      responseFunc(dyn, tri, eventBus);
    }
  }

  processEnemyPlayerPair(player, enemy) {
    // Enemy collision detection with Player (DYNAMIC-DYNAMIC pairs)
    if (player.deathState && player.deathState.isDead) {
      return;
    }
    if (enemy.deathState && enemy.deathState.isDead) {
      return;
    }

    const playerShape = player.collider.colliderShape;
    const enemyShape = enemy.collider.colliderShape;

    const typePair = "DYNAMIC-DYNAMIC";
    const shapePair = `${playerShape}-${enemyShape}`;
    const fullKey = `${typePair}-${shapePair}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(player, enemy);
    if (detectResult) {
      const resolveFunc = resolverMap[fullKey];
      const collisionMsg = resolveFunc(player, enemy);

      const responseFunc = responderMap[typePair];
      responseFunc(player, enemy, collisionMsg);
    }
  }

  processEnemyReplayerPair(replayer, enemy) {
    // Enemy collision detection with Replayer (DYNAMIC-DYNAMIC pairs)
    if (enemy.deathState && enemy.deathState.isDead) {
      return;
    }

    const replayerShape = replayer.collider.colliderShape;
    const enemyShape = enemy.collider.colliderShape;

    const typePair = "DYNAMIC-DYNAMIC";
    const shapePair = `${replayerShape}-${enemyShape}`;
    const fullKey = `${typePair}-${shapePair}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(replayer, enemy);
    if (detectResult) {
      const resolveFunc = resolverMap[fullKey];
      const collisionMsg = resolveFunc(replayer, enemy);

      const responseFunc = responderMap[typePair];
      responseFunc(replayer, enemy, collisionMsg);
    }
  }

  processEnemyTriggerPair(enemy, tri, eventBus = this.eventBus) {
    // Enemy collision detection with TRIGGER entities (buttons, spikes, etc.)
    if (enemy.deathState && enemy.deathState.isDead) {
      return;
    }

    const enemyShape = enemy.collider.colliderShape;
    const triShape = tri.collider.colliderShape;

    const typePair = "DYNAMIC-TRIGGER";
    const shapePair = `${enemyShape}-${triShape}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(enemy, tri);
    if (detectResult) {
      const responseFunc = responderMap[typePair];
      responseFunc(enemy, tri, eventBus);
    }
  }

  maintainHeadPushSupportRelations(pusher) {
    if (!pusher || !pusher.collider) return;

    const cc =
      pusher.controllerManager &&
      pusher.controllerManager.currentControlComponent;
    if (!cc) return;

    // Limit to airborne frames to avoid affecting normal ground-side push logic.
    if (cc.abilityCondition["isOnGround"]) return;

    // If pusher is standing on something, keep existing stack semantics.
    if (pusher._supportingType === "standing") return;

    const candidates = [];

    for (const target of this._dynamicEntities) {
      if (
        !target ||
        target === pusher ||
        !target.collider ||
        !this.isHeadPushTargetForPusher(pusher, target)
      )
        continue;
      if (target._supportingType) continue;

      const contactScore = this.getHeadPushContactScore(pusher, target);
      if (contactScore === null) continue;
      candidates.push({ target, contactScore });
    }

    if (candidates.length === 0) return;

    // Deterministic order: closest contact first.
    candidates.sort((a, b) => a.contactScore - b.contactScore);

    // Keep current semantics: pusher marks one representative pushed target,
    // while every contacted target gets standing relation for propagation.
    const primaryTarget = candidates[0].target;
    pusher._supportingEntity = primaryTarget;
    for (const candidate of candidates) {
      candidate.target._supportingEntity = pusher;
      candidate.target._supportingType = "standing";
    }
    if (pusher._supportingType !== "support") {
      pusher._supportingType = "pushing";
    }
  }

  isHeadPushTargetForPusher(pusher, target) {
    if (target.type === "box") {
      return true;
    }

    // Player can also head-push active replayer in easy/hard levels.
    if (
      pusher.type === "player" &&
      target.type === "replayer" &&
      target.isReplaying
    ) {
      return true;
    }

    // Extensible hook: future dynamic entities can opt in without touching core logic.
    if (target.allowHeadPushSupport === true) {
      return true;
    }

    return false;
  }

  getHeadPushContactScore(pusher, target) {
    const pusherTop = pusher.y + pusher.collider.h;
    const targetBottom = target.y;

    const verticalTolerance = 8;
    const verticalGap = Math.abs(targetBottom - pusherTop);
    if (verticalGap > verticalTolerance) return null;

    const pusherLeft = pusher.x;
    const pusherRight = pusher.x + pusher.collider.w;
    const targetLeft = target.x;
    const targetRight = target.x + target.collider.w;

    const horizontalTolerance = 6;
    const overlapX =
      pusherLeft < targetRight + horizontalTolerance &&
      pusherRight > targetLeft - horizontalTolerance;

    if (!overlapX) return null;

    // Lower score means better candidate: prioritize vertical alignment, then center proximity.
    const pusherCenterX = pusherLeft + pusher.collider.w / 2;
    const targetCenterX = targetLeft + target.collider.w / 2;
    const centerDistance = Math.abs(pusherCenterX - targetCenterX);
    return verticalGap * 1000 + centerDistance;
  }
}
