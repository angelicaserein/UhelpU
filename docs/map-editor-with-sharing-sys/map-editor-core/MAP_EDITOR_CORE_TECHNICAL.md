# 地图编辑器本体技术文档

## 1. 系统定位

地图编辑器是一个运行在关卡内的叠加层编辑系统，用于在游戏世界坐标中放置、移动、缩放和删除实体，并支持多房间地图编辑。

核心实现：

- js/develop-mode/MapEditor.js
- js/develop-mode/EditorUI.js
- js/develop-mode/EditorPreview.js
- js/develop-mode/EditorEntityManager.js

## 2. 如何进入编辑器

当前项目通过空白地图关卡自动进入编辑器模式：

- LevelEmpty10Room 在构造中创建 MapEditor 并 activate()
- 入口文件：js/user-levels/LevelEmpty10Room.js

进入流程：

1. 页面点击“创建地图”按钮
2. 触发 EventTypes.LOAD_LEVEL，levelType = emptyEditor
3. AppCoordinator 加载 empty_editor 关卡
4. LevelEmpty10Room 初始化并激活 MapEditor

## 3. MapEditor 架构

MapEditor 内部主要包含四个子模块：

- UI 层：工具栏、按钮、房间增删、保存/上传触发
- 预览层：鼠标悬停时的实体预览
- 实体管理层：编辑实体集合、选中态、拖动缩放、撤销
- 导出层：调用 EditorExporter 生成代码或 JSON

关键行为：

- 编辑器绘制为“世界层 + 屏幕 UI 层”双层渲染
- 使用键盘 M 开关编辑模式
- 支持 Ctrl+Z 撤销
- 支持删除、拖拽、缩放、文本编辑等操作

## 4. 多房间与相机

MapEditor 支持房间数量管理：

- roomCount 初始值来自 EditorConfig 默认值
- UI 提供 add room / delete room
- 相机偏移叠加在关卡 \_getCameraX 上，实现编辑视角移动

空间规则：

- 实体以世界坐标存储
- 每个房间宽度基于画布宽度
- 导出时会根据 x 坐标推导实体所在房间

## 5. 出生点编辑

编辑器支持拖动出生点：

- 维护 spawn x/y/w/h
- 可视化出生点框和标记
- 修改后同步应用到当前 player 的 startX/startY

## 6. 生命周期与清理

MapEditor 在构造时绑定 DOM 事件：

- keydown
- mousedown/mousemove/mouseup

在关卡 clearLevel 时调用 destroy 清理，避免重复绑定和内存泄露。

## 7. 对接建议

如果后续要把编辑器接入其他关卡，最小改动如下：

1. 在关卡类中创建 this.\_mapEditor = new MapEditor(this)
2. 在 draw 末尾调用 this.\_mapEditor.draw(p)
3. 在 clearLevel 中调用 this.\_mapEditor.destroy()
