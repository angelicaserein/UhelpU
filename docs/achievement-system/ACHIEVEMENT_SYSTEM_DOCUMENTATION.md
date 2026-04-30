# 小组游戏成就系统文档 / Achievement System Documentation

## 概述 / Overview

成就系统是一个记录玩家游戏进度和成就解锁情况的模块，支持以下功能：

The Achievement System is a module that tracks player progress and achievement unlock status. It supports the following features:

- **10个成就 / 10 Achievements** - 分为已实现（3个）和待实现（7个） / Split into implemented (3) and pending (7)
- **持久化存储 / Persistent Storage** - 使用 localStorage 保存解锁状态 / Uses localStorage to save unlock states
- **多语言支持 / Multilingual Support** - 中英文内容切换 / Switch between Chinese and English content
- **视觉反馈 / Visual Feedback** - 成就卡片、彩虹文字、成就解锁提示 / Achievement cards, rainbow text, unlock toasts

---

## 已实现成就（3个）/ Implemented Achievements (3)

### 成就1 / Achievement 1: perseverance（坚持不懈）💪

| 属性 / Attribute           | 值 / Value                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **ID**                     | `perseverance`                                                                                                             |
| **名称 / Name**            | 坚持不懈 / Perseverance                                                                                                    |
| **图标 / Icon**            | 💪                                                                                                                         |
| **所属关卡 / Level**       | Demo1 第2关（登高）/ Demo1 Level 2 (Climb High)                                                                            |
| **难度 / Difficulty**      | 中等 / Medium（🩷🩷）                                                                                                      |
| **解锁条件 / Condition**   | 在第2关中，触发"怎么才能跳得更高呢？"提示**3次** / Trigger the "How can I jump much higher?" prompt **3 times** in Level 2 |
| **描述 / Description**     | "你是不是掉下来了三次？" / "Did you fall down 3 times?"                                                                    |
| **解锁描述 / Unlock Desc** | "在第二关里触发三次'怎么才能跳得更高呢？'" / "Trigger 'How can I jump much higher?' 3 times in Level 2"                    |
| **实现文件 / File**        | `js/level-design/demo1/Level2.js:66`                                                                                       |
| **触发机制 / Trigger**     | TextPrompt 事件触发计数器 / TextPrompt event trigger counter                                                               |

**实现细节 / Implementation Details:**

```javascript
// 第2关中的 TextPrompt（L2 pop-up）触发逻辑
// TextPrompt (L2 pop-up) trigger logic in Level 2
const textPrompt = new TextPrompt(450, 70, this, {
  textKey: "level2_jump_higher_prompt", // "怎么才能跳得更高呢？"
  onTrigger: () => {
    this._jumpPromptCount++;
    if (this._jumpPromptCount === 3) {
      this._jumpHintWindow.open(); // 显示成就提示窗口 / Show achievement hint window
      this._achievementToast.show("achievement_unlocked"); // 显示 Toast / Show toast
      Demo1AchievementData.unlock("perseverance"); // 解锁成就 / Unlock achievement
    }
  },
});
```

**玩家操作流程 / Player Steps:**

1. 进入第2关（登高关卡）/ Enter Level 2 (Climb High)
2. 失败/复活 3 次触发"怎么才能跳得更高呢？"对白 / Fail/respawn 3 times to trigger the "How can I jump much higher?" dialogue
3. 第3次触发时自动解锁成就 / Achievement unlocks automatically on the 3rd trigger
4. 屏幕显示彩虹色"坚持不懈"文字和成就解锁 toast / Rainbow "Perseverance" text and achievement unlock toast appear on screen

---

### 成就2 / Achievement 2: selfjump（无钮自通）🏔

