# 🎮 键盘导航系统技术文档 / Keyboard Navigation System — Technical Documentation

## 概述 / Overview

本系统实现了**完整的系统级键盘导航**。  
This system implements **full system-level keyboard navigation**.

- ✅ 所有 Page（页面）自动支持键盘导航 / All Pages automatically support keyboard navigation
- ✅ 所有 Window（浮窗）自动支持键盘导航 / All Windows automatically support keyboard navigation
- ✅ 每个页面的按钮都能通过键盘控制 / Every button on each page is keyboard-controllable
- ✅ 按钮回调完全正确执行 / Button callbacks execute correctly

---

## 架构 / Architecture

### 三层导航系统 / Three-Layer Navigation System

```
PageBase (基类 / Base Class)
├── registerNavButtons(buttons, options)  调用以注册按钮 / Call to register buttons
├── enter() → _enablePageNavigation()    自动启用 / Auto-enabled
└── exit() → _disablePageNavigation()    自动禁用 / Auto-disabled
    │
    └── KeyboardNavigationManager
        ├── activate()               启用键盘监听 / Enable keyboard listening
        ├── _handleKeyDown()         处理键盘输入 / Handle key input
        └── _activateCurrentButton() 激活按钮 / Activate button

GamePageBase extends PageBase
├── 返回按钮 (Back Button)
├── 暂停按钮 (Pause Button)
└── registerNavButtons() 注册以上按钮 / Registers the above buttons

WindowBase
├── enableKeyboardNavigation() 注册按钮 / Register buttons
├── open() → _initKeyboardNav()         自动启用 / Auto-enabled
└── close() → _cleanupKeyboardNav()     自动禁用 / Auto-disabled
```

---

## Page 级别的键盘导航 / Page-Level Keyboard Navigation

### 为页面添加按钮（GamePageBase 示例）/ Adding Buttons to a Page (GamePageBase Example)

```javascript
// 在 GamePageBase 构造函数中 / In the GamePageBase constructor
this._pageNavButtons = [];

// 添加返回按钮到导航列表 / Add back button to the navigation list
const backBtn = new BackButton(p, onClickCallback);
this._pageNavButtons.push({
  btn: backBtn.btn,
  callback: onClickCallback,
});

// 添加暂停按钮到导航列表 / Add pause button to the navigation list
const pauseBtn = new ButtonBase(p, "⏸", x, y, onPauseCallback);
this._pageNavButtons.push({
  btn: pauseBtn.btn,
  callback: onPauseCallback,
});

// 最后，注册所有页面按钮的导航 / Finally, register navigation for all page buttons
this.registerNavButtons(this._pageNavButtons, {
  layout: "vertical",
  onEsc: null, // ESC 由全局 GamePageBase 处理 / ESC is handled globally by GamePageBase
});
```

### 自动生命周期 / Automatic Lifecycle

```javascript
// 当页面进入时 / When the page is entered
page.enter();
  → page._enablePageNavigation();
    → new KeyboardNavigationManager(buttons)
    → manager.activate();

// 当页面退出时 / When the page is exited
page.exit();
  → page._disablePageNavigation();
    → manager.deactivate();
    → manager.destroy();
```

---

## Window 级别的键盘导航 / Window-Level Keyboard Navigation

### 为窗口添加按钮（WindowPause 示例）/ Adding Buttons to a Window (WindowPause Example)

```javascript
// 在 WindowPause 构造函数中，_buildContent() 之后
// In the WindowPause constructor, after _buildContent()
this.enableKeyboardNavigation(
  [
    {
      btn: this._resumeBtn,
      callback: () => {
        this.close();
        if (this._callbacks.onResume) this._callbacks.onResume();
      },
    },
    // ... 其他按钮，每个都有回调 / ... other buttons, each with a callback
  ],
  {
    layout: "vertical",
    onEsc: () => {
      this.close();
      if (this._callbacks.onResume) this._callbacks.onResume();
    },
  },
);
```

### 自动生命周期 / Automatic Lifecycle

```javascript
// 当窗口打开时 / When the window is opened
window.open();
  → super.open();
    → this._initKeyboardNav();
      → new KeyboardNavigationManager(buttons)
      → manager.activate();

// 当窗口关闭时 / When the window is closed
window.close();
  → super.close();
    → this._cleanupKeyboardNav();
      → manager.deactivate();
      → manager.destroy();
```

---

## KeyboardNavigationManager API 参考 / API Reference

**文件 / File：** `js/ui/keyboard/KeyboardNavigationManager.js`

### 构造函数 / Constructor

```js
new KeyboardNavigationManager(buttons, options);
```

**buttons** — 按钮数组，每项格式为 `{ btn: p5Button, callback?: fn }`  
Button array; each entry has the shape `{ btn: p5Button, callback?: fn }`.

**options 字段 / Options Fields：**

| 字段 / Field           | 类型 / Type | 默认值 / Default | 说明 / Description                                                    |
| ---------------------- | ----------- | ---------------- | --------------------------------------------------------------------- |
| `layout`               | `string`    | `"vertical"`     | 导航布局模式 / Navigation layout mode (see below)                     |
| `onEsc`                | `function`  | `null`           | 按 ESC 时的回调 / Callback when ESC is pressed                        |
| `onNavigate`           | `function`  | `null`           | 焦点移动时的回调，参数为新索引 / Callback on focus change (new index) |
| `rows`                 | `number`    | `1`              | 仅 `grid` 模式使用，网格行数 / Grid mode only: number of rows         |
| `cols`                 | `number`    | `1`              | 仅 `grid` 模式使用，网格列数 / Grid mode only: number of columns      |
| `enableActivationKeys` | `boolean`   | `true`           | 是否启用 Enter/Space 激活按钮 / Enable Enter/Space to activate        |

