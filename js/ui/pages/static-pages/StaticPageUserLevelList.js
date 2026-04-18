import { PageBase } from "../PageBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

const CARD_WIDTH = 700;
const CARD_HEIGHT = 90;
const CARD_GAP = 16;
const CARD_START_Y = 120;
const TITLE_Y = 60;

export class StaticPageUserLevelList extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
    this._levelList = [];
    this._isLoaded = false;
    this._scrollY = 0;
    this._loadingDiv = null;
    this._hoveredIndex = null;
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
    this._scrollY = 0;

    // 注册 wheel 事件监听
    const canvas = this.p.canvas || this.p.drawingContext?.canvas;
    if (canvas) {
      this._wheelHandler = (e) => {
        this._scrollY -= e.deltaY * 0.5;
        const totalHeight = this._levelList.length * (CARD_HEIGHT + CARD_GAP);
        const maxScroll = Math.max(0, totalHeight - (this.p.height - CARD_START_Y - 60));
        this._scrollY = Math.max(0, Math.min(this._scrollY, maxScroll));
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
    if (Assets.bgImageWorldSelect) {
      p.image(Assets.bgImageWorldSelect, 0, 0, p.width, p.height);
    } else {
      p.background(22, 12, 38);
    }

    // 绘制页面标题
    p.fill(255, 255, 255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.text("玩家关卡", p.width / 2, TITLE_Y);

    // 如果加载中，显示加载动画
    if (!this._isLoaded) {
      this._drawLoadingState(p);
      return;
    }

    // 如果列表为空，显示提示信息
    if (this._levelList.length === 0) {
      this._drawEmptyState(p);
      return;
    }

    // 绘制卡片列表
    const cardLeft = (p.width - CARD_WIDTH) / 2;

    // 计算卡片总高度和滚动范围
    const totalHeight = this._levelList.length * (CARD_HEIGHT + CARD_GAP);
    const viewportHeight = p.height - CARD_START_Y - 60;
    const maxScroll = Math.max(0, totalHeight - viewportHeight);

    // 限制滚动范围
    this._scrollY = Math.max(0, Math.min(this._scrollY, maxScroll));

    // 绘制卡片
    let cardY = CARD_START_Y - this._scrollY;
    for (let i = 0; i < this._levelList.length; i++) {
      const level = this._levelList[i];
      const isHovered = this._hoveredIndex === i;

      // 卡片背景（圆角矩形）
      if (isHovered) {
        p.fill(60, 80, 140, 240);
        p.stroke(255, 255, 255, 60);
        p.strokeWeight(2);
      } else {
        p.fill(30, 30, 45, 220);
        p.noStroke();
      }
      p.rect(cardLeft, cardY, CARD_WIDTH, CARD_HEIGHT, 8);

      // 卡片内容
      // 标题（左侧，白色，20px，bold）
      p.fill(255, 255, 255);
      p.textSize(20);
      p.textAlign(p.LEFT, p.TOP);
      p.textStyle(p.BOLD);
      const titleText = level.title || "Untitled";
      p.text(titleText, cardLeft + 24, cardY + 16);

      // 作者 + 日期（左侧下方，灰色，13px）
      p.fill(180, 180, 200);
      p.textSize(13);
      p.textStyle(p.NORMAL);
      const dateStr = level.createdAt
        ? new Date(level.createdAt).toLocaleDateString("zh-CN")
        : "未知日期";
      const infoText = `👤 ${level.authorName || "Unknown"}  📅 ${dateStr}`;
      p.text(infoText, cardLeft + 24, cardY + 48);

      // 开始按钮（右侧，蓝色，16px）
      p.fill(100, 200, 255);
      p.textSize(16);
      p.textAlign(p.RIGHT, p.CENTER);
      p.textStyle(p.BOLD);
      p.text("▶ 开始", cardLeft + CARD_WIDTH - 24, cardY + CARD_HEIGHT / 2);

      cardY += CARD_HEIGHT + CARD_GAP;
    }

    // 更新鼠标悬停状态
    this._updateHoveredCard();
  }

  _drawLoadingState(p) {
    const centerX = p.width / 2;
    const centerY = p.height / 2;

    // 旋转的点点动画
    const dotCount = 3;
    const dotRadius = 6;
    const orbitRadius = 20;
    const frameCount = p.frameCount || 0;

    for (let i = 0; i < dotCount; i++) {
      const angle = (frameCount * 0.05 + (i / dotCount) * Math.PI * 2);
      const dotX = centerX + Math.cos(angle) * orbitRadius;
      const dotY = centerY + Math.sin(angle) * orbitRadius;

      p.fill(100, 200, 255);
      p.noStroke();
      p.ellipse(dotX, dotY, dotRadius * 2);
    }

    // 加载中文字 + 动态省略号
    const dots = ".".repeat((frameCount % 60 < 20 ? 1 : frameCount % 60 < 40 ? 2 : 3));
    p.fill(200, 200, 200);
    p.textSize(18);
    p.textAlign(p.CENTER, p.TOP);
    p.textStyle(p.NORMAL);
    p.text(`加载中${dots}`, centerX, centerY + 40);
  }

  _drawEmptyState(p) {
    const centerX = p.width / 2;
    const centerY = p.height / 2;

    // 主文案
    p.fill(180, 180, 180);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.NORMAL);
    p.text("还没有玩家上传关卡", centerX, centerY);

    // 副文案
    p.fill(100, 150, 255);
    p.textSize(14);
    p.textStyle(p.NORMAL);
    p.text("成为第一个创作者吧！", centerX, centerY + 40);
  }

  _updateHoveredCard() {
    const p = this.p;
    const cardLeft = (p.width - CARD_WIDTH) / 2;
    const viewportHeight = p.height - CARD_START_Y - 60;
    const maxScroll = Math.max(
      0,
      this._levelList.length * (CARD_HEIGHT + CARD_GAP) - viewportHeight,
    );

    // 限制滚动范围
    this._scrollY = Math.max(0, Math.min(this._scrollY, maxScroll));

    this._hoveredIndex = null;

    let cardY = CARD_START_Y - this._scrollY;
    for (let i = 0; i < this._levelList.length; i++) {
      if (
        p.mouseX >= cardLeft &&
        p.mouseX <= cardLeft + CARD_WIDTH &&
        p.mouseY >= cardY &&
        p.mouseY <= cardY + CARD_HEIGHT
      ) {
        this._hoveredIndex = i;

        // 点击处理
        if (p.mouseIsPressed) {
          p.mouseIsPressed = false;
          const level = this._levelList[i];
          this.eventBus.publish(EventTypes.LOAD_LEVEL, {
            levelType: "user",
            levelId: level.id,
          });
        }
        break;
      }

      cardY += CARD_HEIGHT + CARD_GAP;
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

    super.exit();
  }
}
