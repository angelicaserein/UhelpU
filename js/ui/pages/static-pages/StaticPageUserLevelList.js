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

    // 绘制背景（排行榜风格）
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

  _createDomLayout() {
    const p = this.p;
    const layoutWidth = Math.min(p.width - 64, 1220);
    const layoutHeight = Math.min(p.height - 96, 620);

    this._root = p.createDiv("");
    this._root.position((p.width - layoutWidth) / 2, 78);
    this._root.style("width", layoutWidth + "px");
    this._root.style("height", layoutHeight + "px");

    this._grid = p.createDiv("");
    this._grid.parent(this._root);
    this._grid.style("display", "grid");
    this._grid.style("grid-template-columns", "1fr");
    this._grid.style("grid-auto-rows", "auto");
    this._grid.style("gap", "14px");
    this._grid.style("flex", "1");
    this._grid.style("overflow-y", "auto");
    this._grid.style("min-height", "0");
    this._grid.style("padding", "0");

    // 自定义滚动条样式（匹配排行榜）
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes leaderboard-shimmer {
        to {
          transform: translateX(100%);
        }
      }
      .user-levels-grid::-webkit-scrollbar {
        width: 8px;
      }
      .user-levels-grid::-webkit-scrollbar-track {
        background: transparent;
      }
      .user-levels-grid::-webkit-scrollbar-thumb {
        background: rgba(158, 116, 206, 0.6);
        border-radius: 999px;
      }
      .user-levels-grid::-webkit-scrollbar-thumb:hover {
        background: rgba(158, 116, 206, 0.8);
      }
    `;
    document.head.appendChild(style);

    this._grid.addClass("user-levels-grid");
    this.addElement(this._root);
    this._domLayoutCreated = true;
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

  _renderLoadingState() {
    if (!this._grid) return;
    this._grid.html("");

    for (let i = 0; i < 5; i++) {
      const card = this.p.createDiv("");
      card.style("display", "flex");
      card.style("flex-direction", "column");
      card.style("width", "100%");
      card.style("height", "248px");
      card.style("min-height", "248px");
      card.style("max-height", "248px");
      card.style("border-radius", "14px");
      card.style("border", "2px solid rgba(215, 185, 255, 0.7)");
      card.style("background", "linear-gradient(180deg, rgba(45, 24, 66, 0.94), rgba(26, 13, 43, 0.96))");
      card.style("box-shadow", "0 12px 28px rgba(0, 0, 0, 0.34)");
      card.style("overflow", "hidden");
      card.parent(this._grid);

      // 骨架屏头部
      const header = this.p.createDiv("");
      header.style("padding", "10px 12px");
      header.style("border-bottom", "1px solid rgba(230, 210, 255, 0.14)");
      header.style("background", "rgba(255, 255, 255, 0.04)");
      header.style("height", "32px");
      header.parent(card);

      // 骨架屏体
      const body = this.p.createDiv("");
      body.style("flex", "1");
      body.style("padding", "8px 10px");
      body.style("display", "flex");
      body.style("flex-direction", "column");
      body.style("gap", "8px");
      body.parent(card);

      for (let j = 0; j < 3; j++) {
        const skeleton = this.p.createDiv("");
        skeleton.style("position", "relative");
        skeleton.style("height", "22px");
        skeleton.style("margin-top", "6px");
        skeleton.style("border-radius", "8px");
        skeleton.style("overflow", "hidden");
        skeleton.style("background", "rgba(121, 88, 155, 0.2)");
        skeleton.parent(body);

        const shimmer = this.p.createDiv("");
        shimmer.style("position", "absolute");
        shimmer.style("inset", "0");
        shimmer.style("transform", "translateX(-100%)");
        shimmer.style("background", "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0))");
        shimmer.style("animation", "leaderboard-shimmer 1.2s linear infinite");
        shimmer.parent(skeleton);
      }
    }
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
    empty.style("padding", "60px 16px");
    empty.style("text-align", "center");
    empty.parent(this._grid);

    const main = this.p.createDiv("还没有玩家上传关卡");
    main.style("color", "rgba(238, 229, 255, 0.82)");
    main.style("font-family", `"HYPixel11", "PixelFont", sans-serif`);
    main.style("font-size", "16px");
    main.style("line-height", "1.7");
    main.parent(empty);

    const sub = this.p.createDiv("成为第一个创作者吧！");
    sub.style("color", "rgba(238, 229, 255, 0.82)");
    sub.style("font-family", `"HYPixel11", "PixelFont", sans-serif`);
    sub.style("font-size", "14px");
    sub.style("line-height", "1.7");
    sub.parent(empty);
  }

  _renderCards() {
    if (!this._grid) return;
    this._grid.html("");

    for (let i = 0; i < this._levelList.length; i++) {
      const level = this._levelList[i];
      const card = this.p.createDiv("");
      card.style("display", "flex");
      card.style("flex-direction", "column");
      card.style("width", "100%");
      card.style("height", "248px");
      card.style("min-height", "248px");
      card.style("max-height", "248px");
      card.style("border-radius", "14px");
      card.style("border", "2px solid rgba(215, 185, 255, 0.7)");
      card.style("background", "linear-gradient(180deg, rgba(45, 24, 66, 0.94), rgba(26, 13, 43, 0.96))");
      card.style("box-shadow", "0 12px 28px rgba(0, 0, 0, 0.34)");
      card.style("overflow", "hidden");
      card.style("cursor", "pointer");
      card.style("transition", "all 0.3s ease");
      card.parent(this._grid);

      // 头部
      const header = this.p.createDiv("");
      header.style("display", "flex");
      header.style("align-items", "center");
      header.style("justify-content", "space-between");
      header.style("gap", "10px");
      header.style("padding", "10px 12px");
      header.style("border-bottom", "1px solid rgba(230, 210, 255, 0.14)");
      header.style("background", "rgba(255, 255, 255, 0.04)");
      header.parent(card);

      // 标题
      const title = this.p.createDiv(level.title || "Untitled");
      title.style("color", "#fff7ff");
      title.style("font-family", `"HYPixel11", "PixelFont", sans-serif`);
      title.style("font-size", "13px");
      title.style("line-height", "1.4");
      title.style("overflow", "hidden");
      title.style("text-overflow", "ellipsis");
      title.style("white-space", "nowrap");
      title.style("flex", "1");
      title.parent(header);

      // 体
      const body = this.p.createDiv("");
      body.style("flex", "1");
      body.style("overflow-y", "auto");
      body.style("min-height", "0");
      body.style("padding", "8px 10px 8px");
      body.style("display", "flex");
      body.style("flex-direction", "column");
      body.style("gap", "6px");
      body.parent(card);

      // 作者信息行
      const authorRow = this.p.createDiv("");
      authorRow.style("display", "grid");
      authorRow.style("grid-template-columns", "38px minmax(0, 1fr) auto");
      authorRow.style("align-items", "center");
      authorRow.style("gap", "8px");
      authorRow.style("padding", "5px 6px");
      authorRow.style("border-radius", "8px");
      authorRow.style("color", "#efe9ff");
      authorRow.style("font-family", `"HYPixel11", "PixelFont", sans-serif`);
      authorRow.style("font-size", "12px");
      authorRow.parent(body);

      const authorName = level.authorName || "Unknown";
      const nameEl = this.p.createDiv(this._escapeHtml(authorName));
      nameEl.style("overflow", "hidden");
      nameEl.style("text-overflow", "ellipsis");
      nameEl.style("white-space", "nowrap");
      nameEl.parent(authorRow);

      // 日期信息行
      const dateRow = this.p.createDiv("");
      dateRow.style("display", "grid");
      dateRow.style("grid-template-columns", "38px minmax(0, 1fr) auto");
      dateRow.style("align-items", "center");
      dateRow.style("gap", "8px");
      dateRow.style("padding", "5px 6px");
      dateRow.style("border-radius", "8px");
      dateRow.style("color", "#efe9ff");
      dateRow.style("font-family", `"HYPixel11", "PixelFont", sans-serif`);
      dateRow.style("font-size", "12px");
      dateRow.parent(body);

      const dateStr = level.createdAt
        ? new Date(level.createdAt).toLocaleDateString("zh-CN")
        : "未知日期";
      const dateEl = this.p.createDiv(dateStr);
      dateEl.style("overflow", "hidden");
      dateEl.style("text-overflow", "ellipsis");
      dateEl.style("white-space", "nowrap");
      dateEl.parent(dateRow);

      // 按钮行
      const buttonRow = this.p.createDiv("");
      buttonRow.style("display", "grid");
      buttonRow.style("grid-template-columns", "38px minmax(0, 1fr) auto");
      buttonRow.style("align-items", "center");
      buttonRow.style("gap", "8px");
      buttonRow.style("padding", "5px 6px");
      buttonRow.style("border-radius", "8px");
      buttonRow.style("color", "rgba(255, 223, 173, 0.9)");
      buttonRow.style("font-family", `"HYPixel11", "PixelFont", sans-serif`);
      buttonRow.style("font-size", "11px");
      buttonRow.style("letter-spacing", "0.06em");
      buttonRow.style("cursor", "pointer");
      buttonRow.parent(body);

      const actionText = this.p.createDiv("▶ 开始");
      actionText.style("color", "rgba(255, 223, 173, 0.9)");
      actionText.style("font-family", `"HYPixel11", "PixelFont", sans-serif`);
      actionText.style("font-size", "11px");
      actionText.style("text-align", "right");
      actionText.parent(buttonRow);

      // Hover 效果
      card.mouseOver(() => {
        card.style("border-color", "rgba(248, 210, 255, 0.95)");
        card.style("box-shadow", "0 0 0 1px rgba(255, 246, 255, 0.35), 0 0 18px rgba(200, 123, 255, 0.42)");
        card.style("background", "linear-gradient(180deg, rgba(70, 40, 120, 0.95), rgba(45, 24, 70, 0.96))");
      });
      card.mouseOut(() => {
        card.style("border-color", "rgba(215, 185, 255, 0.7)");
        card.style("box-shadow", "0 12px 28px rgba(0, 0, 0, 0.34)");
        card.style("background", "linear-gradient(180deg, rgba(45, 24, 66, 0.94), rgba(26, 13, 43, 0.96))");
      });

      // 点击事件
      card.mousePressed(() => {
        this.eventBus.publish(EventTypes.LOAD_LEVEL, {
          levelType: "user",
          levelId: level.id,
        });
        return false;
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
