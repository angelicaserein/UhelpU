# 用户自制关卡系统文档

## 系统概述与架构

用户自制关卡系统允许玩家在编辑器中创建关卡，导出为 JSON 格式，上传到 Firebase，供其他玩家下载和游玩。

**完整数据流程：**

```
编辑器编辑 → ExportJSON → Firebase上传 → 获取列表 → 下载JSON → 解析为关卡对象 → 运行关卡
```

### 系统特点

- **完全客户端驱动**：所有解析、渲染、物理计算都在浏览器中进行
- **支持多房间**：一个关卡可以包含多个房间，玩家可以左右移动切换
- **支持复杂机制**：按钮联动、传送门、平台等机制可通过 JSON 表示
- **Firebase REST API**：使用 Firestore REST 接口，无需 SDK

---

## 相关文件列表与职责

| 文件路径                                              | 职责描述                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `js/user-levels/LevelParser.js`                       | `UserLevel` 类，运行时将 JSON 解析为可运行的关卡实例                           |
| `js/develop-mode/EditorExporter.js`                   | `EditorExporter` 类，提供 `generateJSON()` 方法将编辑器数据导出为 JSON         |
| `js/utils/firebase-init.js`                           | Firebase 操作函数：`uploadUserLevel()`、`getUserLevelList()`、`getUserLevel()` |
| `js/ui/pages/static-pages/StaticPageUserLevelList.js` | 用户关卡列表页面，显示所有可下载的关卡                                         |
| `js/AppCoordinator.js`                                | 应用协调器，处理用户关卡的加载和生命周期                                       |
| `js/level-design/LevelManager.js`                     | `loadLevelInstance()` 方法，加载预实例化的关卡对象                             |

---

## 完整数据流程

### 1. 编辑阶段（编辑器）

- 编辑器记录所有放置的实体和系统
- 通过 `EditorEntityManager` 维护 `PlacedRecord[]` 数组

### 2. 导出阶段（EditorExporter.js）

- `EditorExporter.generateJSON(records, roomCount, canvasWidth, canvasHeight, spawn, meta)`
- 生成 JSON 字符串，包含元信息、生成时间戳、所有实体数据
- 对于多房间关卡，计算每个实体属于哪个房间

### 3. 上传阶段（firebase-init.js）

- `uploadUserLevel(levelJSON, authorName, title)`
- 解析 JSON 获取 `meta.id`
- 以 PATCH 方式上传到 `firestore/userLevels/{levelId}`

### 4. 列表显示（StaticPageUserLevelList.js）

- 页面进入时调用 `getUserLevelList()`
- 获取所有关卡的元信息（id、title、authorName、createdAt）
- 支持搜索（按标题或作者名）

### 5. 下载阶段（AppCoordinator.js）

- 用户点击关卡时触发 `LOAD_LEVEL` 事件
- `getUserLevel(levelId)` 获取完整 JSON 字符串

### 6. 解析阶段（LevelParser.js）

- `new UserLevel(p, eventBus, levelData)` 创建关卡实例
- 解析 JSON 为游戏实体对象
- 初始化所有系统（按钮、传送门等）

### 7. 运行阶段（LevelManager.js）

- `loadLevelInstance(userLevel, p, options)` 加载关卡
- 进入游戏循环

---

## JSON 格式规范

### 完整结构示例

```json
{
  "meta": {
    "id": "level_1718000000000",
    "title": "我的第一个关卡",
    "authorName": "张三",
    "createdAt": "2024-06-10T12:00:00.000Z"
  },
  "roomCount": 2,
  "canvasWidth": 1366,
  "canvasHeight": 768,
  "spawn": {
    "x": 50,
    "y": 450,
    "w": 40,
    "h": 40
  },
  "entities": [
    // ... 实体数组
  ],
  "rooms": [
    // ... 仅多房间关卡时存在
  ]
}
```

### 字段详解

#### meta（元信息）

