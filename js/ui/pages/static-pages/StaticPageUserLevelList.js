import { PageBase } from "../PageBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { AudioManager } from "../../../AudioManager.js";
import { EventTypes } from "../../../event-system/EventTypes.js";

const CARD_WIDTH = 500;
const CARD_HEIGHT = 80;
const CARD_GAP = 20;
const CARD_START_Y = 150;

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
    if (Assets.bgImageGeneral) {
      p.image(Assets.bgImageGeneral, 0, 0, p.width, p.height);
    } else {
      p.background(22, 12, 38);
    }

    // 如果加载中，显示"加载中..."文字
    if (!this._isLoaded) {
      p.fill(255, 255, 255);
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("加载中...", p.width / 2, p.height / 2);
      return;
    }

    // 如果列表为空，显示"暂无玩家关卡"
    if (this._levelList.length === 0) {
      p.fill(200, 200, 200);
      p.textSize(20);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("暂无玩家关卡", p.width / 2, p.height / 2);
      return;
    }

    // 绘制卡片列表
    const cardCenterX = p.width / 2;
    const cardLeft = cardCenterX - CARD_WIDTH / 2;

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

      // 卡片背景
      const bgColor = isHovered ? [70, 70, 100, 220] : [40, 40, 50, 220];
      p.fill(...bgColor);
      p.noStroke();
      p.rect(cardLeft, cardY, CARD_WIDTH, CARD_HEIGHT, 8);

      // 标题
      p.fill(255, 255, 255);
      p.textSize(18);
      p.textAlign(p.LEFT, p.TOP);
      p.textStyle(p.BOLD);
      const titleText = level.title || "Untitled";
      p.text(titleText, cardLeft + 20, cardY + 12);

      // 作者信息
      p.fill(180, 180, 180);
      p.textSize(13);
      p.textStyle(p.NORMAL);
      const authorText = `作者：${level.authorName || "Unknown"}`;
      p.text(authorText, cardLeft + 20, cardY + 42);

      cardY += CARD_HEIGHT + CARD_GAP;
    }

    // 更新鼠标悬停状态
    this._updateHoveredCard();
  }

  _updateHoveredCard() {
    const p = this.p;
    const cardCenterX = p.width / 2;
    const cardLeft = cardCenterX - CARD_WIDTH / 2;
    const viewportHeight = p.height - CARD_START_Y - 60;
    const maxScroll = Math.max(
      0,
      this._levelList.length * (CARD_HEIGHT + CARD_GAP) - viewportHeight
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

  mouseWheel(event) {
    this._scrollY -= event.delta * 0.5;

    // 滚动范围限制由 draw() 中处理
  }
}