### layout 布局模式 / Layout Modes

| 值 / Value     | 导航方式 / Navigation        | 适用场景 / Use Case                                   |
| -------------- | ---------------------------- | ----------------------------------------------------- |
| `"vertical"`   | ↑/↓ 或 W/S 切换 / ↑/↓ or W/S | 竖向按钮列表（菜单、暂停窗口）/ Vertical list (menus) |
| `"horizontal"` | ←/→ 或 A/D 切换 / ←/→ or A/D | 横向按钮列表 / Horizontal list                        |
| `"grid"`       | 四方向完整导航 / Full 4-way  | 网格布局（关卡选择格子）/ Grid layout (level select)  |
| `"spatial"`    | 按空间位置导航 / Spatial     | 自定义位置按钮组 / Custom-position button groups      |

### 公开方法 / Public Methods

| 方法 / Method          | 说明 / Description                                                    |
| ---------------------- | --------------------------------------------------------------------- |
| `activate()`           | 激活键盘监听，设置初始焦点 / Enable key listening, set initial focus  |
| `deactivate()`         | 停用键盘监听，清除焦点样式 / Disable key listening, clear focus style |
| `destroy()`            | 停用并清空按钮列表 / Deactivate and clear button list                 |
| `setFocus(index)`      | 手动设置焦点到指定索引 / Manually set focus to a given index          |
| `getFocusedButton()`   | 获取当前焦点按钮 / Get the currently focused button                   |
| `addButton(button)`    | 动态添加按钮 / Dynamically add a button                               |
| `removeButton(button)` | 动态移除按钮 / Dynamically remove a button                            |
| `clear()`              | 清空所有按钮 / Clear all buttons                                      |

### 键盘按键映射 / Key Mappings

| 按键 / Key        | 行为 / Behavior                                 |
| ----------------- | ----------------------------------------------- |
| `↑` / `W`         | 向上导航（vertical/grid）/ Navigate up          |
| `↓` / `S`         | 向下导航（vertical/grid）/ Navigate down        |
| `←` / `A`         | 向左导航（horizontal/grid）/ Navigate left      |
| `→` / `D`         | 向右导航（horizontal/grid）/ Navigate right     |
| `Enter` / `Space` | 激活当前焦点按钮 / Activate the focused button  |
| `ESC`             | 调用 `onEsc` 回调 / Invoke the `onEsc` callback |

> **注意 / Note：** 当焦点在 `<input>`/`<textarea>` 等输入元素上时，导航键不拦截（避免干扰文字输入），仅 ESC 仍然有效。  
> When focus is on an `<input>`/`<textarea>` or similar element, navigation keys are not intercepted (to avoid interfering with text input); only ESC remains active.

---

## 按钮回调执行流程 / Button Callback Execution Flow

### 用户按 Enter 或 Space / User Presses Enter or Space

```
1. KeyboardNavigationManager._handleKeyDown(e)
   ├─ e.code === 'Enter' || e.code === 'Space'
   └─ e.preventDefault()

2. _activateCurrentButton()
   ├─ btn = this.buttons[this.currentIndex]
   └─ btn.callback()           ← 直接执行回调 / Callback invoked directly
```

### 回调优先级 / Callback Priority

1. **直接回调 / Direct callback** (最可靠 / Most reliable) - `btn.callback()`
2. **mousedown/mouseup 事件 / Events** - 模拟鼠标行为 / Simulates mouse behaviour
3. **HTML click()** - 备用方案 / Fallback

---

## 实现清单 / Implementation Checklist

### PageBase (已完成 / Completed)

- ✅ `registerNavButtons()` - 注册按钮 / Register buttons
- ✅ `_enablePageNavigation()` - 启用导航 / Enable navigation
- ✅ `_disablePageNavigation()` - 禁用导航 / Disable navigation
- ✅ 在 `enter()` 自动启用 / Auto-enabled in `enter()`
- ✅ 在 `exit()` 自动禁用 / Auto-disabled in `exit()`

### GamePageBase (已完成 / Completed)

- ✅ 改进 BackButton 回调传递 / Improved BackButton callback passing
- ✅ 改进 PauseButton 回调传递 / Improved PauseButton callback passing
- ✅ 注册 `_pageNavButtons` 到上级 / Registers `_pageNavButtons` to parent

### WindowBase (已完成 / Completed)

- ✅ `enableKeyboardNavigation()` - 注册按钮 / Register buttons
- ✅ `_initKeyboardNav()` - 启用导航 / Enable navigation
- ✅ `_cleanupKeyboardNav()` - 禁用导航 / Disable navigation
- ✅ 在 `open()` 自动启用 / Auto-enabled in `open()`
- ✅ 在 `close()` 自动禁用 / Auto-disabled in `close()`

### WindowPause (已完成 / Completed)

- ✅ 为每个按钮传递回调 / Callback passed for each button
- ✅ `enableKeyboardNavigation()` 调用 / `enableKeyboardNavigation()` called

### Windows (可选 / Optional)

- ✅ WindowSetting - 已接入 / Integrated
- ✅ WindowHint - 已接入 / Integrated
- ✅ WindowPrompt - 已接入 / Integrated

---

## 支持的页面类型 / Supported Page Types

### ✅ 已实现 / Implemented

- PageBase - 基础支持 / Base support
- GamePageBase - 游戏页面支持 / Game page support

### ⏳ 可以使用 / Available to Use

- LevelSelectPage - 用 `registerNavButtons()` 注册按钮 / Register buttons with `registerNavButtons()`
- MainMenuPage - 用 `registerNavButtons()` 注册按钮 / Register buttons with `registerNavButtons()`
- AnyCustomPage - 任何 PageBase 子类都有支持 / Any subclass of PageBase is supported
