# Firebase 技术实现详细文档

**项目**：U Help U  
**模块**：Firebase 集成 — 排行榜 + 账号系统  
**技术方案**：Firestore REST API + Firebase Authentication REST API  
**最后更新**：2026-04  

---

## 目录

1. [背景与技术选型](#1-背景与技术选型)
2. [Firebase 项目配置](#2-firebase-项目配置)
3. [为什么不用 Firebase SDK](#3-为什么不用-firebase-sdk)
4. [Firestore REST API 基础](#4-firestore-rest-api-基础)
5. [成绩写入接口](#5-成绩写入接口)
6. [成绩读取接口](#6-成绩读取接口)
7. [文档更新接口](#7-文档更新接口)
8. [文档查询接口](#8-文档查询接口)
9. [Firebase Authentication REST API](#9-firebase-authentication-rest-api)
10. [本地状态持久化（localStorage）](#10-本地状态持久化localstorage)
11. [排行榜数据处理逻辑](#11-排行榜数据处理逻辑)
12. [命名空间设计](#12-命名空间设计)
13. [踩坑记录与解决方案](#13-踩坑记录与解决方案)
14. [隐私与数据安全](#14-隐私与数据安全)

---

## 1. 背景与技术选型

### 项目环境

U Help U 是一个基于 p5.js 的纯前端游戏，部署在 GitHub Pages 上。项目没有后端服务器，所有代码直接在浏览器里运行。

游戏需要实现以下功能：

- 全球排行榜：不同电脑、不同玩家的成绩汇集到同一个排行榜
- 账号系统：玩家注册账号后可以在任何设备登录，查看自己的历史成绩
- 游客模式：不注册也可以直接玩，成绩同样上传到排行榜

### 为什么选 Firebase

Firebase 是 Google 提供的后端即服务（BaaS）平台，免费额度（Spark Plan）对学生项目完全够用：

| 资源 | 免费额度 |
|------|----------|
| 每日读取次数 | 50,000 次 |
| 每日写入次数 | 20,000 次 |
| 存储空间 | 1 GB |
| Authentication 用户数 | 无限制 |

选择 Firebase 的核心原因：无需搭建服务器，前端直接调用，配置简单，免费额度充足。

---

## 2. Firebase 项目配置

### 项目信息

```
Project ID:        uhelpu
Project Name:      UhelpU
API Key:           AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI
Auth Domain:       uhelpu.firebaseapp.com
Storage Bucket:    uhelpu.firebasestorage.app
Messaging Sender:  359872602451
App ID:            1:359872602451:web:ad5424587e00eb6d5401a6
```

### Firestore Database

- **服务器位置**：`eur3 (Europe)` — 选择欧洲服务器是因为项目主要用户在英国，距离近延迟低
- **初始模式**：测试模式（所有人可读写，30天内有效）
- **数据库类型**：Cloud Firestore（NoSQL 文档数据库）

### Firebase Authentication

- **开启方式**：Firebase 控制台 → Authentication → 登录方法 → 电子邮件/密码 → 启用
- **登录提供商**：仅启用邮箱/密码，未启用 Google、GitHub 等第三方登录

---

## 3. 为什么不用 Firebase SDK

### 问题描述

Firebase 官方推荐通过 npm 安装 SDK 并使用 ES Module 语法：

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
```

但项目是纯 p5.js 游戏，所有脚本通过 HTML `<script>` 标签直接加载，没有使用 webpack、Rollup 等打包工具。尝试引入 Firebase SDK 后浏览器报错：

```
Uncaught SyntaxError: Unexpected token 'export'
firebase-firestore.js:1 Uncaught SyntaxError: Cannot use import statement outside a module
```

### 错误原因

Firebase SDK 文件内部使用了 ES Module 的 `export` 语法，普通 `<script>` 标签无法解析这种语法，必须用 `<script type="module">` 才能加载。

但项目的主游戏逻辑文件（sketch.js、各种游戏类文件）都是普通脚本，`type="module"` 会导致模块作用域隔离，`window.xxx` 全局变量的传递方式也需要大幅改造。

### 尝试过的方案

**方案一：jsDelivr CDN 加载 ES Module 版本**

```javascript
import { initializeApp } from 'https://cdn.jsdelivr.net/npm/firebase@12.11.0/+esm';
```

结果：URL 格式不正确，返回 404。

**方案二：改用 compat（兼容）版本**

Firebase 提供旧版兼容 SDK，可以用 `<script>` 直接加载。但 compat 版本和模块化版本混用导致新的冲突。

**最终方案：Firebase REST API**

完全不引入任何 SDK，直接用浏览器原生的 `fetch` 函数调用 Firebase 提供的 HTTP 接口。优点是零依赖、无兼容问题、代码完全可控。

---

## 4. Firestore REST API 基础

### API 根地址

```
https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents
```

本项目中：

```
https://firestore.googleapis.com/v1/projects/uhelpu/databases/(default)/documents
```

### 鉴权方式

所有请求在 URL 后附加 API Key 参数：

```
?key=AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI
```

### Firestore 数据类型格式

Firestore REST API 不使用普通的 JSON，每个字段必须显式声明数据类型：

| JavaScript 类型 | Firestore REST 格式 |
|-----------------|---------------------|
| `"hello"` | `{ "stringValue": "hello" }` |
| `123` | `{ "integerValue": 123 }` |
| `12.5` | `{ "doubleValue": 12.5 }` |
| `true` | `{ "booleanValue": true }` |
| `new Date()` | `{ "timestampValue": "2026-04-01T12:00:00.000Z" }` |

**示例：写入一条包含多个字段的文档**

```json
{
  "fields": {
    "playerName": { "stringValue": "moosry" },
    "timeMs":     { "integerValue": 7120 },
    "isAccount":  { "booleanValue": false },
    "timestamp":  { "timestampValue": "2026-04-01T12:00:00.000Z" }
  }
}
```

### 读取数据时的解析方式

从 Firestore 读回来的数据格式一样带有类型标注，需要手动解析：

```javascript
const fields = doc.fields;

const playerName = fields.playerName?.stringValue || "Unknown";
const timeMs     = parseInt(fields.timeMs?.integerValue || 0);
const isAccount  = fields.isAccount?.booleanValue || false;
```

---

## 5. 成绩写入接口

### 调用时机

玩家碰到关卡终点触发通关事件时调用，由 `LevelTimerManager.js` 计算通关时间后，通过 `window.submitScore` 提交。

### 接口定义

**文件**：`js/utils/firebase-init.js`  
**接口**：`window.submitScore(playerName, timeMs, levelId)`

| 参数 | 类型 | 说明 |
|------|------|------|
| playerName | string | 玩家名字，包含编号（如 moosry#2） |
| timeMs | number | 通关时间，毫秒 |
| levelId | string | 关卡标识，如 easy_level2、hard_level3 |

### 完整实现

```javascript
window.submitScore = async (playerName, timeMs, levelId) => {
  if (!playerName || !levelId) {
    console.error("[Firebase] Missing playerName or levelId");
    return false;
  }

  // 从 localStorage 判断是否为账号用户
  const acctRaw = localStorage.getItem("playerAccount");
  const isAccount = acctRaw ? (JSON.parse(acctRaw).isAccount === true) : false;

  const timestamp = new Date().toISOString();

  // 构建 Firestore 文档数据（必须使用类型标注格式）
  const docData = {
    fields: {
      playerName:  { stringValue: playerName.trim() },
      timeMs:      { integerValue: Math.round(timeMs) },
      timeSeconds: { stringValue: (timeMs / 1000).toFixed(2) },
      levelId:     { stringValue: levelId },
      isAccount:   { booleanValue: isAccount },
      timestamp:   { timestampValue: timestamp },
      submittedAt: { stringValue: timestamp },
    }
  };

  // POST 到 leaderboard/{levelId}/scores 集合
  // Firestore 会自动生成文档 ID
  const url = `https://firestore.googleapis.com/v1/projects/uhelpu/databases/(default)/documents/leaderboard/${levelId}/scores?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(docData)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log(`[Firebase] Score submitted: ${result.name}`);
  return true;
};
```

### 数据存储路径

```
leaderboard/
└── easy_level2/          ← levelId
    └── scores/
        ├── abc123def     ← 自动生成的文档ID
        ├── xyz789ghi
        └── ...
```

---

## 6. 成绩读取接口

### 接口定义

**文件**：`js/utils/firebase-init.js`  
**接口**：`window.getLeaderboard(levelId, limitCount)`

| 参数 | 类型 | 说明 |
|------|------|------|
| levelId | string | 关卡标识 |
| limitCount | number | 返回条数，默认 10，全量查询传 999 |

### 为什么不用 runQuery 排序

Firestore REST API 提供 `runQuery` 端点支持服务端排序：

```
POST /documents:runQuery
```

尝试使用后发现：查询子集合（`leaderboard/{levelId}/scores`）时，`runQuery` 的 `parent` 路径格式在特定情况下返回空结果，即使数据实际存在。

经过排查，问题在于 `runQuery` 对子集合路径的处理与直接列出文档的方式不一致。由于数据量小（单关卡通常不超过数百条），改为**本地排序**更可靠。

### 完整实现（降级方案）

```javascript
window.getLeaderboard = async (levelId, limitCount = 10) => {
  // 拉取该关卡下所有成绩文档（最多 pageSize 条）
  const url = `https://firestore.googleapis.com/v1/projects/uhelpu/databases/(default)/documents/leaderboard/${levelId}/scores?key=${API_KEY}&pageSize=${limitCount}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`[Firebase] Failed to load leaderboard: ${response.status}`);
    return [];
  }

  const data = await response.json();

  if (!data.documents || !Array.isArray(data.documents)) {
    return []; // 该关卡暂无数据
  }

  // 解析每条文档的字段
  let scores = data.documents.map(doc => {
    const fields = doc.fields || {};
    return {
      playerName:  fields.playerName?.stringValue  || "Unknown",
      timeMs:      parseInt(fields.timeMs?.integerValue || 0),
      timeSeconds: fields.timeSeconds?.stringValue || "0.00",
      isAccount:   fields.isAccount?.booleanValue  || false,
      timestamp:   fields.timestamp?.timestampValue,
    };
  });

  // 本地按时间升序排序
  scores.sort((a, b) => a.timeMs - b.timeMs);

  // 去重：同名字 + 同 isAccount 类型 = 同一个人，只保留最佳成绩
  const deduped = new Map();
  scores.forEach(score => {
    const key = score.playerName + "_" + score.isAccount;
    if (!deduped.has(key) || score.timeMs < deduped.get(key).timeMs) {
      deduped.set(key, score);
    }
  });

  // 转回数组，再次排序，加上排名
  return Array.from(deduped.values())
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, limitCount)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));
};
```

### 返回数据格式

```javascript
[
  {
    rank: 1,
    playerName: "moosry",
    timeMs: 7120,
    timeSeconds: "7.12",
    isAccount: false
  },
  {
    rank: 2,
    playerName: "慕斯黎",
    timeMs: 7420,
    timeSeconds: "7.42",
    isAccount: true   // 账号用户，排行榜显示 👑
  }
]
```

---

## 7. 文档更新接口

### 使用场景

- 玩家改名：把所有旧名字的排行榜记录改成新名字
- 游客转账号：把游客成绩的 playerName 和 isAccount 字段更新
- playerNames / accountNames 计数更新

### PATCH 请求格式

```javascript
const url = `${docPath}?key=${API_KEY}&updateMask.fieldPaths=playerName&updateMask.fieldPaths=isAccount`;

await fetch(url, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fields: {
      playerName: { stringValue: newName },
      isAccount:  { booleanValue: true }
    }
  })
});
```

### 关键细节：updateMask 参数

**这是最容易踩的坑。**

Firestore REST API 的 PATCH 请求如果不带 `updateMask` 参数，会**替换整个文档**，即把文档里其他字段全部删除，只保留请求体里的字段。

必须通过 URL 参数指定要更新的字段：

```
?updateMask.fieldPaths=playerName
```

如果要更新多个字段：

```
?updateMask.fieldPaths=playerName&updateMask.fieldPaths=isAccount
```

这样只更新指定字段，其他字段（timeMs、timestamp 等）保持不变。

### 批量更新（改名时遍历所有关卡）

改名需要遍历所有可能有成绩的关卡，逐条更新：

```javascript
async function updateLeaderboardName(oldName, newName, isAccountUser) {
  const levelFormats = ["easy_level", "hard_level"];
  let updatedCount = 0;

  for (const format of levelFormats) {
    for (let i = 1; i <= 10; i++) {
      const levelId = `${format}${i}`;

      // 读取该关卡所有成绩
      const url = `${FIRESTORE_API}/leaderboard/${levelId}/scores?key=${API_KEY}&pageSize=999`;
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (!data.documents) continue;

      for (const doc of data.documents) {
        const fields = doc.fields || {};
        const docPlayerName = fields.playerName?.stringValue;
        const docIsAccount  = fields.isAccount?.booleanValue || false;

        // 关键：只更新名字相同且 isAccount 类型相同的记录
        // 防止账号改名把游客同名记录也改掉
        if (docPlayerName === oldName && docIsAccount === isAccountUser) {
          const docPath = doc.name;
          await fetch(`${docPath}?key=${API_KEY}&updateMask.fieldPaths=playerName`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: { playerName: { stringValue: newName } }
            })
          });
          updatedCount++;
        }
      }
    }
  }

  console.log(`[Firebase] Updated ${updatedCount} records`);
}
```

---

## 8. 文档查询接口

### 查询名字使用次数

用于重名检测，查询 `playerNames` 或 `accountNames` 集合：

```javascript
async function getNameCount(collectionName, name) {
  const docId = name.toLowerCase(); // 文档ID用小写，避免大小写重复
  const url = `${FIRESTORE_API}/${collectionName}/${docId}?key=${API_KEY}`;

  const response = await fetch(url);

  if (response.status === 404) {
    // 文档不存在 = 没有人用过这个名字
    return 0;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return parseInt(data.fields?.count?.integerValue || 0);
}
```

### 更新名字计数（新增或修改）

```javascript
async function setNameCount(collectionName, name, count) {
  const docId = name.toLowerCase();
  const url = `${FIRESTORE_API}/${collectionName}/${docId}?key=${API_KEY}`;

  if (count <= 0) {
    // count 为 0 时删除文档
    await fetch(url, { method: "DELETE" });
    return;
  }

  // PATCH 更新 count 字段
  await fetch(url + "&updateMask.fieldPaths=count", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: { count: { integerValue: count } }
    })
  });
}
```

### 查询用户信息（登录后读取用户名）

```javascript
async function getUserByUid(uid) {
  const url = `${FIRESTORE_API}/users/${uid}?key=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`User not found: ${uid}`);
  }

  const data = await response.json();
  return {
    username: data.fields?.username?.stringValue || "",
    email:    data.fields?.email?.stringValue    || ""
  };
}
```

---

## 9. Firebase Authentication REST API

### 注册

**接口**：`POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}`

```javascript
async function registerWithFirebase(email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password,
        returnSecureToken: true
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    // 常见错误：EMAIL_EXISTS（邮箱已注册）、WEAK_PASSWORD（密码太短）
    throw new Error(error.error?.message || "Registration failed");
  }

  const data = await response.json();
  return {
    uid:     data.localId,   // 用户唯一ID，用于关联 Firestore 用户文档
    idToken: data.idToken,   // 登录令牌（当前未使用，REST API 用 API Key 鉴权）
    email:   data.email
  };
}
```

注册成功后，立即在 Firestore `users/{uid}` 创建用户文档，把用户名和邮箱存进去：

```javascript
await fetch(
  `${FIRESTORE_API}/users/${uid}?key=${API_KEY}`,
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        username: { stringValue: username },
        email:    { stringValue: email }
      }
    })
  }
);
```

### 登录

**接口**：`POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}`

```javascript
async function loginWithFirebase(email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password,
        returnSecureToken: true
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    // 常见错误：INVALID_PASSWORD、EMAIL_NOT_FOUND
    throw new Error(error.error?.message || "Login failed");
  }

  const data = await response.json();
  const uid = data.localId;

  // 用 uid 从 Firestore 读取用户名
  // Firebase Auth 只存邮箱，用户名存在 Firestore users 集合
  const userInfo = await getUserByUid(uid);

  return {
    uid:      uid,
    username: userInfo.username,
    email:    data.email
  };
}
```

### 为什么 Auth 不存用户名

Firebase Authentication 只负责身份验证，存储的字段有限（主要是邮箱和密码哈希）。用户名等自定义信息需要另外存在 Firestore 里，通过 uid 关联。

这也是登录流程需要两步的原因：先调用 Auth 接口拿到 uid，再去 Firestore 读取用户名。

---

## 10. 本地状态持久化（localStorage）

### 设计思路

Firebase REST API 不提供自动保持登录状态的功能（这需要 SDK）。每次页面刷新后，如果不保存登录信息，用户需要重新登录。

解决方案是把登录信息保存在浏览器的 localStorage 里，页面加载时先检查 localStorage，有记录就直接进入游戏。

### 数据结构

| 键名 | 存储内容 | 游客 | 账号用户 |
|------|----------|------|----------|
| `playerName` | 当前显示名字 | ✓ | ✓ |
| `playerAccount` | 账号完整信息（JSON） | ✗ | ✓ |

**游客存储示例：**
```javascript
localStorage.setItem("playerName", "moosry#2");
```

**账号用户存储示例：**
```javascript
localStorage.setItem("playerName", "慕斯黎");
localStorage.setItem("playerAccount", JSON.stringify({
  uid:       "abc123xyz789",
  username:  "慕斯黎",
  email:     "player@example.com",
  isAccount: true
}));
```

### 启动时的判断逻辑

```javascript
// NameInputPage.js — enter() 方法顶部

const savedAccount = localStorage.getItem("playerAccount");
if (savedAccount) {
  // 账号用户，直接进入游戏
  window.playerName = JSON.parse(savedAccount).username;
  setTimeout(() => this.switcher.showWorldSelect(p), 100);
  return;
}

const savedName = localStorage.getItem("playerName");
if (savedName) {
  // 游客，直接进入游戏
  window.playerName = savedName;
  setTimeout(() => this.switcher.showWorldSelect(p), 100);
  return;
}

// 都没有，显示身份选择页面
```

### 登出

登出时清除所有本地记录：

```javascript
localStorage.removeItem("playerAccount");
localStorage.removeItem("playerName");
window.playerName = null;
this.switcher.showNameInput(p);
```

---

## 11. 排行榜数据处理逻辑

### 去重算法

同一个玩家可能通关多次，每次都会写入一条新记录。排行榜显示时每个玩家只保留最佳成绩。

**去重 Key 的设计：**

去重 key 是 `playerName + "_" + isAccount`，而不是只用 `playerName`。

原因：游客 `moosry`（isAccount: false）和账号用户 `moosry`（isAccount: true）是两个完全不同的人，不能合并。

```javascript
const deduped = new Map();

scores.forEach(score => {
  const key = `${score.playerName}_${score.isAccount}`;
  
  if (!deduped.has(key) || score.timeMs < deduped.get(key).timeMs) {
    deduped.set(key, score);
  }
});
```

### timeSeconds 类型问题

**这是实际开发中遇到的一个 bug。**

Firebase 里存的 `timeSeconds` 字段是字符串（`"7.12"`），JavaScript 字符串比较和数字比较规则不同：

```javascript
"10.50" < "7.12"  // true  — 字符串比较，按字符顺序，"1" < "7"
10.50   < 7.12    // false — 数字比较，正确结果
```

导致历史最佳成绩读取错误，明明 7 秒的成绩，显示出来是 10 秒的。

**修复方案：** 比较时统一用 `timeMs`（整数类型），或者用 `parseFloat()` 转换：

```javascript
// 错误写法
scores.sort((a, b) => a.timeSeconds - b.timeSeconds); // timeSeconds 是字符串，减法会 NaN

// 正确写法
scores.sort((a, b) => a.timeMs - b.timeMs); // timeMs 是整数，比较正确
```

### 本次排名计算

本次排名是当前这局成绩，和所有人的最佳成绩（去重后）对比的名次：

```javascript
function calculateCurrentRank(currentTimeMs, deduplicatedScores) {
  // 找出有多少人的最佳成绩比这次成绩更好
  const betterCount = deduplicatedScores.filter(s => s.timeMs < currentTimeMs).length;
  return betterCount + 1;
}
```

### 历史最佳查询

从所有成绩里找当前玩家（按名字和 isAccount 类型匹配）的最短时间：

```javascript
function getPersonalBest(allScores, playerName, isAccount) {
  const personal = allScores.filter(s => 
    s.playerName === playerName && s.isAccount === isAccount
  );
  
  if (personal.length === 0) return null;
  
  return personal.reduce((best, s) => 
    s.timeMs < best.timeMs ? s : best
  );
}
```

---

## 12. 命名空间设计

### 两个独立集合

游客和账号用户的名字去重使用两个完全独立的集合：

```
playerNames/      ← 游客专用
  moosry: { count: 3 }
  test:   { count: 1 }

accountNames/     ← 账号用户专用
  moosry: { count: 1 }
  alice:  { count: 2 }
```

两个集合互不影响，游客叫 `moosry` 和账号用户叫 `moosry` 完全独立，在排行榜上是两个不同的人。

### 改名只影响对应类型

账号用户改名，只更新 `isAccount == true` 的排行榜记录：

```javascript
// 只更新与自己类型相同的记录
if (docPlayerName === oldName && docIsAccount === isAccountUser) {
  // 执行更新
}
```

这样游客 `moosry` 和账号 `moosry` 互相改名都不会影响对方的成绩。

### 游客转账号

游客注册账号后可以选择把历史成绩转移到账号：

1. 找到所有 `playerName == 游客名字` 且 `isAccount == false` 的记录
2. 把这些记录的 `playerName` 改为账号用户名，`isAccount` 改为 `true`
3. `playerNames` 集合里该游客名字的 count 减 1（为 0 时删除文档）
4. 清除 localStorage 里的游客 `playerName`

---

## 13. 踩坑记录与解决方案

### 坑1：Firebase SDK 与 p5.js 加载方式冲突

**现象**：引入 SDK 后报 `Unexpected token 'export'`

**原因**：SDK 使用 ES Module 语法，普通 `<script>` 无法解析

**解决**：完全改用 REST API，零依赖

---

### 坑2：jsDelivr CDN URL 格式错误

**现象**：`GET https://cdn.jsdelivr.net/npm/firebase@12.11.0/+esm 404`

**原因**：jsDelivr 对 Firebase 包的 ESM 路径格式有特殊要求

**解决**：放弃 CDN 方案，改用 REST API

---

### 坑3：runQuery 子集合查询返回空

**现象**：POST runQuery 请求返回 `{ "readTime": "..." }` 没有任何文档

**原因**：`runQuery` 的 `parent` 路径在子集合场景下存在兼容性问题

**解决**：改用 GET 请求读取全部文档，本地排序

```javascript
// 原方案（有问题）
POST /documents:runQuery
{ structuredQuery: { orderBy: [{ field: { fieldPath: "timeMs" } }] } }

// 新方案（稳定）
GET /leaderboard/{levelId}/scores?pageSize=999
// 本地 .sort((a, b) => a.timeMs - b.timeMs)
```

---

### 坑4：PATCH 不带 updateMask 导致数据丢失

**现象**：改名后，排行榜记录里除了 playerName，其他字段（timeMs、timestamp 等）全部消失

**原因**：Firestore REST API 的 PATCH 不带 `updateMask` 时，会替换整个文档

**解决**：所有 PATCH 请求必须带 `updateMask.fieldPaths` 参数

```
错误：PATCH /docPath
正确：PATCH /docPath?updateMask.fieldPaths=playerName
```

---

### 坑5：历史最佳成绩显示错误

**现象**：历史最佳显示 10 秒，实际最佳是 7 秒

**原因**：`timeSeconds` 字段存的是字符串，字符串 `"10"` 在字典序上小于 `"7"`

**解决**：比较时改用整数字段 `timeMs`，或用 `parseFloat()` 转换

---

### 坑6：改名把游客同名记录一起改掉

**现象**：账号用户 `moosry` 改名后，游客 `moosry` 的排行榜记录也被改了

**原因**：改名逻辑只判断 `playerName` 是否匹配，没有过滤 `isAccount` 类型

**解决**：改名时增加 `isAccount` 类型过滤条件

```javascript
// 错误
if (doc.playerName === oldName) { 更新 }

// 正确
if (doc.playerName === oldName && doc.isAccount === isCurrentUserIsAccount) { 更新 }
```

---

### 坑7：Firebase 初始化 150 次轮询失败

**现象**：控制台不断输出 `[Firebase] Checking... attempt X/150, firebase: not loaded`

**原因**：AI 生成的代码用了 `window.firebase` 判断 SDK 是否加载，但 REST API 方案根本不存在 `window.firebase` 对象

**解决**：删除轮询逻辑，REST API 不需要等待 SDK 加载，直接初始化即可

---

## 14. 隐私与数据安全

### 收集的数据

| 数据类型 | 收集场景 | 存储位置 | 是否必要 |
|----------|----------|----------|----------|
| 玩家昵称 | 所有玩家 | Firebase Firestore | 是，排行榜必须 |
| 通关时间 | 通关时 | Firebase Firestore | 是，排行榜必须 |
| 邮箱地址 | 注册账号时 | Firebase Authentication | 是，账号验证必须 |
| 登录令牌 | 登录时 | 仅内存，不持久化 | 是，验证身份必须 |

### 数据保护措施

**密码安全**：密码通过 Firebase Authentication 处理，使用 bcrypt 哈希存储，开发者在 Firebase 控制台只能看到邮箱列表，无法看到任何用户的密码。

**最小化收集**：游客模式下只收集玩家昵称（自定义，不要求真实姓名）和成绩，不收集任何个人信息。账号模式需要邮箱，但不要求真实姓名。

**昵称匿名性**：玩家可以输入任意昵称，不要求使用真实姓名，保护玩家真实身份。

**数据访问控制**：Firebase 控制台只有项目管理员能访问，普通玩家无法查看其他玩家的邮箱或账号信息，排行榜只显示昵称和成绩。

### 功能是否可以不收集数据实现

- **排行榜**：必须收集名字和成绩，否则无法实现。但可以改为完全匿名（只显示成绩不显示名字），或使用随机生成的匿名ID替代真实昵称。
- **账号系统**：必须收集邮箱用于账号验证。如果不需要跨设备功能，可以完全不做账号系统，只保留游客模式。
- **本地游客模式**：可以完全不收集任何数据，只用 localStorage 在本地保存，不上传到服务器。

### 当前安全规则（测试模式）

目前数据库处于测试模式，任何人可读写。正式发布前应更新安全规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 排行榜：所有人可读，只允许写入合法成绩
    match /leaderboard/{levelId}/scores/{doc} {
      allow read: if true;
      allow create: if request.resource.data.playerName is string
                    && request.resource.data.timeMs is number
                    && request.resource.data.timeMs > 0;
      allow update, delete: if false; // 禁止篡改成绩
    }

    // 用户信息：只允许读，写入需要验证
    match /users/{uid} {
      allow read: if true;
      allow write: if true; // 后续可限制为只有对应用户可写
    }

    // 名字计数：允许读写
    match /playerNames/{name} { allow read, write: if true; }
    match /accountNames/{name} { allow read, write: if true; }
  }
}
```
