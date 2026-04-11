# 小组游戏成就系统文档

## 概述

成就系统是一个记录玩家游戏进度和成就解锁情况的模块，支持以下功能：

- **10个成就** - 分为已实现（3个）和待实现（7个）
- **持久化存储** - 使用 localStorage 保存解锁状态
- **多语言支持** - 中英文内容切换
- **视觉反馈** - 成就卡片、彩虹文字、成就解锁提示

---

## 已实现成就（3个）

### 成就1: perseverance（坚持不懈）💪

| 属性         | 值                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **ID**       | `perseverance`                                                                                          |
| **名称**     | 坚持不懈 / Perseverance                                                                                 |
| **图标**     | 💪                                                                                                      |
| **所属关卡** | Demo1 第2关（登高）                                                                                     |
| **难度**     | 中等（🩷🩷）                                                                                            |
| **解锁条件** | 在第2关中，触发"怎么才能跳得更高呢？"提示**3次**                                                        |
| **描述**     | "你是不是掉下来了三次？" / "Did you fall down 3 times?"                                                 |
| **解锁描述** | "在第二关里触发三次'怎么才能跳得更高呢？'" / "Trigger 'How can I jump much higher?' 3 times in Level 2" |
| **实现文件** | `js/level-design/demo1/Level2.js:66`                                                                    |
| **触发机制** | TextPrompt 事件触发计数器                                                                               |

**实现细节：**

```javascript
// 第2关中的 TextPrompt（L2 pop-up）触发逻辑
const textPrompt = new TextPrompt(450, 70, this, {
  textKey: "level2_jump_higher_prompt", // "怎么才能跳得更高呢？"
  onTrigger: () => {
    this._jumpPromptCount++;
    if (this._jumpPromptCount === 3) {
      this._jumpHintWindow.open(); // 显示成就提示窗口
      this._achievementToast.show("achievement_unlocked"); // 显示 Toast
      Demo1AchievementData.unlock("perseverance"); // 解锁成就
    }
  },
});
```

**玩家操作流程：**

1. 进入第2关（登高关卡）
2. 失败/复活 3 次触发"怎么才能跳得更高呢？"对白
3. 第3次触发时自动解锁成就
4. 屏幕显示彩虹色"坚持不懈"文字和成就解锁 toast

---

### 成就2: selfjump（无钮自通）🏔

| 属性         | 值                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| **ID**       | `selfjump`                                                                                                     |
| **名称**     | 无钮自通 / Self-Jump                                                                                           |
| **图标**     | 🏔                                                                                                             |
| **所属关卡** | Demo1 第4关（陷阱）                                                                                            |
| **难度**     | 中等（🩷🩷）                                                                                                   |
| **解锁条件** | 在第4关中，**不踩黄色按钮和蓝色按钮**情况下跳过地刺                                                            |
| **描述**     | "你是跳跃高手！" / "You're a jumping master!"                                                                  |
| **解锁描述** | "在第四关里不踩到黄、蓝按钮就跳过地刺" / "Jump over spikes without stepping on yellow/blue buttons in level 4" |
| **实现文件** | `js/level-design/demo1/Level4.js:260-268`                                                                      |
| **触发机制** | 房间转移的边界检测 + 按钮状态检查                                                                              |

**实现细节：**

```javascript
// 第4关第1房间转移到第2房间时的逻辑
const buttonHintPrompt = new TextPrompt(p.width / 2, 100, this, {
  onTrigger: () => {
    // 检查第1房间的两个按钮是否被踩过
    if (!this._room1ButtonEverPressed && !this._room1Button2EverPressed) {
      if (!Demo1AchievementData.isUnlocked("selfjump")) {
        Demo1AchievementData.unlock("selfjump");
        this._achievementToast.show("achievement_unlocked");
        this._selfjumpHintWindow.open();
      }
    }
  },
});
```

**状态跟踪：**

- `_room1ButtonEverPressed` - 黄色按钮是否被踩过
- `_room1Button2EverPressed` - 蓝色按钮是否被踩过
- 这两个标志在碰撞检测中更新（`updateCollision` 方法）

**玩家操作流程：**

1. 进入第4关第1房间（陷阱房间）
2. 看到黄色和蓝色按钮，但不踩它们
3. 直接跳过所有地刺走到右边边界
4. 触发房间转移时，系统检查两个按钮都没被踩过
5. 自动解锁成就，显示彩虹色"无钮自通"文字

---

### 成就3: prisoner（囚犯）⚡

