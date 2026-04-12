# 导入关卡编辑器数据 - Easy/Hard 专用版

## ✅ 适用范围

这份导入规则**只用于 `easy/` 和 `hard/` 目录下的关卡**。

- 你现在不会往 `demo1/` 里导入关卡
- 因此只考虑 **Demo2 体系**
- **带 `Demo2` 后缀的实体就是当前最新版本**
- 如果某个实体存在 Demo1 / Demo2 两套版本，**在 easy / hard 里一律用 Demo2 版本**

## ✅ 百分百不出bug的导入流程

**核心原则：** 在 `easy/` 和 `hard/` 关卡里，如果某个实体有 Demo1 和 Demo2 两个版本，**必须用 Demo2 版本**。

---

## 第 1 步：导入语句

只导入你**需要用到**的实体：

```javascript
import {
  Player,
  Ground,
  Wall,
  // 下面按需要导入
  Spike,
  Portal,
  Button,
  NPCDemo2, // ⚠️ 有 Demo1/Demo2 → 用 Demo2
  CheckpointDemo2, // ⚠️ 有 Demo1/Demo2 → 用 Demo2
  SignboardDemo2, // ⚠️ 有 Demo1/Demo2 → 用 Demo2
  Platform,
  TeleportPoint,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
// 按需导入系统
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
```

---

## 第 2 步：构造函数基础设置

```javascript
export class LevelX extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    // 总是添加左右墙壁和顶部地面
    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    // ──────── 下面按编辑器数据添加实体 ────────
```

---

## 第 3 步：实体导入规则（必按需要选择）

### ✅ Spike（地刺）- 无版本区分

```javascript
this.entities.add(new Spike(x, y, width, height));
```

### ✅ Platform（平台）- 无版本区分

```javascript
this.entities.add(new Platform(x, y, width, height));
```

### ✅ Portal（传送门）- 无版本区分

```javascript
const portal = new Portal(x, y, width, height);

// 判断逻辑：
// - 如果编辑器注释说"按钮驱动"（如 BtnWirePortalSystem）→ 不调用 openPortal()
// - 如果没有注释或说"常开" → 调用 openPortal()

portal.openPortal(); // 常开传送门
this.entities.add(portal);
```

### ✅ Button（按钮）- 无版本区分

**单独使用：**

```javascript
const btn = new Button(x, y, width, height);
this.entities.add(btn);
```

### ✅ NPCDemo2（NPC）- Easy/Hard 中统一使用最新 Demo2 版本

```javascript
this.entities.add(
  new NPCDemo2(x, y, width, height, {
    getPlayer: () => this._player,
    eventBus: this.eventBus,
    npcId: "easy_levelX_npc", // 唯一 ID
    dialogueLines: ["key1", "key2"], // 2 行对话
    exhaustedLine: "key_exhausted", // 重复对话完后的话
  }),
);
```

### ✅ CheckpointDemo2（检查点 Demo2）- Easy/Hard 中统一使用最新 Demo2 版本

```javascript
this.entities.add(new CheckpointDemo2(x, y, width, height, () => this._player));
```

### ✅ Checkpoint（检查点 - 标准版）- 需要 getPlayer 回调

```javascript
this.entities.add(new Checkpoint(x, y, width, height, () => this._player));
```

**⚠️ 必须传递 `() => this._player` 参数，否则 Checkpoint 无法正确显示！**

### ✅ SignboardDemo2（告示板）- Easy/Hard 中统一使用最新 Demo2 版本

```javascript
this.entities.add(
  new SignboardDemo2(x, y, width, height, () => this._player, this.eventBus, {
    textKey: "easy_signboard_level1_front",
    onTutorialClick: () => {
      /* 可选 */
    },
    tutorialButtonTextKey: "easy_signboard_tutorial",
  }),
);
```

### ✅ TeleportPoint（传送点）- 无版本区分，需要 getPlayer 回调

```javascript
this.entities.add(new TeleportPoint(x, y, width, height, () => this._player));
```

**⚠️ 必须传递 `() => this._player` 参数，否则 TeleportPoint 无法正确显示交互提示！**

---

## 第 4 步：系统导入（按需）

### ✅ 先判断：这是单房间还是多房间

在导入之前，先看编辑器导出注释里有没有这种信息：

