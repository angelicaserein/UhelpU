# 导入关卡编辑器数据 - 通用版

## ✅ 百分百不出bug的导入流程

**核心原则：** 如果某个实体有 Demo1 和 Demo2 两个版本，**必须用 Demo2 版本**。

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
  NPCDemo2,           // ⚠️ 有 Demo1/Demo2 → 用 Demo2
  CheckpointDemo2,    // ⚠️ 有 Demo1/Demo2 → 用 Demo2
  SignboardDemo2,     // ⚠️ 有 Demo1/Demo2 → 用 Demo2
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

portal.openPortal();  // 常开传送门
this.entities.add(portal);
```

### ✅ Button（按钮）- 无版本区分

**单独使用：**
```javascript
const btn = new Button(x, y, width, height);
this.entities.add(btn);
```

### ✅ NPCDemo2（NPC）- ⚠️ Demo1/Demo2 → 用 Demo2

```javascript
this.entities.add(
  new NPCDemo2(x, y, width, height, {
    getPlayer: () => this._player,
    eventBus: this.eventBus,
    npcId: "easy_levelX_npc",  // 唯一 ID
    dialogueLines: ["key1", "key2"],  // 2 行对话
    exhaustedLine: "key_exhausted",   // 重复对话完后的话
  })
);
```

### ✅ CheckpointDemo2（检查点）- ⚠️ Demo1/Demo2 → 用 Demo2

```javascript
this.entities.add(
  new CheckpointDemo2(x, y, width, height, () => this._player)
);
```

### ✅ SignboardDemo2（告示板）- ⚠️ Demo1/Demo2 → 用 Demo2

```javascript
this.entities.add(
  new SignboardDemo2(x, y, width, height, () => this._player, this.eventBus, {
    textKey: "easy_signboard_level1_front",
    onTutorialClick: () => { /* 可选 */ },
    tutorialButtonTextKey: "easy_signboard_tutorial",
  })
);
```

### ✅ TeleportPoint（传送点）- 无版本区分
```javascript
this.entities.add(new TeleportPoint(x, y, width, height, targetX, targetY));
```

---

## 第 4 步：系统导入（按需）

### ✅ ButtonSpikeLinkSystem（按钮-地刺联动）

```javascript
// 系统 1
const bsBtn_0 = new Button(x1, y1, w1, h1);
const bsSpike_0 = new Spike(x2, y2, w2, h2);
this._bsSys_0 = new ButtonSpikeLinkSystem(
  { button: bsBtn_0, spikes: [bsSpike_0] },
  { startColorIndex: 0 }  // 颜色：0=红, 1=蓝, 2=绿, 3=紫, 4=橙, 5=青, 6=黄, 7=粉
);
this.entities.add(bsBtn_0);
this.entities.add(bsSpike_0);

// 系统 2（可选，如果有的话）
const bsBtn_1 = new Button(x3, y3, w3, h3);
const bsSpike_1 = new Spike(x4, y4, w4, h4);
this._bsSys_1 = new ButtonSpikeLinkSystem(
  { button: bsBtn_1, spikes: [bsSpike_1] },
  { startColorIndex: 1 }
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

---

## 第 5 步：玩家和系统初始化（必须）

```javascript
    this._player = new Player(px, py, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
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

## ⚠️ 重要提醒

| 情况 | 做法 |
|------|------|
| **没有某个系统** | 就不导入、不创建、不调用 `update()` |
| **没有 Checkpoint** | 删除 CheckpointDemo2 导入和创建代码 |
| **没有 NPC** | 删除 NPCDemo2 导入和创建代码 |
| **没有按钮-地刺系统** | 删除 ButtonSpikeLinkSystem 导入和创建代码 |
| **Portal 常开** | 调用 `portal.openPortal()` |
| **Portal 按钮驱动** | 不调用 `openPortal()` |
| **有 Demo1/Demo2 两个版本** | **必须用 Demo2** |

---

## 🐛 常见错误排查

| 错误 | 原因 | 修复 |
|------|------|------|
| Checkpoint不自动激活 | 用了 `Checkpoint` | 改为 `CheckpointDemo2` |
| NPC不显示 | 用了 `NPC` | 改为 `NPCDemo2` |
| Signboard不显示 | 用了 `SignboardDemo1` | 改为 `SignboardDemo2` |
| Portal打不开 | 常开传送门没调用 `openPortal()` | 添加 `portal.openPortal()` |
| 按钮驱动Portal自己打开了 | 常开传送门调用了 `openPortal()` | 删除 `portal.openPortal()` 行 |
| "is not a function" | 调用了不存在的方法如 `draw()` | 检查只调用 `update()` |
| 物体不工作 | 忘记 `this.entities.add(obj)` 或忘记系统的 `update()` | 检查都加了 |

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
      })
    );

    // ── Checkpoint ────────────────────────────────────────
    this.entities.add(new CheckpointDemo2(x, y, w, h, () => this._player));

    // ── ButtonSpikeLinkSystem ─────────────────────────────
    const bsBtn_0 = new Button(x1, y1, w1, h1);
    const bsSpike_0 = new Spike(x2, y2, w2, h2);
    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: bsBtn_0, spikes: [bsSpike_0] },
      { startColorIndex: 0 }
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
