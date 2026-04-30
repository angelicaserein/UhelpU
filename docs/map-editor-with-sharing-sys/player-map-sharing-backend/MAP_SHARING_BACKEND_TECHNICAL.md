# 玩家共享地图与后端实现

## 1. 总体链路

玩家共享地图采用纯前端 + Firestore REST 的方案：

编辑器生成 JSON
-> 上传到 Firestore userLevels
-> 地图列表页面拉取 userLevels
-> 点击某张地图后下载 levelData
-> AppCoordinator 解析 JSON
-> UserLevel 运行地图

核心实现文件：

- js/utils/firebase-init.js
- js/ui/pages/static-pages/StaticPageUserLevelList.js
- js/AppCoordinator.js
- js/user-levels/LevelParser.js

## 2. Firestore 数据模型

集合：userLevels

文档 ID：levelId（来自 levelJSON.meta.id）

字段：

- id: string
- title: string
- authorName: string
- createdAt: string
- levelData: string（完整关卡 JSON 字符串）

上传方式：

- 接口：PATCH /documents/userLevels/{levelId}
- 实现：window.uploadUserLevel(levelJSON, authorName, title)

## 3. 地图列表（共享入口）

页面：StaticPageUserLevelList

行为：

1. 进入页面后调用 window.getUserLevelList()
2. 拉取全部文档并按 createdAt 倒序
3. 支持按标题/作者搜索
4. 点击某一项触发 LOAD_LEVEL：

- levelType = user
- levelId = item.id

## 4. 下载与加载流程

AppCoordinator 收到 levelType = user 后：

1. 调用 window.getUserLevel(levelId)
2. 获取字段 levelData（字符串）
3. JSON.parse(levelData)
4. new UserLevel(p, eventBus, levelData)
5. levelManager.loadLevelInstance(userLevel, p, options)

错误处理：

- 获取失败提示“关卡加载失败，请检查网络”
- 解析失败提示“关卡数据错误，加载失败”

## 5. 后端实现特点

1. 不依赖 Firebase SDK

- 直接调用 Firestore REST API
- 使用 fetch + API key

2. 分页拉取

- getUserLevelList 通过 pageToken 循环获取
- 防止一次拉取条数不足

3. 客户端主导

- 后端主要做文档存储
- 实体构建、机制解析、游戏逻辑都在客户端完成

## 6. 与排行榜后端的关系

同一 firebase-init.js 同时承载：

- 排行榜 leaderboard/{levelId}/scores
- 玩家地图 userLevels/{levelId}

两者共享同一个 Firestore 项目，但集合和字段语义独立。

## 7. 安全与治理建议

1. 建议启用 Firestore Security Rules

- 限制非法覆盖他人地图
- 限制请求频率与写入体积

2. 建议补充字段校验

- title 长度
- authorName 黑名单词
- levelData 大小上限

3. 建议增加版本字段

- 例如 schemaVersion
- 便于后续解析兼容升级
