# 我是怎么给游戏加排行榜的？

**写给：** 完全不懂后端的新手  
**项目：** U Help U  
**一句话总结：** 用 Google 的免费云数据库存成绩，不用自己搭服务器  

---

## 目录

1. [先搞懂问题：排行榜为什么难做？](#1-先搞懂问题排行榜为什么难做)
2. [解决方案：Firebase 是什么](#2-解决方案firebase-是什么)
3. [数据库长什么样](#3-数据库长什么样)
4. [第一个坑：SDK 装不上](#4-第一个坑sdk-装不上)
5. [改用 REST API：直接发请求](#5-改用-rest-api直接发请求)
6. [怎么把成绩存进去](#6-怎么把成绩存进去)
7. [怎么把成绩读出来](#7-怎么把成绩读出来)
8. [怎么改数据](#8-怎么改数据)
9. [账号系统怎么做](#9-账号系统怎么做)
10. [游客名字怎么管理](#10-游客名字怎么管理)
11. [本地记住登录状态](#11-本地记住登录状态)
12. [排行榜去重和排名计算](#12-排行榜去重和排名计算)
13. [踩过的所有坑](#13-踩过的所有坑)
14. [隐私问题怎么处理](#14-隐私问题怎么处理)

---

## 1. 先搞懂问题：排行榜为什么难做

### 本地存和云端存的区别

假设你玩了一关，打出了 7 秒的成绩。

**如果存在本地（你的电脑上）：**
```
你的电脑 → 你自己能看到 ✓
朋友的电脑 → 看不到你的成绩 ✗
```

**如果存在云端（服务器上）：**
```
你的电脑 → 上传成绩到服务器
朋友的电脑 → 从服务器下载成绩 → 能看到你的成绩 ✓
全球任何电脑 → 都能看到 ✓
```

排行榜必须用云端存储，因为要让所有玩家看到同一份数据。

### 问题：我们没有服务器

游戏部署在 GitHub Pages 上，这是一个纯静态网站托管服务，只能放 HTML、CSS、JavaScript 文件，没有后端服务器，没有数据库。

所以需要找一个**现成的云数据库服务**来用。

---

## 2. 解决方案：Firebase 是什么

Firebase 是 Google 提供的一套后端服务，你可以把它理解成：

> **Google 帮你管理服务器和数据库，你只需要写前端代码调用它。**

就像你不需要自己建发电厂，直接用电网一样。

### Firebase 提供了什么

这个项目用到了两个服务：

| 服务 | 用途 | 类比 |
|------|------|------|
| **Firestore** | 存游戏数据（成绩、名字） | 云端 Excel 表格 |
| **Authentication** | 账号注册和登录 | 帮你管理用户名密码 |

### 免费吗

完全免费（Spark 套餐），每天可以：
- 读取 50,000 次
- 写入 20,000 次
- 存储 1 GB

对一个学生游戏项目完全够用，超出才需要付费。

### 怎么开始用

1. 去 [firebase.google.com](https://firebase.google.com) 用 Google 账号登录
2. 创建项目，起名叫 `uhelpu`
3. 开启 Firestore Database（选欧洲服务器，因为我们在英国）
4. 开启 Authentication，选「邮箱/密码」登录方式
5. 复制项目配置信息（API Key 等）

---

## 3. 数据库长什么样

Firestore 是 NoSQL 数据库，不像 Excel 那种行列表格，它的结构是**集合 → 文档**。

可以这样理解：

```
文件柜（数据库）
├── 抽屉1：leaderboard（排行榜）
│   ├── 文件夹：easy_level2（关卡2的成绩）
│   │   ├── 纸条1：moosry - 7.12秒
│   │   ├── 纸条2：慕斯黎 - 7.42秒
│   │   └── 纸条3：test - 8.31秒
│   └── 文件夹：hard_level1（困难关卡1的成绩）
│       └── ...
│
├── 抽屉2：playerNames（游客名字计数）
│   ├── moosry → 用了3次
│   └── test → 用了1次
│
├── 抽屉3：accountNames（账号用户名计数）
│   └── moosry → 用了1次
│
└── 抽屉4：users（注册用户信息）
    └── abc123uid → { 用户名: 慕斯黎, 邮箱: xxx@xxx.com }
```

### 每条成绩记录长什么样

```json
{
  "playerName":  "moosry",
  "timeMs":      7120,
  "timeSeconds": "7.12",
  "levelId":     "easy_level2",
  "isAccount":   false,
  "timestamp":   "2026-04-01T12:00:00.000Z"
}
```

`isAccount` 字段用来区分这条成绩是游客打的还是注册账号打的，后面去重的时候会用到。

---

## 4. 第一个坑：SDK 装不上

### 什么是 SDK

SDK 就是 Firebase 官方写好的工具库，你引入之后可以直接调用函数，比如：

```javascript
// 用 SDK 存一条数据，只需要一行
await addDoc(collection(db, "leaderboard"), { name: "moosry", time: 7120 });
```

听起来很方便，但我们遇到了问题。

### 为什么装不上

Firebase SDK 使用了一种叫 **ES Module** 的现代 JavaScript 语法，特点是文件里有 `import` 和 `export` 这样的语句。

我们的项目是 p5.js 游戏，所有文件用 HTML 的 `<script>` 标签加载：

```html
<script src="sketch.js"></script>
```

这种普通的 `<script>` 标签**不支持** `import/export` 语法。

尝试加载 Firebase SDK 后，浏览器直接报错：

```
Uncaught SyntaxError: Unexpected token 'export'
Uncaught SyntaxError: Cannot use import statement outside a module
```

翻译成人话就是：**"这个文件用了我看不懂的语法，我不知道怎么运行它。"**

### 尝试过的修法

**试过用 CDN 加载**（把文件托管在网上，直接引入）：

```javascript
import { initializeApp } from 'https://cdn.jsdelivr.net/npm/firebase@12.11.0/+esm';
```

结果：URL 格式不对，返回 404 找不到文件。

**试过 compat（兼容）版本**：Firebase 有一个旧版写法不用 `import/export`，但和现有代码混用产生了新的冲突。

### 最终解决方案：REST API

不用任何 SDK，直接用浏览器自带的 `fetch` 函数，通过 HTTP 请求和 Firebase 通信。

就像你用浏览器打开一个网页一样，只不过请求的是 Firebase 的 API 地址，返回的是数据而不是网页。

---

## 5. 改用 REST API：直接发请求

### 什么是 REST API

REST API 就是一套通过网络地址（URL）来操作数据的规范。

举个生活例子：

```
想拿数据  → GET  https://api.xxx.com/scores       → 像发邮件"请告诉我成绩"
想存数据  → POST https://api.xxx.com/scores        → 像发邮件"帮我存这条成绩"
想改数据  → PATCH https://api.xxx.com/scores/id1   → 像发邮件"帮我改这条成绩"
想删数据  → DELETE https://api.xxx.com/scores/id1  → 像发邮件"帮我删这条成绩"
```

Firebase 提供了完整的 REST API，地址格式是：

```
https://firestore.googleapis.com/v1/projects/uhelpu/databases/(default)/documents/[集合路径]
```

每次请求后面还要加上 API Key 验证身份：

```
?key=AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI
```

### 用 fetch 发请求

`fetch` 是浏览器自带的函数，可以向任何网址发送请求：

```javascript
// 最简单的 GET 请求（读数据）
const response = await fetch("https://firestore.googleapis.com/...");
const data = await response.json(); // 把返回内容解析成 JavaScript 对象
```

`await` 的意思是：**等这个网络请求完成了再继续**，因为网络请求需要时间。

### Firebase 数据格式的特殊之处

普通 JSON 格式：
```json
{ "name": "moosry", "time": 7120 }
```

Firestore REST API 要求的格式：
```json
{
  "fields": {
    "name": { "stringValue": "moosry" },
    "time": { "integerValue": 7120 }
  }
}
```

每个字段都要加上类型说明（`stringValue`、`integerValue`、`booleanValue` 等），Firebase 用这个来确保数据类型正确。

读出来的数据也是这个格式，需要手动解析：

```javascript
const name = data.fields.name.stringValue;  // "moosry"
const time = parseInt(data.fields.time.integerValue);  // 7120
```

---

## 6. 怎么把成绩存进去

### 触发时机

玩家碰到关卡终点 → 游戏计算通关时间 → 调用 `window.submitScore()` → 数据发送到 Firebase。

### 代码流程

```javascript
// firebase-init.js
window.submitScore = async (playerName, timeMs, levelId) => {

  // 第一步：判断这个玩家是游客还是账号用户
  // 从浏览器本地存储里读取账号信息
  const accountInfo = localStorage.getItem("playerAccount");
  const isAccount = accountInfo ? true : false;

  // 第二步：准备要存的数据
  // 注意：Firebase 要求每个字段都标注类型
  const docData = {
    fields: {
      playerName:  { stringValue: playerName },
      timeMs:      { integerValue: Math.round(timeMs) },
      timeSeconds: { stringValue: (timeMs / 1000).toFixed(2) },
      levelId:     { stringValue: levelId },
      isAccount:   { booleanValue: isAccount },
      timestamp:   { timestampValue: new Date().toISOString() }
    }
  };

  // 第三步：用 POST 请求把数据发到 Firebase
  // 路径：leaderboard → 关卡ID → scores 集合
  const url = `https://firestore.googleapis.com/v1/projects/uhelpu/databases/(default)/documents/leaderboard/${levelId}/scores?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",                              // POST = 新增数据
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(docData)                // 把数据转成字符串发送
  });

  // 第四步：检查是否成功
  if (response.ok) {
    console.log("成绩提交成功！");
  } else {
    console.error("提交失败");
  }
};
```

### 数据存在哪

每次 POST 请求，Firebase 自动生成一个随机 ID，数据存在：

```
leaderboard / easy_level2 / scores / [随机ID]
```

不同关卡的成绩完全分开存，互不干扰。

---

## 7. 怎么把成绩读出来

### 遇到的坑：排序接口不好用

Firebase 提供了一个叫 `runQuery` 的接口，可以在服务器端排好序再返回数据。我们尝试用它：

```
POST /documents:runQuery
{ "orderBy": [{ "field": "timeMs", "direction": "ASCENDING" }] }
```

但是遇到了问题：查询子集合（`leaderboard/easy_level2/scores`）时，`runQuery` 返回的是空数据，即使数据库里有成绩。

经过排查发现是路径格式的兼容性问题，比较难修复。

### 最终方案：读全部数据，本地排序

改成更简单直接的方式：

1. 用 GET 请求把这个关卡所有成绩全读出来
2. 在 JavaScript 里自己排序

```javascript
window.getLeaderboard = async (levelId) => {

  // 第一步：读取该关卡所有成绩
  const url = `https://firestore.googleapis.com/v1/projects/uhelpu/databases/(default)/documents/leaderboard/${levelId}/scores?key=${API_KEY}&pageSize=999`;

  const response = await fetch(url);
  const data = await response.json();

  // 如果没有数据（新关卡还没人打过）
  if (!data.documents) return [];

  // 第二步：解析每条记录的字段
  // Firebase 返回的格式有类型标注，需要手动提取值
  let scores = data.documents.map(doc => ({
    playerName: doc.fields.playerName.stringValue,
    timeMs:     parseInt(doc.fields.timeMs.integerValue),
    isAccount:  doc.fields.isAccount?.booleanValue || false,
  }));

  // 第三步：在本地按时间从小到大排序（时间越短越好）
  scores.sort((a, b) => a.timeMs - b.timeMs);

  // 第四步：去重（每个玩家只保留最好成绩）
  // 详细逻辑见第12章
  scores = deduplicate(scores);

  // 第五步：加上排名编号返回
  return scores.map((s, i) => ({ rank: i + 1, ...s }));
};
```

### 为什么是 pageSize=999

Firebase GET 请求默认只返回前 20 条数据，加上 `pageSize=999` 告诉它最多返回 999 条，确保能读到所有成绩。

---

## 8. 怎么改数据

### 使用场景

- 玩家改名 → 把数据库里所有旧名字改成新名字
- 游客转账号 → 把成绩的 `isAccount` 字段从 false 改成 true

### PATCH 请求

改数据用 PATCH 方法：

```javascript
await fetch(documentPath + "?key=" + API_KEY + "&updateMask.fieldPaths=playerName", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fields: {
      playerName: { stringValue: "新名字" }
    }
  })
});
```

### 重要：必须加 updateMask

**这是一个超级重要的细节，不加会出大问题。**

如果不加 `updateMask.fieldPaths=playerName`：

```
Firebase 理解为：用这个新数据"替换"整个文档
结果：timeMs、timestamp 等字段全部消失
```

如果加了 `updateMask.fieldPaths=playerName`：

```
Firebase 理解为：只更新 playerName 这一个字段
结果：其他字段保持不变 ✓
```

我们就是因为忘记加这个参数，改名后排行榜上所有成绩的时间数据全消失了。

### 批量改名的流程

改名不是改一条记录，是要把所有关卡里所有旧名字的记录全改掉：

```
遍历 easy_level1 到 easy_level10
遍历 hard_level1 到 hard_level10
    ↓ 每个关卡
读取所有成绩
找出 playerName == 旧名字 且 isAccount 类型相同 的记录
逐条发 PATCH 请求更新名字
```

为什么要判断 `isAccount` 类型相同？因为游客 `moosry` 和账号 `moosry` 是两个不同的人，改账号 `moosry` 的名字不能影响游客 `moosry` 的成绩。

---

## 9. 账号系统怎么做

### 同样用 REST API

Firebase Authentication 也提供 REST API，不需要 SDK：

```
注册地址：POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}
登录地址：POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}
```

### 注册流程（一步一步）

```
玩家填写：用户名 + 邮箱 + 密码
          ↓
第1步：检查用户名是否重复（查 accountNames 集合）
          ↓ 不重复
第2步：把邮箱+密码发给 Firebase Auth 注册
          ↓ 注册成功
第3步：Firebase 返回一个唯一的用户ID（uid），比如 "abc123xyz"
          ↓
第4步：把用户名和邮箱存到 Firestore 的 users/{uid} 文档
          ↓  
          为什么要这步？因为 Firebase Auth 只存邮箱和密码
          用户名需要我们自己存在 Firestore 里
          ↓
第5步：accountNames 集合里这个用户名的计数 +1
          ↓
第6步：把登录信息存到浏览器本地（localStorage）
          ↓
进入游戏
```

### 注册代码

```javascript
// 第一步：调用 Firebase Auth 注册接口
const authResponse = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true  // 返回登录令牌
    })
  }
);

const authData = await authResponse.json();

if (!authResponse.ok) {
  // 常见错误：EMAIL_EXISTS（邮箱已被注册）
  throw new Error(authData.error.message);
}

const uid = authData.localId;  // 用户唯一ID

// 第二步：把用户名存到 Firestore
await fetch(
  `https://firestore.googleapis.com/v1/projects/uhelpu/databases/(default)/documents/users/${uid}?key=${API_KEY}`,
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

### 登录流程

```
玩家填写：邮箱 + 密码
          ↓
第1步：把邮箱+密码发给 Firebase Auth 验证
          ↓ 验证成功
第2步：Firebase 返回用户ID（uid）
          ↓
第3步：用 uid 去 Firestore users/{uid} 读取用户名
          ↓  因为登录接口只返回邮箱，不返回用户名
第4步：把登录信息存到 localStorage
          ↓
进入游戏，显示 👑 用户名
```

### 为什么需要两步才能拿到用户名

Firebase Auth 登录接口返回的信息里，只有邮箱（`email`）和用户唯一ID（`localId`/`uid`）。

用户名是我们自己定义的字段，存在 Firestore 的 `users` 集合里，必须用 uid 再查一次才能拿到。

---

## 10. 游客名字怎么管理

### 问题：游客没有密码，怎么防止重名

注册账号有密码验证，但游客只有一个名字，任何人都可以输入同一个名字。

### 解决方案：允许重名，但加编号

不阻止重名，而是给重名的人自动加编号：

```
第1个叫 moosry 的人 → 直接叫 moosry
第2个叫 moosry 的人 → 弹出提示，确认后叫 moosry#2
第3个叫 moosry 的人 → 弹出提示，确认后叫 moosry#3
```

### 用 playerNames 集合记录计数

```
playerNames 集合：
  moosry → { count: 3 }   ← 已经有3个人用了这个名字
  test   → { count: 1 }
```

### 流程

```
玩家输入名字 "moosry"
          ↓
查询 playerNames/moosry 的 count
          ↓ count = 0（全新名字）
直接用，count 设为 1

          ↓ count = 2（已有2个人用过）
弹出对话框：「前方已有 2 个 moosry，你确定还要用这个名字吗？」
  → 点「就要用！」：count + 1，名字变成 moosry#3
  → 点「换一个」：返回输入框重新输入
```

### 游客和账号的命名空间完全独立

```
playerNames  ← 只管游客
accountNames ← 只管注册账号
```

游客叫 `moosry` 和账号用户叫 `moosry` 是两个不同的人，互不影响。注册账号时只检查 `accountNames`，不管 `playerNames` 里有没有同名游客。

---

## 11. 本地记住登录状态

### 问题：关掉浏览器就要重新登录

Firebase REST API 没有自动保持登录状态的功能（那需要 SDK）。如果不做处理，每次刷新页面都要重新输入名字或登录。

### 解决方案：localStorage

`localStorage` 是浏览器内置的本地存储，可以在浏览器里永久保存小量数据，关闭浏览器再打开还在。

```javascript
// 存数据
localStorage.setItem("playerName", "moosry");

// 读数据
const name = localStorage.getItem("playerName"); // "moosry"

// 删数据（登出时用）
localStorage.removeItem("playerName");
```

### 存什么

**游客：**
```javascript
localStorage.setItem("playerName", "moosry#2");
// 只存名字就够了
```

**账号用户：**
```javascript
localStorage.setItem("playerName", "慕斯黎");
localStorage.setItem("playerAccount", JSON.stringify({
  uid:       "abc123xyz",
  username:  "慕斯黎",
  email:     "player@example.com",
  isAccount: true
}));
// 多存一份账号信息，用来判断是游客还是账号用户
```

### 打开游戏时的判断

```javascript
// 游戏启动时，先检查本地有没有记录
const accountInfo = localStorage.getItem("playerAccount");
if (accountInfo) {
  // 有账号记录 → 直接进游戏（账号模式）
  window.playerName = JSON.parse(accountInfo).username;
  goToWorldSelect();
  return;
}

const guestName = localStorage.getItem("playerName");
if (guestName) {
  // 有游客名字 → 直接进游戏（游客模式）
  window.playerName = guestName;
  goToWorldSelect();
  return;
}

// 都没有 → 显示名字输入/登录页面
showNameInputPage();
```

---

## 12. 排行榜去重和排名计算

### 为什么需要去重

同一个玩家可能通关100次，每次都会写入一条新记录。如果不去重，排行榜前10名可能全是同一个人的不同成绩。

### 去重逻辑

```javascript
// 用 Map 来去重
// Map 的 key 是唯一的，相同 key 会覆盖
const deduped = new Map();

scores.forEach(score => {
  // 关键：key 是 "名字_是否账号"
  // 这样游客 moosry 和账号 moosry 是两个不同的 key
  const key = score.playerName + "_" + score.isAccount;

  // 如果这个 key 还没有，或者新成绩更好，就更新
  if (!deduped.has(key) || score.timeMs < deduped.get(key).timeMs) {
    deduped.set(key, score);
  }
});

// 转回数组
const result = Array.from(deduped.values());
```

**为什么 key 要包含 isAccount？**

如果只用名字去重，游客 `moosry` 和账号 `moosry` 会被当成同一个人，其中一个的成绩就消失了。加上 `isAccount` 区分，他们就是两个独立的玩家。

### 本次排名计算

本次排名 = 比我这次成绩更好的人数 + 1

```javascript
function getMyRank(myTimeMs, allBestScores) {
  // 数一下有多少人的最好成绩比我这次更快
  const betterCount = allBestScores.filter(s => s.timeMs < myTimeMs).length;
  return betterCount + 1;
}
```

举例：
- 所有人最好成绩：7.12s、7.42s、8.18s、8.31s
- 我这次打了 8.21s
- 比 8.21s 更快的有 3 个人（7.12、7.42、8.18）
- 所以我这次排名 = 3 + 1 = **第4名**

### 历史最佳查询

从所有成绩里找我自己打过的最好的一次：

```javascript
function getMyBest(allScores, myName, myIsAccount) {
  // 先筛选出属于我的成绩
  const myScores = allScores.filter(s =>
    s.playerName === myName &&
    s.isAccount === myIsAccount
  );

  if (myScores.length === 0) return null;

  // 找最短时间那条
  return myScores.reduce((best, s) =>
    s.timeMs < best.timeMs ? s : best
  );
}
```

---

## 13. 踩过的所有坑

### 坑1：SDK 报错装不上

**遇到的错误：**
```
Uncaught SyntaxError: Unexpected token 'export'
```

**原因：** Firebase SDK 用了 p5.js 不支持的语法

**解法：** 改用 REST API，完全不需要 SDK

---

### 坑2：CDN 链接 404

**遇到的错误：**
```
GET https://cdn.jsdelivr.net/npm/firebase@12.11.0/+esm 404 (Not Found)
```

**原因：** CDN 上 Firebase 的路径格式不对

**解法：** 直接用 REST API，不需要任何 CDN

---

### 坑3：runQuery 查不到数据

**现象：** 明明数据库里有成绩，用 runQuery 查询却返回空

**原因：** runQuery 接口对子集合路径的处理有兼容性问题

**解法：** 改用 GET 读取全部数据，本地排序

---

### 坑4：PATCH 不加 updateMask 导致数据丢失

**现象：** 改名后，成绩的时间数据全部消失了

**原因：** PATCH 不带 `updateMask` 会替换整个文档，把时间等字段都删了

**解法：** PATCH 请求必须加 `&updateMask.fieldPaths=playerName`

```
错误：PATCH /doc
正确：PATCH /doc?updateMask.fieldPaths=playerName
```

---

### 坑5：历史最佳显示错误

**现象：** 历史最佳显示 10 秒，但实际最好是 7 秒

**原因：** `timeSeconds` 存的是字符串，字符串比较 `"10" < "7"` 结果是 true（因为 "1" 比 "7" 小）

```javascript
// 字符串比较（错误）
"10.50" < "7.12"   // true ← 错的！

// 数字比较（正确）
10.50 < 7.12       // false ← 对的！
```

**解法：** 改用 `timeMs`（整数）来比较，不用字符串

---

### 坑6：改名把游客的记录也改了

**现象：** 账号用户 `moosry` 改名后，游客 `moosry` 的排行榜记录也被改了

**原因：** 改名代码只判断名字是否匹配，没有区分是游客还是账号用户

**解法：** 改名时加上 `isAccount` 类型判断

```javascript
// 错误（会把游客和账号的记录都改掉）
if (record.playerName === oldName) { 改名 }

// 正确（只改和自己类型相同的记录）
if (record.playerName === oldName && record.isAccount === 我的isAccount) { 改名 }
```

---

### 坑7：150次轮询失败

**现象：** 控制台不断输出
```
[Firebase] Checking... attempt 1/150, firebase: not loaded
[Firebase] Checking... attempt 2/150, firebase: not loaded
...
```

**原因：** AI 生成的代码里有一段逻辑，一直等待 `window.firebase` 这个对象出现。但因为我们用的是 REST API，根本不存在 `window.firebase`，所以永远等不到。

**解法：** 删掉这段轮询代码，REST API 不需要等待任何东西初始化

---

## 14. 隐私问题怎么处理

### 我们收集了哪些数据

| 收集了什么 | 什么时候收集 | 为什么必须收集 |
|------------|--------------|----------------|
| 玩家昵称 | 输入名字时 | 排行榜显示名字 |
| 通关时间 | 通关时 | 排行榜排名 |
| 邮箱地址 | 注册账号时 | 账号登录验证 |

**没有收集的数据：** 真实姓名、手机号、位置信息、IP 地址、设备信息。

### 能不收集吗

- **昵称和成绩**：排行榜功能必须要，不收集就没法做排行榜
- **邮箱**：账号系统必须要，用于验证身份。如果不做账号系统，可以完全不收集邮箱
- **游客模式**：完全不需要邮箱，只要输一个昵称就能玩，玩家可以用假名字保护隐私

### 数据怎么存储

**密码：** 通过 Firebase Authentication 处理，使用哈希加密存储（bcrypt）。开发者在 Firebase 控制台**只能看到邮箱列表，完全看不到任何人的密码**，密码加密后连 Google 自己也看不到原文。

**邮箱：** 只有项目管理员（我）能在 Firebase 控制台看到用户邮箱列表，其他玩家看不到别人的邮箱，游戏界面里也不会显示邮箱。

**成绩数据：** 存在 Firestore 里，所有人都可以读取（因为排行榜是公开的），但只有代码才能写入，普通玩家无法直接修改数据库。

### 如果想更保护隐私

- 不注册账号，使用游客模式，用任意昵称（比如 `player123`），完全匿名
- 游客模式下我们收集的唯一信息就是你自己起的昵称和游戏成绩

### 数据安全现状和改进方向

**现在：** 数据库处于测试模式，规则比较宽松

**正式发布前应该做的：**
```javascript
// 应该加这样的安全规则
// 成绩只能写入（不能被别人修改或删除）
match /leaderboard/{levelId}/scores/{doc} {
  allow read: if true;        // 所有人可以看排行榜
  allow create: if true;      // 所有人可以提交成绩
  allow update, delete: if false;  // 不允许修改或删除已有成绩
}
```

这样即使有人知道了 API Key，也只能提交成绩，不能修改别人的成绩或删除数据。
