# 导入关卡编辑器数据 - 完整清单

## ✅ 百分百不出bug的导入流程

### 1️⃣ 导入语句（写在文件顶部）

```javascript
import {
  Player,
  Ground,
  Wall,
  Spike,
  Portal,
  Button,
  NPCDemo2,
  CheckpointDemo2,  // ⚠️ 必须用 Demo2 版本！
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";
```

### 2️⃣ 构造函数基础设置

```javascript
export class LevelX extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    // 添加左右墙壁和顶部地面
    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));
    this.entities.add(new Ground(0, 0, p.width, 80));
```

### 3️⃣ 实体导入规则

#### ✅ Spike（地刺）
```javascript
this.entities.add(new Spike(x, y, width, height));
```

#### ✅ Portal（传送门）
```javascript
const portal = new Portal(x, y, width, height);
// 判断逻辑：
// - 如果编辑器注释说"按钮驱动" → 不调用 openPortal()
// - 如果没有说 → 调用 openPortal() 使其常开
portal.openPortal();  // 常开传送门
this.entities.add(portal);
```

#### ✅ NPC
```javascript
this.entities.add(
  new NPCDemo2(x, y, width, height, {
    getPlayer: () => this._player,
    eventBus: this.eventBus,
    npcId: "easy_levelX_npc",  // 或其他 id
    dialogueLines: ["key1", "key2"],  // 2行对话
    exhaustedLine: "key_exhausted",
  })
);
```

#### ✅ Checkpoint（检查点）
```javascript
this.entities.add(
  new CheckpointDemo2(x, y, width, height, () => this._player)
);
```

#### ✅ Button（按钮）- 单独使用
```javascript
const btn = new Button(x, y, width, height);
this.entities.add(btn);
```

#### ✅ ButtonSpikeLinkSystem（按钮-地刺联动）
```javascript
// 系统 1
const bsBtn_0 = new Button(x1, y1, w1, h1);
const bsSpike_0 = new Spike(x2, y2, w2, h2);
this._bsSys_0 = new ButtonSpikeLinkSystem(
  { button: bsBtn_0, spikes: [bsSpike_0] },
  { startColorIndex: 0 }  // 0=红, 1=蓝, 2=绿, 3=紫, 4=橙, 5=青, 6=黄, 7=粉
);
this.entities.add(bsBtn_0);
this.entities.add(bsSpike_0);

// 系统 2
const bsBtn_1 = new Button(x3, y3, w3, h3);
const bsSpike_1 = new Spike(x4, y4, w4, h4);
this._bsSys_1 = new ButtonSpikeLinkSystem(
  { button: bsBtn_1, spikes: [bsSpike_1] },
  { startColorIndex: 1 }  // 不同颜色
);
this.entities.add(bsBtn_1);
this.entities.add(bsSpike_1);
```

### 4️⃣ 玩家和系统初始化（最后）

```javascript
    this._player = new Player(px, py, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
  }
```

### 5️⃣ 更新物理（updatePhysics）

```javascript
  updatePhysics() {
    super.updatePhysics();
    // 如果有 ButtonSpikeLinkSystem，调用 update()
    this._bsSys_0?.update();
    this._bsSys_1?.update();
    // 等等...
  }
```

### 6️⃣ ⚠️ 不需要 draw() 方法

ButtonSpikeLinkSystem **没有** `draw()` 方法，只需要在 `updatePhysics()` 中调用 `update()`。

---

## 🐛 常见错误

| 错误 | 原因 | 修复 |
|------|------|------|
| Checkpoint不自动激活 | 用了 `Checkpoint` 而不是 `CheckpointDemo2` | 改为 `CheckpointDemo2(x,y,w,h,()=>this._player)` |
| NPC不显示 | 用了 `NPC` 而不是 `NPCDemo2` | 改为 `NPCDemo2(...)` |
| Portal打不开 | 没调用 `openPortal()` | 常开传送门要加 `portal.openPortal()` |
| "is not a function" | 调用了 `ButtonSpikeLinkSystem.draw()` | 删除 `draw()` 调用，只保留 `update()` |
| 物体不工作 | 忘记 `this.entities.add(obj)` | 检查所有实体都加入了 |

---

## 📋 导入清单模板

复制粘贴使用：

```javascript
// ── Spikes ────────────────────────────────────────────
this.entities.add(new Spike(...));

// ── Portal ────────────────────────────────────────────
const portal = new Portal(...);
portal.openPortal();
this.entities.add(portal);

// ── NPC ───────────────────────────────────────────────
this.entities.add(new NPCDemo2(...));

// ── Checkpoint ────────────────────────────────────────
this.entities.add(new CheckpointDemo2(..., () => this._player));

// ── ButtonSpikeLinkSystem 0 ───────────────────────────
const bsBtn_0 = new Button(...);
const bsSpike_0 = new Spike(...);
this._bsSys_0 = new ButtonSpikeLinkSystem(
  { button: bsBtn_0, spikes: [bsSpike_0] },
  { startColorIndex: 0 }
);
this.entities.add(bsBtn_0);
this.entities.add(bsSpike_0);

// ── ButtonSpikeLinkSystem 1 ───────────────────────────
const bsBtn_1 = new Button(...);
const bsSpike_1 = new Spike(...);
this._bsSys_1 = new ButtonSpikeLinkSystem(
  { button: bsBtn_1, spikes: [bsSpike_1] },
  { startColorIndex: 1 }
);
this.entities.add(bsBtn_1);
this.entities.add(bsSpike_1);
```