```javascript
// 房间数量: 2
//   Room 0: x ∈ [0, 1366)
//   Room 1: x ∈ [1366, 2732)
```

**如果只有 1 个房间：**

- 直接按普通 `BaseLevel` 写法导入即可
- 左右墙通常是 `x=0` 和 `x=1346`
- 绝大多数 easy/hard 单屏关卡都可以用本文前面的简单模板

**如果有 2 个或更多房间：**

- **不要**再用单房间模板硬塞所有实体
- 应该改成 `Room` 结构
- 每个房间内部都写**本房间局部坐标**
- 第二个房间及以后，通常要把 `world_x - 1366 * roomIndex` 转成房间内坐标
- 之后再统一调用 `_applyWorldOffsetsToRooms(p)` 把实体平移回世界坐标
- 同时要补 `_getCameraX()`、`updateCollision()` 里的切房逻辑、以及 `clearCanvas()` 的多屏背景绘制

**一句话判断：**

- 导出里只出现 `Room 0` → 用单房间模板
- 导出里出现 `Room 1 / Room 2 / ...` → 用多房间模板

### ✅ ButtonSpikeLinkSystem（按钮-地刺联动）

```javascript
// 系统 1
const bsBtn_0 = new Button(x1, y1, w1, h1);
const bsSpike_0 = new Spike(x2, y2, w2, h2);
this._bsSys_0 = new ButtonSpikeLinkSystem(
  { button: bsBtn_0, spikes: [bsSpike_0] },
  { startColorIndex: 0 }, // 颜色：0=红, 1=蓝, 2=绿, 3=紫, 4=橙, 5=青, 6=黄, 7=粉
);
this.entities.add(bsBtn_0);
this.entities.add(bsSpike_0);

// 系统 2（可选，如果有的话）
const bsBtn_1 = new Button(x3, y3, w3, h3);
const bsSpike_1 = new Spike(x4, y4, w4, h4);
this._bsSys_1 = new ButtonSpikeLinkSystem(
  { button: bsBtn_1, spikes: [bsSpike_1] },
  { startColorIndex: 1 },
);
this.entities.add(bsBtn_1);
this.entities.add(bsSpike_1);
```

### ✅ BtnWirePortalSystem（按钮-传送门联动）

```javascript
const wpBtn = new Button(x1, y1, w1, h1);
const wpPortal = new Portal(x2, y2, w2, h2);
// ⚠️ 不调用 openPortal() —— 系统会控制打开/关闭
this._wpSys = new BtnWirePortalSystem({
  button: wpBtn,
  portal: wpPortal,
});
this.entities.add(wpBtn);
this.entities.add(wpPortal);
```

**在当前仓库里，推荐再加一个 `WireRenderer`：**

```javascript
import { WireRenderer } from "../../game-entity-model/index.js";

this.entities.add(new WireRenderer(this._wpSys));
```

这样通常**不需要自己写 `draw()` 来画电线**。

**⚠️ 多房间关卡额外注意：**

- `BtnWirePortalSystem` constructor 会根据按钮和传送门当前位置缓存电线路径
- 所以如果你是 `Room` 多房间写法，**必须先做房间坐标偏移，再创建 `BtnWirePortalSystem`**
- 否则按钮和传送门已经被平移了，但电线路径还是旧坐标，电线会画错位置

---

## 第 5 步：玩家和系统初始化（必须）

```javascript
    this._player = new Player(px, py, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
  }
```

**⚠️ 关键：这条规则要分开理解，不能混为一谈。**

- `ButtonPlatformLinkSystem`：**必须**在 `initSystems()` 之后创建，因为它真的需要 `this.collisionSystem`
- `BtnWirePortalSystem`：**不依赖** `collisionSystem`，所以**不一定**要等 `initSystems()` 之后
- 但是如果是**多房间关卡**，`BtnWirePortalSystem` 仍然要在 `_applyWorldOffsetsToRooms(p)` 之后创建，否则电线路径会错

所以正确理解是：

- **因为 collisionSystem 必须晚创建** → 影响的是 `ButtonPlatformLinkSystem`
- **因为 wirePath 会缓存当前坐标** → 影响的是多房间里的 `BtnWirePortalSystem`

正确顺序：