| 属性         | 值                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| **ID**       | `prisoner`                                                                                                  |
| **名称**     | 囚犯 / Prisoner                                                                                             |
| **图标**     | ⚡                                                                                                          |
| **所属关卡** | Demo1 第5关（牢笼）                                                                                         |
| **难度**     | 困难（🩷🩷🩷🩷）                                                                                            |
| **解锁条件** | 在第5关中，**没有激活存档点**的情况下把自己困住                                                             |
| **描述**     | "有的人活着，他已经死了。" / "Some people are alive, but they are already dead."                            |
| **解锁描述** | "在第五关中没有激活存档点的情况下把自己困住" / "Trap yourself in Level 5 without activating the checkpoint" |
| **实现文件** | `js/level-design/demo1/Level5.js:165-173`                                                                   |
| **触发机制** | 房间转移边界检测 + 存档点状态检查                                                                           |

**实现细节：**

```javascript
// 第5关第0房间转移到第1房间时的逻辑
const jailPrompt = new TextPrompt(p.width - 50, 300, this, {
  onTrigger: () => {
    // 检查存档点是否被激活且自己没被困住
    if (
      !Demo1AchievementData.isUnlocked("prisoner") &&
      !this._room0Checkpoint.activated
    ) {
      Demo1AchievementData.unlock("prisoner");
      this._achievementToast.show("achievement_unlocked");
      this._jailHintWindow.open();
    }
  },
});
```

**状态跟踪：**

- `_room0Checkpoint.activated` - 存档点是否被激活
- 系统会检查玩家是否跳过了所有存档点就尝试逃离

**玩家操作流程：**

1. 进入第5关（牢笼关卡）
2. 看到黄色存档点按钮，但不激活它
3. 通过各种机制（录制分身、踩踏等）把自己困住
4. 尝试向房间右侧移动时系统检测
5. 因为没激活存档点就困住自己了，所以解锁成就
6. 显示彩虹色"囚犯"文字和成就解锁 toast

**游戏特色：**

- 这是一个"反向"成就 - 需要失败或陷入困境才能解锁
- 体现了游戏主题"有的人活着，他已经死了"的深层含义
- 需要了解第5关的机制和存档系统

---

## 待实现成就（7个）

### 成就4: achievement4

| 属性         | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| **ID**       | `achievement4`                                                           |
| **名称**     | 成就4 / Achievement 4                                                    |
| **图标**     | 🫤                                                                       |
| **所属关卡** | _待定_                                                                   |
| **难度**     | _待定_                                                                   |
| **解锁条件** | _待实现_                                                                 |
| **描述**     | 成就4描述（待实现） / Achievement 4 description (pending implementation) |
| **实现状态** | ❌ 未实现                                                                |

**待办事项：**

- [ ] 定义成就名称和目标
- [ ] 确定触发条件
- [ ] 在对应关卡文件中编写触发逻辑
- [ ] 更新 i18n 文本
- [ ] 测试解锁流程

---

### 成就5: achievement5

| 属性         | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| **ID**       | `achievement5`                                                           |
| **名称**     | 成就5 / Achievement 5                                                    |
| **图标**     | 🏆                                                                       |
| **所属关卡** | _待定_                                                                   |
| **难度**     | _待定_                                                                   |
| **解锁条件** | _待实现_                                                                 |
| **描述**     | 成就5描述（待实现） / Achievement 5 description (pending implementation) |
| **实现状态** | ❌ 未实现                                                                |

**待办事项：**

- [ ] 定义成就名称和目标
- [ ] 确定触发条件
- [ ] 在对应关卡文件中编写触发逻辑
- [ ] 更新 i18n 文本
- [ ] 测试解锁流程

---

### 成就6: achievement6

| 属性         | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| **ID**       | `achievement6`                                                           |
| **名称**     | 成就6 / Achievement 6                                                    |
| **图标**     | 🎮                                                                       |
| **所属关卡** | _待定_                                                                   |
| **难度**     | _待定_                                                                   |
| **解锁条件** | _待实现_                                                                 |
| **描述**     | 成就6描述（待实现） / Achievement 6 description (pending implementation) |
| **实现状态** | ❌ 未实现                                                                |

**待办事项：**

- [ ] 定义成就名称和目标
- [ ] 确定触发条件
- [ ] 在对应关卡文件中编写触发逻辑
- [ ] 更新 i18n 文本
- [ ] 测试解锁流程

---

### 成就7: achievement7

| 属性         | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| **ID**       | `achievement7`                                                           |
| **名称**     | 成就7 / Achievement 7                                                    |
| **图标**     | 📝                                                                       |
| **所属关卡** | _待定_                                                                   |
| **难度**     | _待定_                                                                   |
| **解锁条件** | _待实现_                                                                 |
| **描述**     | 成就7描述（待实现） / Achievement 7 description (pending implementation) |
| **实现状态** | ❌ 未实现                                                                |

