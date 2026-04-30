# Box Physics & Stacking System — Technical Reference

> **版本对应**：本文档基于当前代码库实际实现编写，适用于 `js/physics-system/` 与 `js/collision-system/` 下的所有文件。
> 如需了解旧版描述，请参考 `docs/archive/stacking-system-old.md`（可能与当前实现有出入）。

---

## 1. 整体架构

### 1.1 三大系统职责划分

| 系统                            | 文件                                                    | 职责                                                                  |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| **PhysicsSystem**               | `js/physics-system/PhysicsSystem.js`                    | 速度/加速度/位置积分；coyote frames；replayer 离开缓冲；BFS velX 传播 |
| **CollisionSystem**             | `js/collision-system/CollisionSystem.js`                | 实体分区；碰撞调度；箱子稳定化；head-push 维护；支撑链 Y 轴跟随       |
| **Responder/Resolver/Detector** | `resolverMap.js` / `responderMap.js` / `detectorMap.js` | 几何检测、位置修正、行为副作用（三个相互解耦的映射表）                |

### 1.2 每帧主循环顺序

在 `BaseLevel` 中，每帧按以下顺序驱动：

```
physicsEntry()
  └─ 积分 velY/velX → 更新位置
  └─ 重置 isOnGround、tick controller

velXPropagationEntry()
  └─ 基于上帧建立的支撑关系，BFS 传播水平位移

collisionEntry()
  └─ 清空 _supportingEntity / _supportingType
  └─ DS (dynamic-static) ×2 pass
  └─ DD player-enemy
  └─ processPusherBoxInteractions (player)
  └─ maintainHeadPushSupportRelations (player)
  └─ DD replayer-enemy
  └─ processPusherBoxInteractions (replayer)
  └─ maintainHeadPushSupportRelations (replayer)
  └─ stabilizeBoxCollisions()
  └─ restackStandingChains()
  └─ DD player-replayer（最后结算）
  └─ resolvePusherOverlapsWithBoxes (player & replayer)
  └─ DD enemy-static
  └─ DT trigger 处理（按钮等）
  └─ 记录 _lastFrameDeltaX
```

---

## 2. Box 实体

**文件**：`js/game-entity-model/interactables/Box.js`

```
Box
  ├─ type = "box"
  ├─ movementComponent: MovementComponent(velX=0, velY=0, accX=0, accY=-0.5)
  │     ─ accY=-0.5 是重力（每帧向下 0.5 px/frame²）
  ├─ collider: RectangleCollider(DYNAMIC, w, h)  默认 40×40
  ├─ prevX / prevY  ─ 上一帧位置，用于碰撞方向判断
  ├─ blockedXLastFrame  ─ 本帧侧面被阻挡
  └─ headBlockedThisFrame  ─ 本帧头顶被阻挡
```

**与 Player/Replayer 的区别**：

- Box 没有 `controllerManager`，不响应输入
- Box 有 `movementComponent`（受重力），被 `PhysicsSystem.physicsEntry()` 处理
- Box 的 `velX` 在碰撞后总是被归零（无水平惯性）；水平移动完全来自上方实体的 velX 传播

---

## 3. 支撑关系字段

每个 DYNAMIC 实体上有两个字段，每帧开始时被清空，由本帧 `collisionEntry()` 重新建立：

| 字段                | 类型                                               | 含义                         |
| ------------------- | -------------------------------------------------- | ---------------------------- |
| `_supportingEntity` | entity \| null                                     | 当前帧与哪个实体形成支撑关系 |
| `_supportingType`   | `"standing"` \| `"pushing"` \| `"support"` \| null | 本实体在这段关系中的角色     |

### 支撑类型语义

```
A (standing) ── 站在 ──► B (support)
               B 承载 A

pusher (pushing) ── 顶着 ──► box (standing)
                    pusher 用头顶推着 box
```

| 类型       | 谁持有                  | 含义                                       |
| ---------- | ----------------------- | ------------------------------------------ |
| `STANDING` | 上方实体（rider）       | 我站在 `_supportingEntity` 上              |
| `SUPPORT`  | 下方实体（supporter）   | 我托着 `_supportingEntity`                 |
| `PUSHING`  | pusher（玩家/replayer） | 我用头顶着 `_supportingEntity`（一个 box） |