| 属性 / Attribute           | 值 / Value                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                     | `selfjump`                                                                                                                       |
| **名称 / Name**            | 无钮自通 / Self-Jump                                                                                                             |
| **图标 / Icon**            | 🏔                                                                                                                               |
| **所属关卡 / Level**       | Demo1 第4关（陷阱）/ Demo1 Level 4 (Traps)                                                                                       |
| **难度 / Difficulty**      | 中等 / Medium（🩷🩷）                                                                                                            |
| **解锁条件 / Condition**   | 在第4关中，**不踩黄色按钮和蓝色按钮**情况下跳过地刺 / Jump over spikes **without stepping on yellow or blue buttons** in Level 4 |
| **描述 / Description**     | "你是跳跃高手！" / "You're a jumping master!"                                                                                    |
| **解锁描述 / Unlock Desc** | "在第四关里不踩到黄、蓝按钮就跳过地刺" / "Jump over spikes without stepping on yellow/blue buttons in level 4"                   |
| **实现文件 / File**        | `js/level-design/demo1/Level4.js:260-268`                                                                                        |
| **触发机制 / Trigger**     | 房间转移的边界检测 + 按钮状态检查 / Room transition boundary check + button state check                                          |

**实现细节 / Implementation Details:**

```javascript
// 第4关第1房间转移到第2房间时的逻辑
// Logic when transitioning from Room 1 to Room 2 in Level 4
const buttonHintPrompt = new TextPrompt(p.width / 2, 100, this, {
  onTrigger: () => {
    // 检查第1房间的两个按钮是否被踩过
    // Check if either button in Room 1 was ever pressed
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

**状态跟踪 / State Tracking:**

- `_room1ButtonEverPressed` - 黄色按钮是否被踩过 / Whether the yellow button was ever pressed
- `_room1Button2EverPressed` - 蓝色按钮是否被踩过 / Whether the blue button was ever pressed
- 这两个标志在碰撞检测中更新（`updateCollision` 方法）/ Both flags are updated in collision detection (`updateCollision` method)

**玩家操作流程 / Player Steps:**

1. 进入第4关第1房间（陷阱房间）/ Enter Level 4 Room 1 (Trap Room)
2. 看到黄色和蓝色按钮，但不踩它们 / See the yellow and blue buttons but avoid stepping on them
3. 直接跳过所有地刺走到右边边界 / Jump over all spikes directly to reach the right boundary
4. 触发房间转移时，系统检查两个按钮都没被踩过 / On room transition, the system checks that neither button was pressed
5. 自动解锁成就，显示彩虹色"无钮自通"文字 / Achievement unlocks automatically; rainbow "Self-Jump" text is displayed

---

### 成就3 / Achievement 3: prisoner（囚犯）⚡

| 属性 / Attribute           | 值 / Value                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **ID**                     | `prisoner`                                                                                                       |
| **名称 / Name**            | 囚犯 / Prisoner                                                                                                  |
| **图标 / Icon**            | ⚡                                                                                                               |
| **所属关卡 / Level**       | Demo1 第5关（牢笼）/ Demo1 Level 5 (Cage)                                                                        |
| **难度 / Difficulty**      | 困难 / Hard（🩷🩷🩷🩷）                                                                                          |
| **解锁条件 / Condition**   | 在第5关中，**没有激活存档点**的情况下把自己困住 / Trap yourself in Level 5 **without activating the checkpoint** |
| **描述 / Description**     | "有的人活着，他已经死了。" / "Some people are alive, but they are already dead."                                 |
| **解锁描述 / Unlock Desc** | "在第五关中没有激活存档点的情况下把自己困住" / "Trap yourself in Level 5 without activating the checkpoint"      |
| **实现文件 / File**        | `js/level-design/demo1/Level5.js:165-173`                                                                        |
| **触发机制 / Trigger**     | 房间转移边界检测 + 存档点状态检查 / Room transition boundary check + checkpoint state check                      |

**实现细节 / Implementation Details:**

```javascript
// 第5关第0房间转移到第1房间时的逻辑
// Logic when transitioning from Room 0 to Room 1 in Level 5
const jailPrompt = new TextPrompt(p.width - 50, 300, this, {
  onTrigger: () => {
    // 检查存档点是否被激活且自己没被困住
    // Check if checkpoint was not activated and player trapped themselves
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

**状态跟踪 / State Tracking:**

- `_room0Checkpoint.activated` - 存档点是否被激活 / Whether the checkpoint was activated
- 系统会检查玩家是否跳过了所有存档点就尝试逃离 / The system checks if the player skipped all checkpoints before attempting to leave

**玩家操作流程 / Player Steps:**

1. 进入第5关（牢笼关卡）/ Enter Level 5 (Cage)
2. 看到黄色存档点按钮，但不激活它 / See the yellow checkpoint button but do not activate it
3. 通过各种机制（录制分身、踩踏等）把自己困住 / Trap yourself using various mechanics (recording clones, stacking, etc.)
4. 尝试向房间右侧移动时系统检测 / The system detects when the player attempts to move to the right side of the room
5. 因为没激活存档点就困住自己了，所以解锁成就 / Achievement unlocks because the player trapped themselves without activating the checkpoint
6. 显示彩虹色"囚犯"文字和成就解锁 toast / Rainbow "Prisoner" text and achievement unlock toast are displayed

**游戏特色 / Special Notes:**

- 这是一个"反向"成就 - 需要失败或陷入困境才能解锁 / This is a "reverse" achievement — it requires failing or getting trapped to unlock
- 体现了游戏主题"有的人活着，他已经死了"的深层含义 / Reflects the game's theme: "Some people are alive, but they are already dead"
- 需要了解第5关的机制和存档系统 / Requires understanding Level 5's mechanics and the checkpoint system

---

## 待实现成就（7个）/ Pending Achievements (7)

### 成就4 / Achievement 4: achievement4

| 属性 / Attribute         | 值 / Value                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| **ID**                   | `achievement4`                                                           |
| **名称 / Name**          | 成就4 / Achievement 4                                                    |
| **图标 / Icon**          | 🫤                                                                       |
| **所属关卡 / Level**     | _待定 / TBD_                                                             |
| **难度 / Difficulty**    | _待定 / TBD_                                                             |
| **解锁条件 / Condition** | _待实现 / Pending implementation_                                        |
| **描述 / Description**   | 成就4描述（待实现） / Achievement 4 description (pending implementation) |
| **实现状态 / Status**    | ❌ 未实现 / Not implemented                                              |

**待办事项 / To-Do:**

- [ ] 定义成就名称和目标 / Define achievement name and goal
- [ ] 确定触发条件 / Determine trigger conditions
- [ ] 在对应关卡文件中编写触发逻辑 / Write trigger logic in the corresponding level file
- [ ] 更新 i18n 文本 / Update i18n text
- [ ] 测试解锁流程 / Test the unlock flow

---

### 成就5 / Achievement 5: achievement5

| 属性 / Attribute         | 值 / Value                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| **ID**                   | `achievement5`                                                           |
| **名称 / Name**          | 成就5 / Achievement 5                                                    |
| **图标 / Icon**          | 🏆                                                                       |
| **所属关卡 / Level**     | _待定 / TBD_                                                             |
| **难度 / Difficulty**    | _待定 / TBD_                                                             |
| **解锁条件 / Condition** | _待实现 / Pending implementation_                                        |
| **描述 / Description**   | 成就5描述（待实现） / Achievement 5 description (pending implementation) |
| **实现状态 / Status**    | ❌ 未实现 / Not implemented                                              |

**待办事项 / To-Do:**

- [ ] 定义成就名称和目标 / Define achievement name and goal
- [ ] 确定触发条件 / Determine trigger conditions
- [ ] 在对应关卡文件中编写触发逻辑 / Write trigger logic in the corresponding level file
- [ ] 更新 i18n 文本 / Update i18n text
- [ ] 测试解锁流程 / Test the unlock flow

---

### 成就6 / Achievement 6: achievement6

| 属性 / Attribute         | 值 / Value                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| **ID**                   | `achievement6`                                                           |
| **名称 / Name**          | 成就6 / Achievement 6                                                    |
| **图标 / Icon**          | 🎮                                                                       |
| **所属关卡 / Level**     | _待定 / TBD_                                                             |
| **难度 / Difficulty**    | _待定 / TBD_                                                             |
| **解锁条件 / Condition** | _待实现 / Pending implementation_                                        |
| **描述 / Description**   | 成就6描述（待实现） / Achievement 6 description (pending implementation) |
| **实现状态 / Status**    | ❌ 未实现 / Not implemented                                              |

**待办事项 / To-Do:**

- [ ] 定义成就名称和目标 / Define achievement name and goal
- [ ] 确定触发条件 / Determine trigger conditions
- [ ] 在对应关卡文件中编写触发逻辑 / Write trigger logic in the corresponding level file
- [ ] 更新 i18n 文本 / Update i18n text
- [ ] 测试解锁流程 / Test the unlock flow

---

### 成就7 / Achievement 7: achievement7

| 属性 / Attribute         | 值 / Value                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| **ID**                   | `achievement7`                                                           |
| **名称 / Name**          | 成就7 / Achievement 7                                                    |
| **图标 / Icon**          | 📝                                                                       |
| **所属关卡 / Level**     | _待定 / TBD_                                                             |
| **难度 / Difficulty**    | _待定 / TBD_                                                             |
| **解锁条件 / Condition** | _待实现 / Pending implementation_                                        |
| **描述 / Description**   | 成就7描述（待实现） / Achievement 7 description (pending implementation) |
| **实现状态 / Status**    | ❌ 未实现 / Not implemented                                              |

**待办事项 / To-Do:**

- [ ] 定义成就名称和目标 / Define achievement name and goal
- [ ] 确定触发条件 / Determine trigger conditions
- [ ] 在对应关卡文件中编写触发逻辑 / Write trigger logic in the corresponding level file
- [ ] 更新 i18n 文本 / Update i18n text
- [ ] 测试解锁流程 / Test the unlock flow

---

### 成就8 / Achievement 8: achievement8

| 属性 / Attribute         | 值 / Value                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| **ID**                   | `achievement8`                                                           |
| **名称 / Name**          | 成就8 / Achievement 8                                                    |
| **图标 / Icon**          | 💬                                                                       |
| **所属关卡 / Level**     | _待定 / TBD_                                                             |
| **难度 / Difficulty**    | _待定 / TBD_                                                             |
| **解锁条件 / Condition** | _待实现 / Pending implementation_                                        |
| **描述 / Description**   | 成就8描述（待实现） / Achievement 8 description (pending implementation) |
| **实现状态 / Status**    | ❌ 未实现 / Not implemented                                              |

**待办事项 / To-Do:**

- [ ] 定义成就名称和目标 / Define achievement name and goal
- [ ] 确定触发条件 / Determine trigger conditions
- [ ] 在对应关卡文件中编写触发逻辑 / Write trigger logic in the corresponding level file
- [ ] 更新 i18n 文本 / Update i18n text
- [ ] 测试解锁流程 / Test the unlock flow

---

### 成就9 / Achievement 9: achievement9

| 属性 / Attribute         | 值 / Value                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| **ID**                   | `achievement9`                                                           |
| **名称 / Name**          | 成就9 / Achievement 9                                                    |
| **图标 / Icon**          | 🎬                                                                       |
| **所属关卡 / Level**     | _待定 / TBD_                                                             |
| **难度 / Difficulty**    | _待定 / TBD_                                                             |
| **解锁条件 / Condition** | _待实现 / Pending implementation_                                        |
| **描述 / Description**   | 成就9描述（待实现） / Achievement 9 description (pending implementation) |
| **实现状态 / Status**    | ❌ 未实现 / Not implemented                                              |

**待办事项 / To-Do:**

- [ ] 定义成就名称和目标 / Define achievement name and goal
- [ ] 确定触发条件 / Determine trigger conditions
- [ ] 在对应关卡文件中编写触发逻辑 / Write trigger logic in the corresponding level file
- [ ] 更新 i18n 文本 / Update i18n text
- [ ] 测试解锁流程 / Test the unlock flow

---

### 成就10 / Achievement 10: achievement10

| 属性 / Attribute         | 值 / Value                                                                 |
| ------------------------ | -------------------------------------------------------------------------- |
| **ID**                   | `achievement10`                                                            |
| **名称 / Name**          | 成就10 / Achievement 10                                                    |
| **图标 / Icon**          | 👻                                                                         |
| **所属关卡 / Level**     | _待定 / TBD_                                                               |
| **难度 / Difficulty**    | _待定 / TBD_                                                               |
| **解锁条件 / Condition** | _待实现 / Pending implementation_                                          |
| **描述 / Description**   | 成就10描述（待实现） / Achievement 10 description (pending implementation) |
| **实现状态 / Status**    | ❌ 未实现 / Not implemented                                                |

**待办事项 / To-Do:**

- [ ] 定义成就名称和目标 / Define achievement name and goal
- [ ] 确定触发条件 / Determine trigger conditions
- [ ] 在对应关卡文件中编写触发逻辑 / Write trigger logic in the corresponding level file
- [ ] 更新 i18n 文本 / Update i18n text
- [ ] 测试解锁流程 / Test the unlock flow

---

## 系统架构 / System Architecture

### 核心文件 / Core Files

| 文件路径 / File Path                             | 功能描述 / Description                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `js/achievement system/AchievementData.js`       | 主成就数据定义和管理（全局）/ Main achievement data definition and management (global)               |
| `js/achievement system/Demo1AchievementData.js`  | Demo1 专用成就数据管理（localStorage 隔离）/ Demo1-specific achievement data (isolated localStorage) |
| `js/achievement system/AchievementToast.js`      | 成就解锁 Toast 提示组件 / Achievement unlock toast notification component                            |
| `js/ui/pages/static-pages/StaticPageAchieves.js` | 成就展示页面（UI）/ Achievement display page (UI)                                                    |
| `js/i18nDemo1.js`                                | 成就多语言文本定义 / Achievement multilingual text definitions                                       |

### 数据持久化 / Data Persistence

**localStorage 键 / localStorage Keys:**

- `kinoko_achievements` - 全局成就状态 / Global achievement state
- `kinoko_achievements_demo1` - Demo1 成就状态（支持向前兼容迁移）/ Demo1 achievement state (supports forward-compatible migration)

**存储格式 / Storage Format:**

```json
["perseverance", "selfjump", "prisoner"]
```

### 状态管理 / State Management

```javascript
// 获取所有成就 / Get all achievements
const allAchievements = Demo1AchievementData.getAll();

// 检查成就是否解锁 / Check if an achievement is unlocked
const isUnlocked = Demo1AchievementData.isUnlocked("perseverance");

// 手动解锁成就 / Manually unlock an achievement
Demo1AchievementData.unlock("perseverance");

// 获取解锁统计 / Get unlock statistics
const unlockedCount = Demo1AchievementData.getUnlockedCount(); // 3
const totalCount = Demo1AchievementData.getTotal(); // 10
```

---

## UI 展示 / UI Display

### 成就页面 / Achievement Page（StaticPageAchieves）

**布局 / Layout:**

- 5 列 × 2 行的成就卡片网格 / 5-column × 2-row achievement card grid
- 第1行：行为成就（坚持、无钮、囚犯等）/ Row 1: Behavior achievements (Perseverance, Self-Jump, Prisoner, etc.)
- 第2行：进度成就（成就4-10）/ Row 2: Progress achievements (Achievements 4–10)

**卡片设计 / Card Design:**

- **已解锁 / Unlocked:** 紫色背光 + 彩虹波浪文字 + 成就图标 / Purple backlight + rainbow wave text + achievement icon
- **未解锁 / Locked:** 暗紫色 + 🔒 锁定图标 + 灰色文字 / Dark purple + 🔒 lock icon + grey text
- 四角装饰迷你齿轮（旋转动画）/ Decorative mini gears in four corners (rotation animation)
- 悬浮提示框显示详细解锁条件 / Hover tooltip shows detailed unlock conditions

**交互 / Interaction:**

- 鼠标悬浮显示提示框 / Hover to show tooltip
- 点击返回按钮返回菜单 / Click back button to return to menu
- ESC 键快速返回 / ESC key to quickly return

---

## 实现指南 / Implementation Guide

### 添加新成就的步骤 / Steps to Add a New Achievement

#### 1. 定义成就 ID（已完成）/ Define Achievement ID (Already Done)

已在 `AchievementData.js` 和 `Demo1AchievementData.js` 中定义。

IDs are already defined in `AchievementData.js` and `Demo1AchievementData.js`.

#### 2. 添加多语言文本 / Add Multilingual Text

编辑 `js/i18nDemo1.js` / Edit `js/i18nDemo1.js`:

```javascript
achiev_achievement4_name: "你的成就名称",
achiev_achievement4_desc: "成就描述",
achiev_achievement4_unlock_desc: "解锁条件说明",
```

#### 3. 编写触发逻辑 / Write Trigger Logic

在对应关卡文件中（如 `Level2.js`）/ In the corresponding level file (e.g. `Level2.js`):

```javascript
// 检查条件 / Check condition
if (/* 某个条件满足 / some condition is met */) {
  Demo1AchievementData.unlock("achievement4");
  this._achievementToast.show("achievement_unlocked");
}
```

#### 4. 常见触发场景 / Common Trigger Scenarios

**场景 A：关卡完成时 / Scenario A: On Level Complete**

```javascript
onLevelComplete: () => {
  // 检查特定条件 / Check specific condition
  if (specialConditionMet) {
    Demo1AchievementData.unlock("achievement4");
  }
};
```

**场景 B：特定操作时 / Scenario B: On Specific Action**

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

**场景 C：按钮/碰撞检测时 / Scenario C: On Button / Collision Check**

```javascript
if (buttonPressed && !otherButtonPressed) {
  Demo1AchievementData.unlock("achievement4");
}
```

#### 5. 测试 / Testing

- 清除 localStorage 中的 `kinoko_achievements_demo1` / Clear `kinoko_achievements_demo1` from localStorage
- 进入游戏并尝试解锁条件 / Enter the game and attempt to trigger the unlock condition
- 检查成就页面是否显示解锁状态 / Check that the achievement page shows the unlocked state
- 刷新页面后检查持久化是否成功 / Refresh the page and verify persistence

---

## 多样化成就设计建议 / Diverse Achievement Design Suggestions

### 成就类型分类 / Achievement Type Classification

| 类型 / Type             | 描述 / Description                                     | 示例 / Example                                                                                                |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **完成类 / Completion** | 完成某个关卡或任务 / Complete a level or task          | 坚持不懈（重复操作）/ Perseverance (repeated action)                                                          |
| **挑战类 / Challenge**  | 满足特殊条件完成 / Complete under special conditions   | 无钮自通（跳过按钮）/ Self-Jump (skip buttons)                                                                |
| **失败类 / Failure**    | 陷入特殊状态 / Fall into a special state               | 囚犯（被困住）/ Prisoner (get trapped)                                                                        |
| **收集类 / Collection** | 收集全部物品/NPC对话 / Collect all items/NPC dialogues | 好学生（读所有牌）、社交达人（与NPC对话）/ Good Student (read all signs), Social Butterfly (talk to all NPCs) |
| **时间类 / Time**       | 在规定时间内完成 / Complete within a time limit        | _待实现 / Pending_                                                                                            |
| **技巧类 / Skill**      | 演示高超技能 / Demonstrate advanced skill              | 导演（录制功能）、幻影大师（回放完成）/ Director (recording), Phantom Master (complete with replay)           |
| **全局类 / Global**     | 跨多关卡的成就 / Achievement spanning multiple levels  | 完美主义者（全部通关）/ Perfectionist (clear all levels)                                                      |

### 设计平衡 / Design Balance

建议在制定新成就时考虑以下几点：

When designing new achievements, consider the following:

- ✅ **难度分布 / Difficulty Distribution** - 不全是简单的一键成就 / Not all achievements should be trivial one-step unlocks
- ✅ **玩法多样性 / Gameplay Variety** - 鼓励玩家尝试不同的通关方式 / Encourage players to try different approaches
- ✅ **故事相关性 / Story Relevance** - 与游戏主题或剧情相关 / Tie achievements to game themes or narrative
- ✅ **可发现性 / Discoverability** - 让玩家知道如何解锁 / Give players hints on how to unlock
- ✅ **价值感 / Sense of Value** - 达成时要有成就感 / Make the moment of unlocking feel rewarding

---

## 常见问题 / FAQ

### Q: 如何重置所有成就？/ How do I reset all achievements?

A: 打开浏览器控制台（F12），运行 / Open the browser console (F12) and run:

```javascript
localStorage.removeItem("kinoko_achievements_demo1");
location.reload();
```

### Q: 如何快速解锁某个成就用于测试？/ How do I quickly unlock an achievement for testing?

A: 在控制台运行 / Run in the console:

```javascript
Demo1AchievementData.unlock("achievement4");
```

### Q: 成就数据在哪里保存？/ Where is the achievement data stored?

A: 浏览器的 localStorage 中 / In the browser's localStorage:

- 键 / Key: `kinoko_achievements_demo1`
- 值 / Value: JSON 数组 / JSON array `["perseverance", "selfjump", "prisoner"]`

### Q: 能否在不同关卡间共享成就状态？/ Can achievement state be shared across levels?

A: 使用全局的 `AchievementData` 而非 `Demo1AchievementData`（目前 Demo1 使用独立数据管理）。

Use the global `AchievementData` instead of `Demo1AchievementData` (currently Demo1 uses an isolated data manager).

### Q: 成就卡片的彩虹波浪效果是如何实现的？/ How is the rainbow wave effect on achievement cards implemented?

A: 使用 DOM `<span>` 元素 + CSS `animation` + `@keyframes` 实现每个字符的上下波浪运动。见 `StaticPageAchieves._setRainbowContent()`。

Using DOM `<span>` elements + CSS `animation` + `@keyframes` to animate each character up and down in a wave motion. See `StaticPageAchieves._setRainbowContent()`.

---

## 更新日志 / Changelog

| 版本 / Version | 日期 / Date    | 更改 / Changes                                                                                           |
| -------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| v1.1           | 2026-04-30     | 文档双语化（中英文）/ Bilingual documentation (Chinese & English)                                        |
| v1.0           | 2026-04-11     | 初版文档 + 成就 ID 改名（4-10 号）/ Initial documentation + achievement ID rename (4–10)                 |
| v0.1           | _之前 / Prior_ | 原始成就系统实现（3个已完成成就）/ Original achievement system implementation (3 completed achievements) |

---

## 相关资源 / Related Resources

- **成就图标参考 / Achievement Icon Reference** - 各成就 emoji 和主题配色 / Each achievement's emoji and theme color
- **UI 样式表 / UI Stylesheet** - `static/style.css` 中的 `.achiev-*` 类 / `.achiev-*` classes in `static/style.css`
- **关卡设计 / Level Design** - `js/level-design/demo1/` 目录 / `js/level-design/demo1/` directory
- **多语言系统 / Multilingual System** - `js/i18n.js` 文档 / `js/i18n.js` documentation