| 字段         | 类型   | 说明                               |
| ------------ | ------ | ---------------------------------- |
| `id`         | string | 关卡唯一ID，格式 `level_` + 时间戳 |
| `title`      | string | 关卡标题，显示在列表中             |
| `authorName` | string | 作者名称                           |
| `createdAt`  | string | ISO 格式时间戳                     |

#### 布局配置

| 字段           | 类型   | 默认值                    | 说明                            |
| -------------- | ------ | ------------------------- | ------------------------------- |
| `roomCount`    | number | 1                         | 房间数，1 为单房间，>1 为多房间 |
| `canvasWidth`  | number | 1366                      | 每个房间宽度（像素）            |
| `canvasHeight` | number | 768                       | 画布高度（像素）                |
| `spawn`        | object | {x:50, y:450, w:40, h:40} | 玩家出生点位置和大小            |

#### entities（实体数组）

所有放置的游戏对象。见下一章节。

#### rooms（房间数组，仅多房间关卡）

```json
[
  {
    "roomIndex": 0,
    "entityIndices": [0, 1, 2, 5] // 该房间包含的实体在 entities 中的索引
  },
  {
    "roomIndex": 1,
    "entityIndices": [3, 4, 6, 7]
  }
]
```

---

## 支持的实体类型和参数

### 基础实体

#### Ground（地面）

```json
{
  "type": "Ground",
  "x": 0,
  "y": 688,
  "w": 1366,
  "h": 80
}
```

#### Wall（墙）

```json
{
  "type": "Wall",
  "x": -100,
  "y": 0,
  "w": 120,
  "h": 768
}
```

系统自动添加左右边界墙。

#### Platform（平台）

```json
{
  "type": "Platform",
  "x": 300,
  "y": 500,
  "w": 150,
  "h": 30
}
```

#### Box（木箱）

```json
{
  "type": "Box",
  "x": 400,
  "y": 600,
  "w": 40,
  "h": 40
}
```

#### Spike（尖刺）

```json
{
  "type": "Spike",
  "x": 200,
  "y": 650,
  "w": 100,
  "h": 20
}
```

#### Portal（传送门）

```json
{
  "type": "Portal",
  "x": 500,
  "y": 300,
  "w": 50,
  "h": 50,
  "open": true // true: 已打开，false: 未打开
}
```

#### Checkpoint（存档点）

```json
{
  "type": "Checkpoint",
  "x": 100,
  "y": 600,
  "w": 40,
  "h": 70
}
```

#### TeleportPoint（传送点）

```json
{
  "type": "TeleportPoint",
  "x": 200,
  "y": 600,
  "w": 40,
  "h": 70
}
```

#### TextPrompt（文字提示）

```json
{
  "type": "TextPrompt",
  "x": 300,
  "y": 400,
  "w": 40,
  "h": 40,
  "text": "提示内容的 i18n key"
}
```

#### Enemy（敌人）

```json
{
  "type": "Enemy",
  "x": 400,
  "y": 600,
  "w": 40,
  "h": 40,
  "speed": 2,
  "direction": 1 // 1: 向右，-1: 向左
}
```

### 复合系统

#### BtnSpike（按钮+尖刺）

```json
{
  "type": "BtnSpike",
  "button": {
    "x": 100,
    "y": 650,
    "w": 34,
    "h": 16
  },
  "spike": {
    "x": 200,
    "y": 650,
    "w": 100,
    "h": 20
  },
  "colorIndex": 0 // 按钮颜色索引 0-3
}
```

**工作原理**：玩家踩踏按钮时，尖刺切换开关状态。

#### WirePortal（按钮+传送门+连线）

```json
{
  "type": "WirePortal",
  "button": {
    "x": 100,
    "y": 650,
    "w": 34,
    "h": 16
  },
  "portal": {
    "x": 500,
    "y": 300,
    "w": 50,
    "h": 50
  },
  "colorIndex": 0
}
```

**工作原理**：玩家踩踏按钮时，传送门打开。松开时关闭。

