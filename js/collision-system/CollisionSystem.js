import { detectorMap } from "./detectorMap.js";
import { resolverMap } from "./resolverMap.js";
import { responderMap } from "./responderMap.js";

const ENTITY_TYPES = Object.freeze({
  BOX: "box",
  BUTTON: "button",
  ENEMY: "enemy",
  PLAYER: "player",
  REPLAYER: "replayer",
  SPIKE: "spike",
});

const SUPPORT_TYPES = Object.freeze({
  PUSHING: "pushing",
  STANDING: "standing",
  SUPPORT: "support",
});

const BOX_STABILIZATION_PASSES = 4;
const HEAD_PUSH_VERTICAL_TOLERANCE = 8;
const HEAD_PUSH_HORIZONTAL_TOLERANCE = 6;
const BOX_SIDE_EJECT_LANDING_TOLERANCE = 8;

function hasCollider(entity) {
  return !!(entity && entity.collider);
}

function isType(entity, type) {
  return !!entity && entity.type === type;
}

function isBox(entity) {
  return isType(entity, ENTITY_TYPES.BOX);
}

function isButton(entity) {
  return isType(entity, ENTITY_TYPES.BUTTON);
}

function isEnemy(entity) {
  return isType(entity, ENTITY_TYPES.ENEMY);
}

function isPlayer(entity) {
  return isType(entity, ENTITY_TYPES.PLAYER);
}

function isReplayer(entity) {
  return isType(entity, ENTITY_TYPES.REPLAYER);
}

function isActiveReplayer(entity) {
  return isReplayer(entity) && entity.isReplaying;
}

function isPusherEntity(entity) {
  return isPlayer(entity) || isReplayer(entity);
}

export class CollisionSystem {
  constructor(entities, eventBus) {
    this.entities = entities;
    this.eventBus = eventBus;
    this._dynamicEntities = [];
    this._staticEntities = [];
    this._triggerEntities = [];
    this.partitionEntitiesByType();
  }

  hasWalkableSupportAhead(entity, direction, options = {}) {
    if (!entity?.collider) {
      return false;
    }

    const probeDistance = options.probeDistance ?? 1;
    const probePadding = options.probePadding ?? 1;
    const maxStepDown = options.maxStepDown ?? 6;
    const maxStepUp = options.maxStepUp ?? 2;

    const probeX =
      direction >= 0
        ? entity.x + entity.collider.w + probeDistance
        : entity.x - probeDistance;
    const footY = entity.y;

    for (const sta of this._staticEntities) {
      if (!sta?.collider) {
        continue;
      }

      const left = sta.x - probePadding;
      const right = sta.x + sta.collider.w + probePadding;
      if (probeX < left || probeX > right) {
        continue;
      }

      const supportTop = sta.y + sta.collider.h;
      const topDelta = supportTop - footY;
      if (topDelta > maxStepUp || topDelta < -maxStepDown) {
        continue;
      }

      return true;
    }

    return false;
  }

