# 教程系统技术文档 (Tutorial System)

## 概述

该教程系统基于有限状态机划分多阶段引导流程，分七个教学环节循序渐进带领玩家掌握录制与回放核心玩法；开发难点在于：教程运行期间需要临时接管录制系统、精准控制并暂停游戏流程，同时拦截并独占键盘输入以强制引导玩家按步骤完成操作，还要兼顾全局镂空遮罩提示、全程多语言适配、支持随时按 ESC 跳过教程，以及各阶段切换时的状态同步、界面资源自动清理等复杂边界逻辑，既要保证引导流程连贯易懂，又不能破坏游戏原有正常运行逻辑与各模块功能。

**源码位置：** `js/tutorial-system/`

---

## 文件结构

| 文件                  | 职责                                                |
| --------------------- | --------------------------------------------------- |
| `TutorialManager.js`  | 核心管理器：状态机驱动、按键监听、RecordSystem 轮询 |
| `TutorialState.js`    | 7 个 PHASE 状态类定义                               |
| `TutorialUI.js`       | UI 管理：黑幕、提示框、标签、ESC 提示               |
| `TutorialOverlay.js`  | 半透明黑幕层（SVG clip-path 实现镂空）              |
| `tutorial-system.css` | 教程 UI 样式                                        |

---

## 状态机（7 个 PHASE）

```
IDLE → GUIDE_RECORD → GUIDE_TIMELINE → RECORDING → GUIDE_REPLAY → REPLAYING → COMPLETE → IDLE
         ↑___________________________________________________ESC 随时跳过_________________↑
```

| PHASE | 常量             | 描述              | 游戏状态 | 黑幕           | 触发下一阶段                      |
| ----- | ---------------- | ----------------- | -------- | -------------- | --------------------------------- |
| 0     | `IDLE`           | 待机，教程未开始  | 运行     | 无             | 调用 `start()`                    |
| 1     | `GUIDE_RECORD`   | 引导按录制键      | 暂停     | 全屏（可镂空） | 按录制键                          |
| 2     | `GUIDE_TIMELINE` | 引导按移动/跳跃键 | 暂停     | 全屏（可镂空） | 按移动/跳跃键                     |
| 3     | `RECORDING`      | 录制进行中        | 运行     | 无             | RecordSystem 变为 `ReadyToReplay` |
| 4     | `GUIDE_REPLAY`   | 引导按回放键      | 暂停     | 全屏（可镂空） | 按回放键                          |
| 5     | `REPLAYING`      | 回放进行中        | 运行     | 无             | 回放结束或再次按回放键            |
| 6     | `COMPLETE`       | 教程完成          | 运行     | 无             | 3 秒后自动回到 IDLE               |

---

## 核心类说明

### TutorialManager

教程的总控制器，对外暴露以下公开 API：

```js
// 创建
const manager = new TutorialManager(
  gamePageContainer, // HTMLElement，通常是游戏页面容器
  level, // 当前 Level 对象
  recordSystem, // RecordSystem 实例
  eventBus, // EventBus 实例
  p5Instance, // p5 实例（可选，默认用 window.p）
  options, // 配置项（见下方 overlayConfig）
);

// 启动教程
manager.start();

// 跳过教程（立即回到 IDLE）
manager.skip();

// ESC 中断（等同于 skip）
manager.interrupt();

// 销毁，清理所有资源
manager.destroy();

// 运行时更新某阶段的黑幕镂空配置
manager.setOverlayConfigForPhase(phaseType, config);
```

#### `options.overlayConfig` — 黑幕镂空配置

可为每个 PHASE 独立配置黑幕的镂空区域：

```js
options = {
  overlayConfig: {
    GUIDE_RECORD: {
      visibleRects: [
        {
          x: 10,          // 左上角 x（相对于坐标系）
          y: 10,          // 左上角 y
          width: 200,     // 宽度
          height: 50,     // 高度
          coordinateSpace: "window",  // "window"（默认）或 "canvas"
          paddingX: 8,    // 水平内边距（可选）
          paddingY: 8,    // 垂直内边距（可选）
        }
      ]
    },
    GUIDE_REPLAY: {
      visibleRects: [ ... ]
    }
    // 未配置的阶段默认全屏黑幕
  }
}
```

---

### TutorialState

定义所有 PHASE 的状态类，均继承自 `BaseTutorialState`。

#### BaseTutorialState — 基类

提供公共工具方法：

```js
// 注册事件监听（会在 exit() 时自动清理）
this.on(target, eventName, handler);

// 托管 setTimeout（会在 exit() 时自动清理）
this.setTimeout(callback, delay);

// 托管 setInterval（会在 exit() 时自动清理）
this.setInterval(callback, interval);

// 触发 PHASE 转换
this.transitionTo(TutorialStates.NEXT_PHASE);
```

每个状态类实现 `enter()` 和 `exit()` 生命周期钩子：

