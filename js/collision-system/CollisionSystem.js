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
}