  collisionEntry(eventBus = this.eventBus) {
    // [NEW] VelX chain propagation: clear support relations at start of each frame, rebuilt by collision detection this frame. | [NEW] 支撑链velX传递：每帧开始清空支撑关系，由本帧碰撞检测重新建立
    for (const dyn of this._dynamicEntities) {
      dyn._supportingEntity = null;
      dyn._supportingType = null;
    }

    const replayer = this.getReplayer();
    const replayerActive = replayer && replayer.isReplaying;

    // Run dynamic-static passes first so box/platform support settles before player/replayer pairing.
    // 先执行动态-静态碰撞检测，使箱子/平台支撑关系在玩家/分身配对前稳定。
    for (let pass = 0; pass < 2; pass++) {
      for (const dyn of this._dynamicEntities) {
        for (const sta of this._staticEntities) {
          this.processDynamicStaticPair(dyn, sta);
        }
      }
    }

    // Player collision detection with enemies (DYNAMIC-DYNAMIC pairs)
    // 玩家与敌人的碰撞检测（动态-动态碰撞对）
    const player2 = this.getPlayer();
    if (player2) {
      this.processEnemyCollisionsForActor(player2, (actor, enemy) =>
        this.processEnemyPlayerPair(actor, enemy),
      );
    }

    // [FIX] Box clipping through walls: DD pushes box → DS bounces back → second DD re-pushes box into wall using old prevX.
    // [FIX] 推箱穿模：DD 推箱 → DS 弹回 → 再次 DD 会用旧 prevX 把箱子重新推进墙。
    // Changed to: record box x displacement before/after DS, apply same offset to player to fully eliminate overlap without a third DD.
    // 改为：记录 DS 前后箱子的 x 位移量，把同等位移施加给 player，彻底消除重叠，不再做第三次 DD。
    const player3 = this.getPlayer();
    if (player3) {
      this.processPusherBoxInteractions(player3);
      this.maintainHeadPushSupportRelations(player3);
    }

    // Replayer collision detection with enemies (DYNAMIC-DYNAMIC pairs)
    // 分身与敌人的碰撞检测（动态-动态碰撞对）
    const replayer2 = this.getReplayer();
    if (replayer2 && replayer2.isReplaying) {
      this.processEnemyCollisionsForActor(replayer2, (actor, enemy) =>
        this.processEnemyReplayerPair(actor, enemy),
      );
    }

    // [FIX] Box clipping through walls: same as player box pushing, perform DS after DD and use displacement to correct replayer.
    // [FIX] 推箱穿模：replayer 推箱子与玩家推箱子同理，DD 后补 DS，再用位移量修正 replayer
    const replayer3 = this.getReplayer();
    if (replayer3 && replayer3.isReplaying) {
      this.processPusherBoxInteractions(replayer3);
      this.maintainHeadPushSupportRelations(replayer3);
    }

    // Keep all box colliders physically solid against both boxes and static world.
    // 保持所有箱子碰撞器对箱子和静态世界始终保持物理实体状态。
    this.stabilizeBoxCollisions();
    this.restackStandingChains();

    // Resolve player/replayer standing only after box support settles for this frame.
    // 仅在本帧箱子支撑稳定后才处理玩家/分身的站立关系。
    if (replayerActive) {
      const player = this.getPlayer();
      const settledReplayer = this.getReplayer();
      this.processDynamicDynamicPair(player, settledReplayer);
    }

    // Final guard: if box stabilization moved boxes into pusher, separate them immediately.
    // 最终保护：若箱子稳定化阶段将箱子移入推动者内，立即将其分离。
    if (player3 && player3._supportingType === SUPPORT_TYPES.PUSHING) {
      this.resolvePusherOverlapsWithBoxes(player3);
    }
    if (
      replayer3 &&
      replayer3.isReplaying &&
      replayer3._supportingType === SUPPORT_TYPES.PUSHING
    ) {
      this.resolvePusherOverlapsWithBoxes(replayer3);
    }

    // Enemy collision detection with other DYNAMIC/STATIC entities (platforms, walls, etc.)
    // 敌人与其他动态/静态实体（平台、墙壁等）的碰撞检测
    for (const dyn of this._dynamicEntities) {
      if (isEnemy(dyn)) {
        for (const sta of this._staticEntities) {
          if (dyn !== sta && !isType(sta, ENTITY_TYPES.SPIKE)) {
            this.processDynamicStaticPair(dyn, sta);
          }
        }
      }
    }
    // Reset all button states each frame; buttons still being stepped on will be re-pressed during collision detection.    // 每帧重置所有按钮状态，碰撞检测时会重新按下仍被踩到的按钮
    for (const tri of this._triggerEntities) {
      if (isButton(tri) && tri.isPressed) {
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
      if (isEnemy(sta)) {
        for (const tri of this._triggerEntities) {
          this.processEnemyTriggerPair(sta, tri, eventBus);
        }
      }
    }

    // [FIX] Standing follow: box x position is directly modified by DD resolver instead of velX;
    // [FIX] standing跟随：box 由 DD resolver 直接修改 x 位置而非 velX，
    // record actual displacement this frame for next frame's velXPropagationEntry (box.velX is always 0 and cannot reflect real movement).
    // 记录本帧实际位移量供下帧 velXPropagationEntry 使用（box.velX 恒为 0，不能反映真实移动）
    for (const dyn of this._dynamicEntities) {
      dyn._lastFrameDeltaX = dyn.x - dyn.prevX;
    }
  }
  getReplayer() {
    for (const dyn of this._dynamicEntities) {
      if (isReplayer(dyn)) {
        return dyn;
      }
    }
    return null;
  }
  getPlayer() {
    for (const dyn of this._dynamicEntities) {
      if (isPlayer(dyn)) {
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
      // 跳过没有碰撞器的实体（例如纯视觉展示的 KeyPrompt）
      if (!hasCollider(entity)) {
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
    // Dead characters ignore all platform collisions.
    // 死亡的角色无视所有平台碰撞
    if (dyn.deathState && dyn.deathState.isDead) {
      return;
    }

    // Dead enemy collisions are ignored.
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
    const detectResult = detectFunc(dyn, sta); //dynamic-static | 动态-静态碰撞检测
    if (detectResult) {
      //If collision occurred, execute the if block; otherwise skip.
      //如果发生碰撞，执行if语句，如果没有则跳过
      //Step 2: Collision resolution.
      //第二步：碰撞修复
      const resolveFunc = resolverMap[fullKey];
      if (!resolveFunc) {
        console.warn(`[CollisionSystem] No resolver for key: ${fullKey}`);
        return;
      }
      const collisionMsg = resolveFunc(dyn, sta);

      const responseFunc = responderMap[typePair];
      responseFunc(dyn, sta, collisionMsg);
    }
  }

  processDynamicDynamicPair(a, b) {
    if (!a || !b || !a.collider || !b.collider) {
      return;
    }

    // Dead entities do not participate in DD collision.
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
    const detectResult = detectFunc(a, b); //dynamic-dynamic | 动态-动态碰撞检测

    if (detectResult) {
      const resolveFunc = resolverMap[fullKey];
      if (!resolveFunc) {
        console.warn(`[CollisionSystem] No resolver for key: ${fullKey}`);
        return;
      }
      const collisionMsg = resolveFunc(a, b);

      const responseFunc = responderMap[typePair];
      responseFunc(a, b, collisionMsg);
    }
  }

  processAllBoxPairs() {
    const boxes = this.getDynamicBoxes();
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
    const boxes = this.getDynamicBoxes();
    if (boxes.length === 0 || this._staticEntities.length === 0) return;

    for (const box of boxes) {
      for (const sta of this._staticEntities) {
        this.processDynamicStaticPair(box, sta);
      }
    }
  }

  stabilizeBoxCollisions() {
    // Iterate to converge chain pushes: box-box influences box-static and vice versa.
    // 迭代以收敛链式推动：box-box 影响 box-static，反之也然。
    for (let i = 0; i < BOX_STABILIZATION_PASSES; i++) {
      this.processAllBoxPairs();
      this.processAllBoxStaticPairs();
      this.enforceBoxNoPenetrationWithStatics();
    }
  }

  restackStandingChains() {
    const ridersOf = new Map();

    for (const dyn of this._dynamicEntities) {
      if (
        dyn &&
        dyn._supportingType === SUPPORT_TYPES.STANDING &&
        dyn._supportingEntity
      ) {
        let riders = ridersOf.get(dyn._supportingEntity);
        if (!riders) {
          riders = [];
          ridersOf.set(dyn._supportingEntity, riders);
        }
        riders.push(dyn);
      }
    }

    const visited = new Set();
    const restackFromSupporter = (supporter) => {
      if (!supporter || visited.has(supporter)) return;
      visited.add(supporter);

      const riders = ridersOf.get(supporter);
      if (!riders || riders.length === 0) return;

      const supporterDeltaY =
        supporter.prevY !== undefined ? supporter.y - supporter.prevY : 0;

      for (const rider of riders) {
        rider.y += supporterDeltaY;
        rider.prevY = rider.y;
        restackFromSupporter(rider);
      }
    };

    for (const dyn of this._dynamicEntities) {
      if (
        dyn &&
        (dyn._supportingType === SUPPORT_TYPES.SUPPORT ||
          dyn._supportingType === SUPPORT_TYPES.PUSHING ||
          !dyn._supportingEntity)
      ) {
        restackFromSupporter(dyn);
      }
    }
  }

  enforceBoxNoPenetrationWithStatics() {
    const boxes = this.getDynamicBoxes();
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
    // 仅在头顶推动状态激活时应用此保护。
    if (pusher._supportingType !== SUPPORT_TYPES.PUSHING) return;

    // Unpushed boxes should behave like regular platforms: never side-eject from them.
    // 未被推动的箱子应表现如普通平台：永远不会为其的侧面穿模。
    const pushedBox = pusher._supportingEntity;
    if (!isBox(pushedBox)) return;

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
    const pusherCenterY = pusher.y + pusher.collider.h / 2;
    const boxCenterY = box.y + box.collider.h / 2;
    const nearTopLanding =
      pusherBottom >= boxTop - BOX_SIDE_EJECT_LANDING_TOLERANCE;
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
    if (dyn.deathState && dyn.deathState.isDead) {
      return;
    }

    const dynShape = dyn.collider.colliderShape;
    const triShape = tri.collider.colliderShape;

    const typePair = "DYNAMIC-TRIGGER";
    const shapePair = `${dynShape}-${triShape}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(dyn, tri); //dynamic-static | 动态-静态碰撞检测
    if (detectResult) {
      //If collision occurred, execute the if block; otherwise skip.
      //如果发生碰撞，执行if语句，如果没有则跳过
      const responseFunc = responderMap[typePair];
      responseFunc(dyn, tri, eventBus);
    }
  }

  processEnemyPlayerPair(player, enemy) {
    this.processEnemyCharacterPair(player, enemy);
  }

  processEnemyReplayerPair(replayer, enemy) {
    this.processEnemyCharacterPair(replayer, enemy);
  }

  processEnemyCharacterPair(actor, enemy) {
    // Enemy collision detection with actor (DYNAMIC-DYNAMIC pairs)
    // 敌人与角色的碰撞检测（动态-动态碰撞对）
    if (actor.deathState && actor.deathState.isDead) {
      return;
    }
    if (enemy.deathState && enemy.deathState.isDead) {
      return;
    }

    const actorShape = actor.collider.colliderShape;
    const enemyShape = enemy.collider.colliderShape;

    const typePair = "DYNAMIC-DYNAMIC";
    const shapePair = `${actorShape}-${enemyShape}`;
    const fullKey = `${typePair}-${shapePair}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(actor, enemy);
    if (detectResult) {
      const resolveFunc = resolverMap[fullKey];
      if (!resolveFunc) {
        console.warn(`[CollisionSystem] No resolver for key: ${fullKey}`);
        return;
      }
      const collisionMsg = resolveFunc(actor, enemy);

      const responseFunc = responderMap[typePair];
      responseFunc(actor, enemy, collisionMsg);
    }
  }

  processEnemyTriggerPair(enemy, tri, eventBus = this.eventBus) {
    // Enemy collision detection with TRIGGER entities (buttons, spikes, etc.)
    // 敌人与触发器实体（按鈕、地刺等）的碰撞检测
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
    // 仅限于空中帧，避免影响普通地面侧推逻辑。
    if (cc.abilityCondition["isOnGround"]) return;

    // If pusher is standing on something, keep existing stack semantics.
    // 若推动者站在某物上，保持现有的堆叠语义。
    if (pusher._supportingType === SUPPORT_TYPES.STANDING) return;

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
    // 确定性排序：最近接触优先。
    candidates.sort((a, b) => a.contactScore - b.contactScore);

    // Keep current semantics: pusher marks one representative pushed target,
    // 保持当前语义：推动者标记一个代表性被推目标，
    // while every contacted target gets standing relation for propagation.
    // 所有接触目标均获得站立关系以供传播。
    const primaryTarget = candidates[0].target;
    pusher._supportingEntity = primaryTarget;
    for (const candidate of candidates) {
      candidate.target._supportingEntity = pusher;
      candidate.target._supportingType = SUPPORT_TYPES.STANDING;
    }
    if (pusher._supportingType !== SUPPORT_TYPES.SUPPORT) {
      pusher._supportingType = SUPPORT_TYPES.PUSHING;
    }
  }

  isHeadPushTargetForPusher(pusher, target) {
    if (isBox(target)) {
      return true;
    }

    // Player can also head-push active replayer in easy/hard levels.
    if (isPlayer(pusher) && isActiveReplayer(target)) {
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

    const verticalGap = Math.abs(targetBottom - pusherTop);
    if (verticalGap > HEAD_PUSH_VERTICAL_TOLERANCE) return null;

    const pusherLeft = pusher.x;
    const pusherRight = pusher.x + pusher.collider.w;
    const targetLeft = target.x;
    const targetRight = target.x + target.collider.w;

    const overlapX =
      pusherLeft < targetRight + HEAD_PUSH_HORIZONTAL_TOLERANCE &&
      pusherRight > targetLeft - HEAD_PUSH_HORIZONTAL_TOLERANCE;

    if (!overlapX) return null;

    // Lower score means better candidate: prioritize vertical alignment, then center proximity.
    // 分数越低代表候选者越优先：先考虑垂直对齐，再考虑中心距离。
    const pusherCenterX = pusherLeft + pusher.collider.w / 2;
    const targetCenterX = targetLeft + target.collider.w / 2;
    const centerDistance = Math.abs(pusherCenterX - targetCenterX);
    return verticalGap * 1000 + centerDistance;
  }

  getDynamicBoxes() {
    return this._dynamicEntities.filter((dyn) => isBox(dyn));
  }

  processEnemyCollisionsForActor(actor, handler) {
    for (const dyn of this._dynamicEntities) {
      if (isEnemy(dyn) && dyn !== actor) {
        handler(actor, dyn);
      }
    }
  }

  processPusherBoxInteractions(pusher) {
    for (const dyn of this._dynamicEntities) {
      if (!isBox(dyn) || dyn === pusher) {
        continue;
      }

      this.processDynamicDynamicPair(pusher, dyn);

      const boxCorrection = this.resolveBoxAgainstStatics(dyn);
      if (boxCorrection !== 0) {
        pusher.x += boxCorrection;
        if (pusher.movementComponent) {
          pusher.movementComponent.velX = 0;
        }
      }

      this.pushPusherOutOfBoxIfOverlapping(pusher, dyn);
    }
  }

  resolveBoxAgainstStatics(box) {
    // [FIX] Box clipping through walls: immediately perform a DS pass after DD box push to prevent box from stopping inside walls.
    // [FIX] 推箱穿模：DD 推完箱子后立即补一次 DS，防止箱子停在墙内。
    const boxXBeforeDS = box.x;
    for (const sta of this._staticEntities) {
      this.processDynamicStaticPair(box, sta);
    }

    // [FIX] When DS bounces the box back, apply the same correction offset to the pusher to prevent the pusher from sinking into the box.
    // [FIX] DS 把箱子弹回时，将同等修正量施加给推动者，防止推动者陷入箱内。
    return box.x - boxXBeforeDS;
  }
}
