# 彩虹波浪效果规范

## 来源
成就页面（`StaticPageAchieves.js`）的 `.rainbow-wave` CSS 动画。
所有需要彩虹效果的地方统一使用此规范。

---

## CSS 版本（DOM 元素用）

在 `css/style.css` 中已定义，直接给每个字符的 `<span>` 添加 class `rainbow-wave` 即可。

```js
function setRainbowContent(container, text) {
  container.innerHTML = "";
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "rainbow-wave";
    span.textContent = ch;
    container.appendChild(span);
  }
}
```

CSS 动画参数：
- `rainbow-color 3s linear infinite`：所有字符同时共享同一颜色循环
- `wave 2.4s ease-in-out infinite`：每字符 `animation-delay: 0s, (n-1)*0.15s`，振幅 2px

---

## p5.js 版本（canvas 绘制用）

当文字在 p5.js canvas 内绘制时，用以下函数复现相同视觉效果。

### 颜色停靠点（对应 CSS `@keyframes rainbow-color`）

| 进度   | 颜色    | RGB            |
|--------|---------|----------------|
| 0%     | #ff4e50 | 255, 78,  80   |
| 16%    | #ff9f43 | 255, 159, 67   |
| 33%    | #feca57 | 254, 202, 87   |
| 50%    | #48dbfb | 72,  219, 251  |
| 66%    | #a29bfe | 162, 155, 254  |
| 83%    | #fd79a8 | 253, 121, 168  |
| 100%   | #ff4e50 | 255, 78,  80   |

### 波浪参数（对应 CSS `@keyframes wave`）

- 振幅：`2px`（translateY(-2px)）
- 周期：`2400ms`
- 每字符延迟：`150ms`（nth-child 规律）
- 波形公式：`charY = baselineY - 2 * Math.sin(Math.PI * wavePhase)`
  - `wavePhase = (((millis - i * 150) / 2400) % 1 + 1) % 1`

### 完整实现

```js
function drawRainbowWaveText(p, text, startX, baselineY) {
  const waveAmplitude = 2;
  const wavePeriodMs = 2400;
  const colorPeriodMs = 3000;
  const charDelayMs = 150;

  const colorStops = [
    [0.00, [255, 78,  80 ]],
    [0.16, [255, 159, 67 ]],
    [0.33, [254, 202, 87 ]],
    [0.50, [72,  219, 251]],
    [0.66, [162, 155, 254]],
    [0.83, [253, 121, 168]],
    [1.00, [255, 78,  80 ]],
  ];

  const timeMs = p.millis();
  const colorT = (timeMs % colorPeriodMs) / colorPeriodMs;
  let cr, cg, cb;
  for (let j = 0; j < colorStops.length - 1; j++) {
    const [t0, c0] = colorStops[j];
    const [t1, c1] = colorStops[j + 1];
    if (colorT >= t0 && colorT < t1) {
      const f = (colorT - t0) / (t1 - t0);
      cr = c0[0] + (c1[0] - c0[0]) * f;
      cg = c0[1] + (c1[1] - c0[1]) * f;
      cb = c0[2] + (c1[2] - c0[2]) * f;
      break;
    }
  }
  if (cr === undefined) [cr, cg, cb] = colorStops[colorStops.length - 1][1];

  let currentX = startX;
  p.push();
  p.colorMode(p.RGB, 255);
  p.noStroke();

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const rawPhase = (timeMs - i * charDelayMs) / wavePeriodMs;
    const wavePhase = ((rawPhase % 1) + 1) % 1;
    const charY = baselineY - waveAmplitude * Math.sin(Math.PI * wavePhase);
    p.fill(cr, cg, cb);
    p.text(char, currentX, charY);
    currentX += p.textWidth(char);
  }

  p.pop();
}
```

> **注意**：若 canvas 有 `p.scale(1, -1)` 翻转，`baselineY` 传入翻转坐标系下的 y 值即可，
> 波浪方向会自动对应视觉向上（因为翻转后 -Y 在屏幕上显示为向上）。
