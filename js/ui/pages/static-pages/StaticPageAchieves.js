import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { Demo1AchievementData } from "../../../achievement system/Demo1AchievementData.js";
import { i18n, t } from "../../../i18n.js";

export class StaticPageAchieves extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
    this.hoveredIdx = -1;
    this.tooltip = null;
    this.gearAngle = 0;
    this._i18nHandler = null;
    this._nameLabels = [];
    this._cards = this._buildCardLayout(p);
  }

  _buildCardLayout(p) {
    const cols = 5;
    const cardW = p.width * 0.115;
    const cardH = p.height * 0.27;
    const totalW = p.width * 0.76;
    const startX = p.width * 0.12;
    const spacingX = totalW / (cols - 1);
    const row1CenterY = p.height * 0.35;
    const row2CenterY = p.height * 0.73;

    const cards = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        const centerX = startX + c * spacingX;
        const centerY = r === 0 ? row1CenterY : row2CenterY;
        cards.push({
          cx: centerX,
          cy: centerY,
          x: centerX - cardW / 2,
          y: centerY - cardH / 2,
          w: cardW,
          h: cardH,
          row: r,
          col: c,
          idx: r * cols + c,
        });
      }
    }
    return cards;
  }

  enter() {
    const p = this.p;
    AudioManager.playBGM("achieves");

    this.addElement(new BackButton(p, () => this.switcher.showMainMenu(p)));

    // 悬浮提示框
    this.tooltip = p.createDiv("");
    this.tooltip.addClass("achiev-tooltip");
    this.tooltip.style("display", "none");
    this.addElement({ remove: () => this.tooltip.remove() });

    // 创建解锁成就名彩虹标签
    this._createRainbowNameLabels(p);

    // 语言切换监听
    this._i18nHandler = () => {
      this._refreshTooltipContent();
      this._refreshRainbowNameLabels();
    };
    i18n.onChange(this._i18nHandler);
  }

  exit() {
    if (this._i18nHandler) {
      i18n.offChange(this._i18nHandler);
      this._i18nHandler = null;
    }
    this._removeRainbowNameLabels();
    super.exit();
  }

  update() {
    this.gearAngle += 0.003;
  }

  draw() {
    const p = this.p;

    // 背景
    if (Assets.bgImageAchieves) {
      p.image(Assets.bgImageAchieves, 0, 0, p.width, p.height);
    } else {
      p.background(30, 15, 45);
    }

    // 四角装饰齿轮
    this._drawGear(
      p,
      p.width * 0.05,
      p.height * 0.08,
      p.width * 0.032,
      this.gearAngle,
      10,
    );
    this._drawGear(
      p,
      p.width * 0.95,
      p.height * 0.08,
      p.width * 0.027,
      -this.gearAngle * 0.8,
      8,
    );
    this._drawGear(
      p,
      p.width * 0.05,
      p.height * 0.92,
      p.width * 0.027,
      -this.gearAngle * 1.2,
      8,
    );
    this._drawGear(
      p,
      p.width * 0.95,
      p.height * 0.92,
      p.width * 0.032,
      this.gearAngle * 0.9,
      10,
    );

    // 成就卡片
    const achievements = Demo1AchievementData.getAll();
    this.hoveredIdx = -1;
    for (let i = 0; i < this._cards.length && i < achievements.length; i++) {
      const card = this._cards[i];
      const achievement = achievements[i];
      const hovered =
        p.mouseX > card.x &&
        p.mouseX < card.x + card.w &&
        p.mouseY > card.y &&
        p.mouseY < card.y + card.h;
      if (hovered) this.hoveredIdx = i;
      this._drawCard(p, card, achievement, hovered);
    }

    // 更新提示框位置
    this._positionTooltip(p);
  }

  // ── 成就卡片 ──────────────────────────────────────────────────
  _drawCard(p, card, achievement, hovered) {
    const unlocked = Demo1AchievementData.isUnlocked(achievement.id);
    const { x, y, w, h } = card;

    p.push();

    // 发光阴影
    if (unlocked || hovered) {
      p.drawingContext.shadowBlur = unlocked ? 18 : 10;
      p.drawingContext.shadowColor = unlocked
        ? "rgba(160, 96, 208, 0.5)"
        : "rgba(140, 80, 180, 0.3)";
    }

    // 卡片主体
    p.fill(unlocked ? p.color(40, 18, 60, 230) : p.color(25, 12, 35, 210));
    p.stroke(unlocked ? p.color(140, 90, 180) : p.color(70, 40, 90));
    p.strokeWeight(2.5);
    p.rect(x, y, w, h, 10);
    p.drawingContext.shadowBlur = 0;

    // 内边框
    p.noFill();
    p.stroke(unlocked ? p.color(180, 130, 220, 70) : p.color(90, 60, 110, 50));
    p.strokeWeight(1);
    p.rect(x + 5, y + 5, w - 10, h - 10, 7);

    // 四角迷你齿轮
    this._drawMiniGear(p, x + 12, y + 12, 7, this.gearAngle * 2, unlocked);
    this._drawMiniGear(p, x + w - 12, y + 12, 7, -this.gearAngle * 2, unlocked);
    this._drawMiniGear(
      p,
      x + 12,
      y + h - 12,
      7,
      -this.gearAngle * 1.5,
      unlocked,
    );
    this._drawMiniGear(
      p,
      x + w - 12,
      y + h - 12,
      7,
      this.gearAngle * 1.5,
      unlocked,
    );

    // 图标
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();
    if (unlocked) {
      const achImg = Assets.achieveImgs[card.idx];
      if (achImg) {
        const imgSize = w * 0.45;
        p.imageMode(p.CENTER);
        p.image(achImg, x + w / 2, y + h * 0.33, imgSize, imgSize);
      } else {
        p.textSize(w * 0.3);
        p.text(achievement.icon, x + w / 2, y + h * 0.33);
      }
    } else {
      p.textSize(w * 0.25);
      p.fill(100, 60, 130, 150);
      p.text("🔒", x + w / 2, y + h * 0.33);
    }

    // 成就描述（卡片中间，限制在卡片内）
    if (Assets.customFont) p.textFont(Assets.customFont);
    p.textSize(w * 0.08);
    p.fill(unlocked ? p.color(230, 210, 250) : p.color(100, 70, 140, 160));
    p.stroke(0, 0, 0, unlocked ? 80 : 40);
    p.strokeWeight(1);
    const displayText = unlocked
      ? t(`achiev_${achievement.id}_desc`)
      : t("achiev_locked");
    p.textAlign(p.CENTER, p.TOP);
    p.textWrap(p.WORD);
    const descPadding = w * 0.1;
    const descTop = y + h * 0.52;
    const descBoxW = w - descPadding * 2;
    const descBoxH = y + h - h * 0.15 - 10 - descTop - 4;
    p.text(displayText, x + descPadding, descTop, descBoxW, descBoxH);

    // 底部铭牌（成就名称，解锁前后均显示）
    const plateW = w * 0.85;
    const plateH = h * 0.15;
    const plateX = x + (w - plateW) / 2;
    const plateY = y + h - plateH - 10;
    p.fill(unlocked ? p.color(70, 35, 95, 220) : p.color(40, 20, 55, 200));
    p.stroke(unlocked ? p.color(180, 140, 210) : p.color(90, 60, 120));
    p.strokeWeight(1.5);
    p.rect(plateX, plateY, plateW, plateH, 3);

    // 未解锁时在 canvas 上绘制静态名称，解锁后由 DOM 彩虹标签覆盖
    if (!unlocked) {
      p.noStroke();
      p.fill(100, 70, 130);
      p.textSize(plateH * 0.4);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(
        t(`achiev_${achievement.id}_name`),
        x + w / 2,
        plateY + plateH / 2,
      );
    }

    // 悬浮高亮
    if (hovered) {
      p.noStroke();
      p.fill(255, 255, 255, 18);
      p.rect(x, y, w, h, 10);
    }

    p.pop();
  }

  // ── 彩虹波浪成就名 DOM 标签 ────────────────────────────────────
  _createRainbowNameLabels(p) {
    this._removeRainbowNameLabels();
    const achievements = Demo1AchievementData.getAll();
    const canvas = p.canvas;
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < this._cards.length && i < achievements.length; i++) {
      const card = this._cards[i];
      const achievement = achievements[i];
      const unlocked = Demo1AchievementData.isUnlocked(achievement.id);
      if (!unlocked) continue;

      const plateW = card.w * 0.85;
      const plateH = card.h * 0.15;
      const plateY = card.y + card.h - plateH - 10;

      const label = document.createElement("div");
      label.className = "achiev-rainbow-name";
      label.style.position = "absolute";
      label.style.left = rect.left + card.x + (card.w - plateW) / 2 + "px";
      label.style.top = rect.top + plateY + "px";
      label.style.width = plateW + "px";
      label.style.height = plateH + "px";
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.justifyContent = "center";
      label.style.pointerEvents = "none";
      label.style.zIndex = "100";
      label.style.fontFamily = "'HYPixel11', 'PixelFont', sans-serif";
      label.style.fontSize = plateH * 0.4 + "px";
      label.dataset.achievIdx = i;

      this._setRainbowContent(label, t(`achiev_${achievement.id}_name`));
      document.body.appendChild(label);
      this._nameLabels.push(label);
    }
  }

  _setRainbowContent(label, text) {
    label.innerHTML = "";
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "rainbow-wave";
      span.textContent = ch;
      label.appendChild(span);
    }
  }

  _refreshRainbowNameLabels() {
    const achievements = Demo1AchievementData.getAll();
    for (const label of this._nameLabels) {
      const idx = parseInt(label.dataset.achievIdx);
      const achievement = achievements[idx];
      if (achievement) {
        this._setRainbowContent(label, t(`achiev_${achievement.id}_name`));
      }
    }
  }

  _removeRainbowNameLabels() {
    for (const label of this._nameLabels) {
      label.remove();
    }
    this._nameLabels = [];
  }

  // ── 迷你齿轮 ──────────────────────────────────────────────────
  _drawMiniGear(p, cx, cy, r, angle, lit) {
    const teeth = 6;
    p.push();
    p.translate(cx, cy);
    p.rotate(angle);
    p.noStroke();
    p.fill(lit ? p.color(150, 110, 180, 100) : p.color(80, 50, 100, 70));
    p.beginShape();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i * p.TWO_PI) / (teeth * 2);
      const rad = i % 2 === 0 ? r : r * 0.65;
      p.vertex(rad * p.cos(a), rad * p.sin(a));
    }
    p.endShape(p.CLOSE);
    p.fill(lit ? p.color(100, 70, 140, 150) : p.color(50, 30, 70, 100));
    p.circle(0, 0, r * 0.4);
    p.pop();
  }

  // ── 装饰大齿轮 ────────────────────────────────────────────────
  _drawGear(p, cx, cy, r, angle, teeth) {
    p.push();
    p.translate(cx, cy);
    p.rotate(angle);

    p.stroke(110, 75, 55, 80);
    p.strokeWeight(1);
    p.fill(85, 55, 45, 65);
    p.beginShape();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i * p.TWO_PI) / (teeth * 2);
      const rad = i % 2 === 0 ? r : r * 0.78;
      p.vertex(rad * p.cos(a), rad * p.sin(a));
    }
    p.endShape(p.CLOSE);

    p.fill(65, 40, 30, 85);
    p.noStroke();
    p.circle(0, 0, r * 0.5);

    p.fill(45, 25, 20, 100);
    p.circle(0, 0, r * 0.18);

    p.stroke(95, 65, 50, 65);
    p.strokeWeight(1.5);
    for (let i = 0; i < 4; i++) {
      const a = (i * p.TWO_PI) / 4;
      p.line(
        r * 0.12 * p.cos(a),
        r * 0.12 * p.sin(a),
        r * 0.22 * p.cos(a),
        r * 0.22 * p.sin(a),
      );
    }

    p.pop();
  }

  // ── 提示框定位 ────────────────────────────────────────────────
  _positionTooltip(p) {
    if (!this.tooltip) return;

    if (this.hoveredIdx < 0) {
      this.tooltip.style("display", "none");
      return;
    }

    const card = this._cards[this.hoveredIdx];
    const canvas = p.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const absX = rect.left + card.cx;
    const absY =
      card.row === 0 ? rect.top + card.y + card.h + 10 : rect.top + card.y - 10;

    this.tooltip.style("display", "block");
    this.tooltip.position(absX, absY);

    if (card.row === 0) {
      this.tooltip.removeClass("achiev-tooltip-above");
      this.tooltip.addClass("achiev-tooltip-below");
    } else {
      this.tooltip.removeClass("achiev-tooltip-below");
      this.tooltip.addClass("achiev-tooltip-above");
    }

    this._refreshTooltipContent();
  }

  _refreshTooltipContent() {
    if (!this.tooltip || this.hoveredIdx < 0) return;

    const achievement = Demo1AchievementData.getAll()[this.hoveredIdx];
    if (!achievement) return;
    const unlocked = Demo1AchievementData.isUnlocked(achievement.id);
    const title = unlocked
      ? t(`achiev_${achievement.id}_name`)
      : t("achiev_locked");
    const unlockDescKey = `achiev_${achievement.id}_unlock_desc`;
    const unlockDesc = t(unlockDescKey);
    const desc = unlocked
      ? unlockDesc !== unlockDescKey
        ? unlockDesc
        : t(`achiev_${achievement.id}_desc`)
      : t("achiev_locked_desc");
    const icon = unlocked ? "✅" : "🔒";

    this.tooltip.html(
      `<div class="achiev-tooltip-title">${icon} ${title}</div>` +
        `<div class="achiev-tooltip-desc">${desc}</div>`,
    );
  }
}
