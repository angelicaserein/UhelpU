# 排行榜系统技术文档 / Leaderboard System Technical Documentation

**项目 / Project**: U Help U  
**模块 / Module**: 排行榜 + 玩家身份系统 / Leaderboard + Player Identity System  
**最后更新 / Last Updated**: 2026-04

---

## 目录 / Table of Contents

1. [系统概览 / System Overview](#1-系统概览--system-overview)
2. [技术选型 / Technology Choices](#2-技术选型--technology-choices)
3. [数据库结构 / Database Structure](#3-数据库结构--database-structure)
4. [玩家身份系统 / Player Identity System](#4-玩家身份系统--player-identity-system)
5. [排行榜核心逻辑 / Core Leaderboard Logic](#5-排行榜核心逻辑--core-leaderboard-logic)
6. [账号系统 / Account System](#6-账号系统--account-system)
7. [命名空间隔离 / Namespace Isolation](#7-命名空间隔离--namespace-isolation)
8. [文件结构 / File Structure](#8-文件结构--file-structure)
9. [API 接口说明 / API Reference](#9-api-接口说明--api-reference)
10. [已知限制 / Known Limitations](#10-已知限制--known-limitations)

---

## 1. 系统概览 / System Overview

排行榜系统支持两种玩家身份：**游客**和**注册账号**，两者都可以上传成绩并显示在排行榜上。  
The leaderboard supports two player identities: **Guest** and **Registered Account**. Both can submit records and appear on the leaderboard.

核心特性 / Key Features:

- 每个关卡独立排行榜，成绩不混用 / Each level has an isolated leaderboard.
- 每个玩家只显示最佳成绩（去重）/ Only each player's best result is shown (deduplicated).
- 同时显示本次成绩、本次排名、历史最佳 / Shows current run, current rank, and personal best.
- 注册用户排行榜名字前显示 👑 标识 / Registered users display a 👑 marker.
- 游客和账号用户命名空间完全独立 / Guest and account namespaces are fully isolated.

---

## 2. 技术选型 / Technology Choices

### 为什么用 Firebase / Why Firebase

项目是纯前端 p5.js 游戏，部署在 GitHub Pages，没有后端服务器。Firebase 提供免费的云数据库，前端可以直接调用。  
This is a frontend-only p5.js game hosted on GitHub Pages with no backend server. Firebase provides a free cloud database that can be called directly from the frontend.

### 为什么用 REST API 而不是 Firebase SDK / Why REST API Instead of Firebase SDK

Firebase 官方 SDK 使用 ES Module 的 `import` 语法，与项目现有的 p5.js 加载方式冲突（`Unexpected token 'export'`）。因此改用 Firestore REST API，通过 `fetch` 调用且无额外依赖。  
The Firebase SDK relies on ES Module `import`, which conflicts with the project's existing p5.js loading flow (`Unexpected token 'export'`). Therefore the project uses Firestore REST API via `fetch`, with zero SDK dependency.

### Firebase 免费额度（Spark Plan）/ Firebase Free Tier (Spark Plan)

| 资源 / Resource         | 免费额度 / Free Quota |
| ----------------------- | --------------------- |
| 每日读取 / Daily reads  | 50,000                |
| 每日写入 / Daily writes | 20,000                |
| 存储空间 / Storage      | 1 GB                  |

对学生项目完全够用。  
This is sufficient for a student project.

---

## 3. 数据库结构 / Database Structure

### Firestore 集合总览 / Firestore Collection Overview

```text
Firebase Project: uhelpu
│
├── leaderboard/                    # 排行榜数据 / leaderboard data
│   └── {levelId}/                  # 关卡ID，例如 easy_level2 / level ID, e.g. easy_level2
│       └── scores/                 # 该关卡所有成绩 / all scores for this level
│           └── {docId}             # 每条成绩记录 / one score record
│
├── playerNames/                    # 游客名字去重计数 / guest name dedupe counters
│   └── {baseName}                  # 文档ID为小写名字，例如 moosry / lowercase base name
│
├── accountNames/                   # 账号用户名去重计数 / account username dedupe counters
│   └── {baseName}                  # 文档ID为小写用户名 / lowercase base username
│
└── users/                          # 注册用户信息 / registered user profiles
    └── {uid}                       # 文档ID为 Firebase Auth uid / Firebase Auth uid
```

### leaderboard 成绩记录字段 / Score Document Fields

```json
{
  "playerName": "moosry",
  "timeMs": 7120,
  "timeSeconds": "7.12",
  "levelId": "easy_level2",
  "isAccount": false,
  "timestamp": "2026-04-01T12:00:00.000Z",
  "submittedAt": "2026-04-01T12:00:00.000Z"
}
```

| 字段 / Field | 类型 / Type | 说明 / Description                                                         |
| ------------ | ----------- | -------------------------------------------------------------------------- |
| playerName   | string      | 玩家显示名字（可能含编号，如 moosry#2）/ display name (may include suffix) |
| timeMs       | integer     | 通关时间（毫秒，越小越好）/ clear time in ms (lower is better)             |
| timeSeconds  | string      | 通关时间（秒，保留两位）/ clear time in seconds (2 decimals)               |
| levelId      | string      | 关卡标识，如 easy_level2 / level identifier                                |
| isAccount    | boolean     | 是否为注册账号 / whether this record is from account user                  |
| timestamp    | timestamp   | 提交时间 / submission time                                                 |

### playerNames / accountNames 字段 / Name Counter Fields

```json
{
  "count": 3
}
```

文档ID为小写名字，`count` 表示该基础名被使用的次数。  
Document ID is the lowercase base name. `count` is how many times it has been used.

### users 字段 / User Profile Fields

```json
{
  "username": "moosry",
  "email": "player@example.com"
}
```

---

## 4. 玩家身份系统 / Player Identity System

### localStorage 存储结构 / localStorage Schema

| 玩家类型 / Player Type | localStorage 键值 / Stored Keys                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- |
| 游客 / Guest           | `playerName: "moosry"`                                                              |
| 注册账号 / Account     | `playerName: "moosry"` + `playerAccount: "{uid, username, email, isAccount: true}"` |

`playerName` 始终表示当前显示名；`playerAccount` 仅账号用户存在，用于判断当前登录身份。  
`playerName` is always the active display name. `playerAccount` exists only for account users and indicates account login state.

### 启动时自动跳过逻辑 / Startup Auto-Skip Logic

```text
游戏启动 / Game starts
    ↓
检查 localStorage 是否有 playerAccount / check localStorage.playerAccount
    ↓ 有 / yes
设置 window.playerName = username，跳转 WorldSelect（账号模式）
set window.playerName = username, go to WorldSelect (account mode)
    ↓ 没有 / no
检查 localStorage 是否有 playerName / check localStorage.playerName
    ↓ 有 / yes
设置 window.playerName，跳转 WorldSelect（游客模式）
set window.playerName, go to WorldSelect (guest mode)
    ↓ 没有 / no
显示 NameInputPage，玩家选择身份
show NameInputPage for identity selection
```

### 名字唯一性机制 / Name Uniqueness Strategy

由于游客没有密码验证，重名通过编号机制处理。  
Guests are unauthenticated, so duplicate names are handled via suffix numbering.

1. 查询 `playerNames` 集合中该名字的 `count` / Check `count` in `playerNames`.
2. `count = 0` 时直接使用，`count` 设为 1 / If `count = 0`, use directly and set to 1.
3. `count > 0` 时弹确认框 / If `count > 0`, show confirmation dialog.
4. 仍使用则 `count + 1`，并在名字后加编号（如 `moosry#2`）/ If confirmed, increment count and append suffix (e.g. `moosry#2`).
5. localStorage 与 Firebase 都存完整带编号名字 / Store the full suffixed name in both localStorage and Firebase.

---

## 5. 排行榜核心逻辑 / Core Leaderboard Logic

### 成绩提交流程 / Score Submission Flow

```text
玩家通关 / level cleared
    ↓
记录通关时间（毫秒）/ record clear time in ms
    ↓
读取 localStorage 的 playerName 与 isAccount
read playerName and isAccount from localStorage
    ↓
POST 到 Firestore leaderboard/{levelId}/scores
    ↓
提交完成后加载排行榜 / reload leaderboard
```

### 排行榜读取流程 / Leaderboard Fetch Flow

由于 Firestore REST API 在子集合路径的 runQuery 排序有兼容性问题，采用本地排序降级方案。  
Because `runQuery` sorting on sub-collection paths has compatibility issues in Firestore REST API, the system uses a local-sort fallback.

```text
GET /leaderboard/{levelId}/scores?pageSize=100
    ↓
获取最多 100 条该关卡成绩 / fetch up to 100 raw records
    ↓
本地按 timeMs 升序排序 / sort by timeMs ascending locally
    ↓
按「playerName + isAccount」去重，只留最好成绩
dedupe by "playerName + isAccount", keep best only
    ↓
取前 10 名给页面展示 / return top 10 to UI
```

### 去重逻辑 / Deduplication Key

去重 key 为 `playerName + "_" + isAccount`，不是只用 `playerName`。  
The dedupe key is `playerName + "_" + isAccount`, not `playerName` alone.

游客 `moosry`（`isAccount: false`）和账号 `moosry`（`isAccount: true`）会被视为两位不同玩家。  
Guest `moosry` and account `moosry` are treated as two distinct players.

### WinPage 显示内容 / WinPage Display

| 信息 / Item              | 说明 / Description                                                 |
| ------------------------ | ------------------------------------------------------------------ |
| 本次成绩 / Current Run   | 当前通关时间，格式 X.XXs / this run time in X.XXs                  |
| 本次排名 / Current Rank  | 与去重后全体最佳对比得到的排名 / rank against deduped best records |
| 历史最佳 / Personal Best | 当前玩家该关卡历史最短及其排名 / best personal result and its rank |

### 排行榜视觉效果 / Visual Effects

- 第1名：🥇 金色高亮 / 1st place: 🥇 highlighted in gold
- 第2名：🥈 银色高亮 / 2nd place: 🥈 highlighted in silver
- 第3名：🥉 铜色高亮 / 3rd place: 🥉 highlighted in bronze
- 当前玩家：名字高亮 + `← YOU` / current player highlighted + `← YOU`
- 注册账号：名字前显示 👑 / account users display 👑 before name
- 加载中：骨架屏先显示，数据逐条淡入 / loading uses skeleton placeholders then fade-in rows

---

## 6. 账号系统 / Account System

### Firebase Authentication

使用 Firebase Auth REST API，不引入 SDK。  
The system uses Firebase Auth REST API without SDK.

**注册接口 / Sign Up**

```text
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}
Body: { email, password, returnSecureToken: true }
Response: { idToken, localId, email }
```

**登录接口 / Sign In**

```text
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}
Body: { email, password, returnSecureToken: true }
Response: { idToken, localId, email }
```

### 注册流程 / Registration Flow

```text
填写用户名 + 邮箱 + 密码 / input username + email + password
    ↓
检查 accountNames 是否重名 / check accountNames duplication
    ↓ 重复 / duplicated
弹确认框并分配编号（如 moosry#2）/ confirm and assign suffix
    ↓ 不重复或确认 / unique or confirmed
调用 Firebase Auth 注册 / call Firebase Auth sign-up
    ↓
创建 Firestore users/{uid} 文档 / create users/{uid}
    ↓
accountNames 对应名字 count + 1
    ↓
localStorage 写入 playerAccount 与 playerName
    ↓
若存在游客记录，询问是否转移成绩 / ask to migrate guest scores
    ↓
进入 WorldSelect / go to WorldSelect
```

### 登录流程 / Login Flow

```text
填写邮箱 + 密码 / input email + password
    ↓
调用 Firebase Auth 登录，获取 uid / sign in and get uid
    ↓
从 users/{uid} 读取 username / read username from users/{uid}
    ↓
localStorage 写入 playerAccount 与 playerName
    ↓
进入 WorldSelect / go to WorldSelect
```

### 游客升级账号（成绩转移）/ Guest Upgrade (Score Migration)

注册成功后，如果 localStorage 里有游客 `playerName`，会弹窗询问是否迁移成绩。  
After successful registration, if a guest `playerName` exists in localStorage, a migration dialog is shown.

确认后执行 / On confirm:

1. 遍历所有关卡，找到 `playerName == 游客名` 且 `isAccount == false` 的记录。  
   Traverse all levels and find records where `playerName == guestName` and `isAccount == false`.
2. 把这些记录更新为新账号用户名并设 `isAccount = true`。  
   Update those records to the new account username and set `isAccount = true`.
3. 在 `playerNames` 中将游客基础名 `count - 1`（为 0 则删除文档）。  
   Decrement corresponding `playerNames` count (delete document if it reaches 0).
4. 清除 localStorage 里的游客 `playerName`。  
   Clear guest `playerName` from localStorage.

### 改名规则 / Rename Rules

| 玩家类型 / Player Type | 查重集合 / Dedupe Collection | 受影响排行榜记录 / Affected Records |
| ---------------------- | ---------------------------- | ----------------------------------- |
| 游客 / Guest           | playerNames                  | `isAccount == false`                |
| 账号 / Account         | accountNames                 | `isAccount == true`                 |

改名后 / After rename:

- 更新 localStorage 名字 / update localStorage name
- 更新 `window.playerName` / update `window.playerName`
- 更新计数（新名字 +1，旧名字 -1）/ update counters (new +1, old -1)
- 批量更新 leaderboard 中对应身份记录 / batch update matching identity records in leaderboard

### 登出 / Logout

清除 `playerAccount` 与 `playerName`，将 `window.playerName = null`，并跳回 NameInputPage。  
Clear `playerAccount` and `playerName`, set `window.playerName = null`, then navigate back to NameInputPage.

---

## 7. 命名空间隔离 / Namespace Isolation

游客和账号用户的名字系统完全独立。  
Guest and account name systems are fully isolated.

```text
playerNames 集合 / guest names      accountNames 集合 / account names
（游客专用）                         （账号专用）
    │                                   │
    ├── moosry: count=3                 ├── moosry: count=1
    ├── test: count=1                   └── alice: count=2
    └── alice: count=2
```

同名游客和账号可以共存且不会互相覆盖。  
Guest and account users may share the same visible name without overwriting each other.

排行榜去重 key：`playerName + isAccount`。  
Leaderboard dedupe key: `playerName + isAccount`.

---

## 8. 文件结构 / File Structure

```text
js/
├── utils/
│   └── firebase-init.js          # Firebase REST API wrapper
│                                 # exposes window.submitScore
│                                 # exposes window.getLeaderboard
│
├── ui/pages/static-pages/
│   ├── NameInputPage.js          # identity selection page
│   │                             # guest name input
│   │                             # account register/login
│   │                             # duplicate-name checks
│   │                             # guest-to-account upgrade
│   │
│   ├── StaticPageWorldSelect.js  # world select page
│   │                             # show player name and identity
│   │                             # guest rename / account rename / logout
│   │
│   └── StaticPageWinEasy.js      # win summary page
│                                 # leaderboard display
│                                 # current run / rank / personal best
│
└── i18n.js                       # zh/en text resources
```

---

## 9. API 接口说明 / API Reference

### `window.submitScore(playerName, timeMs, levelId)`

提交一条成绩到 Firebase。  
Submits one score record to Firebase.

| 参数 / Param | 类型 / Type | 说明 / Description                           |
| ------------ | ----------- | -------------------------------------------- |
| playerName   | string      | 玩家名字 / player display name               |
| timeMs       | number      | 通关时间（毫秒）/ clear time in milliseconds |
| levelId      | string      | 关卡ID，如 easy_level2 / level ID            |

会自动从 localStorage 读取 `isAccount` 并写入。  
`isAccount` is automatically read from localStorage and included.

### `window.getLeaderboard(levelId, limitCount)`

读取指定关卡排行榜。  
Loads leaderboard data for a specific level.

| 参数 / Param | 类型 / Type | 说明 / Description                                 |
| ------------ | ----------- | -------------------------------------------------- |
| levelId      | string      | 关卡ID / level ID                                  |
| limitCount   | number      | 返回数量，默认 10 / max rows to return, default 10 |

返回数组示例 / Return item example:

```javascript
{
  rank: 1,
  playerName: "moosry",
  timeSeconds: "7.12",
  timeMs: 7120,
  isAccount: false
}
```

---

## 10. 已知限制 / Known Limitations

| 限制 / Limitation                                    | 说明 / Description                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 游客无法防冒充 / Guest impersonation risk            | 游客无密码认证，同名只能靠编号区分 / Guests are unauthenticated; same names are distinguished only by suffixes   |
| 改名历史成绩逐条更新 / Rename updates are per-record | 记录越多越慢 / More records means slower rename operations                                                       |
| runQuery 排序兼容性 / runQuery sort compatibility    | 子集合排序查询兼容性问题，已降级本地排序 / Sub-collection sort incompatibility; uses local-sort fallback         |
| 单关卡最多读取100条 / Max 100 raw records per level  | 超出部分不参与排名计算 / Records above 100 are excluded from ranking calculation                                 |
| 无防刷榜机制 / No anti-cheat throttling              | 测试模式未限制提交频率，正式上线需补充规则 / No submit-rate limits in test mode; production needs security rules |
