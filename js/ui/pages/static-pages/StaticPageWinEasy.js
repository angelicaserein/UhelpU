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
    const nextLevelId = this.levelIndex.replace(
      /level\d+$/,
      `level${levelNum + 1}`,
    );
    const TOTAL_LEVELS = 10;

    const btnW = 180;
    const btnH = 46;
    const btnGap = 14;

    // 计算横排按钮的布局
    const totalBtnWidth = btnW * 3 + btnGap * 2;
    const btnStartX = p.width / 2 - totalBtnWidth / 2;
    // 按钮位置向下移动到屏幕下方，为排行榜腾出中间空间
    const btnY = p.height * 3 / 4;

    // 存储按钮引用以用于键盘导航
    this._winButtons = [];

    // 下一关按钮（左边）
    if (levelNum < TOTAL_LEVELS) {
      const nextBtn = new ButtonBase(
        p,
        t("btn_next_level"),
        btnStartX,
        btnY,
        () => {
          this.eventBus.publish(
            EventTypes.LOAD_LEVEL,
            nextLevelId,
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
            nextLevelId,
          );
        },
      });
    }

    // 重试按钮（中间）
    const restartBtn = new ButtonBase(
      p,
      t("btn_restart"),
      btnStartX + btnW + btnGap,
      btnY,
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

    // 返回菜单按钮（右边）
    const backBtn = new ButtonBase(
      p,
      t("btn_back_menu"),
      btnStartX + (btnW + btnGap) * 2,
      btnY,
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
    this._leaderboardStatus = 'idle'; // 'idle' | 'loading' | 'loaded' | 'error'
    this._leaderboardLoadTime = 0;
    this._entryShowStartTimes = []; // 每条记录的显示开始时间戳
    this._currentScore = null; // 本次成绩
    this._currentRank = null; // 本次排名
    this._bestScore = null; // 历史最佳成绩
    this._bestRank = null; // 历史最佳排名
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

    // 注册键盘导航（横排排列）
    if (this._winButtons.length > 0) {
      this.registerNavButtons(this._winButtons, {
        layout: "horizontal",
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
      this._leaderboardStatus = 'error';
      return;
    }

    this._leaderboardStatus = 'loading';

    try {
      const allEntries = await window.getLeaderboard(this.levelIndex, 100); // 获取更多数据用于去重

      // 获取当前玩家的本次成绩（从 window.finalScore 获取，由 LevelTimerManager 在通关时设置）
      this._currentScore = window.finalScore || null;
      console.log("[WinEasy Load] playerName:", window.playerName, "finalScore:", window.finalScore, "currentScore:", this._currentScore);

      // 去重逻辑：同名但身份不同（游客 vs 账号）视为不同玩家
      // key = playerName + "|" + isAccount，保证游客 moosry 和账号 moosry 各自独立
      const playerBestScores = {};
      for (const entry of allEntries) {
        const key = entry.playerName + "|" + !!entry.isAccount;
        const timeSeconds = parseFloat(entry.timeSeconds);

        if (!playerBestScores[key]) {
          playerBestScores[key] = { ...entry, timeSeconds };
        } else {
          const currentBest = parseFloat(playerBestScores[key].timeSeconds);
          if (timeSeconds < currentBest) {
            playerBestScores[key] = { ...entry, timeSeconds };
          }
        }
      }

      // 当前玩家的身份标志（用于匹配）
      let currentPlayerIsAccount = false;
      try {
        if (localStorage.getItem("playerAccount")) currentPlayerIsAccount = true;
      } catch (e) {}
      this._currentPlayerIsAccount = currentPlayerIsAccount;
      const currentPlayerKey = window.playerName + "|" + currentPlayerIsAccount;

      // 打印诊断信息
      console.log("[WinEasy] Total entries loaded:", allEntries.length);
      if (window.playerName) {
        const myRecords = allEntries.filter(e => e.playerName === window.playerName && !!e.isAccount === currentPlayerIsAccount);
        console.log(`[WinEasy] All records for "${window.playerName}" (isAccount=${currentPlayerIsAccount}):`, myRecords.map(e => ({ time: e.timeSeconds, date: e.timestamp })));
        console.log(`[WinEasy] Best from records:`, playerBestScores[currentPlayerKey]);
      }

      // 转换为数组并按时间排序，取前10名
      this._leaderboard = Object.values(playerBestScores)
        .sort((a, b) => a.timeSeconds - b.timeSeconds)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      // 计算当前玩家的排名信息
      if (this._currentScore !== null && window.playerName) {
        // 本次排名（当前成绩和所有人最佳成绩对比，但排除当前玩家自己）
        let currentRank = 1;
        for (const entry of Object.values(playerBestScores)) {
          // 排除当前玩家自己的历史最佳，只看其他玩家
          if (entry.playerName !== window.playerName || !!entry.isAccount !== currentPlayerIsAccount) {
            if (entry.timeSeconds < this._currentScore) {
              currentRank++;
            }
          }
        }
        this._currentRank = currentRank;

        // 历史最佳成绩和排名（用复合 key 精确匹配当前玩家）
        const playerBestValue = playerBestScores[currentPlayerKey];
        if (playerBestValue) {
          this._bestScore = parseFloat(playerBestValue.timeSeconds);

          const sortedByTime = Object.values(playerBestScores)
            .map(e => ({ ...e, time: parseFloat(e.timeSeconds) }))
            .sort((a, b) => a.time - b.time);
          this._bestRank = sortedByTime.findIndex(
            e => e.playerName === window.playerName && !!e.isAccount === currentPlayerIsAccount
          ) + 1;

          console.log("[WinEasy] bestScore type:", typeof this._bestScore, "value:", this._bestScore);
        }
      }

      this._leaderboardStatus = 'loaded';
      this._leaderboardLoadTime = Date.now();

      // 初始化每条记录的显示时间戳（依次延迟100ms）
      this._entryShowStartTimes = this._leaderboard.map((_, i) => this._leaderboardLoadTime + i * 100);

      console.log(
        "[WinEasy] Leaderboard loaded (deduplicated):",
        this._leaderboard.length,
        "entries, currentScore:",
        this._currentScore,
        "currentRank:",
        this._currentRank,
        "bestScore:",
        this._bestScore,
        "bestRank:",
        this._bestRank,
      );

      // 将统计信息挂到window对象便于调试
      window._winEasyStats = {
        currentScore: this._currentScore,
        currentRank: this._currentRank,
        bestScore: this._bestScore,
        bestRank: this._bestRank,
        playerName: window.playerName,
      };
      console.log("[WinEasy] Stats:", window._winEasyStats);
    } catch (error) {
      console.error("[WinEasy] Failed to load leaderboard:", error);
      this._leaderboardStatus = 'error';
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

    const titleY = p.height / 6;
    p.fill(200, 80, 180, 60);
    p.textSize(78);
    p.text(t("result_win"), p.width / 2 + 3, titleY + 3);

    p.fill(255, 200, 240);
    p.textSize(76);
    p.text(t("result_win"), p.width / 2, titleY);

    // sub-label
    p.fill(255, 200, 240, 200);
    p.textSize(20);
    const match = this.levelIndex.match(/\d+/);
    const levelNum = match ? parseInt(match[0], 10) : "?";
    p.text(`- Level ${levelNum} -`, p.width / 2, titleY + 52);

    // 绘制排行榜
    this._drawLeaderboard(p);
  }

  /**
   * 绘制排行榜
   * @private
   */
  _drawLeaderboard(p) {
    const baseX = p.width / 2;
    const baseY = 220;
    const rowHeight = 28;
    const maxRows = 10;
    const panelWidth = 360;
    const panelHeight = rowHeight * (maxRows + 1) + 16;

    // 背景框和标题总是显示（不等数据）
    p.fill(0, 0, 0, 120);
    p.rect(baseX - panelWidth / 2, baseY - 8, panelWidth, panelHeight, 4);

    if (Assets.customFont) p.textFont(Assets.customFont);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(220, 180, 255, 255);
    p.text("TOP 10", baseX - panelWidth / 2 + 12, baseY);

    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);

    // 根据不同状态绘制内容
    if (this._leaderboardStatus === 'loading' || this._leaderboardStatus === 'idle') {
      // 未加载或加载中 - 显示骨架屏
      this._drawSkeletonScreen(p, baseX, baseY, rowHeight, maxRows, panelWidth);
    } else if (this._leaderboardStatus === 'loaded') {
      if (this._leaderboard.length === 0) {
        // 加载完成但无数据
        p.fill(200, 180, 255, 150);
        p.textAlign(p.CENTER, p.TOP);
        p.text("No records yet", baseX, baseY + rowHeight);
      } else {
        // 加载完成 - 显示数据并做淡入动画
        this._drawLeaderboardEntries(p, baseX, baseY, rowHeight, panelWidth);
      }
    } else if (this._leaderboardStatus === 'error') {
      // 加载失败
      p.fill(255, 100, 100, 200);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(14);
      p.text("网络连接失败，请重试", baseX, baseY + rowHeight);
    }
  }

  /**
   * 绘制骨架屏（加载中）
   * @private
   */
  _drawSkeletonScreen(p, baseX, baseY, rowHeight, maxRows, panelWidth) {
    const time = Date.now();
    const flashCycle = 1000; // 闪烁周期ms
    const flashAlpha = p.map(Math.sin(time / flashCycle * Math.PI), -1, 1, 100, 200);
    const rotation = (time / 20) % 360; // 旋转速度

    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.fill(180, 170, 200, flashAlpha);

    for (let i = 0; i < maxRows; i++) {
      const y = baseY + rowHeight * (i + 1);

      // 绘制loading文字
      p.text("loading", baseX - panelWidth / 2 + 50, y);

      // 绘制转圈的加载符号
      const spinnerX = baseX - panelWidth / 2 + 35;
      const spinnerY = y + 6;
      const spinnerRadius = 4;

      p.push();
      p.translate(spinnerX, spinnerY);
      p.rotate(p.radians(rotation));

      // 绘制旋转的弧线
      p.noFill();
      p.stroke(180, 170, 200, flashAlpha);
      p.strokeWeight(2);
      p.arc(0, 0, spinnerRadius * 2, spinnerRadius * 2, 0, p.PI * 1.5);

      p.pop();
    }
  }

  /**
   * 绘制排行榜条目（带淡入动画）
   * @private
   */
  _drawLeaderboardEntries(p, baseX, baseY, rowHeight, panelWidth) {
    const currentTime = Date.now();
    const animationDuration = 400; // 每条记录的淡入动画时长ms

    for (let i = 0; i < Math.min(this._leaderboard.length, 10); i++) {
      const entry = this._leaderboard[i];
      const y = baseY + rowHeight * (i + 1);
      const showStartTime = this._entryShowStartTimes[i];

      // 计算动画进度（0 ~ 1）
      const timeSinceShow = currentTime - showStartTime;
      let animProgress = Math.min(timeSinceShow / animationDuration, 1);
      if (animProgress < 0) animProgress = 0;

      // 淡入效果
      const alpha = p.map(animProgress, 0, 1, 0, 255);

      // 仅当动画开始时才绘制
      if (animProgress === 0) continue;

      const isCurrentPlayer = entry.playerName === window.playerName && !!entry.isAccount === !!this._currentPlayerIsAccount;

      // 高亮当前玩家背景
      if (isCurrentPlayer) {
        p.fill(255, 200, 100, 50 * animProgress / 255);
        p.rect(
          baseX - panelWidth / 2 + 4,
          y - 2,
          panelWidth - 8,
          rowHeight - 2,
          2,
        );
      }

      // 排序颜色和奖牌emoji
      let rankColor;
      let medal = "";
      if (i === 0) {
        rankColor = [255, 215, 0]; // 金色
        medal = "🥇";
      } else if (i === 1) {
        rankColor = [192, 192, 192]; // 银色
        medal = "🥈";
      } else if (i === 2) {
        rankColor = [205, 127, 50]; // 铜色
        medal = "🥉";
      } else {
        rankColor = [200, 180, 255]; // 默认
      }

      // 排名 + 奖牌 - 1-3名只显示emoji，4-10名显示数字（右对齐保证对齐）
      p.fill(...rankColor, alpha);
      let rankText = "";
      if (i === 0) {
        rankText = "🥇";
      } else if (i === 1) {
        rankText = "🥈";
      } else if (i === 2) {
        rankText = "🥉";
      } else {
        rankText = `${entry.rank}`;
      }
      p.textAlign(p.LEFT, p.TOP);
      p.text(rankText, baseX - panelWidth / 2 + 12, y);

      // 账户标记 - 皇冠单独显示在排名和名字之间
      let nameStartX = baseX - panelWidth / 2 + 50;
      if (entry.isAccount) {
        p.fill(255, 255, 255, alpha);
        p.text("👑", baseX - panelWidth / 2 + 42, y);
        nameStartX = baseX - panelWidth / 2 + 60; // 名字向右移动为皇冠腾出空间
      }

      // 玩家名字（当前玩家用不同颜色，第一名用彩虹效果）
      if (i === 0) {
        // 第一名用彩虹效果
        this._drawRainbowWaveText(p, entry.playerName, nameStartX, y, alpha);
        // 如果第一名是当前玩家，加上YOU标识
        if (isCurrentPlayer) {
          p.fill(255, 200, 100, Math.min(220, alpha * 1.1));
          p.text(" ← YOU", nameStartX + p.textWidth(entry.playerName), y);
        }
      } else if (isCurrentPlayer) {
        const playerDisplayName = entry.playerName;
        p.fill(255, 255, 100, Math.min(255, alpha * 1.2));
        p.textAlign(p.LEFT, p.TOP);
        p.text(playerDisplayName + " ← YOU", nameStartX, y);
      } else {
        p.fill(255, 255, 255, Math.min(220, alpha * 1.1));
        p.textAlign(p.LEFT, p.TOP);
        p.text(entry.playerName, nameStartX, y);
      }

      // 右侧显示时间
      p.fill(220, 220, 200, Math.min(200, alpha));
      p.textAlign(p.RIGHT, p.TOP);
      p.text(`${entry.timeSeconds}s`, baseX + panelWidth / 2 - 12, y);
    }

    // 在排行榜下方显示当前玩家的成绩和排名统计
    this._drawPlayerStatsInfo(p, baseX, baseY, rowHeight, panelWidth);
  }

  /**
   * 绘制彩虹波浪文字
   * @private
   */
  _drawRainbowWaveText(p, text, startX, baselineY, alpha = 255) {
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
      p.fill(cr, cg, cb, alpha);
      p.text(char, currentX, charY);
      currentX += p.textWidth(char);
    }

    p.pop();
  }

  /**
   * 显示当前玩家的排名和成绩信息
   * @private
   */
  _drawPlayerStatsInfo(p, baseX, baseY, rowHeight, panelWidth) {
    // 调试：打印所有统计信息
    console.log("[WinEasy] Stats - currentScore:", this._currentScore, "currentRank:", this._currentRank, "bestScore:", this._bestScore, "bestRank:", this._bestRank);

    // 排行榜右边显示（panelWidth/2 右侧）
    const infoStartX = baseX + panelWidth / 2 + 20;
    const infoStartY = baseY + 30;
    const lineHeight = 20;

    p.textSize(13);
    p.textAlign(p.LEFT, p.TOP);
    p.noStroke();

    // 本次成绩
    if (this._currentScore !== null) {
      p.fill(255, 200, 100, 255);
      const text1 = `本次成绩：${this._currentScore.toFixed(2)}s`;
      p.text(text1, infoStartX, infoStartY);
    }

    // 本次排名
    if (this._currentRank !== null) {
      p.fill(255, 200, 100, 255);
      const text2 = `本次排名：第 ${this._currentRank} 名`;
      p.text(text2, infoStartX, infoStartY + lineHeight);
    }

    // 历史最佳
    if (this._bestScore !== null && this._bestRank !== null) {
      p.fill(200, 180, 255, 255);
      const bestScoreStr = typeof this._bestScore === 'number' ? this._bestScore.toFixed(2) : this._bestScore;
      const text3 = `历史最佳：${bestScoreStr}s（#${this._bestRank}）`;
      p.text(text3, infoStartX, infoStartY + lineHeight * 2);
    }
  }
}
