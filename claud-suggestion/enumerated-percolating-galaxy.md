# 代码审查修复计划

## Context

对重构后的代码库进行严格审查，发现若干真实 Bug、死代码、架构不一致问题。目标：修复 Bug、清除垃圾文件、保持结构对未来扩展友好。

---

## 一、真实 Bug（必须修复）

### Bug 1：实体监听器泄漏（高优先级）
**文件**：`js/level-design/BaseLevel.js`（`clearLevel()`），`js/game-entity-model/interactables/Signboard.js`

**问题**：`GameEntity.js` 声明了 `onDestroy()` 生命周期钩子（注释写明"called when entity is removed"），但 `BaseLevel.clearLevel()` 从未调用它。`Signboard` 游戏实体在构造函数中用 `document.addEventListener("keydown"/"keyup")` 注册了键盘监听，但离开关卡时这些监听从未被清理。

**后果**：每次进入/离开 Level 1，残留的 `Signboard` 键盘监听会积累，可能触发幽灵交互或内存泄漏。

**修复方案**：
在 `BaseLevel.clearLevel()` 中，遍历 `this.entities`，对每个实体调用 `onDestroy()`（如已有 `clearListeners()` 也需统一化）：
```js
// BaseLevel.clearLevel() 末尾，entities.clear() 之前加：
for (const entity of this.entities) {
  if (typeof entity.onDestroy === 'function') {
    entity.onDestroy();
  }
}
```
并在 `Signboard.js` 中实现 `onDestroy()`，调用 `this.clearListeners()`：
```js
onDestroy() { this.clearListeners(); }
```

---

## 二、死代码 / 垃圾文件（应删除）

| 文件 | 原因 |
|------|------|
| `js/ui/components/Signboard.js` | 无任何文件 import 它；旧 DOM 方案，已被 `game-entity-model/interactables/Signboard.js` 取代 |
| `js/ui/components/SliderBase.js` | 文件内容完全为空，没有任何实现 |
| `js/ui/windows/WindowPrompt_USAGE.js` | 纯文档/示例代码，不应作为 `.js` 源文件存放于 windows 目录 |
| `_fix_check.js`（根目录） | 临时调试文件 |
| `test.js`（根目录） | 临时测试文件 |
| `temp_exit.txt`（根目录） | 临时文本文件 |
| `js/collision-system/UML-CollideSystem.png` | 图片资源，不应放在源码目录 |

---

## 三、架构不一致（应修复）

### Issue 1：`EventTypes.js` 从未被使用
**文件**：`js/event-system/EventTypes.js`，`js/AppCoordinator.js`

`EventTypes.js` 定义了所有事件名常量，但代码中所有的 `eventBus.subscribe()` 和 `eventBus.publish()` 调用均使用原始字符串字面量（如 `"loadLevel"`、`"autoResult"` 等）。这使得 `EventTypes.js` 完全是死代码。

**修复方案**：在 `AppCoordinator.js` 中 import 并使用 `EventTypes` 常量替换字符串字面量，并检查 `CollisionSystem.js`、`Signboard.js` 等发布事件的位置同步修改。

### Issue 2：`Level1.js` 遗留注释
**文件**：`js/level-design/Level1.js` 第 68 行

```js
// ...existing code...
```

这是 Copilot 自动生成的占位注释，应删除。

---

## 四、文件夹分类问题（建议调整）

| 问题 | 说明 | 建议 |
|------|------|------|
| `js/game-runtime/Level1PromptState.js` | 是 Level 1 专属逻辑状态，与 `game-runtime/` 通用运行时状态不匹配 | 移动到 `js/level-design/` 或新建 `js/level-design/states/Level1PromptState.js` |
| `js/collision-system/UML-CollideSystem.png` | 图片资源 | 移动到根目录 `docs/` 文件夹 |

---

## 五、非严重但值得关注

| 问题 | 文件 | 说明 |
|------|------|------|
| `Level2.draw()` 完全覆盖 `BaseLevel.draw()` | `js/level-design/Level2.js` | 绕过了父类的 zIndex 排序逻辑，目前可用，但未来 BaseLevel.draw() 改动不会影响 Level2 |
| `SwitcherStaticPage.eventBus` 延迟初始化 | `js/switchers/SwitcherStaticPage.js` | 首次调用 `showMainMenu()` 才会赋值，若直接调用 `showLevelChoice()` 则 eventBus 为 null |
| `CollisionSystem` 分区用字符串字面量 | `js/collision-system/CollisionSystem.js:71` | `switch(colliderType)` 的 case 用 `"DYNAMIC"/"STATIC"/"TRIGGER"` 而非 `ColliderType.DYNAMIC` 等枚举 |

---

## 六、关键文件变更清单

**需修改**：
- `js/level-design/BaseLevel.js` — Bug 1 修复
- `js/game-entity-model/interactables/Signboard.js` — 添加 `onDestroy()`
- `js/AppCoordinator.js` — 使用 `EventTypes` 常量
- `js/level-design/Level1.js` — 删除 `// ...existing code...`

**需删除**：
- `js/ui/components/Signboard.js`
- `js/ui/components/SliderBase.js`
- `js/ui/windows/WindowPrompt_USAGE.js`
- `_fix_check.js`
- `test.js`
- `temp_exit.txt`
- `js/collision-system/UML-CollideSystem.png`

**需移动（可选）**：
- `js/game-runtime/Level1PromptState.js` → `js/level-design/Level1PromptState.js`（同时更新所有 import）

---

## 七、验证方式

1. 打开游戏，进入 Level 1，与木牌交互
2. 退出关卡回到菜单，重新进入 Level 1
3. 再次与木牌交互 — 应只触发一次，不会因残留监听触发多次
4. 检查浏览器控制台无报错
5. 所有已删除文件确认不再被任何 import 引用