#### BtnPlatform（按钮+平台）

```json
{
  "type": "BtnPlatform",
  "button": {
    "x": 100,
    "y": 650,
    "w": 34,
    "h": 16
  },
  "platforms": [
    {
      "x": 300,
      "y": 400,
      "w": 160,
      "h": 30,
      "mode": "disappear" // "disappear" 或 "appear"
    },
    {
      "x": 500,
      "y": 350,
      "w": 160,
      "h": 30,
      "mode": "disappear"
    }
  ],
  "colorIndex": 0
}
```

**工作原理**：

- `"mode": "disappear"`：按钮按下时平台消失，松开时出现
- `"mode": "appear"`：按钮按下时平台出现，松开时消失

---

## Firebase 数据结构

### Firestore 集合

#### userLevels

存储所有用户自制关卡的主集合。

**文档 ID**: `{levelId}` （例如 `level_1718000000000`）

**字段**：
| 字段 | 类型 | 说明 |
|-----|------|------|
| `id` | string | 关卡 ID（冗余字段） |
| `title` | string | 关卡标题 |
| `authorName` | string | 作者名 |
| `createdAt` | string | 创建时间（ISO格式） |
| `levelData` | string | 完整的 JSON 字符串 |

**API 操作**：

- **上传/更新**：`PATCH /userLevels/{levelId}`
- **获取列表**：`GET /userLevels?pageSize=100`
- **获取单个**：`GET /userLevels/{levelId}`
- **删除**：`DELETE /userLevels/{levelId}`（需权限验证）

---

## 单房间与多房间实现差异

### 单房间关卡（roomCount = 1）

**解析过程**（LevelParser.js `_parseEntitiesSingleRoom`）：

1. 添加左右边界墙
2. 添加地面
3. 逐个添加用户放置的实体

**特点**：

- 所有实体直接添加到 `this.entities`
- 无需计算世界偏移
- 无房间切换逻辑

**JSON 示例**：

```json
{
  "roomCount": 1,
  "entities": [...]
  // 无 rooms 字段
}
```

### 多房间关卡（roomCount > 1）

**解析过程**（LevelParser.js `_parseEntitiesMultiRoom`）：

1. 创建 `Room` 对象数组，每个 Room 包含自己的实体集
2. 为每个房间添加边界和地面
3. 根据 `rooms` 数组将实体分配到对应房间
4. 调用 `_applyWorldOffsetsToRooms()` 应用世界偏移：
   - 房间 0 的实体 x 坐标 += 0
   - 房间 1 的实体 x 坐标 += canvasWidth
   - 房间 N 的实体 x 坐标 += N \* canvasWidth
5. 配置房间的左右出口

**房间切换**（LevelParser.js `_checkRoomTransition`）：

- 监控玩家 x 坐标
- 当玩家超越房间边界时触发房间切换
- 260ms 过渡动画（easeOutCubic）

**JSON 示例**：

```json
{
  "roomCount": 2,
  "canvasWidth": 1366,
  "entities": [
    { "type": "Platform", "x": 300, "y": 400, ... },   // 房间0
    { "type": "Platform", "x": 1800, "y": 400, ... },  // 房间1 (1366+434)
    { "type": "Spike", "x": 600, "y": 650, ... }       // 房间0
  ],
  "rooms": [
    { "roomIndex": 0, "entityIndices": [0, 2] },
    { "roomIndex": 1, "entityIndices": [1] }
  ]
}
```

---

## 关键的顺序约束

### 1. ButtonPlatformLinkSystem 必须在 initSystems 之后

**原因**：`ButtonPlatformLinkSystem` 需要 `collisionSystem` 引用。

**代码位置**（LevelParser.js，第 58-61 行）：

```javascript
this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
// collisionSystem 现在可用

this._parseBtnPlatformSystems(levelData); // 在这里创建 ButtonPlatformLinkSystem
```

**违反后果**：平台的碰撞检测失效，玩家无法踩踏平台。

