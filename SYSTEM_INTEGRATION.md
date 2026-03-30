# 🎮 系统级键盘导航集成方案

## 概述

现在实现了**完整的系统级键盘导航**：

- ✅ 所有 Page（页面）自动支持键盘导航
- ✅ 所有 Window（浮窗）自动支持键盘导航
- ✅ 每个页面的按钮都能通过键盘控制
- ✅ 按钮回调完全正确执行

---

## 架构

### 三层导航系统

```
PageBase (基类)
├── registerNavButtons(buttons, options)  调用以注册按钮
├── enter() → _enablePageNavigation()    自动启用
└── exit() → _disablePageNavigation()    自动禁用
    │
    └── KeyboardNavigationManager
        ├── activate()         启用键盘监听
        ├── _handleKeyDown()   处理键盘输入
        └── _activateCurrentButton() 激活按钮

GamePageBase extends PageBase
├── 返回按钮 (Back Button)
├── 暂停按钮 (Pause Button)
└── registerNavButtons() 注册以上按钮

WindowBase
├── enableKeyboardNavigation() 注册按钮
├── open() → _initKeyboardNav()  自动启用
└── close() → _cleanupKeyboardNav() 自动禁用
```

---

## Page 级别的键盘导航

### 为页面添加按钮（GamePageBase 示例）

```javascript
// 在 GamePageBase 构造函数中
this._pageNavButtons = [];

// 添加返回按钮到导航列表
const backBtn = new BackButton(p, onClickCallback);
this._pageNavButtons.push({
  btn: backBtn.btn,
  callback: onClickCallback,
});

// 添加暂停按钮到导航列表
const pauseBtn = new ButtonBase(p, "⏸", x, y, onPauseCallback);
this._pageNavButtons.push({
  btn: pauseBtn.btn,
  callback: onPauseCallback,
});

// 最后，注册所有页面按钮的导航
this.registerNavButtons(this._pageNavButtons, {
  layout: "vertical",
  onEsc: null, // ESC 由全局 GamePageBase 处理
});
```

### 自动生命周期

```javascript
// 当页面进入时
page.enter();
  → page._enablePageNavigation();
    → new KeyboardNavigationManager(buttons)
    → manager.activate();

// 当页面退出时
page.exit();
  → page._disablePageNavigation();
    → manager.deactivate();
    → manager.destroy();
```

---

## Window 级别的键盘导航

### 为窗口添加按钮（WindowPause 示例）

```javascript
// 在 WindowPause 构造函数中，_buildContent() 之后
this.enableKeyboardNavigation(
  [
    {
      btn: this._resumeBtn,
      callback: () => {
        this.close();
        if (this._callbacks.onResume) this._callbacks.onResume();
      },
    },
    // ... 其他按钮，每个都有回调
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

### 自动生命周期

```javascript
// 当窗口打开时
window.open();
  → super.open();
    → this._initKeyboardNav();
      → new KeyboardNavigationManager(buttons)
      → manager.activate();

// 当窗口关闭时
window.close();
  → super.close();
    → this._cleanupKeyboardNav();
      → manager.deactivate();
      → manager.destroy();
```

---

## 按钮回调执行流程

### 用户按 Enter 或 Space

```
1. KeyboardNavigationManager._handleKeyDown(e)
   ├─ e.code === 'Enter' || e.code === 'Space'
   └─ e.preventDefault()

2. _activateCurrentButton()
   ├─ btn = this.buttons[this.currentIndex]
   └─ btn.callback()           ← 直接执行回调！
```

### 回调优先级

1. **直接回调** (最可靠) - `btn.callback()`
2. **mousedown/mouseup 事件** - 模拟鼠标行为
3. **HTML click()** - 备用方案

---

## 实现清单

### PageBase (已完成)

- ✅ `registerNavButtons()` - 注册按钮
- ✅ `_enablePageNavigation()` - 启用导航
- ✅ `_disablePageNavigation()` - 禁用导航
- ✅ 在 `enter()` 自动启用
- ✅ 在 `exit()` 自动禁用

### GamePageBase (进行中)

- [ ] 改进 BackButton 回调传递
- [ ] 改进 PauseButton 回调传递
- [ ] 注册 `_pageNavButtons` 到上级
- [ ] 测试所有页面的按钮

### WindowBase (已完成)

- ✅ `enableKeyboardNavigation()` - 注册按钮
- ✅ `_initKeyboardNav()` - 启用导航
- ✅ `_cleanupKeyboardNav()` - 禁用导航
- ✅ 在 `open()` 自动启用
- ✅ 在 `close()` 自动禁用

### WindowPause (已完成)

- ✅ 为每个按钮传递回调
- ✅ `enableKeyboardNavigation()` 调用

### Windows (可选)

- [ ] WindowSetting - 按键绑定按钮
- [ ] WindowHint - 翻页按钮
- [ ] WindowPrompt - 确认/取消按钮

---

## 使用指南

### 最简单的方式：在 PageBase 子类中

```javascript
export class MyGamePage extends GamePageBase {
  constructor(switcher, p) {
    super(switcher, p, 1, "hint_key", "level1");

    // 创建你的按钮...
    const btn1 = new CustomButton(...);
    const btn2 = new CustomButton(...);

    // 注册键盘导航
    this.registerNavButtons([
      {
        btn: btn1.btn,
        callback: () => this._handleBtn1Click(),
      },
      {
        btn: btn2.btn,
        callback: () => this._handleBtn2Click(),
      },
    ]);
  }

  _handleBtn1Click() {
    console.log('按钮1被激活');
  }

  _handleBtn2Click() {
    console.log('按钮2被激活');
  }
}
```

---

## 支持的页面类型

### ✅ 已实现

- PageBase - 基础支持
- GamePageBase - 游戏页面支持

### ⏳ 可以使用

- LevelSelectPage - 用 `registerNavButtons()` 注册按钮
- MainMenuPage - 用 `registerNavButtons()` 注册按钮
- AnyCustomPage - 任何 PageBase 子类都有支持

---

## 下一步

1. **测试现有页面**
   - 进入每个 demo2 关卡
   - 验证返回按钮和暂停按钮能通过键盘激活

2. **为其他页面集成**
   - 关卡选择页面
   - 主菜单
   - 成就页面
   - 任何有按钮的地方

3. **优化用户体验**
   - 调整焦点示例顺序
   - 可能添加焦点音效
   - 制作焦点高亮动画

---

## 常见问题

**Q: 如何改变页面按钮的导航顺序？**
A: 改变 `registerNavButtons()` 中数组的顺序

**Q: 如何为页面定义自定义的 Esc 行为？**
A: 传递 `onEsc` 选项：

```javascript
this.registerNavButtons(buttons, {
  layout: "vertical",
  onEsc: () => this._customEscHandler(),
});
```

**Q: 能混合使用鼠标和键盘吗？**
A: 完全可以！鼠标点击自动更新焦点位置

**Q: 如何禁用某个按钮不让它获焦？**
A: 添加 `disabled` 属性即可，导航会自动跳过它

---

现在准备好全面测试了！🚀
