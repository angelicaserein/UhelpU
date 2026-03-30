# Language Choice Page — 视觉风格规范

## 色板

| 变量含义 | 色值 |
|---|---|
| 深紫黑（最深阴影/文字） | `#2A1433` |
| 中深紫（边框主色） | `#6B4A7A` |
| 浅紫灰（内高光描边） | `#8A6A99` |
| 淡紫（面板背景中段） | `#D4BEE0` → `rgba(212, 190, 224)` |
| 极浅紫（面板背景顶部） | `#E8D8F0` → `rgba(232, 216, 240)` |

---

## 一、标题光带横幅（p5 canvas 绘制）

在 `draw()` 里用 p5 直接画，与关卡标题横幅风格一致。

```js
_drawTitleBanner(p) {
  const centerY   = p.height * 0.13;       // 纵向位置（距顶13%）
  const bandH     = Math.max(72, p.height * 0.115);  // 横幅高度
  const coreBandW = p.width * 0.52;        // 中央实心段宽度
  const sideFadeW = p.width * 0.36;        // 两侧渐隐宽度

  // 两侧渐隐光带（白色，alpha 最大 108/255）
  for (let i = 0; i < sideFadeW; i++) {
    const t = i / Math.max(1, sideFadeW - 1);
    p.fill(255, 255, 255, (1 - t) * 108);
    p.rect(leftOuterX + i,  bandY, 1, bandH);
    p.rect(rightOuterX - i, bandY, 1, bandH);
  }

  p.fill(255, 255, 255, 248);              // 文字：纯白
  p.textStyle(p.BOLD);
  p.textSize(Math.floor(p.width * 0.026)); // 英文行字号
  p.text("Please Select Language", p.width * 0.5, centerY - bandH * 0.2);

  p.textSize(Math.floor(p.width * 0.032)); // 中文行字号（稍大）
  p.text("请 选 择 语 言", p.width * 0.5, centerY + bandH * 0.22);
}
```

**关键参数：**
- `centerY = p.height * 0.13` — 横幅中心纵坐标，改这个调高低
- `bandH = p.height * 0.115` — 横幅高度比例
- `coreBandW = p.width * 0.52` — 实心段宽度比例
- `sideFadeW = p.width * 0.36` — 渐隐扩散宽度
- 最大 alpha `108` — 控制光带亮度（0–255）
- 英文字号 `p.width * 0.026`，中文字号 `p.width * 0.032`

---

## 二、选择面板（DOM + CSS）

### HTML 结构

```html
<div class="language-panel lang-panel-left">      <!-- 外层定位容器 -->
  <div class="lang-frame-inner">                  <!-- 带边框的可见框 -->
    <div class="lang-fog"></div>                  <!-- 雾化叠层 -->
    <div class="lang-panel-text">ENGLISH</div>    <!-- 大字 -->
    <div class="lang-panel-hint">Click to select</div>
  </div>
</div>
```

### 面板定位

```css
.language-panel {
  position: absolute;
  width: 38%;
  height: 60%;
  top: 26%;
}
.lang-panel-left  { left: 8%; }
.lang-panel-right { right: 8%; }
```

> 调整尺寸改 `width / height`；调整与标题的间距改 `top`；调整两框距边距改 `left / right`。

### 边框风格（像素硬边 + 双层描边）

```css
.lang-frame-inner {
  border: 8px solid #6b4a7a;             /* 主边框 */
  box-shadow:
    inset 0 0 0 2px #8a6a99,             /* 内高光描边 */
    inset 0 0 0 4px #2a1433;             /* 内阴影描边 */
}
```

> 无 `border-radius`，保持像素风硬边。

### 背景（半透明渐变，透出底图）

```css
.lang-frame-inner {
  background: linear-gradient(
    180deg,
    rgba(232, 216, 240, 0.72) 0%,   /* 顶部极浅紫 */
    rgba(212, 190, 224, 0.68) 50%,  /* 中段淡紫 */
    rgba(138, 106, 153, 0.65) 100%  /* 底部浅紫灰 */
  );
}
```

> 调 rgba 第四个参数（0–1）控制透明度，数值越小越透。

### 雾化叠层

```css
.lang-fog {
  background:
    radial-gradient(circle at 50% 30%, rgba(232, 216, 240, 0.18), transparent 55%),
    radial-gradient(circle at 50% 75%, rgba(42, 20, 51, 0.06),    transparent 60%);
}
```

> `circle at X% Y%` 控制光斑位置；最后的 alpha 控制强度。

### 大字

```css
.lang-panel-text {
  font-size: 110px;
  font-weight: 900;
  color: #2a1433;                          /* 深紫黑 */
  text-shadow:
    0 2px 0 rgba(232, 216, 240, 0.5),      /* 顶部白色高光 */
    3px 5px 12px rgba(42, 20, 51, 0.4);    /* 底部投影 */
}
```

### 面板内提示小字

```css
.lang-panel-hint {
  font-size: 24px;
  color: #ffffff;
  text-shadow:
    0 0 8px rgba(42, 20, 51, 0.9),
    0 2px 0 rgba(42, 20, 51, 0.8),
    0 4px 12px rgba(0, 0, 0, 0.7);
}
```

### Hover 效果

```css
.language-panel:hover {
  filter: brightness(1.12) saturate(1.08);
  transform: scale(1.018);
}
```

---

## 三、底部呼吸灯提示条

### HTML

```html
<div class="lang-hint-bar">
  <div class="lang-hint-text">
    You can change the language anytime in Settings.<br>
    可以在设置界面随时调整语言。
  </div>
</div>
```

### CSS

```css
/* 呼吸动画 */
@keyframes lang-hint-breathe {
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 1.0;  }
}

/* 黑色半透明长条 */
.lang-hint-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 13px 0 15px;
  background: rgba(0, 0, 0, 0.52);
  text-align: center;
  z-index: 150;
  pointer-events: none;
}

/* 白色呼吸文字 */
.lang-hint-text {
  font-size: 17px;
  color: #ffffff;
  letter-spacing: 0.07em;
  line-height: 1.7;
  animation: lang-hint-breathe 2.8s ease-in-out infinite;
}
```

> 调 `2.8s` 改呼吸速度；调 `opacity 0.45` 改最暗时亮度；调 `background rgba` 第四参数改条带透明度。

---

## 四、背景图

- 文件：`assets/images/bg/languagechoice.png`
- 加载键：`Assets.bgImageLanguageChoice`（index `results[70]`）
- 绘制：`p.image(Assets.bgImageLanguageChoice, 0, 0, p.width, p.height)`