`setStandingSupportRelation(rider, supporter)` 是建立普通站立关系的辅助函数：

- `rider._supportingType = STANDING`, `rider._supportingEntity = supporter`
- `supporter._supportingType = SUPPORT`, `supporter._supportingEntity = null`

`applyHeadPushSupportRelation(pusher, box)` 建立 head-push 关系：

- `box._supportingType = STANDING`, `box._supportingEntity = pusher`
- `pusher._supportingType = PUSHING`, `pusher._supportingEntity = box`

---

## 4. PhysicsSystem 详解

### 4.1 `physicsEntry()`

对所有有 `movementComponent` 的实体依次：

1. 若有 `initDeathEffect`，执行一次性死亡初始化
2. `headBlockedThisFrame = false`
3. 更新 replayer 离开缓冲状态（`refreshReplayerStandingState`）
4. 保存 `prevX = x`, `prevY = y`
5. 若有 `controllerManager`：
   - 更新 coyote frames、jump cooldown（`updateGroundAbilityState`）
   - 重置 `isOnGround = false`（每帧重置，由碰撞检测重新设置）
   - 执行 `controllerManager.tick()`（处理输入）
6. `integrateMovement`：积分速度和加速度，更新位置
   ```
   velY += accY   (accY = -0.5 为重力)
   velX += accX
   x += velX
   y += velY
   ```

### 4.2 Coyote Frames 机制

`coyoteFrames` 默认值 6。规则：

- 在地面：`coyoteFrames = 6`（重置）
- 离开地面：`coyoteFrames--` 递减
- 有 jump cooldown：`coyoteFrames = 0`（跳跃起飞帧截断）
- `wasOnGround = coyoteFrames > 0`（控制器通过这个判断是否允许跳跃）

### 4.3 `velXPropagationEntry()` — BFS 水平位移传播

**目的**：当底层实体（地面/箱子/replayer）水平移动时，站在上面的所有实体跟随移动。

**实现**：

**步骤一**：构建 `ridersOf` 邻接表

- `STANDING` 类型：`ridersOf[_supportingEntity].push(entity)`（我站在支撑者上，我是 rider）
- `PUSHING` 类型：`ridersOf[entity].push(_supportingEntity)`（我顶着 box，box 是 rider）

**步骤二**：找根节点（链底层）

- 持有 `SUPPORT` 或 `PUSHING` 类型的实体是根节点（它们自己在被推动）

**步骤三**：BFS 从根节点向上传播

- 传播量 = `supporter._lastFrameDeltaX ?? supporter.movementComponent.velX`
  - `_lastFrameDeltaX` 由上一帧 `collisionEntry()` 末尾记录，反映箱子被 DD resolver 直接修改 x 的真实位移
  - 因为箱子 `velX` 恒为 0（侧面碰撞后即被归零），所以不能直接用 `velX`
- 对每个 rider：`rider.x += supporterDeltaX`（直接改位置，不修改 velX，避免被 controller.tick 覆盖）
- 跳跃起飞帧（`isTakeoffFrame`）切断该 rider 分支，防止被强制拖动

---

## 5. CollisionSystem 详解

### 5.1 实体分区

`partitionEntitiesByType()` 按 `collider.colliderType` 分入三组：

- `DYNAMIC`：受物理影响（Player, Replayer, Box, Enemy）
- `STATIC`：固定障碍物（Ground, Wall, 固定平台）
- `TRIGGER`：触发器（Button, Portal, Spike）

### 5.2 `collisionEntry()` 主流程

#### 阶段 0：清空支撑关系

```js
for (dyn of _dynamicEntities) {
  dyn._supportingEntity = null;
  dyn._supportingType = null;
}
```

#### 阶段 1：DS 碰撞（×2 pass）

对所有 `(dynamic, static)` 对执行 2 遍 `processDynamicStaticPair`。
2 遍的原因：第一遍可能因为箱子链传递导致需要再次修正。

#### 阶段 2：`processPusherBoxInteractions(pusher)`

对每个 Box：

