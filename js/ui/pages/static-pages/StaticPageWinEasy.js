import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { t } from "../../../i18n.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageWinEasy extends PageBase {
  constructor(levelIndex, switcher, p, eventBus) {
    super(switcher);
    this.levelIndex = levelIndex;
    this.p = p;
    this.eventBus = eventBus;

    console.log("[WinEasy] Constructor - levelIndex:", this.levelIndex);

    const levelNum = parseInt(this.levelIndex.replace(/.*level/, ""), 10);
    const TOTAL_LEVELS = 10;

    const btnW = 180;
    const btnH = 46;
    const btnGap = 14;
    const btnX = p.width / 2 - btnW / 2;
    // 按钮位置向下移动，为排行榜腾出空间
    const btnY0 = p.height / 2 + 120;

    // 存储按钮引用以用于键盘导航
    this._winButtons = [];

    // 下一关按钮
    if (levelNum < TOTAL_LEVELS) {
      const nextBtn = new ButtonBase(
        p,
        t("btn_next_level"),
        btnX,
        btnY0,
        () => {
          this.eventBus.publish(
            EventTypes.LOAD_LEVEL,
            `easy_level${levelNum + 1}`,
          );
        },
        "win-action-button",
      );
      nextBtn.btn.style("width", btnW + "px");
      nextBtn.btn.style("height", btnH + "px");
      this.addElement(nextBtn);
      this._winButtons.push({
        btn: nextBtn.btn,
        callback: () => {
          this.eventBus.publish(
            EventTypes.LOAD_LEVEL,
            `easy_level${levelNum + 1}`,
          );
        },
      });
    }

    // 重试按钮
    const restartBtn = new ButtonBase(
      p,
      t("btn_restart"),
      btnX,
      btnY0 + btnH + btnGap,
      () => {
        console.log(
          "[WinEasy] Restart - publishing LOAD_LEVEL with levelIndex:",
          this.levelIndex,
        );
        this.eventBus.publish(EventTypes.LOAD_LEVEL, this.levelIndex);
      },
      "win-action-button",
    );
    restartBtn.btn.style("width", btnW + "px");
    restartBtn.btn.style("height", btnH + "px");
    this.addElement(restartBtn);
    this._winButtons.push({
      btn: restartBtn.btn,
      callback: () => {
        console.log(
          "[WinEasy] Restart (via keyboard) - publishing LOAD_LEVEL with levelIndex:",
          this.levelIndex,
        );
        this.eventBus.publish(EventTypes.LOAD_LEVEL, this.levelIndex);
      },
    });

    // 返回菜单按钮
    const backBtn = new ButtonBase(
      p,
      t("btn_back_menu"),
      btnX,
      btnY0 + (btnH + btnGap) * 2,
      () => {
        this.switcher.staticSwitcher.showMainMenu(p);
      },
      "win-action-button",
    );
    backBtn.btn.style("width", btnW + "px");
    backBtn.btn.style("height", btnH + "px");
    this.addElement(backBtn);
    this._winButtons.push({
      btn: backBtn.btn,
      callback: () => {
        this.switcher.staticSwitcher.showMainMenu(p);
      },
    });

    // decorative star particles
    this._stars = [];
    for (let i = 0; i < 60; i++) {
      this._stars.push({
        x: p.random(p.width),
        y: p.random(p.height),
        size: p.random(2, 6),
        speedY: p.random(-0.6, -2.0),
        speedX: p.random(-0.4, 0.4),
        alpha: p.random(160, 255),
        hue: p.random(280, 320),
      });
    }

    // 排行榜数据
    this._leaderboard = [];
    this._leaderboardLoaded = false;
  }

  enter() {
    super.enter();

    AudioManager.playBGM("gameWin");

    // 加载排行榜数据（等待1秒确保成绩已上报）
    setTimeout(() => {
      this._loadLeaderboard();
    }, 1000);

    // 底部提示条
    const hintBar = this.p.createDiv(
      `<div class="win-hint-text">${t("win_press_space_or_enter")}</div>`,
    );
    hintBar.addClass("win-hint-bar");
    this.addElement(hintBar);

    // 注册键盘导航
    if (this._winButtons.length > 0) {
      this.registerNavButtons(this._winButtons, {
        layout: "vertical",
        onEsc: () => this.switcher.staticSwitcher.showMainMenu(this.p),
      });
    }
  }

  /**
   * 加载排行榜数据
   * @private
   */
  async _loadLeaderboard() {
    if (!window.getLeaderboard) {
      console.warn("[WinEasy] getLeaderboard not available, skipping");
      return;
    }

    try {
      this._leaderboard = await window.getLeaderboard(this.levelIndex, 10);
      this._leaderboardLoaded = true;
      console.log(
        "[WinEasy] Leaderboard loaded:",
        this._leaderboard.length,
        "entries",
      );
    } catch (error) {
      console.error("[WinEasy] Failed to load leaderboard:", error);
      this._leaderboard = [];
      this._leaderboardLoaded = true;
    }
  }

  draw() {
    const p = this.p;

    // pink-to-purple gradient background
    for (let y = 0; y < p.height; y++) {
      const t = y / p.height;
      const r = p.lerp(255, 100, t);
      const g = p.lerp(150, 40, t);
      const b = p.lerp(200, 180, t);
      p.stroke(r, g, b);
      p.line(0, y, p.width, y);
    }
    p.noStroke();

    // drift stars upward
    for (const s of this._stars) {
      s.x += s.speedX;
      s.y += s.speedY;
      if (s.y < -10) {
        s.y = p.height + 5;
        s.x = p.random(p.width);
      }
      p.fill(255, 180, 220, s.alpha);
      p.rect(s.x, s.y, s.size, s.size);
    }

    // title glow
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);

    p.fill(200, 80, 180, 60);
    p.textSize(78);
    p.text(t("result_win"), p.width / 2 + 3, p.height / 4 + 3);

    p.fill(255, 200, 240);
    p.textSize(76);
    p.text(t("result_win"), p.width / 2, p.height / 4);

    // sub-label
    p.fill(255, 200, 240, 200);
    p.textSize(20);
    const levelNum = parseInt(this.levelIndex.replace("level", ""), 10);
    p.text(`- Level ${levelNum} -`, p.width / 2, p.height / 4 + 68);

    // 绘制排行榜
    this._drawLeaderboard(p);
  }

  /**
   * 绘制排行榜
   * @private
   */
  _drawLeaderboard(p) {
    if (!this._leaderboardLoaded) {
      return;
    }

    const baseX = p.width / 2;
    const baseY = 180;
    const rowHeight = 28;
    const maxRows = 10;

    // 排行榜背景
    const panelWidth = 360;
    const panelHeight = rowHeight * Math.min(this._leaderboard.length + 1, maxRows + 1) + 16;
    p.fill(0, 0, 0, 120);
    p.rect(baseX - panelWidth / 2, baseY - 8, panelWidth, panelHeight, 4);

    // 排行榜标题
    if (Assets.customFont) p.textFont(Assets.customFont);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(220, 180, 255, 255);
    p.text("TOP 10", baseX - panelWidth / 2 + 12, baseY);

    // 排行榜条目
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);

    for (let i = 0; i < Math.min(this._leaderboard.length, 10); i++) {
      const entry = this._leaderboard[i];
      const y = baseY + rowHeight * (i + 1);

      // 高亮当前玩家
      const isCurrentPlayer = entry.playerName === window.playerName;
      if (isCurrentPlayer) {
        p.fill(255, 200, 100, 30);
        p.rect(
          baseX - panelWidth / 2 + 4,
          y - 2,
          panelWidth - 8,
          rowHeight - 2,
          2,
        );
      }

      // 排序颜色
      let rankColor;
      if (i === 0) rankColor = [255, 215, 0]; // 金色
      else if (i === 1) rankColor = [192, 192, 192]; // 银色
      else if (i === 2) rankColor = [205, 127, 50]; // 铜色
      else rankColor = [200, 180, 255]; // 默认
      p.fill(...rankColor, 255);
      p.text(`${entry.rank}`, baseX - panelWidth / 2 + 12, y);

      // 玩家名字
      p.fill(255, 255, 255, 220);
      p.text(entry.playerName, baseX - panelWidth / 2 + 50, y);

      // 时间
      p.fill(220, 220, 200, 200);
      p.text(
        `${entry.timeSeconds}s`,
        baseX - panelWidth / 2 + panelWidth - 80,
        y,
      );
    }

    // 如果没有排行榜数据
    if (this._leaderboard.length === 0) {
      p.fill(200, 180, 255, 150);
      p.textAlign(p.CENTER, p.TOP);
      p.text("No records yet", baseX, baseY + rowHeight);
    }
  }
}