```javascript
export class LevelX extends BaseLevel {
  constructor(p, eventBus) {
    // ... 基础设置 ...

    // 1️⃣ 添加基础实体（非系统相关）
    this.entities.add(new Ground(...));
    this.entities.add(new Spike(...));
    this.entities.add(new Platform(...));

    // 2️⃣ 添加玩家
    this._player = new Player(...);
    this.entities.add(this._player);

    // 3️⃣ 初始化系统（此时 this.collisionSystem 被创建）
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // 4️⃣ 创建 ButtonPlatformLinkSystem（现在 collisionSystem 已有效）
    const bpBtn = new Button(...);
    const bpPlat = new Platform(...);
    this._bpSys = new ButtonPlatformLinkSystem(
      { button: bpBtn, platforms: [...] },
      this.collisionSystem,  // ✅ 现在有效
      { startColorIndex: 0 }
    );
    this.entities.add(bpBtn);
    this.entities.add(bpPlat);
  }
}
```

**多房间里 `BtnWirePortalSystem` 的正确顺序：**

```javascript
export class LevelX extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);

    this.rooms = this._buildRooms(p);
    this._applyWorldOffsetsToRooms(p); // 1️⃣ 先把房间局部坐标平移成世界坐标

    // 2️⃣ 再创建按钮-传送门系统，否则电线路径会缓存错坐标
    this._wpSys_0 = new BtnWirePortalSystem({
      button: this._wpBtn_0,
      portal: this._wpPortal_0,
    });

    this._player = new Player(...);
    this.entities = this._buildEntities();
    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
  }
}
```

---

## 第 6 步：更新物理（按需）

**只更新你使用过的系统：**

```javascript
  updatePhysics() {
    super.updatePhysics();

    // 按需调用系统的 update()
    this._bsSys_0?.update();
    this._bsSys_1?.update();
    this._wpSys?.update();
  }
```

---

## 第 7 步：渲染系统（按需）

**如果有系统需要自定义绘制效果（如平台轮廓等），需要添加 `draw()` 方法：**

```javascript
  draw(p) {
    // 第1步：必须先调用 super.draw(p) 来绘制所有实体
    //        否则按钮、尖刺等元素会消失！
    super.draw(p);

    // 第2步：然后绘制系统的特殊效果
    this._bsSys_0?.draw?.(p);
    this._wpSys?.draw?.(p);
    this._bpSys_0?.draw?.(p);
  }
```

**重点：**

- ✅ `ButtonPlatformLinkSystem` — 需要 `draw()` 绘制平台轮廓
- ✅ `BtnWirePortalSystem` — **优先用 `WireRenderer`**；只有你不用 `WireRenderer` 时，才自己写 `draw()`
- ❌ `ButtonSpikeLinkSystem` — 不需要 `draw()` (尖刺自动渲染)

**当前仓库推荐写法：**

```javascript
import {
  Button,
  Portal,
  WireRenderer,
} from "../../game-entity-model/index.js";

const wpBtn = new Button(...);
const wpPortal = new Portal(...);
this._wpSys = new BtnWirePortalSystem({ button: wpBtn, portal: wpPortal });
this.entities.add(wpBtn);
this.entities.add(wpPortal);
this.entities.add(new WireRenderer(this._wpSys));
```

**如果没有这些系统，就不需要添加 `draw()` 方法。**

---

## 第 8 步：多房间关卡专用规则（很重要）

如果编辑器导出里写了多个房间，除了实体本身，你还要补下面这些结构：

### ✅ 1. 引入 `Room`

```javascript
import { Room } from "../Room.js";
```

### ✅ 2. 用 `_buildRooms(p)` 返回房间数组

```javascript
this.rooms = this._buildRooms(p);
```

每个 `Room` 里只放该房间自己的实体，并配置出口：

```javascript
const room0 = new Room([...], { right: { targetRoomIndex: 1 } });
const room1 = new Room([...], { left: { targetRoomIndex: 0 } });
return [room0, room1];
```

### ✅ 3. 对所有房间实体做世界坐标偏移

```javascript
_applyWorldOffsetsToRooms(p) {
  for (let i = 0; i < this.rooms.length; i++) {
    const offsetX = i * p.width;
    for (const entity of this.rooms[i].entities) {
      entity.x += offsetX;
    }
  }
}
```

### ✅ 4. 统一构建 `entities`

