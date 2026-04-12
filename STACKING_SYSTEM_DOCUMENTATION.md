# Stacking / Collision / Physics System Documentation

## 1. 整体架构概览

本系统由三层核心逻辑组成：物理积分、水平支撑传播、碰撞修正与响应。

标准关卡中的主循环顺序由 `BaseLevel.updatePhysics()` 和 `BaseLevel.updateCollision()` 驱动：

1. `physicsEntry()`
2. `velXPropagationEntry()`
3. 实体自身 `update()`
4. `collisionEntry()`

也就是常说的：

```text
physicsEntry -> velXPropagationEntry -> collisionEntry
```

### 1.1 三个系统各自职责

#### 物理系统 `PhysicsSystem`

职责：

- 处理速度、加速度、位置积分
- 处理 `jumpCooldown` 和 `coyoteFrames`
- 维护玩家离开 replayer 时的 1 帧缓冲状态
- 在碰撞修正之前，把底层支撑实体的水平位移沿支撑链向上传播

它不负责：

- 判定是否碰撞
- 决定碰撞后该怎么分离
- 决定踩敌人、踩按钮、踩箱子后的行为结果

#### 碰撞系统 `CollisionSystem`

职责：

- 把实体按 `DYNAMIC / STATIC / TRIGGER` 分区
- 组织 DYNAMIC-STATIC、DYNAMIC-DYNAMIC、DYNAMIC-TRIGGER 的处理流程
- 调用 `detectorMap` 判定是否相交
- 调用 `resolverMap` 做位置修正
- 调用 `responderMap` 写入行为副作用和支撑关系
- 维护一些系统级稳定逻辑，例如箱子稳定化、head-push 支撑关系维护

它是“调度者”，不把所有细节都写死在一个函数里，而是把检测、修正、响应分别转发给不同映射表。

#### 响应系统 `responderMap`

职责：

- 根据 resolver 返回的碰撞消息，写入游戏语义结果
- 例如：落地、头顶撞击、踩敌人、踩按钮、进传送门、建立 standing / pushing / support 关系
- 同步 `isOnGround`、`groundVelY`、部分 `velY`

它不负责几何分离。几何分离已经由 `resolverMap` 完成。

### 1.2 各文件分工

#### 主流程入口

- `js/level-design/BaseLevel.js`
  - 初始化 `PhysicsSystem`、`CollisionSystem`
  - 在标准关卡中定义主循环顺序

#### 物理层

- `js/physics-system/PhysicsSystem.js`
  - 物理积分
  - 地面能力状态更新
  - 支撑链 BFS 水平传播

#### 碰撞层

- `js/collision-system/CollisionSystem.js`
  - 实体分区
  - 调度 DS / DD / Trigger 处理
  - 箱子稳定化
  - head-push 维护
- `js/collision-system/detectorMap.js`
  - 几何检测
  - 当前只有 `RECTANGLE-RECTANGLE`
- `js/collision-system/resolverMap.js`
  - 位置修正
  - 把碰撞归类为 `bottom / top / left / right / a_on_b / b_on_a / allowed collision`
- `js/collision-system/responderMap.js`
  - 行为响应
  - 写入 `_supportingEntity / _supportingType`
  - 更新 `isOnGround`、按钮、死亡、传送门等状态
- `js/collision-system/enumerator.js`
  - 碰撞器类型和形状枚举
- `js/collision-system/CollideComponent.js`
  - 碰撞器组件定义

#### 实体接入层

- `js/game-entity-model/characters/Player.js`
- `js/game-entity-model/characters/Replayer.js`
- `js/game-entity-model/characters/Enemy.js`
- `js/game-entity-model/interactables/Box.js`
- `js/game-entity-model/terrain/Ground.js`
- `js/game-entity-model/terrain/Wall.js`

这些文件通过设置 `type`、`collider`、`movementComponent`、控制器等，把实体接入上述系统。

## 2. 核心概念解释

