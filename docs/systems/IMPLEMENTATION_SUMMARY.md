# 教学系统实现总结 (2026-04-10)

## ✅ 完成的改动

### 1. TutorialManager.js（重写）
**关键功能**：
- 7 个 PHASE 状态管理（IDLE → GUIDE_RECORD → GUIDE_TIMELINE → RECORDING → GUIDE_REPLAY → REPLAYING → COMPLETE）
- 按键监听系统：
  - PHASE 1: 检测录制键
  - PHASE 2: 检测移动/跳跃键
  - PHASE 4: 检测回放键
- RecordSystem 轮询（100ms 间隔）检测：
  - Recording → ReadyToReplay (PHASE 3→4)
  - Replaying → ReadyToRecord (PHASE 5→6)
- 暂停菜单禁用通过 `window._tutorialPauseMenuDisabled` 标志
- ESC 全局处理（完全退出教程）

### 2. TutorialState.js（完全重写）
**7 个 PHASE 状态类**：
- `IdleState`: PHASE 0 - 待机
- `GuideRecordState`: PHASE 1 - 引导录制（暂停+镂空）
- `GuideTimelineState`: PHASE 2 - 引导时间轴（暂停+镂空）
- `RecordingState`: PHASE 3 - 录制进行（运行，无黑幕）
- `GuideReplayState`: PHASE 4 - 引导回放（暂停+三区域镂空）
- `ReplayingState`: PHASE 5 - 回放进行（运行，无黑幕）
- `CompleteState`: PHASE 6 - 完成（3秒后自动返回IDLE）

### 3. TutorialUI.js（增强）
**新增方法**：
- `showMultiplePrompts(prompts)` - 同时显示多个提示
- 支持"醒目提示"样式（PHASE 3, 5 用）
- 支持标签样式提示

**改进**：
- 所有提示框清理集中在 `_removeAllPrompts()`
- 语言切换实时更新所有提示文本

### 4. TutorialOverlay.js（修复）
**改进**：
- 支持 `width/height` 和 `w/h` 两种属性名
- 多区域镂空通过 clip-path polygon 实现
- PHASE 4 支持 3 个同时镂空的区域

### 5. GamePageBaseDemo2.js（修改）
**暂停菜单禁用**：
```javascript
_togglePause() {
  if (window._tutorialPauseMenuDisabled) return;
  // ... 原有逻辑
}
```

### 6. GamePageBase.js（同步修改）
**相同的暂停菜单禁用逻辑**

### 7. GamePageLevel1.js（修改）
**改进**：
- 传递 p5 实例给 TutorialManager: `this._p`

### 8. i18n-tutorial.js（更新）
**新的文本键**：
- `tutorial_guide_record_msg`
- `tutorial_guide_timeline_msg`
- `tutorial_recording_msg`
- `tutorial_guide_replay_msg`
- `tutorial_phantom_label`
- `tutorial_actions_label`
- `tutorial_replaying_msg`
- `tutorial_phantom_replaying_label`
- `tutorial_complete_msg`

### 9. css/style.css（新增）
**新增样式**：
- `.tutorial-prompt-highlight` - 醒目提示框（粉红色边框）

## 🎮 教程流程（用户交互）

```
PHASE 0 (IDLE)
↓ 玩家点击 signboard "开始教程"
PHASE 1 (GUIDE_RECORD) - 暂停，录制UI镂空
↓ 玩家按录制键 (C)
PHASE 2 (GUIDE_TIMELINE) - 暂停，时间轴镂空
↓ 玩家按移动/跳跃键
PHASE 3 (RECORDING) - 运行，正在录制
↓ 5秒或手动结束（RecordSystem 状态变为 ReadyToReplay）
PHASE 4 (GUIDE_REPLAY) - 暂停，三区域镂空
↓ 玩家按回放键 (R)
PHASE 5 (REPLAYING) - 运行，分身回放
↓ 5秒或手动结束（RecordSystem 状态变为 ReadyToRecord）
PHASE 6 (COMPLETE) - 完成提示，3秒后返回 PHASE 0（正常游玩）
```

## 🔑 关键技术细节

### 按键检测
- 使用 `KeyBindingManager.getIntentByKey()` 获取玩家绑定的按键
- 支持 "record", "replay", "moveLeft", "moveRight", "jump" 意图

### 状态轮询
- 每 100ms 检查一次 `recordSystem.state`
- 自动从 "Recording" → "ReadyToReplay" 和 "Replaying" → "ReadyToRecord" 转换

### ESC 处理
- 捕获事件（capture phase）以拦截 ESC
- 教程中 ESC 完全退出，不打开暂停菜单
- 恢复正常后，ESC 再次可用

### 黑幕镂空
- PHASE 1: 1 个区域（录制 UI）
- PHASE 2: 1 个区域（时间轴）
- PHASE 4: 3 个区域（录制 UI + 时间轴 + 分身）
- 使用 clip-path polygon 实现

## 📋 测试检查清单

- [ ] 启动 Easy Level 1，看到 signboard 的"开始教程"按钮
- [ ] 点击按钮，进入 PHASE 1，看到黑幕 + 录制 UI 镂空
- [ ] 按 C 键，转换到 PHASE 2，看到时间轴镂空
- [ ] 按方向键或 WASD，转换到 PHASE 3，黑幕消失，收到新提示
- [ ] 等待 5 秒或按 C 结束录制，转换到 PHASE 4，看到三区域镂空
- [ ] 按 R 键，转换到 PHASE 5，分身开始回放
- [ ] 等待回放完成或按 R 中断，转换到 PHASE 6
- [ ] 看到完成提示，3 秒后自动返回正常游玩
- [ ] 验证在教程中 ESC 不打开暂停菜单
- [ ] 验证教程结束后 ESC 可以正常打开暂停菜单
- [ ] 在 signboard 再次点击"开始教程"可重新启动教程

## 🐛 已知问题 & 限制

1. **分身显示时机**: 需要确认分身是否从 PHASE 4 开始显示（取决于 RecordSystem 何时创建 replayer）
2. **录制键检测**: 依赖 RecordSystem 没有 EventBus 事件，使用轮询可能有延迟
3. **多语言**: 所有文本已i18n化，但需要验证中英文显示正确

## 📝 后续可能的优化

1. 为 RecordSystem 添加状态变化事件，替代轮询
2. 为成就卡片添加键盘导航支持
3. 为滚动故事文本添加 Space/Enter 快进支持
4. 添加可选的声音反馈（导航时发出音效）
