# 账号系统技术文档 / Account System Technical Documentation

## 1. 范围 / Scope

本文档覆盖账号体系相关能力：

- 注册/登录
- 账号命名空间与重名处理
- 账号改名
- 游客转账号后记录继承

This document covers the account system capabilities:

- Registration / Login
- Account namespace and duplicate name handling
- Account renaming
- Score inheritance when upgrading from guest to account

核心源码 / Core Source Files：

- `js/ui/pages/static-pages/NameInputPage.js`
- `js/ui/pages/static-pages/StaticPageWorldSelect.js`
- `js/utils/firebase-init.js`

## 2. 注册与登录 / Registration & Login

### 注册 / Registration

入口 / Entry point：`NameInputPage._showRegisterForm()`

流程 / Flow：

1. 输入 `username/email/password` / Enter `username/email/password`
2. 先查 `accountNames` 计数（账号命名空间）/ Check `accountNames` count (account namespace)
3. 若重名：弹确认，按 `username#N` 分配 / If duplicate: show confirmation, assign `username#N`
4. 调用 Firebase Auth REST：`accounts:signUp` / Call Firebase Auth REST: `accounts:signUp`
5. 写 `users/{uid}` 文档 / Write `users/{uid}` document
6. 增加 `accountNames` 计数 / Increment `accountNames` count
7. 写入本地 `playerAccount` / Write local `playerAccount`

### 登录 / Login

入口 / Entry point：`NameInputPage._showLoginForm()`

流程 / Flow：

1. 调用 Firebase Auth REST：`accounts:signInWithPassword` / Call Firebase Auth REST: `accounts:signInWithPassword`
2. 读取 `users/{uid}` 获取用户名 / Read `users/{uid}` to get username
3. 写本地 / Write locally：
   - `playerName`
   - `playerAccount = { uid, username, email, isAccount:true }`

## 3. 本地身份数据 / Local Identity Data

关键 localStorage 键 / Key localStorage keys：

- `playerName`
- `playerAccount`

`playerAccount` 结构 / Structure：

- `uid`
- `username`
- `email`
- `isAccount: true`

排行榜提交时会依据 `playerAccount.isAccount` 写 `isAccount` 字段。  
When submitting to the leaderboard, the `isAccount` field is written based on `playerAccount.isAccount`.

## 4. 账号重名机制 / Account Duplicate Name Mechanism

账号命名空间 / Account namespace：`accountNames`

规则 / Rules：

- 仅在 `accountNames` 内检查重名 / Duplicate check is only within `accountNames`
- 与游客 `playerNames` 完全分离 / Completely separate from guest `playerNames`
- 冲突时支持编号后缀 `#N` / Supports numbered suffix `#N` on conflict

相关方法（NameInputPage）/ Related methods (NameInputPage)：

- `_getAccountNameCount(username)`
- `_incrementAccountNameCount(username)`

## 5. 账号改名 / Account Renaming

入口 / Entry point：`StaticPageWorldSelect._showAccountRenameDialog()`

执行链 / Execution chain：

- `_handleAccountRename(newUsername)`
- `_updateAccountNameAndLeaderboard(oldUsername,newUsername,savedAccount)`

改名会更新 3 类数据 / Renaming updates 3 types of data：

1. 排行榜记录：`_updateLeaderboardName(old,new,true)` / Leaderboard records: `_updateLeaderboardName(old,new,true)`
2. `accountNames` 计数：新名 +1、旧名 -1 / `accountNames` count: new name +1, old name -1
3. 本地身份：`playerAccount.username` 和 `playerName` / Local identity: `playerAccount.username` and `playerName`

关键保护 / Key safeguards：

- `_updateLeaderboardName(old,new,isAccount)` 只更新同身份记录 / Only updates records with the same identity type
- 账号改名不会误改游客同名记录 / Account rename will not accidentally modify guest records with the same name

## 6. 游客升级账号并继承游玩记录 / Guest-to-Account Upgrade with Score Inheritance

注册成功后，`NameInputPage._doRegister()` 会检查是否存在旧游客名：

After successful registration, `NameInputPage._doRegister()` checks whether an old guest name exists:

- 若存在且与新账号名不同：弹迁移确认 / If exists and differs from the new account name: show migration confirmation
- 用户确认后执行 `_transferGuestScores(guestName,newUsername)` / After user confirmation, execute `_transferGuestScores(guestName,newUsername)`

迁移规则 / Migration rules：

1. 扫描多种关卡前缀（easy/hard/demo2/level）/ Scan multiple level prefixes (easy/hard/demo2/level)
2. 找到 `playerName == guestName && isAccount == false` 的成绩记录 / Find score records where `playerName == guestName && isAccount == false`
3. PATCH 更新为 / PATCH update to：
   - `playerName = newUsername`
   - `isAccount = true`
4. 递减旧游客基础名的 `playerNames` 计数 / Decrement `playerNames` count for the old guest base name

结果 / Result：

- 游客阶段成绩可以继承到新账号身份 / Scores from the guest phase are inherited by the new account
- 排行榜展示将按账号用户显示（含账号身份标记）/ Leaderboard will display as an account user (with account identity marker)

## 7. 登出 / Logout

在 `StaticPageWorldSelect` / In `StaticPageWorldSelect`：

- 点击登出会清除 `playerAccount` / Clicking logout clears `playerAccount`
- 保留/回退到游客流程（具体由页面进入逻辑决定）/ Reverts to guest flow (determined by page entry logic)

## 8. 相关 Firestore 集合 / Related Firestore Collections

账号系统相关 / Account system related：

- `users`
- `accountNames`
- `playerNames`（游客迁移时会涉及 / involved during guest migration）
- `leaderboard/*/scores`

## 9. 常见问题排查 / Troubleshooting

1. 注册提示重名但看起来没重名 / Registration shows duplicate name but it doesn't look duplicated

- 检查 `accountNames/{docId}` 计数是否残留 / Check if `accountNames/{docId}` count has leftover data
- 注意账号和游客命名空间分离，不互相影响 / Account and guest namespaces are separate and do not affect each other

2. 账号改名后排行榜未更新 / Leaderboard not updated after account rename

- 检查 `_updateLeaderboardName(..., true)` 执行日志 / Check execution log for `_updateLeaderboardName(..., true)`
- 检查 Firestore PATCH 是否返回 200 / Check if Firestore PATCH returned 200

3. 游客转账号后成绩没继承 / Scores not inherited after guest-to-account upgrade

- 检查是否点击了迁移确认 / Check if the migration confirmation was clicked
- 检查 `_transferGuestScores` 中过滤条件：`!docIsAccount` / Check filter condition in `_transferGuestScores`: `!docIsAccount`
- 检查是否命中对应关卡前缀 / Check if the correct level prefix was matched

4. 账号/游客同名互相覆盖 / Account and guest records with the same name overwriting each other

- 正常不应发生，去重键应包含 `isAccount` / Should not happen; deduplication key should include `isAccount`
- 检查提交侧 `isAccount` 写入是否正确 / Check if `isAccount` is written correctly on the submission side