### 2.1 `_supportingEntity` / `_supportingType` 是什么

这是本系统里“支撑关系图”的两个核心字段。

- `_supportingEntity`
  - 当前实体和哪一个实体形成了支撑关系
- `_supportingType`
  - 当前实体在这段关系里扮演什么角色

这两个字段不是永久状态。

`CollisionSystem.collisionEntry()` 每帧开始都会先把动态实体的这两个字段清空，再由本帧碰撞和 head-push 逻辑重新建立。

这意味着：

- 它们表示的是“本帧有效关系”
- 不是实体初始化时的固定属性
- 任何想依赖它们的逻辑，都必须假设它们是每帧重建的

### 2.2 `standing / pushing / support` 三种关系分别代表什么

#### `standing`

表示“当前实体站在另一个实体上面”。

例子：

- 玩家站在箱子上
- 玩家站在 replayer 上
- 上层箱子站在下层箱子上

在这种关系里：

- 上层实体：`_supportingType = "standing"`
- 上层实体的 `_supportingEntity` 指向下面那个实体

#### `support`

表示“当前实体是一个支撑根节点”。

通常出现在：

- 某个实体作为一段 standing 链条的最下层支撑者

它的作用不是表达额外物理含义，而是给 `PhysicsSystem.velXPropagationEntry()` 提供 BFS 根节点。

#### `pushing`

表示“当前实体正在从下方顶着另一个实体”，也就是 head-push 关系。

典型场景：

- 玩家跳起后头顶着箱子
- 玩家空中顶着 replayer

在这种关系里：

- 顶人的那个实体：`_supportingType = "pushing"`
- 被顶住的目标通常会把 `_supportingEntity` 指回这个 pusher，并把自己标记为 `standing`

### 2.3 BFS 传播链是什么，怎么工作的

`PhysicsSystem.velXPropagationEntry()` 会把 standing / pushing 关系视为一张有向图，然后做一次 BFS，把底层支撑者的水平位移传递给上层实体。

核心过程分三步：

1. 构建邻接表 `supporter -> riders[]`
   - 如果一个实体是 `standing`，说明它骑在 `_supportingEntity` 上，所以加入 `supporter -> rider`
   - 如果一个实体是 `pushing`，说明它正顶着 `_supportingEntity`，传播方向要反过来处理
2. 找根节点
   - `_supportingType === "support"` 或 `_supportingType === "pushing"` 的实体会作为 BFS 根
3. 从根节点向上传播 `deltaX`
   - 优先使用 `supporter._lastFrameDeltaX`
   - 否则回退到 `supporter.movementComponent.velX`
   - rider 直接执行 `rider.x += supporterDeltaX`

这里“直接改位置而不是改 velX”是刻意设计。

原因是控制器里的 `tick()` 可能会把 `velX` 覆盖掉。如果传播链也走 `velX`，支撑移动会被输入层冲掉。

### 2.4 `jumpCooldown / coyoteFrames` 的作用

#### `jumpCooldown`

用途：

- 记录角色是否刚刚起跳，以及起跳后的若干帧状态
- 在 `PhysicsSystem.physicsEntry()` 中每帧递减
- 在支撑链传播里，`jumpCooldown === 6` 被视为“起跳帧”，该 rider 分支会被切断

也就是说，当前系统里它不只是“冷却”，还承担了“起跳帧标记”的职责。

#### `coyoteFrames`

用途：

- 实现 coyote time，也就是离地后短时间内仍允许起跳
- 当 `isOnGround` 为真时重置为 6
- 当离地且大于 0 时持续递减
- `wasOnGround` 实际上是从 `coyoteFrames > 0` 推导出来的

这套逻辑允许角色在离开平台后的短时间内仍然响应跳跃，提升操作容错。

## 3. 关键常量说明

下面列出当前这套 stacking / collision / physics 系统里显式命名、并对行为有意义的常量。

### 3.1 `js/collision-system/enumerator.js`

#### `ColliderType.DYNAMIC`

