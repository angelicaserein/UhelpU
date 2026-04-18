import { PageBase } from "../PageBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

export class StaticPageUserLevelList extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
    this._levelList = [];
    this._isLoaded = false;
    this._loadingDiv = null;
    this._domLayoutCreated = false;
    this._root = null;
    this._grid = null;
    this._hoveredCardElement = null;
  }

  enter() {
    super.enter();

    const p = this.p;

    AudioManager.playBGM("levelChoice");

    // 创建返回按钮
    const backBtn = new BackButton(p, () => this.switcher.showWorldSelect(p));
    this.addElement(backBtn);

    // 创建加载提示 div，用 addElement() 注册
    this._loadingDiv = p.createDiv("加载中...");
    this._loadingDiv.style("position", "fixed");
    this._loadingDiv.style("top", "50%");
    this._loadingDiv.style("left", "50%");
    this._loadingDiv.style("transform", "translate(-50%, -50%)");
    this._loadingDiv.style("fontSize", "24px");
    this._loadingDiv.style("color", "#fff");
    this._loadingDiv.style("zIndex", "1000");
    this.addElement(this._loadingDiv);

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

      // 加载完成后，从 elements 中删除 _loadingDiv
      if (this._loadingDiv) {
        const index = this.elements.indexOf(this._loadingDiv);
        if (index > -1) {
          this._loadingDiv.remove();
          this.elements.splice(index, 1);
        }
        this._loadingDiv = null;
      }
    }
  }

  update() {
    // 空的
  }

  draw() {
    const p = this.p;

    // 绘制背景
    p.background(22, 12, 38);
    if (Assets.bgImageWorldSelect) {
      p.push();
      p.tint(255, 205);
      p.image(Assets.bgImageWorldSelect, 0, 0, p.width, p.height);
      p.pop();
    }

    p.noStroke();
    p.fill(18, 10, 32, 142);
    p.rect(0, 0, p.width, p.height);

    p.fill(246, 214, 255, 24);
    p.ellipse(p.width * 0.18, p.height * 0.18, 260, 200);
    p.fill(134, 105, 206, 20);
    p.ellipse(p.width * 0.84, p.height * 0.78, 320, 220);

    // 第一次 draw 时创建 DOM 布局
    if (!this._domLayoutCreated) {
      this._createDomLayout();
    }

    // 更新卡片内容
    this._updateCardContent();
  }

  _updateCardContent() {
    if (!this._domLayoutCreated || !this._grid) return;

    // 如果加载中
    if (!this._isLoaded) {
      this._renderLoadingState();
      return;
    }

    // 如果列表为空
    if (this._levelList.length === 0) {
      this._renderEmptyState();
      return;
    }

    // 渲染卡片
    this._renderCards();
  }

  _createDomLayout() {
    const p = this.p;
    const layoutWidth = Math.min(p.width - 64, 1220);
    const layoutHeight = Math.min(p.height - 96, 620);

    this._root = p.createDiv("");
    this._root.position((p.width - layoutWidth) / 2, 78);
    this._root.style("width", layoutWidth + "px");
    this._root.style("height", layoutHeight + "px");
    this._root.style("display", "flex");
    this._root.style("flex-direction", "column");
    this._root.style("gap", "0px");

    this._grid = p.createDiv("");
    this._grid.parent(this._root);
    this._grid.style("flex", "1");
    this._grid.style("overflow-y", "auto");
    this._grid.style("overflow-x", "hidden");
    this._grid.style("padding", "0px");
    this._grid.style("display", "grid");
    this._grid.style("grid-template-columns", "1fr");
    this._grid.style("gap", "12px");
    this._grid.style("padding", "16px");

    // 自定义滚动条样式
    const style = document.createElement("style");
    style.innerHTML = `
      .user-levels-grid::-webkit-scrollbar {
        width: 8px;
      }
      .user-levels-grid::-webkit-scrollbar-track {
        background: transparent;
      }
      .user-levels-grid::-webkit-scrollbar-thumb {
        background: rgba(100, 200, 255, 0.5);
        border-radius: 4px;
      }
      .user-levels-grid::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 200, 255, 0.8);
      }
    `;
    document.head.appendChild(style);

    this._grid.addClass("user-levels-grid");
    this.addElement(this._root);
    this._domLayoutCreated = true;
  }

  _renderLoadingState() {
    if (!this._grid) return;
    this._grid.html("");

    for (let i = 0; i < 5; i++) {
      const card = this.p.createDiv("");
      card.style("background-color", "rgba(30, 30, 45, 0.87)");
      card.style("border-radius", "8px");
      card.style("padding", "12px");
      card.style("min-height", "100px");
      card.style("display", "flex");
      card.style("flex-direction", "column");
      card.parent(this._grid);

      const body = this.p.createDiv("");
      body.style("flex", "1");
      body.style("display", "flex");
      body.style("flex-direction", "column");
      body.style("gap", "8px");
      body.parent(card);

      for (let j = 0; j < 3; j++) {
        const skeleton = this.p.createDiv("");
        skeleton.style("height", "12px");
        skeleton.style("background", "linear-gradient(90deg, rgba(100,200,255,0.1), rgba(100,200,255,0.2), rgba(100,200,255,0.1))");
        skeleton.style("background-size", "200% 100%");
        skeleton.style("animation", "loading 1.5s infinite");
        skeleton.style("border-radius", "4px");
        skeleton.parent(body);
      }
    }

    const loading = this.p.createDiv("加载中...");
    loading.style("text-align", "center");
    loading.style("color", "rgba(200, 200, 200, 0.8)");
    loading.style("padding", "16px");
    loading.style("font-size", "14px");
    loading.parent(this._grid);
  }

  _renderEmptyState() {
    if (!this._grid) return;
    this._grid.html("");

    const empty = this.p.createDiv("");
    empty.style("display", "flex");
    empty.style("flex-direction", "column");
    empty.style("align-items", "center");
    empty.style("justify-content", "center");
    empty.style("gap", "8px");
    empty.style("padding", "40px 16px");
    empty.style("text-align", "center");
    empty.parent(this._grid);

    const main = this.p.createDiv("还没有玩家上传关卡");
    main.style("color", "rgba(180, 180, 180, 0.9)");
    main.style("font-size", "16px");
    main.style("font-weight", "500");
    main.parent(empty);

    const sub = this.p.createDiv("成为第一个创作者吧！");
    sub.style("color", "rgba(100, 150, 255, 0.8)");
    sub.style("font-size", "13px");
    sub.parent(empty);
  }

  _renderCards() {
    if (!this._grid) return;
    this._grid.html("");

    for (let i = 0; i < this._levelList.length; i++) {
      const level = this._levelList[i];
      const card = this.p.createDiv("");
      card.style("background-color", "rgba(30, 30, 45, 0.87)");
      card.style("border-radius", "8px");
      card.style("overflow", "hidden");
      card.style("transition", "all 0.2s ease");
      card.style("cursor", "pointer");
      card.parent(this._grid);

      const header = this.p.createDiv("");
      header.style("padding", "12px 16px");
      header.style("border-bottom", "1px solid rgba(100, 200, 255, 0.1)");
      header.style("display", "flex");
      header.style("justify-content", "space-between");
      header.style("align-items", "center");
      header.parent(card);

      const title = this.p.createDiv(level.title || "Untitled");
      title.style("color", "rgb(255, 255, 255)");
      title.style("font-size", "14px");
      title.style("font-weight", "700");
      title.style("flex", "1");
      title.style("overflow", "hidden");
      title.style("text-overflow", "ellipsis");
      title.style("white-space", "nowrap");
      title.parent(header);

      const body = this.p.createDiv("");
      body.style("padding", "12px 16px");
      body.style("display", "flex");
      body.style("flex-direction", "column");
      body.style("gap", "8px");
      body.parent(card);

      const dateStr = level.createdAt
        ? new Date(level.createdAt).toLocaleDateString("zh-CN")
        : "未知日期";
      const authorName = level.authorName || "Unknown";

      const info = this.p.createDiv(
        `👤 ${this._escapeHtml(authorName)}  📅 ${dateStr}`
      );
      info.style("color", "rgba(180, 180, 200, 0.8)");
      info.style("font-size", "12px");
      info.style("line-height", "1.4");
      info.parent(body);

      const action = this.p.createDiv("▶ 开始");
      action.style("color", "rgb(100, 200, 255)");
      action.style("font-size", "12px");
      action.style("font-weight", "700");
      action.style("cursor", "pointer");
      action.parent(body);

      // 点击事件
      card.mousePressed(() => {
        this.eventBus.publish(EventTypes.LOAD_LEVEL, {
          levelType: "user",
          levelId: level.id,
        });
        return false;
      });

      // Hover 效果
      card.mouseOver(() => {
        card.style("background-color", "rgba(60, 80, 140, 0.9)");
        card.style("border", "1px solid rgba(255, 255, 255, 0.2)");
        card.style("box-shadow", "0 4px 12px rgba(100, 200, 255, 0.2)");
      });
      card.mouseOut(() => {
        card.style("background-color", "rgba(30, 30, 45, 0.87)");
        card.style("border", "none");
        card.style("box-shadow", "none");
      });
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

  exit() {
    // 移除 wheel 事件监听
    if (this._wheelHandler) {
      const canvas = this.p.canvas || this.p.drawingContext?.canvas;
      if (canvas) {
        canvas.removeEventListener("wheel", this._wheelHandler);
      }
      this._wheelHandler = null;
    }

    super.exit();
  }
}
