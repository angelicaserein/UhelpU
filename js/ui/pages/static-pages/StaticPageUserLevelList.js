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
    this._container = null;
  }

  enter() {
    super.enter();

    const p = this.p;

    AudioManager.playBGM("levelChoice");

    // 创建返回按钮
    const backBtn = new BackButton(p, () => this.switcher.showWorldSelect(p));
    this.addElement(backBtn);

    // 创建主容器
    const container = p.createDiv("");
    container.style("position", "fixed");
    container.style("top", "50%");
    container.style("left", "50%");
    container.style("transform", "translate(-50%, -50%)");
    container.style("width", "480px");
    container.style("max-height", "500px");
    container.style("overflow-y", "auto");
    container.style("background", "rgba(20,20,35,0.92)");
    container.style("border-radius", "14px");
    container.style("padding", "28px 24px");
    container.style("box-sizing", "border-box");
    this.addElement(container);
    this._container = container;

    // 显示加载中提示
    const loading = p.createDiv("加载中...");
    loading.parent(this._container);
    loading.style("text-align", "center");
    loading.style("color", "#888");
    loading.style("padding", "40px 0");

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

      // 清空容器
      if (this._container) {
        this._container.elt.innerHTML = "";

        const p = this.p;

        // 如果列表为空
        if (this._levelList.length === 0) {
          const empty = p.createDiv("还没有玩家上传关卡");
          empty.parent(this._container);
          empty.style("color", "#888");
          empty.style("text-align", "center");
          empty.style("padding", "40px 0");
          return;
        }

        // 遍历关卡列表，创建卡片
        for (const item of this._levelList) {
          const card = p.createDiv("");
          card.parent(this._container);
          card.style("padding", "14px 18px");
          card.style("margin-bottom", "10px");
          card.style("background", "rgba(255,255,255,0.06)");
          card.style("border-radius", "8px");
          card.style("cursor", "pointer");
          card.style("transition", "background 0.15s");

          card.elt.addEventListener("mouseenter", () => {
            card.style("background", "rgba(255,255,255,0.14)");
          });
          card.elt.addEventListener("mouseleave", () => {
            card.style("background", "rgba(255,255,255,0.06)");
          });
          card.elt.addEventListener("click", () => {
            this.eventBus.publish(EventTypes.LOAD_LEVEL, {
              levelType: "user",
              levelId: item.id,
            });
          });

          const title = p.createDiv(item.title || "未命名关卡");
          title.parent(card);
          title.style("color", "#ffffff");
          title.style("font-size", "16px");
          title.style("margin-bottom", "6px");

          const author = p.createDiv("by " + (item.authorName || "匿名"));
          author.parent(card);
          author.style("color", "#aaaacc");
          author.style("font-size", "12px");
        }
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