### 2. WirePortal 系统必须在应用世界偏移之后

**原因**：按钮和传送门的位置需要包含世界偏移，以便在多房间关卡中正确计算。

**代码位置**（LevelParser.js，第 62-64 行）：

```javascript
this._applyWorldOffsetsToRooms(canvasWidth, canvasHeight, roomCount);
// 世界偏移已应用

this._createWirePortalSystems(levelData); // 在这里创建 BtnWirePortalSystem
```

**违反后果**：多房间关卡中，传送门和按钮的连线位置不正确。

### 3. 玩家必须在 initSystems 之前创建

**代码位置**（LevelParser.js，第 54-58 行）：

```javascript
this._createPlayer(levelData);
// 玩家现在可用

this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
```

**违反后果**：系统无法初始化物理引擎。

---

## 页面流程：StaticPageUserLevelList 生命周期

### 进入页面（enter）

1. 创建"＋ 创建地图"按钮 → 加载 `emptyEditor` 关卡
2. 创建搜索框
3. 创建可滚动列表容器
4. 显示加载中提示
5. 注册语言变化监听
6. 异步调用 `_fetchLevels()`

### 获取关卡列表（\_fetchLevels）

1. 调用 `window.getUserLevelList()`
2. 获取所有关卡的元信息数组
3. 设置 `_isLoaded = true`
4. 调用 `_renderCards()`

### 渲染卡片（\_renderCards）

1. 读取搜索框内容
2. 过滤关卡列表（按标题或作者名搜索）
3. 为每个关卡创建 DOM 元素（卡片）
4. 绑定鼠标悬停样式
5. 绑定点击事件 → 发布 `LOAD_LEVEL` 事件

### 点击关卡

1. 触发 `eventBus.publish(EventTypes.LOAD_LEVEL, { levelType: "user", levelId })`
2. AppCoordinator 接收事件
3. 调用 `window.getUserLevel(levelId)` 下载 JSON
4. 创建 `new UserLevel(...)` 实例
5. 加载到游戏

### 退出页面（exit）

1. 移除 wheel 事件监听
2. 移除语言变化监听
3. 清理 DOM 元素

---

## AppCoordinator 中用户关卡处理逻辑

### 关键变量

```javascript
this._currentLevelType = null; // "normal" 或 "user"
this._currentUserLevelId = null; // 用户关卡 ID
```

### LOAD_LEVEL 事件处理

```javascript
if (loadRequest?.levelType === "user" || this._currentLevelType === "user") {
  const levelId = loadRequest?.levelId || this._currentUserLevelId;

  // 异步获取 JSON
  window.getUserLevel(levelId).then((levelJSON) => {
    const levelData = JSON.parse(levelJSON);
    const userLevel = new UserLevel(this.p, this.eventBus, levelData);

    // 加载并播放
    this.levelManager.loadLevelInstance(userLevel, this.p, options);
    this._currentLevelType = "user";
    this._currentUserLevelId = levelId;
  });
}
```

### 死亡重载（关卡结果）

```javascript
if (this._currentLevelType === "user") {
  this.levelManager.setPaused(true);
  const resultPage = new StaticPageResultDemo2(result, "user_level", ...);
  this.switcher.setOverlay(resultPage, this.p);
  return;
}
```

### 返回关卡选择

```javascript
if (this._currentLevelType === "user") {
  this._currentLevelType = null;
  this._currentUserLevelId = null;
  this.switcher.staticSwitcher.showUserLevelList(this.p); // 返回列表
}
```

---

## LevelManager.loadLevelInstance 方法

**签名**：

```javascript
loadLevelInstance(levelInstance, (p = this.p), (options = {}));
```

**参数**：

- `levelInstance`: 已实例化的关卡对象（通常是 `UserLevel`）
- `p`: p5 实例
- `options.startCheckpoint`: 可选，从某个检查点开始

**逻辑**：