**待办事项：**

- [ ] 定义成就名称和目标
- [ ] 确定触发条件
- [ ] 在对应关卡文件中编写触发逻辑
- [ ] 更新 i18n 文本
- [ ] 测试解锁流程

---

### 成就8: achievement8

| 属性         | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| **ID**       | `achievement8`                                                           |
| **名称**     | 成就8 / Achievement 8                                                    |
| **图标**     | 💬                                                                       |
| **所属关卡** | _待定_                                                                   |
| **难度**     | _待定_                                                                   |
| **解锁条件** | _待实现_                                                                 |
| **描述**     | 成就8描述（待实现） / Achievement 8 description (pending implementation) |
| **实现状态** | ❌ 未实现                                                                |

**待办事项：**

- [ ] 定义成就名称和目标
- [ ] 确定触发条件
- [ ] 在对应关卡文件中编写触发逻辑
- [ ] 更新 i18n 文本
- [ ] 测试解锁流程

---

### 成就9: achievement9

| 属性         | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| **ID**       | `achievement9`                                                           |
| **名称**     | 成就9 / Achievement 9                                                    |
| **图标**     | 🎬                                                                       |
| **所属关卡** | _待定_                                                                   |
| **难度**     | _待定_                                                                   |
| **解锁条件** | _待实现_                                                                 |
| **描述**     | 成就9描述（待实现） / Achievement 9 description (pending implementation) |
| **实现状态** | ❌ 未实现                                                                |

**待办事项：**

- [ ] 定义成就名称和目标
- [ ] 确定触发条件
- [ ] 在对应关卡文件中编写触发逻辑
- [ ] 更新 i18n 文本
- [ ] 测试解锁流程

---

### 成就10: achievement10

| 属性         | 值                                                                         |
| ------------ | -------------------------------------------------------------------------- |
| **ID**       | `achievement10`                                                            |
| **名称**     | 成就10 / Achievement 10                                                    |
| **图标**     | 👻                                                                         |
| **所属关卡** | _待定_                                                                     |
| **难度**     | _待定_                                                                     |
| **解锁条件** | _待实现_                                                                   |
| **描述**     | 成就10描述（待实现） / Achievement 10 description (pending implementation) |
| **实现状态** | ❌ 未实现                                                                  |

**待办事项：**

- [ ] 定义成就名称和目标
- [ ] 确定触发条件
- [ ] 在对应关卡文件中编写触发逻辑
- [ ] 更新 i18n 文本
- [ ] 测试解锁流程

---

## 系统架构

### 核心文件

| 文件路径                                         | 功能描述                                    |
| ------------------------------------------------ | ------------------------------------------- |
| `js/achievement system/AchievementData.js`       | 主成就数据定义和管理（全局）                |
| `js/achievement system/Demo1AchievementData.js`  | Demo1 专用成就数据管理（localStorage 隔离） |
| `js/achievement system/AchievementToast.js`      | 成就解锁 Toast 提示组件                     |
| `js/ui/pages/static-pages/StaticPageAchieves.js` | 成就展示页面（UI）                          |
| `js/i18nDemo1.js`                                | 成就多语言文本定义                          |

### 数据持久化

**localStorage 键：**

- `kinoko_achievements` - 全局成就状态
- `kinoko_achievements_demo1` - Demo1 成就状态（支持向前兼容迁移）

**存储格式：**

```json
["perseverance", "selfjump", "prisoner"]
```

### 状态管理

```javascript
// 获取所有成就
const allAchievements = Demo1AchievementData.getAll();

// 检查成就是否解锁
const isUnlocked = Demo1AchievementData.isUnlocked("perseverance");

// 手动解锁成就
Demo1AchievementData.unlock("perseverance");

// 获取解锁统计
const unlockedCount = Demo1AchievementData.getUnlockedCount(); // 3
const totalCount = Demo1AchievementData.getTotal(); // 10
```

---

## UI 展示

### 成就页面（StaticPageAchieves）

**布局：**

- 5 列 × 2 行的成就卡片网格
- 第1行：行为成就（坚持、无钮、囚犯等）
- 第2行：进度成就（成就4-10）

**卡片设计：**

- **已解锁：** 紫色背光 + 彩虹波浪文字 + 成就图标
- **未解锁：** 暗紫色 + 🔒 锁定图标 + 灰色文字
- 四角装饰迷你齿轮（旋转动画）
- 悬浮提示框显示详细解锁条件