- 含义：可移动、参与物理积分和碰撞修正的实体
- 典型实体：`player`、`replayer`、`enemy`、`box`

#### `ColliderType.STATIC`

- 含义：不主动移动、作为地形/墙体/平台参与碰撞的实体
- 典型实体：`ground`、`wall`、`platform`

#### `ColliderType.TRIGGER`

- 含义：只做触发，不做实体分离
- 典型实体：`button`、`spike`、`portal`、`checkpoint`

#### `ColliderShape.RECTANGLE`

- 含义：当前唯一启用的碰撞形状
- 原因：整个 detector / resolver / collision 调度都是按矩形实现的，其他形状尚未接入

### 3.2 `js/collision-system/CollisionSystem.js`

#### `BOX_STABILIZATION_PASSES = 4`

- 含义：箱子稳定化时重复做 box-box / box-static 收敛迭代的次数
- 为什么是 4：这是一个折中值，足够处理短链式推挤，又不会把每帧成本拉太高

#### `HEAD_PUSH_VERTICAL_TOLERANCE = 8`

- 含义：head-push 判定时允许的上下误差
- 为什么是 8：留出分类抖动空间，避免轻微数值波动导致空中顶推关系忽有忽无

#### `HEAD_PUSH_HORIZONTAL_TOLERANCE = 6`

- 含义：head-push 判定时允许的左右边缘误差
- 为什么是 6：避免刚好擦边或方向切换帧时支撑关系丢失

#### `BOX_SIDE_EJECT_LANDING_TOLERANCE = 8`

- 含义：箱子侧向弹出保护中的落地容差
- 为什么是 8：避免角色明明接近箱顶着陆，却被错误地从侧面挤出去

### 3.3 `js/collision-system/responderMap.js`

#### `STOMP_BOUNCE_VEL_Y = 17.5`

- 含义：踩敌人后的反弹速度
- 为什么是 17.5：注释中明确写明这是普通跳跃速度的大约 1.75 倍，用来制造踩踏反馈

#### `HEAD_PUSH_VERTICAL_TOLERANCE = 8`

- 含义：`shouldKeepHeadPushRelation()` 里用于维持 head-push 关系的上下容差
- 设计原因：和 `CollisionSystem` 中的 head-push 选择逻辑保持同级别宽容区间

#### `HEAD_PUSH_HORIZONTAL_TOLERANCE = 6`

- 含义：维持 head-push 关系的左右容差
- 设计原因：避免正好切边时掉链

### 3.4 `js/physics-system/PhysicsSystem.js`

#### `REPLAYER_LEAVE_BUFFER_FRAMES = 1`

- 含义：玩家离开 replayer 后保留的 1 帧缓冲
- 为什么是 1：当前实现只想解决“刚离开时立即被当成静态落地/状态抖动”的问题，不想把空中容错拉得太长

#### `DEFAULT_COYOTE_FRAMES = 6`

- 含义：标准 coyote time 长度
- 为什么是 6：当前控制器和支撑传播都围绕这个值工作，属于已经内化到系统行为中的基础参数

#### `JUMP_TAKEOFF_COOLDOWN = 6`

- 含义：把 `jumpCooldown === 6` 视为“起跳帧”
- 为什么是 6：当前跳跃逻辑在起跳时把 `jumpCooldown` 设为 6，因此传播系统用这个值识别切断时机

### 3.5 常量里的两类值要区分

这套系统中的具名常量大体分两类：

- 语义常量
  - 例如 `ColliderType`、`SUPPORT_TYPES`
  - 它们主要是为了可读性和避免字符串散落
- 调参常量
  - 例如 `8`、`6`、`17.5` 这类被提取出来的数值
  - 它们直接影响实际手感和稳定性

改语义常量一般是代码结构问题，改调参常量则往往是行为改动。

## 4. 新增实体扩展指南

### 4.1 新增一个动态实体，需要改哪些地方

最小接入条件：