```javascript
_buildEntities() {
  const set = new Set();
  for (const room of this.rooms) {
    for (const entity of room.entities) set.add(entity);
  }
  set.add(this._player);
  return set;
}
```

### ✅ 5. 添加切房逻辑

至少要有：

- `_checkRoomTransition(p)`
- `_switchRoom(roomIndex, direction)`
- `_getCameraX(p)`
- `updateCollision()` 里在碰撞后检查切房

### ✅ 6. `draw()` 里按 cameraX 平移

```javascript
draw(p = this.p) {
  const cameraX = this._getCameraX(p);
  p.push();
  p.translate(-cameraX, 0);
  super.draw(p);
  p.pop();
}
```

### ✅ 7. `clearCanvas()` 也要按房间数量画背景

否则玩家切到第二个房间时，背景可能只显示第一屏。

---

## ⚠️ 重要提醒

| 情况                                       | 做法                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| **没有某个系统**                           | 就不导入、不创建、不调用 `update()`                                      |
| **没有 Checkpoint**                        | 删除 Checkpoint/CheckpointDemo2 导入和创建代码                           |
| **Checkpoint 不显示**                      | 检查是否传了 `() => this._player` 参数                                   |
| **TeleportPoint 不显示**                   | 检查是否传了 `() => this._player` 参数                                   |
| **没有 NPC**                               | 删除 NPCDemo2 导入和创建代码                                             |
| **没有按钮-地刺系统**                      | 删除 ButtonSpikeLinkSystem 导入和创建代码                                |
| **Portal 常开**                            | 调用 `portal.openPortal()`                                               |
| **Portal 按钮驱动**                        | 不调用 `openPortal()`                                                    |
| **在 easy/hard 中有 Demo1/Demo2 两个版本** | **必须用 Demo2（最新版本）**                                             |
| **使用 ButtonPlatformLinkSystem**          | **必须在 initSystems() 之后创建，否则 collisionSystem 为 undefined**     |
| **多房间里使用 BtnWirePortalSystem**       | **必须在 `_applyWorldOffsetsToRooms(p)` 之后创建，否则电线路径坐标错误** |
| **多房间导入**                             | **必须补 `Room`、camera、切房逻辑，不是只把 x 写大就行**                 |
| **BtnWirePortalSystem 画电线**             | **优先加 `WireRenderer`，通常比手写 `draw()` 更稳**                      |
| **NPC / Signboard 文案**                   | **优先用 i18n key，不要长期写死字符串**                                  |

---

## 🐛 常见错误排查

| 错误                                             | 原因                                                                                 | 修复                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Checkpoint不自动激活                             | 用了 `Checkpoint`                                                                    | 改为 `CheckpointDemo2`                                           |
| Checkpoint/TeleportPoint 不显示                  | 没传 `() => this._player` 参数                                                       | 添加参数：`new Checkpoint(x, y, w, h, () => this._player)`       |
| NPC不显示                                        | 用了 `NPC`                                                                           | 改为 `NPCDemo2`                                                  |
| Signboard不显示                                  | 用了 `SignboardDemo1`                                                                | 改为 `SignboardDemo2`                                            |
| Portal打不开                                     | 常开传送门没调用 `openPortal()`                                                      | 添加 `portal.openPortal()`                                       |
| 按钮驱动Portal自己打开了                         | 常开传送门调用了 `openPortal()`                                                      | 删除 `portal.openPortal()` 行                                    |
| "is not a function"                              | 调用了不存在的方法如 `draw()`                                                        | 检查只调用 `update()`                                            |
| 物体不工作                                       | 忘记 `this.entities.add(obj)` 或忘记系统的 `update()`                                | 检查都加了                                                       |
| **第二个房间里的机关位置不对 / 电线画歪了**      | 多房间里先创建了 `BtnWirePortalSystem`，后做房间偏移                                 | 先 `_applyWorldOffsetsToRooms(p)`，再创建 `BtnWirePortalSystem`  |
| **第二个房间完全看不见 / 玩家过去后还是第一屏**  | 多房间关卡没补 camera / 切房逻辑 / 多屏背景                                          | 补 `Room`、`_getCameraX()`、`updateCollision()`、`clearCanvas()` |
| **传送门电线没显示**                             | 创建了 `BtnWirePortalSystem`，但没加 `WireRenderer`，也没自己画 `draw()`             | 优先 `this.entities.add(new WireRenderer(this._wpSys))`          |
| **平台/按钮/尖刺只有系统的消失，其他元素看不见** | 添加了 `draw()` 方法但没调用 `super.draw(p)`                                         | 在 `draw()` 的第一行添加 `super.draw(p)`                         |
| **按了按钮，平台出现了但没有碰撞体**             | 在 `initSystems()` 之前创建了 ButtonPlatformLinkSystem，collisionSystem 为 undefined | 必须在 `initSystems()` 之后创建 ButtonPlatformLinkSystem         |