**交互：**

- 鼠标悬浮显示提示框
- 点击返回按钮返回菜单
- ESC 键快速返回

---

## 实现指南

### 添加新成就的步骤

#### 1. 定义成就 ID（已完成）

已在 `AchievementData.js` 和 `Demo1AchievementData.js` 中定义。

#### 2. 添加多语言文本

编辑 `js/i18nDemo1.js`：

```javascript
achiev_achievement4_name: "你的成就名称",
achiev_achievement4_desc: "成就描述",
achiev_achievement4_unlock_desc: "解锁条件说明",
```

#### 3. 编写触发逻辑

在对应关卡文件中（如 `Level2.js`）：

```javascript
// 检查条件
if (/* 某个条件满足 */) {
  Demo1AchievementData.unlock("achievement4");
  this._achievementToast.show("achievement_unlocked");
}
```

#### 4. 常见触发场景

**场景 A：关卡完成时**

```javascript
onLevelComplete: () => {
  // 检查特定条件
  if (specialConditionMet) {
    Demo1AchievementData.unlock("achievement4");
  }
};
```

**场景 B：特定操作时**

```javascript
const prompt = new TextPrompt(x, y, this, {
  onTrigger: () => {
    triggerCount++;
    if (triggerCount === 3) {
      Demo1AchievementData.unlock("achievement4");
    }
  },
});
```

**场景 C：按钮/碰撞检测时**

```javascript
if (buttonPressed && !otherButtonPressed) {
  Demo1AchievementData.unlock("achievement4");
}
```

#### 5. 测试

- 清除 localStorage 中的 `kinoko_achievements_demo1`
- 进入游戏并尝试解锁条件
- 检查成就页面是否显示解锁状态
- 刷新页面后检查持久化是否成功

---

## 多样化成就设计建议

### 成就类型分类

| 类型       | 描述                 | 示例                                      |
| ---------- | -------------------- | ----------------------------------------- |
| **完成类** | 完成某个关卡或任务   | 坚持不懈（重复操作）                      |
| **挑战类** | 满足特殊条件完成     | 无钮自通（跳过按钮）                      |
| **失败类** | 陷入特殊状态         | 囚犯（被困住）                            |
| **收集类** | 收集全部物品/NPC对话 | 好学生（读所有牌）、社交达人（与NPC对话） |
| **时间类** | 在规定时间内完成     | _待实现_                                  |
| **技巧类** | 演示高超技能         | 导演（录制功能）、幻影大师（回放完成）    |
| **全局类** | 跨多关卡的成就       | 完美主义者（全部通关）                    |

### 设计平衡

建议在制定新成就时考虑：

- ✅ **难度分布** - 不全是简单的一键成就
- ✅ **玩法多样性** - 鼓励玩家尝试不同的通关方式
- ✅ **故事相关性** - 与游戏主题或剧情相关
- ✅ **可发现性** - 让玩家知道如何解锁
- ✅ **价值感** - 达成时要有成就感

---

## 常见问题

### Q: 如何重置所有成就？

A: 打开浏览器控制台（F12），运行：

```javascript
localStorage.removeItem("kinoko_achievements_demo1");
location.reload();
```

### Q: 如何快速解锁某个成就用于测试？

A: 在控制台运行：

```javascript
Demo1AchievementData.unlock("achievement4");
```

### Q: 成就数据在哪里保存？

A: 浏览器的 localStorage 中：

- 键：`kinoko_achievements_demo1`
- 值：JSON 数组 `["perseverance", "selfjump", "prisoner"]`

### Q: 能否在不同关卡间共享成就状态？

A: 使用全局的 `AchievementData` 而非 `Demo1AchievementData`（目前 Demo1 使用独立数据管理）。

### Q: 成就卡片的彩虹波浪效果是如何实现的？

A: 使用 DOM `<span>` 元素 + CSS `animation` + `@keyframes` 实现每个字符的上下波浪运动。见 `StaticPageAchieves._setRainbowContent()`。

---

## 更新日志

| 版本 | 日期       | 更改                               |
| ---- | ---------- | ---------------------------------- |
| v1.0 | 2026-04-11 | 初版文档 + 成就 ID 改名（4-10 号） |
| v0.1 | _之前_     | 原始成就系统实现（3个已完成成就）  |

---

## 相关资源

- **成就图标参考** - 各成就 emoji 和主题配色
- **UI 样式表** - `static/style.css` 中的 `.achiev-*` 类
- **关卡设计** - `js/level-design/demo1/` 目录
- **多语言系统** - `js/i18n.js` 文档
