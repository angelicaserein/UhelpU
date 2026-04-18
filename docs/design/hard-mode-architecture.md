# Hard 模式架构说明 & 开发规范

## 核心原则

Hard 模式的所有逻辑、实体、UI 与 Easy 模式保持一致，**除非专门为 Hard 模式创建了新的替代文件**。

## 当前 Hard 模式使用的组件

| 组件               | 当前使用                                           | 有专属版本时替换为               |
| ------------------ | -------------------------------------------------- | -------------------------------- |
| Level 基类         | `BaseLevel`                                        | 同上（无需替换）                 |
| 关卡实体           | `Player`, `Ground`, `Wall`, `Portal` 等（同 Easy） | 按需扩展                         |
| RecordUI           | `Demo2RecordUI`                                    | `HardRecordUI`（若创建）         |
| GamePage 基类      | `GamePageBaseDemo2`                                | `GamePageBaseHard`（若创建）     |
| 通关页面（WIN）    | `StaticPageWinEasy`                                | `StaticPageWinHard`（若创建）    |
| 失败页面（Result） | `StaticPageResultDemo2`                            | `StaticPageResultHard`（若创建） |
| 关卡选择页         | `StaticPageLevelChoiceHard` ✅ 已专属              | —                                |
| i18n 文案          | `i18nHard.js` ✅ 已专属                            | —                                |

## 文件结构

```
js/level-design/hard/         ← 关卡逻辑（Level1.js ~ Level10.js）
js/ui/pages/game-pages/hard/  ← 游戏内 UI 页面（GamePageLevel1.js ~ GamePageLevel10.js）
js/i18nHard.js                ← Hard 模式 i18n 文案
js/ui/pages/static-pages/StaticPageLevelChoiceHard.js  ← 关卡选择页
```

## Level ID 前缀规则

- Hard 模式关卡 ID 格式：`hard_level1` ~ `hard_level10`
- 注册位置：`LevelManager.js`（levelMap）、`SwitcherGamePage.js`（\_pageMap）

## 新增 Hard 专属组件的步骤

当你想为 Hard 模式创建专属组件时（例如 `StaticPageResultHard`）：

1. 创建新文件，例如 `js/ui/pages/static-pages/StaticPageResultHard.js`
2. 在 `AppCoordinator.js` 中 import 它
3. 在对应判断逻辑中把 `isHard` 的分支从复用 Demo2/Easy 改为使用新文件：

```js
// AppCoordinator.js — AUTO_RESULT 中
// 改前（未创建 Hard 专属版时）：
const ResultPage =
  isDemo2 || isEasy || isHard ? StaticPageResultDemo2 : StaticPageResultDemo1;

// 改后（创建了 StaticPageResultHard 之后）：
let ResultPage;
if (isHard) ResultPage = StaticPageResultHard;
else if (isDemo2 || isEasy) ResultPage = StaticPageResultDemo2;
else ResultPage = StaticPageResultDemo1;
```

## 重要：不要用 Demo1 的旧逻辑

Hard 模式**不使用**任何 demo1 相关的东西（`GamePageBase`、`StaticPageResultDemo1`、demo1 专属机制等），除非某个 demo2 的 mechanism（如 `BtnWirePortalSystem`）本来就是 demo2 的通用机制，那是可以用的。
