# 游客登录系统技术文档 / Guest Login System Technical Documentation

## 1. 范围 / Scope

本文档描述"游客进入与游客身份管理"流程，包括：

This document describes the "guest entry and guest identity management" flow, including:

- 游客命名与重名机制 / Guest naming and duplicate name handling
- 游客身份持久化 / Guest identity persistence
- 游客改名 / Guest name changes
- 游客成绩在排行榜中的身份标记 / Guest score identity marking in leaderboard

核心源码 / Core source files:

- `js/ui/pages/static-pages/NameInputPage.js`
- `js/ui/pages/static-pages/StaticPageWorldSelect.js`
- `js/utils/firebase-init.js`

## 2. 游客进入流程 / Guest Entry Flow

入口在 `NameInputPage` / Entry point in `NameInputPage`:

- 按钮 / Button: `Play as Guest`
- 调用 / Call: `_handleGuestPlay()`

流程 / Flow:

1. 读取昵称输入并校验（非空、长度）/ Read and validate nickname input (non-empty, length)
2. 查询游客命名空间计数 / Query guest namespace count: `_getPlayerNameCount(name)`
3. 若计数为 0：直接 `_saveGuestAndContinue(name)` / If count is 0: directly call `_saveGuestAndContinue(name)`
4. 若计数 > 0：弹重名确认框 / If count > 0: show duplicate name confirmation dialog

## 3. 游客重名策略 / Guest Duplicate Name Strategy

游客命名空间集合 / Guest namespace collection: `playerNames`

规则 / Rules:

- 基础名字按小写作为 `docId` / Base name in lowercase as `docId`
- 文档字段 `count` 表示该基础名已使用次数 / Document field `count` indicates how many times this base name has been used
- 重名确认后采用编号：`name#(count+1)` / After duplicate confirmation, use numbering: `name#(count+1)`

相关方法 / Related methods:

- `_getPlayerNameCount(playerName)`
- `_incrementNameCount(playerName)`
- `_showDuplicateConfirmDialog(playerName, count)`

## 4. 游客身份持久化 / Guest Identity Persistence

保存点 / Save point: `_saveGuestAndContinue(finalName)`

写入 / Write to:

- `localStorage['playerName'] = finalName`
- `window.playerName = finalName`

同时更新游客命名空间计数 / Also update guest namespace count: `playerNames`

## 5. 游客排行榜身份 / Guest Leaderboard Identity

排行榜提交由 `firebase-init.js` 的 `window.submitScore()` 完成。

Leaderboard submission is completed by `window.submitScore()` in `firebase-init.js`.

游客与账号区分字段 / Field distinguishing guests from accounts:

- `isAccount`（boolean）

逻辑 / Logic:

- 提交成绩时检查 `localStorage['playerAccount']` / Check `localStorage['playerAccount']` when submitting score
- 不存在或非账号：`isAccount = false`（游客） / If absent or not account: `isAccount = false` (guest)

这会影响 / This affects:

- 排行榜去重键：`playerName + '|' + isAccount` / Leaderboard deduplication key: `playerName + '|' + isAccount`
- 同名游客与账号互不覆盖 / Guests and accounts with the same name do not overwrite each other

## 6. 游客改名流程 / Guest Name Change Flow

入口在 `StaticPageWorldSelect` / Entry point in `StaticPageWorldSelect`:

- 游客显示"改名"按钮，调用 `_showRenameInputDialog()` / Guests see a "Rename" button, calls `_showRenameInputDialog()`

改名执行 / Rename execution:

- `_handleRename(newName)`
- 若新名未占用：`_updateNameAndLeaderboard(oldName, newName)` / If new name is not taken: `_updateNameAndLeaderboard(oldName, newName)`
- 若新名占用：弹确认框并分配后缀编号 / If new name is taken: show confirmation dialog and assign suffix number

改名时更新 / Update on rename:

1. 排行榜文档中的 `playerName`（仅游客记录） / `playerName` in leaderboard document (guest records only)
2. `playerNames` 计数 / `playerNames` count
3. 本地 `playerName` / Local `playerName`

## 7. 与账号命名空间隔离 / Namespace Isolation from Accounts

命名空间明确分离 / Namespaces are clearly separated:

- 游客 / Guest: `playerNames`
- 账号 / Account: `accountNames`

因此 / Therefore:

- 游客重名检查不看 `accountNames` / Guest duplicate name check does not check `accountNames`
- 游客名字与账号名字允许"文本同名"但身份不同 / Guests and accounts can have the same text name but different identities

## 8. 与注册升级衔接 / Registration Upgrade Integration

当游客后续注册账号时（见账号文档） / When a guest later registers for an account (see account documentation):

- 可选择将游客成绩迁移为账号成绩 / Option to migrate guest scores to account scores
- 迁移时把 `isAccount:false` 改为 `true` / Change `isAccount:false` to `true` during migration
- 并更新 `playerName` 到新账号名 / And update `playerName` to new account name

这部分核心在 `NameInputPage._transferGuestScores()` / Core of this part is in `NameInputPage._transferGuestScores()`

## 9. 排查建议 / Troubleshooting Guide

1. 游客重名不生效 / Guest duplicate name not working

- 检查 `playerNames/{docId}` 是否写入成功 / Check if `playerNames/{docId}` is written successfully
- 检查前端是否走到 `_showDuplicateConfirmDialog` / Check if frontend reaches `_showDuplicateConfirmDialog`

2. 游客成绩显示异常 / Guest score display anomaly

- 检查 `submitScore` 时 `isAccount` 是否为 `false` / Check if `isAccount` is `false` during `submitScore`
- 检查排行榜去重逻辑是否按 `playerName|isAccount` / Check if leaderboard deduplication logic uses `playerName|isAccount`

3. 改名后旧名仍显示 / Old name still shows after rename

- 检查 `_updateLeaderboardName(old,new,false)` 是否执行成功 / Check if `_updateLeaderboardName(old,new,false)` executed successfully
- 检查是否刷新了页面上的名字 UI / Check if UI name was refreshed on page