- **`enter()`**：进入阶段时执行（显示 UI、控制暂停等）
- **`exit()`**：离开阶段时执行（调用 `super.exit()` 自动清理 UI 和监听）

---

### TutorialUI

管理所有教程 UI 元素，DOM 挂载于 `document.body`。

```js
// 显示/隐藏黑幕
ui.showOverlay({ type: 'full' });
ui.showOverlay({ type: 'partial', visibleRects: [...] });
ui.hideOverlay();

// 更新黑幕镂空区域（不重建元素）
ui.updateOverlayVisibility(visibleRects);

// 显示单个提示框（会先清除旧的）
ui.showPrompt(textOrI18nKey, {
  position: 'top-center' | 'center' | 'bottom-center' | 'custom',
  x: 0, y: 0,         // 仅 position: 'custom' 时有效
  isPersistent: true,  // 持久显示（默认 true）
  isHighlight: false,  // 醒目样式（默认 false）
});

// 显示多个提示框/标签
ui.showMultiplePrompts([
  { text: 'key', position: 'center', style: 'prompt' },
  { text: 'label', x: 100, y: 200, style: 'label' },
]);

// 添加屏幕标签
ui.addLabel({ text, x, y, color });

// 显示/隐藏 ESC 跳过提示（固定在 canvas 右下角）
ui.showEscHint(canvasRect);
ui.hideEscHint();

// 清理所有 UI 元素
ui.cleanup();
```

**i18n 支持：** 提示文本传入以 `tutorial_` 开头的字符串时，自动调用 `t()` 翻译；语言切换时所有可见提示自动更新。

---

### TutorialOverlay

基于 SVG `clip-path` 实现带镂空的半透明黑幕层。

- z-index：`5000`（位于 GamePage 之上、WindowBase 之下）
- 使用 `fill-rule: evenodd` 实现镂空效果
- 自动监听 `window.resize` 更新视口尺寸

```js
overlay.create(container); // 创建并挂载到 document.body
overlay.show(visibleRects); // 显示，visibleRects 为空则全屏黑幕
overlay.hide(); // 隐藏
overlay.updateVisibleRects(visibleRects); // 更新镂空区域
overlay.isVisible(); // 返回当前可见状态
overlay.destroy(); // 销毁并移除 DOM
```

---

## 与其他系统的集成

### RecordSystem

- 教程启动时调用 `recordSystem.setDisabled(true)`，接管所有录制/回放控制权
- 教程结束（回到 IDLE）时调用 `recordSystem.setDisabled(false)` 恢复正常
- TutorialManager 通过轮询（100ms 间隔）监听 `recordSystem.state` 的变化

### KeyBindingManager

- 通过 `KeyBindingManager.getInstance()` 获取单例
- 使用 `kbm.getIntentByKey(event.code)` 将物理按键映射为意图（`record`、`replay`、`moveLeft`、`moveRight`、`jump`）

### EventBus

- 教程启动时发布 `EventTypes.TUTORIAL_CLOSE_SIGNBOARD` 事件，通知 signboard 关闭

### GamePauseState

- 使用 `setGamePaused(true/false)` 控制游戏时间暂停/恢复

---

## 新增教程阶段的方法

1. 在 `TutorialState.js` 中新增常量和状态类：

```js
// 添加常量
export const TutorialStates = {
  ...,
  MY_NEW_PHASE: "MY_NEW_PHASE",
};

// 新增状态类
export class MyNewPhaseState extends BaseTutorialState {
  enter() {
    setGamePaused(true);
    this.ui.showOverlay(this.manager.getOverlayOptionsForPhase(TutorialStates.MY_NEW_PHASE));
    this.ui.showPrompt("tutorial_my_new_msg", { position: "center" });
  }
  exit() {
    super.exit(); // 必须调用，清理 UI 和监听
  }
}
```

2. 在 `TutorialManager.js` 的 `start()` 中注册新状态：

```js
import { ..., MyNewPhaseState } from "./TutorialState.js";

this._phaseMap = {
  ...,
  [TutorialStates.MY_NEW_PHASE]: new MyNewPhaseState(this, this.ui, this.level, this.recordSystem),
};
```

3. 在适当位置触发转换：

```js
this._transitionToPhase(TutorialStates.MY_NEW_PHASE);
```

4. 在 `js/i18n/` 的语言文件中添加对应翻译键 `tutorial_my_new_msg`。

---

## 注意事项

- **暂停菜单**：教程期间暂停菜单被禁用，ESC 仅用于跳过教程
- **资源清理**：所有状态类的 `exit()` 都必须调用 `super.exit()`，否则 DOM 元素和事件监听不会被自动清理
- **黑幕坐标系**：`visibleRects` 默认使用窗口坐标（`window`），若使用 Canvas 内坐标需设置 `coordinateSpace: "canvas"`
- **i18n 键命名**：教程相关翻译键统一以 `tutorial_` 前缀开头，TutorialUI 会据此自动调用翻译函数
