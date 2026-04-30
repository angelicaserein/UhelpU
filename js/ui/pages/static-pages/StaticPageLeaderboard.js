import { PageBase } from "../PageBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { i18n, t } from "../../../i18n/index.js";

const CARD_COUNT = 10;
const RANK_LOOKUP_LIMIT = 999;

export class StaticPageLeaderboard extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
    this._activeMode = "easy";
    this._cardsData = [];
    this._loadToken = 0;
    this._currentPlayerIsAccount = this._detectCurrentPlayerIsAccount();
    this._root = null;
    this._titleEl = null;
    this._subtitleEl = null;
    this._tabEasyBtn = null;
    this._tabHardBtn = null;
    this._grid = null;
  }

  enter() {
    super.enter();

    const p = this.p;
    AudioManager.playBGM("levelChoice");

    const layout = this._getLayoutMetrics();

    const backBtn = new BackButton(p, () => this.switcher.showWorldSelect(p));
    const backBtnWidth = 0.04 * p.width;
    const backBtnHeight = 0.065 * p.height;
    backBtn.setPosition(
      Math.max(12, layout.x - backBtnWidth - 14),
      Math.max(12, layout.y - backBtnHeight - 10),
    );
    backBtn.btn.addClass("leaderboard-back-button");
    this.addElement(backBtn);

    this._createLayout(layout);
    this._refreshTabButtons();
    this._cardsData = this._buildLoadingCards(this._activeMode);
    this._renderCards();

    this.registerNavButtons(
      [
        {
          btn: backBtn.btn,
          callback: () => this.switcher.showWorldSelect(p),
        },
        {
          btn: this._tabEasyBtn,
          callback: () => this._handleModeSwitch("easy"),
        },
        {
          btn: this._tabHardBtn,
          callback: () => this._handleModeSwitch("hard"),
        },
      ],
      {
        layout: "horizontal",
        onEsc: () => this.switcher.showWorldSelect(p),
      },
    );

    this._loadModeData(this._activeMode);
  }

  draw() {
    const p = this.p;
    p.background(22, 12, 38);

    if (Assets.bgImageWorldSelect) {
      p.push();
      p.tint(255, 205);
      p.image(Assets.bgImageWorldSelect, 0, 0, p.width, p.height);
      p.pop();
    }
  }

  _onLanguageChange() {
    this._refreshHeaderText();
    this._refreshTabButtons();
    this._renderCards();
  }

  _getLayoutMetrics() {
    const p = this.p;
    const layoutWidth = Math.min(p.width - 64, 1220);
    const layoutHeight = Math.min(p.height - 112, 620);
    const layoutX = (p.width - layoutWidth) / 2;
    const layoutY = 86;

    return {
      width: layoutWidth,
      height: layoutHeight,
      x: layoutX,
      y: layoutY,
    };
  }

  _createLayout(layout = this._getLayoutMetrics()) {
    const p = this.p;

    this._root = p.createDiv("");
    this._root.addClass("leaderboard-page");
    this._root.position(layout.x, layout.y);
    this._root.style("width", layout.width + "px");
    this._root.style("height", layout.height + "px");

    const header = p.createDiv("");
    header.addClass("leaderboard-header");
    header.parent(this._root);

    const titleWrap = p.createDiv("");
    titleWrap.addClass("leaderboard-title-wrap");
    titleWrap.parent(header);

    this._titleEl = p.createDiv("");
    this._titleEl.addClass("leaderboard-page-title");
    this._titleEl.parent(titleWrap);

    this._subtitleEl = p.createDiv("");
    this._subtitleEl.addClass("leaderboard-page-subtitle");
    this._subtitleEl.parent(titleWrap);

    const tabs = p.createDiv("");
    tabs.addClass("leaderboard-tabs");
    tabs.parent(header);

    this._tabEasyBtn = p.createButton("");
    this._tabEasyBtn.addClass("leaderboard-tab-button");
    this._tabEasyBtn.parent(tabs);
    this._tabEasyBtn.mousePressed(() => this._handleModeSwitch("easy"));

    this._tabHardBtn = p.createButton("");
    this._tabHardBtn.addClass("leaderboard-tab-button");
    this._tabHardBtn.parent(tabs);
    this._tabHardBtn.mousePressed(() => this._handleModeSwitch("hard"));

    this._grid = p.createDiv("");
    this._grid.addClass("leaderboard-grid");
    this._grid.parent(this._root);

    this._refreshHeaderText();
    this.addElement(this._root);
  }

  _refreshHeaderText() {
    if (!this._titleEl || !this._subtitleEl) return;
    this._titleEl.html(t("leaderboard_page_title"));
    this._subtitleEl.html(t("leaderboard_all_records"));
  }

  _refreshTabButtons() {
    if (!this._tabEasyBtn || !this._tabHardBtn) return;

    this._tabEasyBtn.html(t("world_easy"));
    this._tabHardBtn.html(t("world_difficult"));

    this._tabEasyBtn.removeClass("leaderboard-tab-active");
    this._tabHardBtn.removeClass("leaderboard-tab-active");

    if (this._activeMode === "easy") {
      this._tabEasyBtn.addClass("leaderboard-tab-active");
    } else {
      this._tabHardBtn.addClass("leaderboard-tab-active");
    }
  }

  _handleModeSwitch(mode) {
    if (mode === this._activeMode) return;
    this._activeMode = mode;
    this._refreshTabButtons();
    AudioManager.playSFX("click");
    this._loadModeData(mode);
  }

  _buildLoadingCards(mode) {
    return Array.from({ length: CARD_COUNT }, (_, index) => ({
      levelId: `${mode}_level${index + 1}`,
      levelNumber: index + 1,
      mode,
      status: "loading",
      entries: [],
      currentPlayerRank: null,
    }));
  }

  async _loadModeData(mode) {
    const requestToken = ++this._loadToken;
    this._cardsData = this._buildLoadingCards(mode);
    this._renderCards();

    if (!window.getLeaderboard) {
      this._cardsData = this._buildErrorCards(mode);
      this._renderCards();
      return;
    }

    const promises = Array.from({ length: CARD_COUNT }, (_, index) => {
      const levelNumber = index + 1;
      const levelId = `${mode}_level${levelNumber}`;
      return this._loadSingleCard(mode, levelId, levelNumber);
    });

    const results = await Promise.all(promises);
    if (requestToken !== this._loadToken) return;

    this._cardsData = results;
    this._renderCards();
  }

  _buildErrorCards(mode) {
    return Array.from({ length: CARD_COUNT }, (_, index) => ({
      levelId: `${mode}_level${index + 1}`,
      levelNumber: index + 1,
      mode,
      status: "error",
      entries: [],
      currentPlayerRank: null,
    }));
  }

  async _loadSingleCard(mode, levelId, levelNumber) {
    try {
      const allEntries = await window.getLeaderboard(
        levelId,
        RANK_LOOKUP_LIMIT,
      );
      const currentPlayerRank = this._findCurrentPlayerRank(allEntries);
      return {
        levelId,
        levelNumber,
        mode,
        status: "loaded",
        entries: allEntries,
        currentPlayerRank,
      };
    } catch (error) {
      console.error(
        `[StaticPageLeaderboard] Failed to load ${levelId}:`,
        error,
      );
      return {
        levelId,
        levelNumber,
        mode,
        status: "error",
        entries: [],
        currentPlayerRank: null,
      };
    }
  }

  _findCurrentPlayerRank(entries) {
    if (!window.playerName) return null;
    const index = entries.findIndex(
      (entry) =>
        entry.playerName === window.playerName &&
        !!entry.isAccount === this._currentPlayerIsAccount,
    );
    return index === -1 ? null : index + 1;
  }

  _renderCards() {
    if (!this._grid) return;
    this._grid.html("");

    for (const cardData of this._cardsData) {
      const card = this.p.createDiv("");
      card.addClass("leaderboard-card");
      card.parent(this._grid);

      const header = this.p.createDiv("");
      header.addClass("leaderboard-card-header");
      header.parent(card);

      const title = this.p.createDiv(
        this._getLevelTitle(cardData.mode, cardData.levelNumber),
      );
      title.addClass("leaderboard-card-title");
      title.parent(header);

      const badge = this.p.createDiv(t("leaderboard_top_ten"));
      badge.html(t("leaderboard_all_records"));
      badge.addClass("leaderboard-card-badge");
      badge.parent(header);

      const body = this.p.createDiv("");
      body.addClass("leaderboard-card-body");
      body.parent(card);

      if (cardData.status === "loading") {
        this._renderSkeleton(body);
      } else if (cardData.status === "error") {
        const error = this.p.createDiv(t("network_error"));
        error.addClass("leaderboard-error");
        error.parent(body);
      } else if (cardData.entries.length === 0) {
        const empty = this.p.createDiv(t("no_records_yet"));
        empty.addClass("leaderboard-empty");
        empty.parent(body);
      } else {
        for (const entry of cardData.entries) {
          const row = this.p.createDiv("");
          row.addClass("leaderboard-entry-row");
          row.parent(body);

          const isCurrentPlayer =
            entry.playerName === window.playerName &&
            !!entry.isAccount === this._currentPlayerIsAccount;

          if (isCurrentPlayer) {
            row.addClass("leaderboard-entry-current");
          }

          const rank = this.p.createDiv(this._getRankLabel(entry.rank));
          rank.addClass("leaderboard-entry-rank");
          rank.parent(row);

          const name = this.p.createDiv(
            this._buildNameHtml(entry, isCurrentPlayer),
          );
          name.addClass("leaderboard-entry-name");
          name.parent(row);

          const time = this.p.createDiv(
            `${this._escapeHtml(this._formatLeaderboardTime(entry.timeSeconds))}s`,
          );
          time.addClass("leaderboard-entry-time");
          time.parent(row);
        }
      }

      const footer = this.p.createDiv(
        this._formatPlayerRank(cardData.currentPlayerRank),
      );
      footer.addClass("leaderboard-card-footer");
      footer.parent(card);
    }
  }

  _renderSkeleton(body) {
    for (let i = 0; i < 7; i++) {
      const row = this.p.createDiv("");
      row.addClass("leaderboard-skeleton-row");
      row.parent(body);
    }

    const loading = this.p.createDiv(t("leaderboard_loading"));
    loading.addClass("leaderboard-empty");
    loading.parent(body);
  }

  _getRankLabel(rank) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return String(rank);
  }

  _buildNameHtml(entry, isCurrentPlayer) {
    const crown = entry.isAccount
      ? '<span class="leaderboard-crown">👑</span>'
      : "";
    const name =
      entry.rank === 1
        ? this._buildRainbowName(entry.playerName)
        : `<span class="leaderboard-name-text">${this._escapeHtml(entry.playerName)}</span>`;
    const you = isCurrentPlayer
      ? `<span class="leaderboard-you-tag">← ${this._escapeHtml(t("leaderboard_you"))}</span>`
      : "";
    return `${crown}${name}${you}`;
  }

  _buildRainbowName(name) {
    const chars = Array.from(name).map(
      (char) => `<span class="rainbow-wave">${this._escapeHtml(char)}</span>`,
    );
    return `<span class="leaderboard-name-text">${chars.join("")}</span>`;
  }

  _formatPlayerRank(rank) {
    const rankText = rank == null ? "--" : String(rank);
    return `${t("leaderboard_your_rank_prefix")}${rankText}${t("leaderboard_your_rank_suffix")}`;
  }

  _getLevelTitle(mode, levelNumber) {
    const difficulty = mode === "easy" ? t("world_easy") : t("world_difficult");
    if (i18n.getLang() === "zh") {
      return `${difficulty} ${t("leaderboard_level_prefix")}${levelNumber}${t("leaderboard_level_suffix")}`;
    }
    return `${difficulty} ${t("leaderboard_level_prefix")} ${levelNumber}${t("leaderboard_level_suffix")}`;
  }

  _detectCurrentPlayerIsAccount() {
    try {
      return !!localStorage.getItem("playerAccount");
    } catch (error) {
      return false;
    }
  }

  _escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  _formatLeaderboardTime(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    return num.toLocaleString("en-US", {
      useGrouping: false,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}
