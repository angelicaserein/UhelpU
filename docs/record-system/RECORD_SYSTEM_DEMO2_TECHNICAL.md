# Demo2 录制系统技术文档（Record System）

## 1. 文档范围

本文仅描述 Demo2 模式下的录制系统（record / replay）实现，不覆盖 demo1/easy/hard 的 UI 风格差异。

说明：仓库根目录下 `demo-2/` 目录当前为空；实际 Demo2 关卡与录制逻辑位于 `js/level-design/demo2/` 与 `js/record-system/`。

## 2. 关键代码位置

- 录制核心状态机：`js/record-system/RecordSystem.js`
- 录制输入采样容器：`js/record-system/Clip.js`
- Demo2 HUD/时间轴渲染：`js/record-system/Demo2RecordUI.js`
- 基类系统初始化（标准入口）：`js/level-design/BaseLevel.js`
- Demo2 关卡示例（Level1）：`js/level-design/demo2/Level1.js`
- Demo2 关卡注册：`js/level-registry.js`
- 全局暂停对 RecordSystem 的接入：`js/level-design/LevelManager.js`

## 3. Demo2 接入链路

### 3.1 关卡构造阶段

在 Demo2 各关卡中，会通过以下方式初始化系统（示例来自 Level1）：

```js
this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });
```

`initSystems(...)` 在 `BaseLevel` 中创建 `RecordSystem` 并调用 `createListeners()` 绑定键盘监听。

### 3.2 运行时调用顺序

1. 键盘事件进入 `RecordSystem.eventHandler(event)`
2. `process(event)` 将键位映射为意图（record/replay）
3. `transition(intent)` 进行状态迁移并执行动作函数
4. `draw(p)` 委托 `Demo2RecordUI.draw(...)` 绘制 HUD 和动作时间轴

## 4. 状态机设计

RecordSystem 使用 4 态有限状态机：

- `ReadyToRecord`
- `Recording`
- `ReadyToReplay`
- `Replaying`

状态迁移规则（简化）：

- `ReadyToRecord --record--> Recording`
- `Recording --record / RecordTimeout--> ReadyToReplay`
- `ReadyToReplay --replay--> Replaying`
- `ReadyToReplay --record--> Recording`（重录）
- `Replaying --ReplayTimeout / replay--> ReadyToReplay`

其中：

- `record` 与 `replay` 是“意图（intent）”，由 `KeyBindingManager` 根据当前键位绑定解析。
- `RecordTimeout`/`ReplayTimeout` 由定时器触发。

## 5. 输入采样与数据结构

### 5.1 采样来源

`Clip` 负责在录制期间监听 `keydown/keyup` 并记录。

每条记录结构：

```js
{
  keyType: "keydown" | "keyup",
  code: "ArrowLeft" | "KeyA" | ...,
  time: number // 相对录制起点的毫秒
}
```

### 5.2 去重与过滤

- 只允许移动/跳跃相关键位（支持按键绑定 + 方向键 + Space）
- 同键连续 `keydown` 会被 `_pressedKeys` 去重
- 暂停期间输入被丢弃（`isGamePaused()`）

### 5.3 初始按键注入

开始录制时会把“已按住”的移动键注入为 `t=0` 的 `keydown`，用于保证回放起步状态一致。

## 6. 回放调度机制

`RecordSystem.dispatchEvent()` 会对记录排序并建立 `_replayRecords` + `_replayCursor`。

回放过程中：

1. `scheduleNextReplayEvent()` 计算下一事件触发延迟
2. `flushDueReplayEvents()` 批量触发到期事件
3. `triggerKey(record)` 构造 `KeyboardEvent` 并 `window.dispatchEvent(...)`

实现细节：

- 使用 `time <= elapsed + 0.5` 的容差，降低边界误差导致的漏触发
- 保证 `t=0` 注入事件在回放开始时立即生效

## 7. Demo2 UI（Demo2RecordUI）

Demo2 UI 与默认 `RecordUI` 区分明显：

- 视觉风格：复古像素硬边 + 紫色系主题
- 信息结构：状态标题、按键提示、进度条、操作时间轴
- 时间轴标记：将操作映射为三类 icon
  - `moveLeft` -> `←`
  - `moveRight` -> `→`
  - `jump` -> `↑`

### 7.1 操作提取

`RecordSystem._extractRecordedActions()` 将 `clip.records` 中 `keydown` 事件映射为：

```js
{ time: number, action: "moveLeft" | "moveRight" | "jump" }
```

该数组传入 `Demo2RecordUI.draw(...)`，用于下半区时间轴绘制。

### 7.2 空中录制拦截提示

当玩家离地且处于可开始录制状态（`ReadyToRecord` / `ReadyToReplay`）时：

- `RecordSystem` 拦截 `record` 触发
- 刷新 `_airBlockFlashMs`
- UI 渲染阻断提示（`rec_blocked_air`）

## 8. 暂停与恢复

`LevelManager` 在游戏暂停/恢复时调用：

- `recordSystem.pauseForGamePause()`
- `recordSystem.resumeFromGamePause()`

录制暂停：

- 记录 `_pausedRecordElapsed`
- 清理录制定时器
- 恢复时重算 `recordStartTime` 并重建剩余定时器

回放暂停：

- 记录 `_pausedReplayElapsed`
- 清理回放总定时器与事件调度定时器
- 恢复时重建回放定时器并从已播进度继续调度

## 9. 与 Demo2 关联的实现约定

- Demo2 关卡通常显式传入 `{ uiClass: Demo2RecordUI }`
- 录制时长在当前代码中多为 `5000ms`
- 关卡销毁需调用 `recordSystem.clearAllListenersAndTimers()` 防止监听器残留

## 10. 扩展建议（针对 Demo2）

### 10.1 新增操作类型

若要支持冲刺/下蹲等动作：

1. 在 `Clip._getAllowedKeys()` 放行对应按键
2. 在 `_extractRecordedActions()` 增加 action 映射
3. 在 `Demo2RecordUI._drawActionTimeline()` 增加图标与颜色规则

### 10.2 UI 可配置化

可将 `COLOR_PALETTE` 与布局参数抽离到配置模块，避免 Demo2 UI 内部硬编码。

### 10.3 回放精度增强

当前基于 `setTimeout` 调度。若后续需要更高精度，可考虑：

- 使用固定帧步进队列
- 或统一由主循环按 `elapsed` 拉取并触发到期事件

## 11. 快速排错清单（Demo2）

- 按录制键无反应：检查是否离地（空中会被拦截）
- 回放不触发：检查 `recordEndTime > recordStartTime`，并确认 `clip.records` 非空
- UI 不显示：检查 `recordSystem._hudVisible` 与 `draw()` 调用链
- 暂停后错位：检查 `pauseForGamePause/resumeFromGamePause` 是否被 LevelManager 正确触发