1. `processDynamicDynamicPair(pusher, box)`（DD 检测推动）
2. `resolveBoxAgainstStatics(box)`：立即补一次 DS，防止箱子被推进墙（返回 box 的 x 修正量）
3. 将同等修正量施加给 pusher（防止 pusher 陷入 box）
4. `pushPusherOutOfBoxIfOverlapping(pusher, box)`：侧面穿模防护

这一步分别对 player 和 replayer 各执行一次。

#### 阶段 3：`maintainHeadPushSupportRelations(pusher)`

对空中的 pusher（非 `isOnGround`、非 `STANDING`），扫描所有 DYNAMIC 实体，找到满足条件的 head-push 目标（主要是 Box，以及 player↔replayer 互推情况），建立 PUSHING/STANDING 关系。

候选者按 `contactScore` 排序（`verticalGap * 1000 + centerDistance`），取最近接触的为主要目标。

容差参数：

- `HEAD_PUSH_VERTICAL_TOLERANCE = 8`（px）
- `HEAD_PUSH_HORIZONTAL_TOLERANCE = 6`（px）

#### 阶段 4：`stabilizeBoxCollisions()`

**目的**：收敛箱子链推动，防止多个箱子互相穿模。

执行 `BOX_STABILIZATION_PASSES = 4` 次循环，每次：

1. `processAllBoxPairs()`：所有 box-box DD 碰撞
2. `processAllBoxStaticPairs()`：所有 box-static DS 碰撞
3. `enforceBoxNoPenetrationWithStatics()`：强制消除 box-box 重叠（考虑 static 阻挡方向）

**`enforceBoxNoPenetrationWithStatics()` 逻辑**：
对每对仍然重叠的 box A、B：

- 计算 `overlapX` 和 `overlapY`
- 若 `overlapX <= overlapY`（水平穿模更严重）：沿 X 轴分离
  - 若 A 被 static 卡住但 B 没有：只推 B
  - 若 B 被 static 卡住但 A 没有：只推 A
  - 否则各推一半
- 垂直情况同理

#### 阶段 5：`restackStandingChains()`

**目的**：box 稳定化可能改变了 box 的 Y 坐标，需要把所有站在 box 上的 rider 跟随移动。

递归 DFS（从 SUPPORT/PUSHING 的根节点出发）：

```
supporterDeltaY = supporter.y - supporter.prevY
for rider in ridersOf[supporter]:
  rider.y += supporterDeltaY
  rider.prevY = rider.y
  restackFromSupporter(rider)  // 递归
```

#### 阶段 6：Player-Replayer DD

在 box 支撑稳定后，最后结算 player 与 replayer 之间的 DD 碰撞。

#### 阶段 7：`resolvePusherOverlapsWithBoxes(pusher)`

box 稳定化后可能把 box 推进了 pusher。若 pusher 当前处于 PUSHING 状态，立即做一次侧面穿模防护。

#### 阶段 8：记录 `_lastFrameDeltaX`

```js
dyn._lastFrameDeltaX = dyn.x - dyn.prevX;
```

供下帧 `velXPropagationEntry()` 使用。

---

## 6. detectorMap — 几何检测

**当前唯一实现**：`RECTANGLE-RECTANGLE`

```js
function rectVsRect(a, b) {
  const vectorX = a.x + a.collider.w / 2 - (b.x + b.collider.w / 2);
  const vectorY = a.y + a.collider.h / 2 - (b.y + b.collider.h / 2);
  return (
    Math.abs(vectorX) < a.collider.w / 2 + b.collider.w / 2 &&
    Math.abs(vectorY) < a.collider.h / 2 + b.collider.h / 2
  );
}
```

纯 AABB 中心距检测，返回 `true/false`。

---

## 7. resolverMap — 位置修正

### 7.1 `DYNAMIC-STATIC-RECTANGLE-RECTANGLE` → `resolveFirst(a, b)`

优先级（由高到低）：