1. 在实体类里设置明确的 `type`
2. 创建矩形碰撞器：`new RectangleCollider(ColliderType.DYNAMIC, w, h)`
3. 如果需要受物理影响，提供 `movementComponent`
4. 如果需要输入、跳跃、地面状态，提供 `controllerManager.currentControlComponent`

通常还要检查以下几个层面：

#### A. 是否要进入物理系统

如果实体没有 `movementComponent`，`PhysicsSystem` 会直接跳过它。

这意味着：

- 不能被积分移动
- 不能参与 BFS 支撑传播

#### B. 是否要有特殊碰撞行为

如果你的新动态实体只是“像普通动态块一样落地/被顶/侧推”，现有 `resolverMap` 和 `responderMap` 可能已经足够。

但如果它需要特殊语义，例如：

- 踩到它会弹跳
- 碰到它会受伤
- 它能当特殊支撑者
- 它能被某些实体忽略

则通常需要修改：

- `responderMap.js`
- 必要时 `CollisionSystem.js` 中的类型过滤 helper

#### C. 是否要参与支撑链

如果它要支持上层实体跟随移动，就必须在响应阶段正确写入：

- `_supportingEntity`
- `_supportingType`

最常见的做法是复用 standing / support / pushing 现有语义，而不是再发明第四种关系。

#### D. 是否要被 head-push 顶起

如果希望这个动态实体能被从下方顶住并进入传播链，有三个入口：

- 它本身是 `box`
- 它是 active `replayer`，且 pusher 是 `player`
- 它显式声明 `allowHeadPushSupport = true`

最后这一项就是当前系统留给新动态实体的通用扩展点。

### 4.2 新增一个静态实体，需要改哪些地方

最小接入条件：

1. 设置明确的 `type`
2. 创建矩形碰撞器：`new RectangleCollider(ColliderType.STATIC, w, h)`

如果这个实体只是普通地形，通常不需要额外改 collision core。

但如果它有特殊行为，需要看是哪一类：

- 像地面/墙一样，只做阻挡：现有 `resolveFirst()` + `basicBlockResponse()` 就够了
- 像敌人一样带特殊响应：需要在 `responderMap.js` 增加针对该 `type` 的分支
- 需要运行时开关碰撞：还要考虑 `colliderType` 改变后的重新分区

### 4.3 新增一个触发器实体，需要改哪些地方

如果它只需要触发，不需要实体分离：

1. 使用 `ColliderType.TRIGGER`
2. 在 `responderMap.js` 的 `dynTriResponse()` 中添加对应逻辑

例如按钮、尖刺、传送门都是这样接入的。

### 4.4 `allowHeadPushSupport` 这类能力标记在哪里用，怎么扩展

当前真实落点在 `CollisionSystem.isHeadPushTargetForPusher()`。

它的判定顺序是：

1. `box` 永远允许
2. `player` 可以顶 active `replayer`
3. 任何 `target.allowHeadPushSupport === true` 的动态实体都允许

这意味着，新增一个动态实体如果你只想让它加入“空中顶推支撑链”，最小改动通常是：

```js
this.allowHeadPushSupport = true;
```

但要注意，这只解决“可被识别为 head-push 目标”。

如果它还需要特殊的落地响应、速度同步或伤害逻辑，仍然要补 `responderMap` 分支。

### 4.5 如果新增了新的碰撞形状

这不是小扩展，而是系统级扩展。

至少要同时改：

1. `enumerator.js`
2. `detectorMap.js`
3. `resolverMap.js`
4. `CollisionSystem.js` 中的 shape key 组合使用点

当前系统默认很多逻辑都建立在“所有实体都是矩形”的前提上。

## 5. 已知设计权衡和注意事项

### 5.1 哪些地方是刻意这样设计的，不要轻易改

#### A. 主循环顺序

标准顺序是：

```text
physicsEntry -> velXPropagationEntry -> collisionEntry
```

这个顺序的意图是：

- 先做实体自主运动
- 再做支撑链水平跟随
- 最后统一做碰撞修正和语义响应

