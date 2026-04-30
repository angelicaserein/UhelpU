import { PageBase } from "../PageBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";
import { t, i18n } from "../../../i18n/index.js";
import "../../../i18n/i18nUserLevel.js";

export class StaticPageUserLevelList extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
    this._levelList = [];
    this._isLoaded = false;
    this._container = null;
  }

  enter() {
    super.enter();

    const p = this.p;

    AudioManager.playBGM("levelChoice");

    // 创建返回按钮
    const backBtn = new BackButton(p, () => this.switcher.showWorldSelect(p));
    this.addElement(backBtn);

    // 创建主容器 - 对齐排行榜样式
    const container = p.createDiv("");
    container.addClass("leaderboard-card");
    container.style("position", "fixed");
    container.style("top", "50%");
    container.style("left", "50%");
    container.style("transform", "translate(-50%, -50%)");
    container.style("width", "60vw");
    container.style("max-width", "800px");
    container.style("height", "65vh");
    container.style("min-height", "400px");
    container.style("padding", "36px 40px");
    container.style("overflow", "hidden");
    container.style("display", "flex");
    container.style("flex-direction", "column");
    this.addElement(container);
    this._container = container;

    // 创建地图按钮 - 放在画布右上角
    const createBtn = p.createButton(t("user_level_create_map"));
    createBtn.style("position", "absolute");
    createBtn.style("top", "32px");
    createBtn.style("right", "40px");
    createBtn.style("padding", "10px 20px");
    createBtn.style("background", "rgba(120,80,200,0.85)");
    createBtn.style("color", "#fff");
    createBtn.style("border", "1px solid rgba(255,255,255,0.2)");
    createBtn.style("border-radius", "8px");
    createBtn.style("font-size", "14px");
    createBtn.style("font-family", '"HYPixel11", "PixelFont", sans-serif');
    createBtn.style("cursor", "pointer");
    createBtn.style("z-index", "1000");
    createBtn.mousePressed(() => {
      this.eventBus.publish(EventTypes.LOAD_LEVEL, {
        levelType: "emptyEditor",
      });
    });
    createBtn.parent(p.canvas.parentElement);
    this.addElement(createBtn);

    // 创建搜索框
    const searchWrap = p.createDiv("");
    searchWrap.parent(container);
    searchWrap.style("padding", "0 0 16px 0");

    const searchInput = p.createElement("input");
    searchInput.parent(searchWrap);
    searchInput.attribute("placeholder", t("user_level_search_placeholder"));
    searchInput.addClass("leaderboard-tab-button");
    searchInput.style("width", "100%");
    searchInput.style("box-sizing", "border-box");
    searchInput.style("background", "rgba(255,255,255,0.07)");
    searchInput.style("border", "1px solid rgba(255,255,255,0.15)");
    searchInput.style("border-radius", "6px");
    searchInput.style("color", "#fff");
    searchInput.style("padding", "10px 16px");
    searchInput.style("font-size", "15px");
    searchInput.style("outline", "none");
    this._searchInput = searchInput;

    searchInput.elt.addEventListener("input", () => {
      this._renderCards();
    });

    // 创建可滚动列表区域
    const listWrap = p.createDiv("");
    listWrap.parent(container);
    listWrap.style("height", "calc(65vh - 120px)");
    listWrap.style("overflow-y", "auto");
    this._listWrap = listWrap;

    // 初始化状态
    this._levelList = [];
    this._isLoaded = false;

    // 注册 wheel 事件监听
    const canvas = this.p.canvas || this.p.drawingContext?.canvas;
    if (canvas) {
      this._wheelHandler = (e) => {
        e.preventDefault();
      };
      canvas.addEventListener("wheel", this._wheelHandler, { passive: false });
    }

    // 显示加载中提示
    const loading = document.createElement("div");
    loading.className = "leaderboard-empty";
    loading.textContent = t("user_level_loading");
    this._listWrap.elt.appendChild(loading);

    // 注册语言变化监听器
    this._langChangeHandler = (lang) => {
      searchInput.attribute("placeholder", t("user_level_search_placeholder"));
      createBtn.html(t("user_level_create_map"));
      this._renderCards();
    };
    i18n.onChange(this._langChangeHandler);

    // 异步获取关卡列表
    this._fetchLevels();
  }

  async _fetchLevels() {
    try {
      if (!window.getUserLevelList) {
        console.error("[StaticPageUserLevelList] getUserLevelList not found");
        this._levelList = [];
      } else {
        this._levelList = await window.getUserLevelList();
      }
    } catch (error) {
      console.error("[StaticPageUserLevelList] Failed to fetch levels:", error);
      this._levelList = [];
    } finally {
      this._isLoaded = true;
      this._renderCards();
    }
  }

  _renderCards() {
    if (!this._listWrap) return;
    const query = this._searchInput?.elt.value.toLowerCase() || "";
    const filtered = this._levelList.filter(
      (item) =>
        (item.title || "").toLowerCase().includes(query) ||
        (item.authorName || "").toLowerCase().includes(query),
    );

    this._listWrap.elt.innerHTML = "";

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "leaderboard-empty";
      empty.textContent = query
        ? t("user_level_no_match")
        : t("user_level_empty");
      this._listWrap.elt.appendChild(empty);
      return;
    }

    filtered.forEach((item) => {
      const row = document.createElement("div");
      row.style.cssText = `
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 20px 26px;
        margin-bottom: 14px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        display: flex;
        flex-direction: column;
        gap: 6px;
      `;

      const title = document.createElement("div");
      title.style.cssText = `
        font-size: 18px;
        color: #ffffff;
        font-weight: 600;
        text-align: left;
        word-break: break-all;
        white-space: normal;
        overflow: visible;
      `;
      title.textContent = item.title || t("user_level_unnamed");

      const author = document.createElement("div");
      author.style.cssText = `
        font-size: 13px;
        color: rgba(200,180,255,0.7);
        text-align: left;
      `;
      author.textContent =
        t("user_level_by_prefix") +
        (item.authorName || t("user_level_anonymous_author"));

      row.appendChild(title);
      row.appendChild(author);

      row.addEventListener("mouseenter", () => {
        row.style.background = "rgba(255,255,255,0.11)";
        row.style.borderColor = "rgba(255,255,255,0.2)";
      });
      row.addEventListener("mouseleave", () => {
        row.style.background = "rgba(255,255,255,0.05)";
        row.style.borderColor = "rgba(255,255,255,0.08)";
      });
      row.addEventListener("click", () => {
        this.eventBus.publish(EventTypes.LOAD_LEVEL, {
          levelType: "user",
          levelId: item.id,
        });
      });

      this._listWrap.elt.appendChild(row);
    });
  }

  update() {
    // 空的
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageWorldSelect) {
      p.image(Assets.bgImageWorldSelect, 0, 0, p.width, p.height);
    } else {
      p.background(22, 12, 38);
    }
  }

  exit() {
    // 移除 wheel 事件监听
    if (this._wheelHandler) {
      const canvas = this.p.canvas || this.p.drawingContext?.canvas;
      if (canvas) {
        canvas.removeEventListener("wheel", this._wheelHandler);
      }
      this._wheelHandler = null;
    }

    // 移除语言变化监听器
    if (this._langChangeHandler) {
      i18n.offChange(this._langChangeHandler);
      this._langChangeHandler = null;
    }

    super.exit();
  }
}