| 条件                                                              | 碰撞方向       | 修正                               |
| ----------------------------------------------------------------- | -------------- | ---------------------------------- |
| `prevBottom >= staticTop` 且当前 bottom < staticTop（从上方穿越） | `BOTTOM`       | `a.y = staticTop`（落地）          |
| `prevTop <= staticBottom` 且当前 top > staticBottom（从下方穿越） | `TOP`          | `a.y = staticBottom - a.h`（顶头） |
| 从左侧穿越                                                        | `RIGHT`        | `a.x = staticLeft - a.w`           |
| 从右侧穿越                                                        | `LEFT`         | `a.x = staticRight`                |
| Fallback（已重叠，极罕见）                                        | 最小重叠轴弹出 | 水平或垂直分离                     |

**特殊**：`BOTTOM` 方向时，若 `_replayerLeftFrameCount > 0`（刚离开 replayer 的缓冲帧），不修正位置，让玩家继续下落。

### 7.2 `DYNAMIC-DYNAMIC-RECTANGLE-RECTANGLE` → `resolveDynDyn(a, b)`

优先级：

1. **垂直栈判断（上方 A 踩 B）**：`aPrev.bottom >= bPrev.top`
   - 若 `a.headBlockedThisFrame`：把 B 压回 A 下方（`b.y = a.y - b.h`），防止互相穿模
   - 否则：把 A 吸附到 B 顶部（`a.y = b.y + b.h`）
   - 返回 `A_ON_B`

2. **垂直栈判断（上方 B 踩 A）**：`bPrev.bottom >= aPrev.top`（同理，返回 `B_ON_A`）

3. **侧面 Box 推动** `tryResolveLateralBoxPush`：
   - 检测本帧是否从侧面穿入（prev 不重叠，curr 重叠），若是，直接把 box 推到推动者侧面
   - 例：A 从左推 B（box）：`b.x = a.x + a.w`

4. **侧面 fallback（pusher-box 或 box-box）**：
   - 若两者上一帧未垂直叠放，根据上一帧的 prevX 关系确定谁在左谁在右，推开
   - 平局（prevX 相同）按当前中心方向分离

5. **其他情况**：返回 `ALLOWED`（侧面重叠保留，不做垂直分离）

---

## 8. responderMap — 行为响应

### 8.1 `DYNAMIC-STATIC`：`basicBlockResponse(a, b, msg)`

**a 是 Box**：

- `LEFT/RIGHT`：`velX = 0`, `blockedXLastFrame = true`
- `TOP`（顶头）：`headBlockedThisFrame = true`，若 `velY > 0` 则清零
- `BOTTOM`（落地）：`velY = 0`

**a 是 Enemy**：

- `LEFT`：`blockedLeftThisFrame = true`
- `RIGHT`：`blockedRightThisFrame = true`
- `TOP`：`velY > 0` 时清零
- `BOTTOM`：`velY = 0`, `blockedBottomThisFrame = true`，记录 `_supportLeft/_supportRight`

**a 是 Player/Replayer**：

- `LEFT/RIGHT`：`velX = 0`, `blockedXLastFrame = true`
- `TOP`（顶头）：`headBlockedThisFrame = true`，清零向上的 velY
- `BOTTOM`（落地）：
  - 若在 replayer 离开缓冲期：清标志，直接返回（不阻拦下落）
  - 否则：`velY = 0`, `markGrounded(a, 0)`

### 8.2 `DYNAMIC-DYNAMIC`：`dynDynBlockResponse(a, b, msg)`

#### Player/Replayer vs Enemy

| msg                  | 结果                                                        |
| -------------------- | ----------------------------------------------------------- |
| `A_ON_B`             | 踩踏：`stomper.velY = 17.5`（弹起），`enemy.triggerDeath()` |
| `ALLOWED` / `B_ON_A` | 受伤：`player.triggerDeath("enemy")`（replayer 无效）       |

#### Player/Replayer vs Box