1. 检查是否已有关卡在运行
2. 设置关卡实例为当前关卡
3. 设置 `currentLevelIndex` 为 `levelInstance.levelId || "user_level"`
4. 重置死亡重载标志
5. 重置检查点系统
6. 启动关卡标题叠加层
7. 如果提供 `startCheckpoint`，恢复到该检查点

---

## 已知限制

### 不支持的功能

1. **NPC 文案**
   - `NPCDemo2` 实体虽然在编辑器中可放置，但 JSON 格式中无法存储对话内容
   - `dialogueLines` 字段为空数组
   - 玩家无法与 NPC 交互

2. **KeyPrompt 机制**
   - 用户自制关卡不支持按键提示机制
   - 仅支持文字提示（TextPrompt）

3. **自定义音效**
   - 用户自制关卡只能使用全局背景音乐
   - 无法指定关卡特定的音效

4. **高级渲染效果**
   - 无视差卷轴设置
   - 无自定义背景图片

5. **脚本和自定义逻辑**
   - 关卡数据是纯数据格式，无法执行自定义代码
   - 机制限于预定义的按钮系统

---

## UserLevel / LevelParser API 速查

### UserLevel（`js/user-levels/LevelParser.js`）

| API                                     | 说明                                               |
| --------------------------------------- | -------------------------------------------------- |
| `new UserLevel(p, eventBus, levelData)` | 将 JSON 数据解析成可运行关卡                       |
| `updatePhysics()`                       | 每帧更新机制系统与房间切换（继承并扩展 BaseLevel） |
| `draw(p)`                               | 每帧渲染关卡实体与过渡动画                         |
| `clearLevel(p, eventBus)`               | 清理实体、系统、监听，避免切图后残留               |

### LevelParser 核心内部流程

| 方法                                  | 职责                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| `_parseEntities(levelData)`           | 根据 `roomCount` 分发到单房间/多房间解析                |
| `_createEntity(entityData)`           | 依据 `type` 创建运行时实体                              |
| `_parseBtnPlatformSystems(levelData)` | 构建 `ButtonPlatformLinkSystem`（依赖 collisionSystem） |
| `_createWirePortalSystems(levelData)` | 构建 `BtnWirePortalSystem`（要求世界偏移已完成）        |
| `_applyWorldOffsetsToRooms(...)`      | 将各房间坐标映射到世界坐标                              |

---

## 支持类型白名单（运行时）

`UserLevel._createEntity()` 当前支持以下 `type`：

- `Ground`
- `Wall`
- `Platform`
- `Box`
- `Spike`
- `Portal`
- `Checkpoint`（运行时映射为 `CheckpointDemo2`）
- `TeleportPoint`
- `TextPrompt`
- `Enemy`
- `BtnSpike`
- `WirePortal`
- `BtnPlatform`

> 说明：不在此白名单中的 `type` 会被忽略，不会生成实体。

对应机制系统：

- `ButtonSpikeLinkSystem`
- `BtnWirePortalSystem`
- `ButtonPlatformLinkSystem`

---

## JSON 校验建议（上传前）

建议在 `uploadUserLevel()` 前做最小校验，避免非法数据进入 Firestore。

必检项：

1. `meta.id/title/authorName` 非空，`title` 长度受限（建议 <= 40）
2. `roomCount` 为正整数，且与 `rooms.length` 一致（多房间时）
3. `entities` 为数组，且每项 `type` 在白名单内
4. 坐标/尺寸字段均为有限数值，宽高必须 > 0
5. `rooms[].entityIndices` 不越界、不重复
6. 复合结构合法：

- `BtnSpike` 必须同时有 `button` 与 `spike`
- `WirePortal` 必须同时有 `button` 与 `portal`
- `BtnPlatform` 必须有非空 `platforms`，且每项 `mode` 为 `appear|disappear`

---

## 安全与性能建议

### 安全

1. 前端不得信任下载到的 `levelData`，必须先校验再 `new UserLevel(...)`
2. Firestore 规则需限制写入字段，避免任意字段注入
3. 标题/作者名渲染到 DOM 前应进行转义或使用安全文本接口（避免 XSS）

