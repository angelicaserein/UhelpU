# Stacking System Quickstart

这份文档是给第一次接手 stacking / collision / physics 系统的新成员看的快速上手版。

如果你只想先建立整体心智模型，而不想一开始就读完整实现，先看这份。

## 1. 先记住系统顺序

标准关卡里的核心执行顺序是：

```text
physicsEntry -> velXPropagationEntry -> collisionEntry
```

对应入口在 `js/level-design/BaseLevel.js`。

可以这样理解：

1. `physicsEntry()`
   - 每个动态实体先按自己的速度和加速度移动
   - 同时更新 `jumpCooldown`、`coyoteFrames`
2. `velXPropagationEntry()`
   - 把“底下支撑者”的水平位移沿支撑链向上传给上层实体
3. `collisionEntry()`
   - 最后统一做碰撞修正、落地、踩敌人、踩按钮、建立 standing / pushing 关系

一句话版：

- `PhysicsSystem` 先让大家“各走各的”
- 然后补“被支撑链带着走”的水平位移
- 最后 `CollisionSystem` 再把穿模和语义修正回来

## 2. 三个核心文件各管什么

### `js/physics-system/PhysicsSystem.js`

负责：

- 位置积分
- 地面状态更新
- 支撑链 BFS 水平传播

这里不要找“踩敌人会怎样”“按钮怎么按下”这类逻辑，那不在这里。

### `js/collision-system/resolverMap.js`

负责：

- 几何修正
- 判断这次碰撞是 `bottom / top / left / right / a_on_b / b_on_a / allowed collision`

它只决定“怎么分离”和“这是什么碰撞类型”，不写语义结果。

### `js/collision-system/responderMap.js`

负责：

- 根据碰撞类型写游戏行为
- 例如落地、踩敌人、触发按钮、进入传送门、建立支撑关系

一句话：

- resolver 负责“几何”
- responder 负责“语义”

### `js/collision-system/CollisionSystem.js`

负责：

- 把实体分成 `DYNAMIC / STATIC / TRIGGER`
- 调 detector / resolver / responder
- 做箱子稳定化
- 做 head-push 补建关系

它更像总调度器。

## 3. 最重要的两个字段

### `_supportingEntity`

表示：当前实体和谁存在支撑关系。

### `_supportingType`

表示：当前实体在支撑关系里扮演什么角色。

当前主要有三种值：

- `standing`
  - 当前实体站在别的实体上
- `support`
  - 当前实体是某一段支撑链的根
- `pushing`
  - 当前实体正在从下往上顶着别的实体

最关键的一点：

这些关系不是持久状态，而是每帧在 `collisionEntry()` 开头清空，再由本帧碰撞重新建立。

所以不要把它们当成实体永久属性来理解。

## 4. BFS 支撑传播到底在做什么

`PhysicsSystem.velXPropagationEntry()` 会把 standing / pushing 关系拼成一张图，然后做 BFS。

它要解决的问题是：

- 底下那个实体横向移动了
- 上面站着的实体也应该一起被带着走

传播规则可以粗略理解成：

- `standing`：上层 rider 跟着下层 supporter 走
- `pushing`：从下往上顶的链也要继续传递
- `support / pushing`：通常是 BFS 根节点候选

传播用的是：

```js
rider.x += supporterDeltaX;
```

而不是改 `rider.velX`。

这是刻意设计，因为控制器可能会在同帧把 `velX` 覆盖掉。

## 5. 跳跃相关先看哪两个状态

### `jumpCooldown`

当前系统里它除了“跳跃冷却”，还承担“识别起跳帧”的功能。

在支撑链里，`jumpCooldown === 6` 会被当作起跳帧，当前 rider 分支会切断，不继续吃本帧水平传播。

### `coyoteFrames`

这是离地后短暂可跳的缓冲。

简单理解：

- 还在地上时重置
- 离地后递减
- 大于 0 时仍然允许按“刚离地不久”处理

如果你发现“明明刚离开平台却跳不起来”，通常要查它。

## 6. 新增实体时最短路径怎么做

### 新增动态实体

最小接入要求：

1. 有 `type`
2. 有 `RectangleCollider(ColliderType.DYNAMIC, w, h)`
3. 如果要被 PhysicsSystem 驱动，要有 `movementComponent`
4. 如果要跳跃和地面状态，要有 `controllerManager.currentControlComponent`

如果它需要特殊行为，再继续改：

- `responderMap.js`：写语义响应
- 必要时 `CollisionSystem.js`：加类型过滤或特殊调度

### 新增静态实体

最小接入要求：

1. 有 `type`
2. 有 `RectangleCollider(ColliderType.STATIC, w, h)`

普通地形通常只要这样就够了。

### 新增触发器实体

最小接入要求：

1. 使用 `ColliderType.TRIGGER`
2. 在 `responderMap.js` 的 `dynTriResponse()` 里加对应分支

## 7. `allowHeadPushSupport` 是干什么的

这是当前系统给“可被头顶支撑”的动态实体留的扩展标记。

判定位置在 `CollisionSystem.isHeadPushTargetForPusher()`。

如果一个新动态实体需要支持：

- 玩家或别的 pusher 从下往上顶住它
- 并把它纳入支撑传播链

最小做法通常是：

```js
this.allowHeadPushSupport = true;
```

但这只表示“允许成为 head-push 目标”。

如果它还需要特殊落地反馈、伤害、速度同步，还是要去补 `responderMap.js`。

## 8. 新人最容易踩的坑

### A. 不要随便改主循环顺序

`physicsEntry -> velXPropagationEntry -> collisionEntry` 不是随便排的。

改顺序很容易直接打坏 standing / pushing 链。

### B. 不要把 resolver 和 responder 的职责混掉

- resolver 只做几何修正
- responder 才写行为语义

一旦混写，后面很难维护。

### C. `_supportingEntity / _supportingType` 是每帧重建的

不要把它们当缓存状态用。

### D. `detectorMap.rectVsRect()` 是严格重叠，不是贴边即碰撞

也就是说，刚好边缘接触但没有真正重叠，不会进碰撞分支。

很多“为什么这帧没进 responder”的问题都和这个有关。

### E. `resolverMap` 的分支顺序不要轻易重排

例如：

- 先判上下
- 再判侧推
- 最后才走 fallback

这个顺序本身就是行为定义的一部分。

### F. `_lastFrameDeltaX` 很重要

有些实体，尤其是 box，位移并不是通过 `velX` 产生，而是 resolver 直接改了 `x`。

所以系统会在碰撞阶段记录：

```js
_lastFrameDeltaX = x - prevX;
```

支撑传播优先读它。删掉或者改错时机，链条水平跟随会出问题。

## 9. 推荐阅读顺序

如果你只打算花 20 分钟入门，按这个顺序看：

1. `js/level-design/BaseLevel.js`
2. `js/physics-system/PhysicsSystem.js`
3. `js/collision-system/CollisionSystem.js`
4. `js/collision-system/resolverMap.js`
5. `js/collision-system/responderMap.js`

如果你已经读完这五个文件，再回头看完整版文档：

- `STACKING_SYSTEM_DOCUMENTATION.md`

这样会更容易把细节对上。