---

## 📋 快速模板（复制粘贴）

```javascript
import {
  Player,
  Ground,
  Wall,
  Spike,
  Portal,
  Button,
  NPCDemo2,
  CheckpointDemo2,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";

export class LevelX extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Spikes ────────────────────────────────────────────
    this.entities.add(new Spike(x, y, w, h));

    // ── Portal ────────────────────────────────────────────
    const portal = new Portal(x, y, w, h);
    portal.openPortal();
    this.entities.add(portal);

    // ── NPC ───────────────────────────────────────────────
    this.entities.add(
      new NPCDemo2(x, y, w, h, {
        getPlayer: () => this._player,
        eventBus: this.eventBus,
        npcId: "levelX_npc",
        dialogueLines: ["line1", "line2"],
        exhaustedLine: "exhausted",
      }),
    );

    // ── Checkpoint ────────────────────────────────────────
    this.entities.add(new CheckpointDemo2(x, y, w, h, () => this._player));

    // ── ButtonSpikeLinkSystem ─────────────────────────────
    const bsBtn_0 = new Button(x1, y1, w1, h1);
    const bsSpike_0 = new Spike(x2, y2, w2, h2);
    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: bsBtn_0, spikes: [bsSpike_0] },
      { startColorIndex: 0 },
    );
    this.entities.add(bsBtn_0);
    this.entities.add(bsSpike_0);

    this._player = new Player(px, py, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
  }

  updatePhysics() {
    super.updatePhysics();
    this._bsSys_0?.update();
  }
}
```

---

## 📋 完整模板（含 ButtonPlatformLinkSystem）

如果包含 `ButtonPlatformLinkSystem`，需要添加 `draw()` 方法。

如果包含 `BtnWirePortalSystem`，**当前仓库优先使用 `WireRenderer`**；只有你不用 `WireRenderer` 时，才自己写 `draw()`。

```javascript
import {
  Player,
  Ground,
  Wall,
  Platform,
  Button,
  Portal,
  WireRenderer,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { BtnWirePortalSystem } from "../../mechanism-system/demo2/BtnWirePortalSystem.js";
import { ButtonPlatformLinkSystem } from "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js";

export class LevelX extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Platform ──────────────────────────────────────────
    this.entities.add(new Platform(x, y, w, h));

    // ── BtnWirePortalSystem ───────────────────────────────
    const wpBtn = new Button(x, y, w, h);
    const wpPortal = new Portal(x, y, w, h);
    this._wpSys = new BtnWirePortalSystem({ button: wpBtn, portal: wpPortal });
    this.entities.add(wpBtn);
    this.entities.add(wpPortal);
    this.entities.add(new WireRenderer(this._wpSys));

    this._player = new Player(px, py, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });

    // ── ButtonPlatformLinkSystem ──────────────────────────
    // ⚠️ 必须放在 initSystems() 之后，因为这里要用 this.collisionSystem
    const bpBtn = new Button(x, y, w, h);
    const bpPlat = new Platform(x, y, w, h);
    this._bpSys = new ButtonPlatformLinkSystem(
      { button: bpBtn, platforms: [{ platform: bpPlat, mode: "appear" }] },
      this.collisionSystem,
      { startColorIndex: 0 },
    );
    this.entities.add(bpBtn);
    this.entities.add(bpPlat);
  }

  updatePhysics() {
    super.updatePhysics();
    this._wpSys?.update();
    this._bpSys?.update();
  }

  draw(p) {
    // ⚠️ 关键：必须先调用 super.draw(p) 来绘制所有实体
    super.draw(p);

    // 然后绘制系统的特殊效果
    this._bpSys?.draw?.(p);
  }
}
```