如果随便调顺序，通常会直接破坏 standing / pushing 链条的稳定性。

#### B. BFS 直接改 `x`，而不是改 `velX`

这是刻意设计，不是偷懒。

因为控制层 `tick()` 可能会把 `velX` 覆盖。如果传播链也写 `velX`，上层实体很容易在同帧被输入逻辑清零。

#### C. `_supportingEntity / _supportingType` 每帧清空再重建

这保证了支撑图总是反映“本帧真实接触结果”，不会把上一帧的关系带到当前帧。

如果把它改成持久关系缓存，系统会更难排查，而且会引入幽灵支撑关系。

#### D. `jumpCooldown === 6` 被当作起跳帧标记

这不是最优雅的建模，但它已经和当前跳跃控制、传播切断逻辑耦合在一起。除非你准备整体重构跳跃状态机，否则不要单点改掉它。

### 5.2 哪些地方是已知脆弱点，改动时要特别小心

#### A. 坐标语义不直观

这套代码里：

- `bottom = y`
- `top = y + h`

也就是 y 轴方向和很多常见物理引擎直觉不完全一致。读 `resolveFirst()`、`resolveDynDyn()` 时如果按传统屏幕坐标脑补，很容易把上下关系看反。

#### B. `resolverMap` 高度依赖分支顺序

例如：

- 先判上下踩踏
- 再判侧推
- 最后才走 overlap fallback

这个顺序本身就是行为定义的一部分，不只是代码排列。重排分支很可能直接改行为。

#### C. `detectorMap.rectVsRect()` 使用严格 `<` 重叠

当前矩形检测要求真正穿插，而不是边缘接触：

```js
Math.abs(vectorX) < combinedHalfWidths &&
  Math.abs(vectorY) < combinedHalfHeights;
```

这意味着“刚好贴边但不重叠”不会被判为碰撞。很多 standing 边界问题、分类抖动问题，都会和这一点有关。

#### D. 部分旧关卡可能没有走标准 `velXPropagationEntry()` 顺序

`BaseLevel` 已经定义了标准顺序，但仓库里仍存在一些 demo 关卡自定义 update 流程，只调用了 `physicsEntry()` 和 `collisionEntry()`。

如果你在某个特定关卡里发现 stacking 行为和标准关卡不一致，先检查该关卡是否真的调用了 `velXPropagationEntry()`。

#### E. head-push 关系是“额外维护层”，不是纯碰撞天然产物

普通 standing 多数来自 resolver + responder。

但 head-push 关系还有一层 `maintainHeadPushSupportRelations()` 的补建逻辑。改这块时要同时考虑：

- responder 已经写入了什么
- collision pass 结束后还会不会被补写
- `_supportingType` 是否已经被占用

#### F. `_lastFrameDeltaX` 是一个补偿字段

`box` 的某些位移来自 resolver 直接改位置，而不是改 `velX`。所以 `CollisionSystem` 会在帧末记录：

```js
dyn._lastFrameDeltaX = dyn.x - dyn.prevX;
```

如果你把这段删掉或改时机，支撑链上传播的水平位移就可能失真。

#### G. 运行时切换 `colliderType` 时要记得重新分区

系统里已经有按钮平台联动把平台从 `STATIC` 切成 `TRIGGER` 的做法。凡是动态改 `colliderType` 的功能，都要确保碰撞系统下一帧重新分区，否则逻辑会落在错误分组里。

## 6. 推荐阅读顺序

如果是第一次接手这套系统，建议按下面顺序阅读：

1. `js/level-design/BaseLevel.js`
2. `js/physics-system/PhysicsSystem.js`
3. `js/collision-system/CollisionSystem.js`
4. `js/collision-system/resolverMap.js`
5. `js/collision-system/responderMap.js`
6. `js/collision-system/detectorMap.js`

这样会先建立主循环和职责边界，再看几何修正，最后看语义响应，理解成本最低。
