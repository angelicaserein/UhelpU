# 计时系统技术文档 / Timer System Technical Documentation

## 1. 范围 / Scope

本文档说明项目中的关卡计时实现，覆盖：

This document describes the level timing implementation in the project, covering:

- 计时核心状态机 / Core timer state machine
- 与事件总线的集成 / Integration with the event bus
- 暂停/恢复 / Pause / Resume
- 通关后与排行榜提交流程 / Post-completion leaderboard submission flow
- 计时快照与恢复 / Timer snapshot and restoration

核心源码 / Core source files：

- `js/timer-system/TimerSystem.js`
- `js/timer-system/LevelTimerManager.js`
- `js/timer-system/TimerConfig.js`

## 2. 架构 / Architecture

计时系统分两层：

The timer system is divided into two layers:

1. `TimerSystem`

- 纯计时核心 / Pure timing core
- 不依赖 UI、不依赖 EventBus / No dependency on UI or EventBus
- 负责状态与毫秒计算 / Manages state and millisecond calculations

2. `LevelTimerManager`

- 关卡级封装 / Level-scoped wrapper
- 监听游戏事件驱动 `TimerSystem` / Listens to game events to drive `TimerSystem`
- 对接通关成绩上报（`window.submitScore`）/ Interfaces with score submission (`window.submitScore`)
- 暴露给 UI 的时间查询接口 / Exposes time query interface to UI

## 3. TimerSystem 设计 / TimerSystem Design

`TimerSystem` 状态 / States：

- `idle`
- `running`
- `paused`
- `finished`

关键字段 / Key fields：

- `_startTime`
- `_pauseTime`
- `_accumulatedPausedTime`
- `_finalTime`

核心方法 / Core methods：

- `start()`：`idle -> running`
- `pause()`：`running -> paused`
- `resume()`：`paused -> running`
- `finish()`：`running -> finished`
- `reset()`：重置回 `idle` / Resets back to `idle`
- `getElapsedTime()`：返回秒（含小数）/ Returns elapsed seconds (with decimals)
- `getFormattedTime('mm:ss')`
- `exportSnapshot()` / `restoreSnapshot(snapshot)`

计时公式（简化）/ Timing formula (simplified)：

- `elapsed = end - start - pausedDuration`

其中 / Where：

- `end = now`（running）
- `end = pauseTime`（paused）
- `end = finalTime`（finished）

## 4. LevelTimerManager 事件接入 / LevelTimerManager Event Integration

`LevelTimerManager` 监听以下事件 / listens to the following events：

1. `LOAD_LEVEL`

- 命中当前 `levelId` 时：`timer.reset()` / When matching current `levelId`: `timer.reset()`
- `_firstInputDetected = false`

2. `GAME_FIRST_INPUT`

- 若首次输入且状态 `idle`：调用 `timer.start()` / If first input and state is `idle`: calls `timer.start()`
- 避免关卡加载后就自动计时 / Prevents timer from starting automatically on level load

3. `PAUSE_GAME`

- 运行中时调用 `timer.pause()` / Calls `timer.pause()` while running

4. `RESUME_GAME`

- 暂停时调用 `timer.resume()` / Calls `timer.resume()` while paused

5. `AUTO_RESULT`

- `resultType === 'autoResult1'` 且正在运行 / and timer is running：
  - `elapsed = timer.finish()`
  - 写入 `window.finalScore` / Writes to `window.finalScore`
  - 满足难度条件时自动上报排行榜 / Automatically submits to leaderboard when difficulty conditions are met

## 5. 与排行榜联动 / Leaderboard Integration

在 `AUTO_RESULT` 分支中 / In the `AUTO_RESULT` branch：

- 支持排行榜的关卡前缀：`easy_`、`hard_` / Supported level prefixes for leaderboard: `easy_`, `hard_`
- 通过 `window.submitScore(window.playerName, elapsedMs, levelId)` 提交 / Submitted via `window.submitScore(window.playerName, elapsedMs, levelId)`
- 提交异步执行，不阻塞结算流程 / Submission is async and does not block the result flow

依赖条件 / Prerequisites：

- `window.submitScore` 可用（由 `firebase-init.js` 挂载）/ available (mounted by `firebase-init.js`)
- `window.playerName` 已设置 / has been set

## 6. 计时快照机制 / Timer Snapshot Mechanism

用于关卡切换、重载等场景中的时间保留 / Used to preserve timing across level switches and reloads：

- `LevelTimerManager.captureSnapshot()` 返回 / returns：
  - `levelId`
  - `firstInputDetected`
  - `timer`（来自 `TimerSystem.exportSnapshot()` / from `TimerSystem.exportSnapshot()`）

- `LevelTimerManager.restoreSnapshot(snapshot)`：
  - 先校验 `snapshot.levelId === this.levelId` / First validates `snapshot.levelId === this.levelId`
  - 再恢复 timer 状态和累计时间 / Then restores timer state and accumulated time

`TimerSystem.restoreSnapshot()` 支持恢复到 / supports restoring to：

- `idle`
- `running`
- `paused`
- `finished`

## 7. 配置入口 / Configuration

`TimerConfig.js` 负责按 `levelId` 管理开关 / manages enable/disable per `levelId`。

`LevelTimerManager` 构造时 / On construction：

- 若显式传 `config.enabled`，优先使用 / If `config.enabled` is explicitly passed, it takes priority
- 否则回退到 `TIMER_CONFIG[levelId].enabled` / Otherwise falls back to `TIMER_CONFIG[levelId].enabled`

## 8. 常见排查 / Troubleshooting

1. 计时不开始 / Timer does not start

- 检查是否触发了 `GAME_FIRST_INPUT` / Check whether `GAME_FIRST_INPUT` was fired
- 检查 `levelId` 是否在 `TimerConfig` 中启用 / Check whether `levelId` is enabled in `TimerConfig`

2. 暂停后时间继续走 / Timer continues after pause

- 检查是否发布了 `PAUSE_GAME` / Check whether `PAUSE_GAME` was published
- 检查 `LevelTimerManager` 是否正确绑定 EventBus / Check whether `LevelTimerManager` is correctly bound to EventBus

3. 通关不提交排行榜 / Completion does not submit to leaderboard

- 检查 `levelId` 前缀是否为 `easy_`/`hard_` / Check whether `levelId` prefix is `easy_` or `hard_`
- 检查 `window.submitScore` 与 `window.playerName` / Check `window.submitScore` and `window.playerName`

4. 重载后时间丢失 / Time lost after reload

- 检查快照是否在上层被 capture + restore / Check whether snapshot was captured and restored at the higher level

## 9. 对外接口摘要 / Public Interface Summary

给 UI 的主要接口 / Main interfaces exposed to UI：

- `getElapsedTime()`
- `getFormattedTime()`
- `getState()`

生命周期 / Lifecycle：

- 初始化后自动绑定监听 / Listeners are automatically bound after initialization
- 页面退出时必须调用 `cleanup()` 解绑 / Must call `cleanup()` on page exit to unbind