| msg                                   | 结果                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ALLOWED`                             | 若仍满足 head-push 条件，维持 `applyHeadPushSupportRelation`，否则不操作                           |
| `A_ON_B`（player/replayer 踩箱顶）    | `markGrounded(a, deltaY)`, `syncVerticalVelocity(a, deltaY)`, `setStandingSupportRelation(a, b)`   |
| `B_ON_A`（box 踩 player/replayer 头） | `markGrounded(b, deltaY)`, `syncVerticalVelocity(b, deltaY)`, `applyHeadPushSupportRelation(a, b)` |

#### Box vs Box

| msg                        | 结果                                                                          |
| -------------------------- | ----------------------------------------------------------------------------- |
| `ALLOWED`                  | 无操作                                                                        |
| `A_ON_B`（上方 A 踩 B 头） | `a.velY = 0`, `b.velY = max(b.velY, 0)`, `setStandingSupportRelation(a, b)`   |
| `B_ON_A`（上方 B 踩 A 头） | `b.velY = 0`, `a.velY = max(a.velY, 0)`, B 设为 STANDING on A，A 设为 PUSHING |

#### Player vs Replayer（DD 通用分支）

| msg      | 结果                                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `A_ON_B` | `markGrounded(a, deltaY)`, `syncVerticalVelocity(a, deltaY, -1)`（偏移 -1 确保持续微小重叠触发 isOnGround）, `setStandingSupportRelation(a, b)` |
| `B_ON_A` | 同理，`applyHeadPushSupportRelation(a, b)`                                                                                                      |

**`syncVerticalVelocity` 偏移 -1 的原因**：若完全同步 velY，player 与 replayer 每帧位移完全相同，AABB 无重叠，`isOnGround` 永远不触发，导致跳不起来。偏移 -1 产生持续微小穿模，确保碰撞每帧触发。

### 8.3 `DYNAMIC-TRIGGER`：`dynTriResponse(a, b, eventBus)`

- Player/Replayer + Button → `b.pressButton()`
- Enemy + Button → `b.pressButton()`
- Box + Button → `b.pressButton()`
- Player/Replayer + Portal → 触发传送（通过 `eventBus`）
- Player + Spike → `player.triggerDeath("spike")`

---

## 9. 推箱穿模修复（Box Wall Clipping Fix）

**问题**：DD 阶段推箱，DS 阶段把箱子弹回，若再次做 DD 会用旧 `prevX` 把箱子重新推进墙。

**当前修复方案**（`processPusherBoxInteractions`）：

1. 执行 DD（pusher vs box）
2. 立即补一次 DS（`resolveBoxAgainstStatics`），记录 box 的 x 修正量 `boxCorrection`
3. 将 `boxCorrection` 施加给 pusher
4. 不再做第三次 DD，消除重叠

---

## 10. 关键常量汇总

| 常量                               | 值             | 位置                           | 含义                       |
| ---------------------------------- | -------------- | ------------------------------ | -------------------------- |
| `BOX_STABILIZATION_PASSES`         | 4              | CollisionSystem                | 箱子稳定化迭代次数         |
| `HEAD_PUSH_VERTICAL_TOLERANCE`     | 8 px           | CollisionSystem / responderMap | head-push 垂直容差         |
| `HEAD_PUSH_HORIZONTAL_TOLERANCE`   | 6 px           | CollisionSystem / responderMap | head-push 水平容差         |
| `BOX_SIDE_EJECT_LANDING_TOLERANCE` | 8 px           | CollisionSystem                | 落地保护区（防侧面弹出）   |
| `DEFAULT_COYOTE_FRAMES`            | 6 帧           | PhysicsSystem                  | coyote time 帧数           |
| `JUMP_TAKEOFF_COOLDOWN`            | 6 帧           | PhysicsSystem                  | 跳跃冷却帧数               |
| `REPLAYER_LEAVE_BUFFER_FRAMES`     | 1 帧           | PhysicsSystem                  | 玩家离开 replayer 的缓冲帧 |
| `STOMP_BOUNCE_VEL_Y`               | 17.5           | responderMap                   | 踩踏弹起初速度             |
| `accY` (Box gravity)               | -0.5 px/frame² | Box.js                         | 箱子重力加速度             |

---

## 11. 扩展提示

- **新增实体类型支持 head-push**：在 `CollisionSystem.isHeadPushTargetForPusher()` 中将 `target.allowHeadPushSupport === true` 条件即可，无需修改核心逻辑
- **新增碰撞形状**：在 `detectorMap` 和 `resolverMap` 中新增对应键值对，`CollisionSystem` 会自动分发
- **多箱子链推动不稳定**：可适当增加 `BOX_STABILIZATION_PASSES` 值（当前 4，性能允许可调至 6）
