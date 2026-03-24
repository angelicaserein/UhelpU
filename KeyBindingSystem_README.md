# ⌨ 按键设置系统 - 快速参考

## 🎯 系统概述

这是一个完全独立的、易于扩展的**按键绑定管理系统**。允许玩家在设置窗口中自定义按键，配置会自动保存到 localStorage。

---

## 📁 文件结构

```
js/KeyBindingSystem/           ← 新建文件夹
├── KeyBindingConfig.js        (40 行) - localStorage 读写
└── KeyBindingManager.js       (140 行) - 单例管理器

js/CharacterControlSystem/
├── EventProcesser.js          ✏️ 改造 (3处改动)
└── IntentResolver.js          ✏️ 改造 (主要改造 switch 语句)

js/ui/windows/
└── WindowSetting.js           ✏️ 改造 (增加 ~200 行新功能)

css/style.css                  ✏️ 改造 (增加 ~80 行新样式)

js/i18n.js                     ✏️ 改造 (增加 6 个新翻译键)
```

---

## 🔑 核心 API 使用示例

### 获取单例

```javascript
import { KeyBindingManager } from './KeyBindingSystem/KeyBindingManager.js';

const manager = KeyBindingManager.getInstance();
```

### 查询接口

```javascript
// 按键 → 意图
manager.getIntentByKey('KeyW');           // → 'jump'

// 意图 → 按键
manager.getKeyByIntent('jump');           // → 'KeyW'

// 获取所有允许的按键
manager.getAllowedKeys();                 // → Set { 'KeyW', 'KeyA', 'KeyD' }

// 获取完整配置
manager.getConfig();                      // → { jump: 'KeyW', moveLeft: 'KeyA', ... }
```

### 修改接口

```javascript
// 重新绑定按键
manager.rebind('jump', 'Space');          // 将 jump 绑定到 Space

// 重置为默认配置
manager.reset();
```

### 监听器

```javascript
// 注册监听器（绑定改变时触发）
manager.onChange((intent, newKeyCode) => {
  console.log(`${intent} is now bound to ${newKeyCode}`);
});

// 注销监听器
manager.offChange(callback);
```

---

## 🔄 数据流程

### 游戏运行时

```
键盘事件 (keydown/keyup)
    ↓
ControllerManager → EventProcesser
    ↓
❌ 旧: allowedKeys.has(event.code)
✅ 新: keyBindingManager.getAllowedKeys().has(event.code)
    ↓
IntentResolver.resolve(event)
    ↓
❌ 旧: switch(event.code) { case "KeyW": ... }
✅ 新: mappedIntent = keyBindingManager.getIntentByKey(event.code)
    ↓
意图信号 (wantsJump / wantsLeft / ...)
    ↓
ActionValidator → PhysicsApplier
```

### 设置窗口修改配置

```
玩家点击按键按钮
    ↓
WindowSetting._startListeningForKey()
    ↓
全局计时 keydown 事件
    ↓
keyBindingManager.rebind(intent, newKeyCode)
    ↓
保存到 localStorage
    ↓
触发 onChange() 监听器
    ↓
WindowSetting._onKeyBindChange() 刷新 UI
```

---

## 💾 数据持久化

配置自动保存到 localStorage（键名：`game_keybinding`）

```javascript
// 自动保存（JSON 格式）
{
  "jump": "KeyW",
  "moveLeft": "KeyA",
  "moveRight": "KeyD"
}
```

页面重载后配置会自动恢复。

---

## 🎮 扩展新的控制意图

如果要添加新的控制意图（如 "dash"、"attack"），只需：

### 1️⃣ 更新默认配置 [KeyBindingConfig.js]

```javascript
export const DEFAULT_KEYBINDING = {
  jump: 'KeyW',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  dash: 'Space',        // ← 新增
  attack: 'KeyE',       // ← 新增
};
```

### 2️⃣ 更新意图解析 [IntentResolver.js]

```javascript
const mappedIntent = this.keyBindingManager.getIntentByKey(event.code);

if (event.type === "keydown") {
  if (mappedIntent === "jump") {
    intent.add("wantsJump");
  } else if (mappedIntent === "dash") {    // ← 新增
    intent.add("wantsDash");
  } else if (mappedIntent === "attack") {  // ← 新增
    intent.add("wantsAttack");
  }
  // ...
}
```

### 3️⃣ 更新 UI [WindowSetting.js - _getIntentLabel()]

```javascript
_getIntentLabel(intent) {
  const keyMap = {
    'jump': t('keybind_jump'),
    'moveLeft': t('keybind_moveLeft'),
    'moveRight': t('keybind_moveRight'),
    'dash': t('keybind_dash'),        // ← 新增
    'attack': t('keybind_attack'),    // ← 新增
  };
  return keyMap[intent] || intent;
}
```

### 4️⃣ 添加翻译 [i18n.js]

```javascript
// 英文
keybind_dash: 'Dash',
keybind_attack: 'Attack',

// 中文
keybind_dash: '冲刺',
keybind_attack: '攻击',
```

完成！整个系统会自动处理新的意图。

---

## 🎨 UI 样式类

按键设置相关的 CSS 类：

| 类名 | 用途 |
|------|------|
| `.window-keybind-row` | 按键绑定行容器 |
| `.window-keybind-btn` | 按键显示按钮 |
| `.window-keybind-btn-listening` | 正在监听的按钮（自动闪烁） |
| `.window-keybind-reset` | 重置按钮 |

---

## 🧪 测试清单

- [ ] 按键设置窗口能正常显示
- [ ] 点击按键按钮，能正常输入新按键
- [ ] 重复按键时能显示告警
- [ ] 重置按钮能恢复默认配置
- [ ] 关闭窗口后重新打开，配置仍保留
- [ ] 页面刷新后，配置仍保留
- [ ] 游戏中按键绑定生效

---

## 📝 常见问题

**Q: 能支持多少个控制意图？**
A: 理论上无限制。每增加一个意图只需在 3 个地方添加几行代码。

**Q: 按键不能绑定为什么没反应？**
A: 检查 EventProcesser 中是否添加了对应的 keyCode 允许列表。

**Q: 怎么禁止某个意图的绑定？**
A: 从 DEFAULT_KEYBINDING 中删除即可，或在 getIntentLabel() 中返回 falsy 值。

**Q: 怎么导出/导入配置？**
A: 直接操作 localStorage 或实现 JSON import/export 功能（可扩展）。

---

## ✨ 特性总结

✅ **完全独立** - 按键系统完全隔离在 KeyBindingSystem 文件夹  
✅ **易于维护** - 不需要修改原有的控制逻辑  
✅ **自动持久化** - 配置自动保存到 localStorage  
✅ **易于扩展** - 添加新意图只需改 3 个地方  
✅ **友好的 UI** - 实时反馈、重复检测、视觉提示  
✅ **国际化** - 完整的中英文支持  

---

更新时间：2026-03-21  
版本：1.0.0
