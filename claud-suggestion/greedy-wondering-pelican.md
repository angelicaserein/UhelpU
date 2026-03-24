# 计划：生成代码重构问题分析文档

## Context

用户希望对"兜底版修改中-源自V17"项目进行认真重构前的问题梳理。
需要生成一份详尽的 Markdown 文档，涵盖：文件分类、代码格式、命名规范、功能职责等所有结构性问题。
已通过两个 Explore Agent 对 80+ 个代码文件进行了深度阅读分析，现在直接写入文档。

---

## 输出文件

**路径**：`d:\kinoko_bristol\TB2\Software_Engineering\小组游戏部分\我的工作\自己的库\兜底版修改中-源自V17\代码重构指南.md`

---

## 文档结构（7大类问题 + 重构路线图）

### 第一类：目录与文件命名混乱
- 目录大小写不一致：`switchers/`、`ui/` 用小写，其他系统目录（`CharacterControlSystem/`、`CollideSystem/`等）用大驼峰
- `each-level-design/` 用破折号，风格与所有其他目录不符
- `CollideSystem/` 名称不规范（Collide 非标准英文，应为 Collision）
- 关卡逻辑文件夹（`each-level-design/`）与 UI 页面文件夹（`ui/pages/game-pages/`）割裂

### 第二类：代码格式问题（带具体文件+行号证据）
- 缩进不统一：`AppCoordinator.js` 用4空格，`Level2.js` 用2空格
- `ControllerManager.js:42` 存在多余空格
- `Signboard.js:30-32` 同一行赋值出现两次（复制粘贴错误）
- 花括号、空行风格混乱

### 第三类：命名规范混乱（带具体证据）
- 私有属性前缀 `_` 使用不一致（Player.js 有，但 Level2.js 的 `bgAssetKey` 没有）
- 方法名风格：`referenceOfPlayer()` vs `getPlayer()` vs `getReplayer()`
- 注释：中英文混用，装饰符号不统一（东亚破折号 vs 西方破折号）
- 打字错误："翰转"应为"翻转"，"敏住"应为"遵循"（Signboard.js:77）

### 第四类：模块职责违反单一责任原则（带具体行号）
- **AppCoordinator.js**：同时管理事件路由、关卡切换、BGM播放、UI控制（上帝类）
- **RecordSystem.js**（706行）：状态机 + 事件处理 + 数据管理 + UI绘制 全混在一起
- **LevelManager.js**：关卡管理 + 相机动画 + UI叠加层 + 坐标转换
- **BaseLevel.js**：实体管理 + 三个子系统 + 手动清理逻辑
- **Level2.js**：关卡逻辑 + 200行电线绘制代码内嵌

### 第五类：代码重复/冗余
- **GamePageLevel1/2/3**：后退按钮、暂停按钮、设置窗口、暂停逻辑 95%相同，应提取 `GamePageBase`
- **Player.js vs Replayer.js**：粒子效果、渲染、碰撞器初始化几乎完全相同，差别仅在 ControlMode
- **Level1/2/3 构造函数**：系统初始化流程完全相同，缺少模板方法模式
- **CollisionSystem.js**：同一碰撞检测循环重复3次（Dynamic-Dynamic）

### 第六类：模块耦合与架构问题
- **循环依赖**：`Signboard` 持有 `Level` 引用 → `Level` 发事件给 `GamePage` → `GamePage` 订阅 `Signboard` 事件
- **全局状态散落**：`GamePauseState.js`、`Level1PromptState.js` 是独立全局变量；`LevelManager.paused` 和 `GamePauseState.paused` 并存，容易不同步
- **EventBus 无类型安全**：事件名是魔法字符串，拼写错误无法被发现
- **GameEntity 接口不统一**：`update()` 在有些实体有、有些没有；`Portal.draw()` 修改了状态（副作用）；没有统一的生命周期定义

### 第七类：死代码与废弃内容
- `BaseLevel.updateAnimation()`：空实现，从未调用
- `RecordSystem.printRecords()`：纯 console.log 调试函数，不应留在生产代码
- `Character.js` 中多个空方法体（`createEventListeners()`、`clearEventListeners()`、`draw()`）
- CharacterControlSystem 中的 `设计思路.txt`、`待整理废稿.txt`（中文草稿文件混在代码目录）

---

## 重构路线图（文档末尾）
- 第一优先级：解决循环依赖、统一全局状态、拆分 RecordSystem UI
- 第二优先级：提取 GamePageBase、完善 Character 基类、模板方法统一 Level 初始化
- 第三优先级：统一目录命名、类型化 EventBus、清理死代码

---

## 执行步骤

使用 `Write` 工具将完整文档写入路径，内容来自两个 Explore Agent 的详细分析（含具体文件路径+行号+代码片段证据）。