### 性能

1. 建议限制单关实体总数（例如 <= 500）
2. 建议限制 `roomCount`（例如 <= 10）
3. 对超大关卡分页显示或延迟加载，避免列表页首屏阻塞
4. 对 `getUserLevelList()` 增加分页参数，避免一次拉取全部文档

---

## 开发日志

### 实现过程中遇到的问题与解决方案

#### 问题 1：多房间关卡中，BtnWirePortal 系统位置计算错误

**症状**：传送门和按钮的连线不对齐，特别是在房间 1 及之后

**根本原因**：`BtnWirePortalSystem` 在应用世界偏移之前创建，导致系统引用的位置是未偏移的坐标

**解决方案**：

- 在 `_parseEntities` 中，先解析实体但暂不创建系统（存储到 `_pendingWirePortals`）
- 在 `_applyWorldOffsetsToRooms` 之后，调用 `_createWirePortalSystems` 创建系统
- 系统此时引用的是已偏移的坐标

**相关代码**（LevelParser.js，第 345-351 行）：

```javascript
case "WirePortal": {
  const wireRenderer = new WireRenderer(null);
  this._pendingWirePortals = this._pendingWirePortals || [];
  this._pendingWirePortals.push({ button, portal, wireRenderer, entityData });
  return [button, portal, wireRenderer];
}
```

#### 问题 2：ButtonPlatformLinkSystem 创建时 collisionSystem 不可用

**症状**：平台踩踏检测失效，玩家穿过平台

**根本原因**：`collisionSystem` 由 `initSystems()` 创建，但之前尝试创建 `ButtonPlatformLinkSystem`

**解决方案**：

- 在 `initSystems()` 之后再创建平台系统
- 平台系统需要通过构造函数接收 `collisionSystem` 参数

**相关代码**（LevelParser.js，第 408-411 行）：

```javascript
const system = new ButtonPlatformLinkSystem(
  { button, platforms: platformConfigs },
  this.collisionSystem, // 现在可用
  { startColorIndex: entityData.colorIndex ?? 0 },
);
```

#### 问题 3：单房间关卡中，多个系统的创建顺序

**症状**：不同系统之间可能相互干扰

**根本原因**：各系统依赖关系的顺序没有清晰定义

**解决方案**：

- `ButtonSpikeLinkSystem` 和 `BtnWirePortalSystem` 可在 `initSystems` 之前或之后创建
- `ButtonPlatformLinkSystem` 必须在 `initSystems` 之后
- 在 `updatePhysics()` 中统一更新所有系统

#### 问题 4：关卡卸载时，平台系统残留导致后续关卡异常

**症状**：切换关卡后，按钮仍然响应，或平台重复出现

**根本原因**：系统对象没有被正确清理

**解决方案**：

- `BaseLevel.clearLevel()` 负责清理所有实体和系统
- 确保 `this.entities` 被完全清空
- 系统对象（`_bpSystems`, `_wpSystems`, `_bsSystems`）也被清空

#### 问题 5：多房间关卡的房间切换动画与物理引擎不同步

**症状**：动画未完成时物理已计算，导致画面闪烁

**原因**：房间切换时应暂停物理更新

**解决方案**：

- 在 `_transition` 存在时（未完成）跳过物理更新
- 在 `updateCollision()` 中检查转换状态
- 仅在转换完成后恢复物理

**相关代码**（LevelParser.js，第 602-608 行）：

```javascript
if (this._transition) {
  this._updateTransition(p);
  return; // 跳过房间检查
}
```

---

## 相关接口文档链接

- Firebase Firestore REST API：https://cloud.google.com/firestore/docs/reference/rest
- p5.js 文档：https://p5js.org/reference/
- 关卡设计系统（BaseLevel）：见 `js/level-design/BaseLevel.js`
- 事件系统（EventBus）：见 `js/event-system/EventBus.js`
