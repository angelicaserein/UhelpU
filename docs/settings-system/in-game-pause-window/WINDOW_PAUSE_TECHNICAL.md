# WindowPause 技术文档

## 概述

`WindowPause` 是游戏内暂停悬浮窗，继承自 `WindowBase`。玩家按下 ESC 或点击暂停按钮时弹出，提供继续游戏、设置、提示、重新开始、返回关卡选择、返回主菜单六个操作入口。

**文件位置：** `js/ui/windows/WindowPause.js`

---

## 架构

```
WindowBase（可拖拽悬浮窗基类）
  └─ WindowPause
        ├─ 标题栏（可拖拽）
        ├─ _hint（提示文字）
        ├─ _resumeBtn（继续）
        ├─ _settingBtn（设置）
        ├─ _hintBtn（提示）
        ├─ _restartBtn（重新开始）
        ├─ _levelChoiceBtn（返回关卡选择）
        └─ _menuBtn（返回主菜单）
```

`WindowPause` 不直接管理游戏状态。它只调用外部通过 `callbacks` 参数传入的回调函数，由上层的 `GamePageBaseDemo1` / `GamePageBaseDemo2` 负责实际的暂停/恢复逻辑。

---

## 构造函数

```js
new WindowPause(p, callbacks);
```

| 参数        | 类型     | 说明                                 |
| ----------- | -------- | ------------------------------------ |
| `p`         | `p5`     | p5 实例                              |
| `callbacks` | `object` | 各按钮的回调函数（见下表），全部可选 |

### callbacks 参数

| 回调键              | 触发时机                          | 典型实现                                    |
| ------------------- | --------------------------------- | ------------------------------------------- |
| `onResume`          | 点击"继续"或关闭按钮（✕）或按 ESC | 恢复游戏循环、隐藏暂停标志                  |
| `onSetting`         | 点击"设置"                        | 打开 `WindowSetting`                        |
| `onHint`            | 点击"提示"                        | 打开 `WindowHint`                           |
| `onRestartLevel`    | 点击"重新开始"                    | 发布 `EventTypes.LOAD_LEVEL` 重载当前关卡   |
| `onBackLevelChoice` | 点击"返回关卡选择"                | 发布 `EventTypes.RETURN_LEVEL_CHOICE`       |
| `onBackMenu`        | 点击"返回主菜单"                  | 发布 `EventTypes.UNLOAD_LEVEL` 后跳转主菜单 |

### 示例（来自 GamePageBaseDemo2）

```js
this._windowPause = new WindowPause(p, {
  onResume: () => this._resumeGame(),
  onSetting: () => this._windowSetting.open(),
  onHint: () => this._onHint(),
  onRestartLevel: () => {
    this._resumeGame();
    this.switcher.eventBus.publish(EventTypes.LOAD_LEVEL, this._levelIndex);
  },
  onBackLevelChoice: () => {
    this._resumeGame();
    this.switcher.eventBus.publish(EventTypes.RETURN_LEVEL_CHOICE);
  },
  onBackMenu: () => {
    this._resumeGame();
    this.switcher.eventBus.publish(EventTypes.UNLOAD_LEVEL);
    this.switcher.main.staticSwitcher.showMainMenu(p);
  },
});
```

---

## 公开 API

继承自 `WindowBase`，完整 API 如下：

| 方法        | 说明                                                   |
| ----------- | ------------------------------------------------------ |
| `open()`    | 显示窗口，激活键盘导航，z-index 设为最高（2147483646） |
| `close()`   | 隐藏窗口，停用键盘导航                                 |
| `toggle()`  | 切换显隐（在 `open`/`close` 间切换）                   |
| `remove()`  | 销毁窗口 DOM 及所有事件监听，注销 i18n 监听器          |
| `isVisible` | `boolean`，当前是否可见                                |

---

## 键盘导航

`WindowPause` 在构造时调用 `enableKeyboardNavigation()`，按钮顺序如下：

1. 继续（Resume）
2. 设置（Setting）
3. 提示（Hint）
4. 重新开始（Restart Level）
5. 返回关卡选择（Back to Level Choice）
6. 返回主菜单（Back to Menu）

- **↑ / ↓**：在按钮间切换焦点（layout: vertical）
- **Enter / Space**：触发当前焦点按钮
- **ESC**：等同于点击"继续"，关闭窗口并恢复游戏

键盘导航在 `open()` 时自动激活，`close()` 时自动停用。

---

## 多语言支持（i18n）

`WindowPause` 在构造时注册 i18n 变更监听器，语言切换时自动调用 `_refreshLabels()` 更新所有按钮和标题文字。

相关 i18n 键：

| i18n 键                   | 含义                 |
| ------------------------- | -------------------- |
| `pause_title`             | 窗口标题             |
| `pause_hint`              | 说明文字（标题下方） |
| `pause_resume`            | 继续按钮             |
| `pause_setting`           | 设置按钮             |
| `pause_hint_btn`          | 提示按钮             |
| `pause_restart`           | 重新开始按钮         |
| `pause_back_level_choice` | 返回关卡选择按钮     |
| `pause_back_menu`         | 返回主菜单按钮       |

---

## 生命周期

```
GamePage 构造时
  └─ new WindowPause(p, callbacks)   // 创建 DOM，注册 i18n 监听

玩家按 ESC / 点击暂停按钮
  └─ _windowPause.open()            // 显示窗口，激活键盘导航

玩家点击任意按钮
  └─ 执行对应 callback
  └─ 需要关闭的操作（继续/重启/返回）内部自动调用 close()

GamePage 销毁时
  └─ _windowPause.remove()          // 移除 DOM，注销所有监听器
```

---

## 与其他窗口的交互

- **WindowSetting**：`onSetting` 回调打开设置窗口，两窗口可同时可见（不互斥）。
- **WindowHint**：`onHint` 回调打开提示窗口，同样不互斥。
- **WindowPause 本身**不负责冻结游戏循环。游戏暂停/恢复由 `GamePageBaseDemo1._pauseGame()` / `_resumeGame()` 实现（停止/启动 p5 `draw` 循环）。

---

## 集成方式（在新 GamePage 中使用）

1. 在 `GamePage` 构造函数中创建实例并传入 callbacks。
2. 在键盘 `keydown` 监听中，ESC 键调用 `this._windowPause.open()`（或 `toggle()`）。
3. 在 `GamePage.remove()` 中调用 `this._windowPause.remove()` 清理。

---

## 相关文件

| 文件                                          | 说明                                       |
| --------------------------------------------- | ------------------------------------------ |
| `js/ui/windows/WindowPause.js`                | 暂停窗口主体                               |
| `js/ui/windows/WindowBase.js`                 | 悬浮窗基类（拖拽、开关、键盘导航支持）     |
| `js/ui/keyboard/KeyboardNavigationManager.js` | 键盘导航管理器                             |
| `js/ui/pages/game-pages/GamePageBaseDemo1.js` | Demo1 游戏页面，包含 WindowPause 集成示例  |
| `js/ui/pages/game-pages/GamePageBaseDemo2.js` | Demo2 游戏页面，包含 WindowPause 集成示例  |
| `js/i18n/index.js`                            | i18n 系统，提供 `t()` 和 `i18n.onChange()` |
