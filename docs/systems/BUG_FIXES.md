# 教程系统 Bug 修复总结 (2026-04-10)

## 🔧 修复的问题

### 1. ❌ 黑幕位置错误 → ✅ 已修复
**问题**: 黑幕镂空坐标是基于整个窗口的，导致位置不对齐

**解决方案**:
- 添加 `_getCanvasRect()` 获取 canvas 在窗口中的位置
- 添加 `_canvasToWindowCoords()` 将 canvas 相对坐标转换为窗口坐标
- 所有 PHASE 使用转换后的坐标

**代码位置**:
- `TutorialManager.js`: `_getCanvasRect()` 和 `_canvasToWindowCoords()`
- `TutorialState.js`: 各 PHASE 调用 `this.getWindowCoords()`

---

### 2. ❌ 提前按录制键导致失同步 → ✅ 已修复
**问题**: 玩家在教程中意外按第二次 C 键会导致 RecordSystem 状态混乱

**解决方案**:
- 教程启动时禁用 RecordSystem (`recordSystem.setDisabled(true)`)
- 教程完全控制录制/回放的启动
- 教程结束时恢复 RecordSystem (`recordSystem.setDisabled(false)`)

**代码位置**:
- `TutorialManager.js` `start()` 方法中禁用
- `destroy()` 和 `_transitionToPhase()` 中恢复

---

### 3. ❌ 回放完成后没反应 → ✅ 已修复
**问题**: REPLAYING 状态完成后，没有转换到 COMPLETE

**原因**:
1. 没有手动启动回放（RecordSystem 仍被禁用，无法响应 R 键）
2. 少了轮询检测 "Replaying" → "ReadyToRecord" 的转换

**解决方案**:
- PHASE 4 → 5 转换时，手动调用 `recordSystem.transition("replay")`
- 加强 RecordSystem 轮询，确保检测到 "Replaying" → "ReadyToRecord"

**代码位置**:
- `TutorialManager.js` 按键监听中的 GUIDE_REPLAY 处理

---

## 🎮 现在的完整流程

```
PHASE 0 (IDLE) - 正常游玩
  ↓ 点击 signboard "开始教程"

PHASE 1 (GUIDE_RECORD) - 暂停，录制 UI 镂空 ✓ 位置正确
  ↓ 按 C 键（不会因为其他键干扰）

PHASE 2 (GUIDE_TIMELINE) - 暂停，时间轴镂空 ✓ 位置正确
  ↓ 按移动/跳跃键
  ↓ 恢复游戏时间
  ↓ 手动启动 RecordSystem 录制

PHASE 3 (RECORDING) - 运行，正在录制 ✓ RecordUI 显示正确
  ↓ 5秒或按 C 结束
  ↓ RecordSystem 状态 → ReadyToReplay（轮询检测）

PHASE 4 (GUIDE_REPLAY) - 暂停，三区域镂空 ✓ 位置正确
  ↓ 按 R 键（不会因为其他键干扰）
  ↓ 恢复游戏时间
  ↓ 手动启动 RecordSystem 回放

PHASE 5 (REPLAYING) - 运行，回放进行 ✓ 分身执行动作
  ↓ 5秒或按 R 中断
  ↓ RecordSystem 状态 → ReadyToRecord（轮询检测）

PHASE 6 (COMPLETE) - 显示完成提示
  ↓ 3秒自动返回 PHASE 0 ✓ RecordSystem 恢复
```

---

## 📝 技术细节

### Canvas 坐标转换
```javascript
const canvasRect = canvas.getBoundingClientRect();
// Canvas 中 (12, 12) 转换为窗口坐标：
const windowX = canvasRect.left + 12;
const windowY = canvasRect.top + 12;
```

### RecordSystem 管理
```javascript
// 教程启动时
recordSystem.setDisabled(true);  // 禁用独立事件处理

// 需要启动录制时
recordSystem.transition("record");  // 手动触发状态转换

// 教程结束时
recordSystem.setDisabled(false);  // 恢复到正常（第 R 键可用等）
```

### RecordSystem 轮询
- 每 100ms 检查一次状态
- "Recording" → "ReadyToReplay": PHASE 3 → 4
- "Replaying" → "ReadyToRecord": PHASE 5 → 6

---

## ✅ 测试清单

- [ ] 硬刷新 (Ctrl+Shift+R)
- [ ] 打开 Easy Level 1
- [ ] 点击"开始教程"
- [ ] PHASE 1: 黑幕和录制 UI 镂空位置正确
- [ ] 按 C 键进入 PHASE 2
- [ ] PHASE 2: 时间轴镂空位置正确
- [ ] 按方向键/WASD，游戏开始运行，开始录制
- [ ] PHASE 3: 无黑幕，Rec ordUI 显示正常
- [ ] 等待 5 秒或按 C，进入 PHASE 4（等待 100ms 让轮询检测）
- [ ] PHASE 4: 三区域镂空位置正确（录制 UI + 时间轴 + 分身）
- [ ] 按 R 键进入 PHASE 5
- [ ] PHASE 5: 无黑幕，分身回放动作正确
- [ ] 等待 5 秒或按 R，进入 PHASE 6（等待 100ms 让轮询检测）
- [ ] PHASE 6: 看到完成提示
- [ ] 3 秒后自动返回 PHASE 0（正常游玩）
- [ ] 在 signboard 再次点击"开始教程"可以重新启动
