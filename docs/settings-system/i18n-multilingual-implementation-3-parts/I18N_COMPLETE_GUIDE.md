# i18n 多语言系统完整指南

## 1. 系统目标

本项目 i18n 系统负责：

1. 提供统一的多语言取词函数 `t(key)`
2. 管理当前语言状态（`en` / `zh`）
3. 在语言切换时通知 UI（窗口、页面、组件）刷新文案
4. 允许各子系统按需注册自己的翻译字典

核心文件：

- `js/i18n/index.js`
- `js/i18n/i18nDemo1.js`
- `js/i18n/i18nDemo2.js`
- `js/i18n/i18nEasy.js`
- `js/i18n/i18nHard.js`
- `js/i18n/i18nSpecial.js`
- `js/i18n/i18nUserLevel.js`
- `js/i18n/i18n-tutorial.js`

---

## 2. 架构与数据流

```text
页面/窗口/组件
  ├─ t("key") 取当前语言文案
  └─ i18n.onChange(handler) 监听语言变化

i18n 核心（index.js）
  ├─ _dict: 全量语言字典（en/zh）
  ├─ _lang: 当前语言
  ├─ _listeners: 监听器数组
  ├─ setLang(lang): 切换语言 + 广播
  └─ registerTranslations(entries): 动态合并子模块词条

localStorage
  └─ key: kinoko_lang （保存用户语言选择）
```

---

## 3. 核心 API

### 3.1 `t(key)`

```js
import { t } from "../i18n/index.js";
const text = t("pause_resume");
```

规则：

1. 先查当前语言 `_dict[currentLang][key]`
2. 查不到回退到英文 `_dict.en[key]`
3. 仍查不到返回 `key` 本身

### 3.2 `i18n.setLang(lang)`

```js
import { i18n } from "../i18n/index.js";
i18n.setLang("zh");
```

行为：

1. 更新当前语言状态
2. 写入 `localStorage["kinoko_lang"]`
3. 同步 `document.documentElement.lang` 与 `document.title`
4. 通知所有 `onChange` 监听器刷新 UI

### 3.3 `i18n.onChange(fn)` / `i18n.offChange(fn)`

```js
const handler = () => {
  this.titleEl.html(t("pause_title"));
};
i18n.onChange(handler);

// 销毁时必须解绑
i18n.offChange(handler);
```

### 3.4 `registerTranslations(langEntries)`

```js
import { registerTranslations } from "./index.js";

registerTranslations({
  en: { level_custom_title: "Custom Level" },
  zh: { level_custom_title: "自定义关卡" },
});
```

用途：让各模式（Demo/Easy/Hard/UserLevel/Tutorial）独立维护词条，再合并到全局字典。

---

## 4. 模块拆分约定

### 基础词条（全局）

在 `js/i18n/index.js` 内维护：

- 主菜单
- 设置窗口
- 暂停窗口
- 账号系统
- 排行榜系统
- 通用按钮与提示

### 模式词条（按功能拆分）

- `i18nDemo1.js`: Demo1 关卡/NPC/提示文案
- `i18nDemo2.js`: Demo2 关卡、Record UI 文案
- `i18nEasy.js`: Easy 模式专属文案
- `i18nHard.js`: Hard 模式专属文案
- `i18nSpecial.js`: 特殊关卡文案
- `i18nUserLevel.js`: 用户关卡/地图编辑器相关文案
- `i18n-tutorial.js`: 教程流程文案

这些文件通过 `registerTranslations(...)` 自动注入。

---

## 5. 新增文案的标准流程

1. 选定 key 命名（建议：`系统前缀_功能_含义`）
2. 在 `en` 和 `zh` 同时新增词条
3. 在 UI 中用 `t(key)` 读取，不写死字符串
4. 若组件是常驻 DOM，注册 `i18n.onChange` 做实时刷新
5. 在组件销毁时 `i18n.offChange` 防止内存泄漏

示例：

```js
// 1) 新增词条
registerTranslations({
  en: { map_upload_retry: "Retry Upload" },
  zh: { map_upload_retry: "重试上传" },
});

// 2) 使用词条
this.retryBtn.html(t("map_upload_retry"));
```

---

## 6. 页面/窗口集成模式

### 静态文案（创建后不变）

创建时直接 `t(key)`。

### 动态文案（语言切换时要实时更新）

遵循固定模式：

```js
this._i18nHandler = () => this._refreshLabels();
i18n.onChange(this._i18nHandler);

// ...
remove() {
  i18n.offChange(this._i18nHandler);
}
```

典型示例：`WindowPause`、`ReplayerVoice`。

---

## 7. Key 命名规范

建议统一使用小写 snake_case，按模块加前缀：

- `pause_*`：暂停窗口
- `rec_*`：录像/回放系统
- `auth_*`：账号系统
- `leaderboard_*`：排行榜
- `ai_voice_*`：幻影对话
- `editor_*`：地图编辑器

避免：

1. 一个 key 在不同模块表达不同语义
2. 只写中文或只写英文，不成对
3. 在业务代码里拼接硬编码句子

---

## 8. 常见问题与排查

### Q1：切换语言后文本不更新

检查点：

1. 是否注册了 `i18n.onChange`
2. 是否在回调里调用了 `html(...)` / `setTitle(...)`
3. 组件销毁重建后是否重复绑定导致异常

### Q2：页面显示 key 本身（如 `pause_resume`）

检查点：

1. key 是否拼写错误
2. `en` 或 `zh` 字典是否缺失该 key
3. 对应模块 i18n 文件是否已被 import 执行

### Q3：切语言后 title 没变

`index.js` 的 `_syncDocumentLanguage()` 会自动刷新 `document.title`。若无变化，检查 `app_title` 是否存在。

---

## 9. 与语言选择页面文档关系

本文件是“系统实现文档”，覆盖 API、架构、集成、规范。

视觉样式请参考：

- `language-choice-style.md`（专注语言选择页的视觉与 CSS 规范）
