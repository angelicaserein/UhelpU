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
        }
      }
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
            if (replayer3.movementComponent) replayer3.movementComponent.velX = 0;
          }
        }
      }
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

  processDynamicDynamicPair(player, replayer) {
    // 死亡的玩家无视与分身的碰撞
    if (player.deathState && player.deathState.isDead) {
      return;
    }

    const playerShape = player.collider.colliderShape;
    const replayerShape = replayer.collider.colliderShape;

    const typePair = "DYNAMIC-DYNAMIC";
    const shapePair = `${playerShape}-${replayerShape}`;
    const fullKey = `${typePair}-${shapePair}`;

    const detectFunc = detectorMap[shapePair];
    const detectResult = detectFunc(player, replayer); //dynamic-dynamic

    if (detectResult) {
      console.log("player and replayer collided");
      const resolveFunc = resolverMap[fullKey];
      const collisionMsg = resolveFunc(player, replayer);

      const responseFunc = responderMap[typePair];
      responseFunc(player, replayer, collisionMsg);
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
}
