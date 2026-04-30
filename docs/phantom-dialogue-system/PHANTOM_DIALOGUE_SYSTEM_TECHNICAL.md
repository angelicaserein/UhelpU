# 幻影对话系统技术文档

## 1. 系统定位

幻影对话系统用于给玩家提供两类 AI 交互能力：

1. 录制回放结束后自动生成一句“幻影点评”气泡。
2. 玩家主动打开聊天窗口与幻影连续对话。

核心实现代码：

- js/replayer-voice/ReplayerVoice.js
- js/replayer-voice/ReplayerVoiceBubble.js
- assets/text/phantom_prompt_zh.txt
- assets/text/phantom_prompt_en.txt

## 2. API 架构与后端部署

当前架构是“前端 -> 自建后端 API -> 大模型服务”，并非前端直连模型厂商。

- 前端调用入口：ReplayerVoice.js 内 CLAUDE_ENDPOINT
- 已部署后端地址：https://uhelpu-api.vercel.app/api/claude
- 前端通过 fetch POST 发送 JSON，请求头包含 content-type 与 anthropic-version
- 模型调用由后端服务器统一代理和处理（密钥管理、转发、返回）

## 3. 请求与响应约定

请求体主要字段（语音点评与聊天共用同类结构）：

- model（当前写的是 claude-sonnet-4-20250514）
- max_tokens
- system（来自 phantom_prompt_zh/en）
- messages（用户输入与上下文）

响应解析策略：

- 兼容 payload.content[].text
- 兼容 text/message/reply/completion/output/result
- 失败时使用本地默认文案兜底

## 4. 运行时流程

录制点评流程：

1. 录制结束 hook 触发
2. 汇总本次按键与时长（clip summary）
3. 拼装 prompt + 历史去重信息
4. 调用后端 API
5. 在气泡 UI 展示一句短评

聊天流程：

1. 点击幻影气泡打开聊天窗口
2. 用户输入追加到 chatHistory
3. 调后端 API 生成回复
4. 渲染到聊天窗口，保留有限历史

## 5. 多语言与 prompt 资源

系统会按 i18n 当前语言加载 prompt 文件：

- zh -> assets/text/phantom_prompt_zh.txt
- en -> assets/text/phantom_prompt_en.txt

语言切换时会重新加载 prompt，并刷新聊天区文案。

## 6. 当前约束与建议

1. **API key 管理**：`js/level-design/special/Level1.js` 中的 Anthropic API key 已移除，前端不再持有明文 key。密钥通过 Vercel 环境变量 `ANTHROPIC_API_KEY` 管理，仅在服务端可见。前端仅向自建后端 `/api/claude` 发请求。
2. 建议后端补充限流、鉴权与审计日志，避免滥用。
3. 建议为 /api/claude 约定稳定响应格式，减少前端分支解析复杂度。

---

## 7. ReplayerVoice API Reference

### 构造函数

```js
new ReplayerVoice(recordSystem, apiKey, levelContext);
```

| 参数           | 类型           | 说明                                                                                                                                                          |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recordSystem` | `RecordSystem` | 当前关卡的录制系统实例，用于 hook 录制完成事件                                                                                                                |
| `apiKey`       | `string`       | 前端开关标志，非空即视为启用 AI 功能。**实际 API key 在服务端管理，此参数不会发送给 Anthropic。** 传入任意非空字符串（如 `"server-managed-proxy"`）即可启用。 |
| `levelContext` | `string`       | 关卡描述字符串，注入到系统 prompt 中，让幻影了解关卡特性                                                                                                      |

### 公开方法

| 方法         | 说明                                                     |
| ------------ | -------------------------------------------------------- |
| `draw(p)`    | 在 p5 draw 循环中调用，渲染气泡并处理悬停交互            |
| `openChat()` | 打开聊天窗口（通常由气泡点击触发，也可手动调用）         |
| `destroy()`  | 销毁实例，移除聊天窗口 DOM、中止所有请求、注销 i18n 监听 |

### 使用示例（来自 Level1.js）

```js
import { ReplayerVoice } from "../../replayer-voice/ReplayerVoice.js";

export class Level1 extends HardLevel2 {
  constructor(p, eventBus) {
    super(p, eventBus);
    // apiKey 参数仅作为开关（非空 = 启用）
    // 真实密钥在 Vercel 服务端，前端不持有
    this.replayerVoice = new ReplayerVoice(
      this.recordSystem,
      "server-managed-proxy",
      "关卡描述：幻影可被传送到玩家无法安全到达的区域，并代替玩家触发机关。",
    );
  }

  draw(p = this.p) {
    super.draw(p);
    this.replayerVoice?.draw(p); // 每帧调用
  }

  clearLevel(p = this.p, eventBus = this.eventBus) {
    this.replayerVoice?.destroy(); // 关卡卸载时销毁
    super.clearLevel?.(p, eventBus);
  }
}
```

---

## 8. ReplayerVoiceBubble API Reference

`ReplayerVoiceBubble` 是纯 canvas 渲染的气泡 UI，由 `ReplayerVoice` 内部创建，通常无需外部直接操作。

### 构造参数（options）

| 字段              | 类型       | 默认值   | 说明                             |
| ----------------- | ---------- | -------- | -------------------------------- |
| `labelText`       | `string`   | `"幻影"` | 气泡左侧的说话人标签             |
| `onOpenChat`      | `function` | `null`   | 点击气泡时的回调（打开聊天窗口） |
| `durationMs`      | `number`   | `4000`   | 气泡显示时长（ms）               |
| `enterDurationMs` | `number`   | `≈333`   | 进入动画时长（ms）               |
| `exitDurationMs`  | `number`   | `260`    | 退出动画时长（ms）               |

### 公开方法

| 方法                   | 说明                                               |
| ---------------------- | -------------------------------------------------- |
| `showBubble(text)`     | 显示气泡并播放进入动画，自动在 `durationMs` 后隐藏 |
| `hideBubble()`         | 立即触发退出动画并隐藏                             |
| `draw(p)`              | 在 p5 draw 循环中渲染气泡                          |
| `updateInteraction(p)` | 更新悬停状态，返回当前是否悬停                     |
| `setLabelText(text)`   | 更新说话人标签（语言切换时使用）                   |
| `destroy()`            | 清理定时器和状态                                   |

---

## 9. Prompt 文件格式

**文件路径：** `assets/text/phantom_prompt_zh.txt` / `assets/text/phantom_prompt_en.txt`

这两个文件是系统 prompt（`system` 字段），定义幻影 AI 的角色和行为规则。格式为纯文本，内容结构：

1. **角色定义**：描述幻影是什么（玩家过去动作的回放）
2. **核心规则**：每次回复必须有不同风格/语气
3. **输出约束**：限制回复长度（通常 1-2 句）、禁止某些内容
4. **关卡上下文注入点**：构造函数的 `levelContext` 参数会在运行时追加到 prompt 末尾

如需修改幻影的说话风格，编辑这两个 txt 文件即可，无需改代码。
