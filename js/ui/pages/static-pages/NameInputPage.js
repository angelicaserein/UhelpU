import { PageBase } from "../PageBase.js";
import { Assets } from "../../../AssetsManager.js";
import { i18n } from "../../../i18n.js";
import { t } from "../../../i18n.js";

export class NameInputPage extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
    this.inputElement = null;
    this.confirmButton = null;
    this._onKeyDown = null;
  }

  enter() {
    super.enter();

    const p = this.p;

    // 检查 localStorage 里是否已保存名字，有的话直接进入游戏
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      console.log("[NameInputPage] Found saved name in localStorage:", savedName);
      window.playerName = savedName;
      // 延迟以确保 window.playerName 被正确设置
      setTimeout(() => {
        this.switcher.showWorldSelect(p);
      }, 100);
      return;
    }

    // 没有保存的名字，显示输入框

    // 创建输入框容器
    const container = p.createDiv("");
    container.addClass("name-input-container");
    container.style("position", "absolute");
    container.style("top", "50%");
    container.style("left", "50%");
    container.style("transform", "translate(-50%, -50%)");
    container.style("text-align", "center");
    this.addElement(container);

    // 标题
    const title = p.createDiv(t("name_input_title"));
    title.addClass("name-input-title");
    title.parent(container);

    // 输入框
    this.inputElement = p.createInput(window.playerName || "");
    this.inputElement.addClass("name-input-field");
    this.inputElement.attribute("maxlength", "12");
    this.inputElement.attribute(
      "placeholder",
      t("name_input_placeholder"),
    );
    this.inputElement.parent(container);

    // 确认按钮
    this.confirmButton = p.createButton(t("btn_confirm"));
    this.confirmButton.addClass("name-input-confirm-button");
    this.confirmButton.parent(container);
    this.confirmButton.mousePressed(() => {
      this._handleConfirm();
    });

    // 返回按钮
    const backButton = p.createButton(t("btn_back"));
    backButton.addClass("name-input-back-button");
    backButton.parent(container);
    backButton.mousePressed(() => {
      this.switcher.showLanguageChoice(p);
    });

    // 键盘事件：Enter 确认，ESC 返回
    this._onKeyDown = (e) => {
      if (e.code === "Enter") {
        this._handleConfirm();
      } else if (e.code === "Escape") {
        this.switcher.showLanguageChoice(p);
      }
    };
    document.addEventListener("keydown", this._onKeyDown);

    // 自动聚焦输入框
    if (this.inputElement) {
      setTimeout(() => {
        this.inputElement.elt.focus();
      }, 100);
    }
  }

  exit() {
    if (this._onKeyDown) {
      document.removeEventListener("keydown", this._onKeyDown);
    }
    super.exit();
  }

  async _handleConfirm() {
    const playerName = this.inputElement.value().trim();

    // 验证：不能为空或全是空格
    if (!playerName) {
      alert(t("name_input_empty"));
      return;
    }

    // 验证：最多12个字符
    if (playerName.length > 12) {
      alert(t("name_input_too_long"));
      this.inputElement.elt.select();
      return;
    }

    // 禁用按钮，防止重复提交
    this.confirmButton.attribute("disabled", "true");
    this.confirmButton.elt.style.opacity = "0.5";

    try {
      // 去 Firebase 查询这个名字一共使用过几次
      const count = await this._checkNameCount(playerName);

      // 恢复按钮
      this.confirmButton.removeAttribute("disabled");
      this.confirmButton.elt.style.opacity = "1";

      if (count === 0) {
        // 第一个使用这个名字，无编号
        await this._saveNameAndContinue(playerName);
      } else {
        // 已有人使用过这个名字，显示确认对话框
        this._showDuplicateConfirmDialog(playerName, count);
      }
    } catch (error) {
      console.error("[NameInputPage] Error checking name count:", error);
      this.confirmButton.removeAttribute("disabled");
      this.confirmButton.elt.style.opacity = "1";
      alert(t("name_check_error"));
    }
  }

  /**
   * 查询 Firebase playerNames 集合中这个名字的使用次数
   */
  async _checkNameCount(playerName) {
    try {
      const count = await this._getPlayerNameCount(playerName);
      console.log(`[NameInputPage] Name "${playerName}" has been used ${count} times`);
      return count;
    } catch (error) {
      console.error("[NameInputPage] Error querying name count:", error);
      return 0;
    }
  }

  /**
   * 从 playerNames 集合获取名字的使用次数
   */
  async _getPlayerNameCount(playerName) {
    const PROJECT_ID = "uhelpu";
    const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
    const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

    try {
      // 文档ID就是名字本身
      const docId = playerName.toLowerCase();
      const url = `${FIRESTORE_API}/playerNames/${docId}?key=${API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          // 文档不存在，说明这是第一个使用这个名字的玩家
          console.log(`[NameInputPage] Name "${playerName}" not found in playerNames, count = 0`);
          return 0;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const count = data.fields?.count?.integerValue || 0;
      return parseInt(count);
    } catch (error) {
      console.error(`[NameInputPage] Error getting name count: ${error}`);
      return 0;
    }
  }

  /**
   * 更新 playerNames 集合中名字的使用次数
   */
  async _incrementNameCount(playerName) {
    const PROJECT_ID = "uhelpu";
    const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
    const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

    try {
      const docId = playerName.toLowerCase();
      const currentCount = await this._getPlayerNameCount(playerName);
      const newCount = currentCount + 1;

      const docData = {
        fields: {
          count: { integerValue: newCount },
        },
      };

      // 使用 PATCH 更新或创建文档
      const url = `${FIRESTORE_API}/playerNames/${docId}?key=${API_KEY}`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(docData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[NameInputPage] ✓ Updated "${playerName}" count to ${newCount}`);
      return true;
    } catch (error) {
      console.error(`[NameInputPage] Error incrementing name count: ${error}`);
      return false;
    }
  }

  /**
   * 显示重名确认对话框
   */
  _showDuplicateConfirmDialog(playerName, count) {
    // 创建自定义对话框容器
    const dialogContainer = this.p.createDiv("");
    dialogContainer.addClass("name-duplicate-dialog-overlay");
    dialogContainer.style("position", "fixed");
    dialogContainer.style("top", "0");
    dialogContainer.style("left", "0");
    dialogContainer.style("width", "100%");
    dialogContainer.style("height", "100%");
    dialogContainer.style("background-color", "rgba(0, 0, 0, 0.7)");
    dialogContainer.style("display", "flex");
    dialogContainer.style("justify-content", "center");
    dialogContainer.style("align-items", "center");
    dialogContainer.style("z-index", "10000");

    // 对话框内容
    const dialog = this.p.createDiv("");
    dialog.addClass("name-duplicate-dialog");
    dialog.style("background-color", "#1a0033");
    dialog.style("border", "2px solid #ff9f43");
    dialog.style("border-radius", "12px");
    dialog.style("padding", "30px");
    dialog.style("text-align", "center");
    dialog.style("max-width", "400px");
    dialog.style("box-shadow", "0 0 30px rgba(255, 159, 67, 0.3)");
    dialog.parent(dialogContainer);

    // 提示文字
    const messageContent = t("name_duplicate_message")
      .replace(/\n/g, "<br>")
      .replace(/{COUNT}/g, `<span style="color: #ff9f43; font-weight: bold;">${count}</span>`)
      .replace(/{NAME}/g, `<span style="color: #feca57; font-weight: bold;">${playerName}</span>`);

    const message = this.p.createDiv(messageContent);
    message.style("color", "#e0e0e0");
    message.style("font-size", "16px");
    message.style("margin-bottom", "25px");
    message.style("line-height", "1.6");
    message.parent(dialog);

    // 按钮容器
    const buttonContainer = this.p.createDiv("");
    buttonContainer.style("display", "flex");
    buttonContainer.style("gap", "15px");
    buttonContainer.style("justify-content", "center");
    buttonContainer.parent(dialog);

    // "就要用！"按钮 - 分配编号 (count+1)
    const confirmBtn = this.p.createButton(t("name_duplicate_confirm_btn"));
    confirmBtn.addClass("name-duplicate-confirm-btn");
    confirmBtn.style("background-color", "#ff9f43");
    confirmBtn.style("color", "#000");
    confirmBtn.style("border", "none");
    confirmBtn.style("border-radius", "6px");
    confirmBtn.style("padding", "12px 25px");
    confirmBtn.style("font-size", "14px");
    confirmBtn.style("font-weight", "bold");
    confirmBtn.style("cursor", "pointer");
    confirmBtn.style("transition", "all 0.3s");
    confirmBtn.mousePressed(async () => {
      dialogContainer.remove();
      // 分配编号：第 (count+1) 个使用这个名字的玩家
      const finalName = playerName + "#" + (count + 1);
      await this._saveNameAndContinue(finalName);
    });
    confirmBtn.parent(buttonContainer);

    // "换一个"按钮
    const cancelBtn = this.p.createButton(t("name_duplicate_cancel_btn"));
    cancelBtn.addClass("name-duplicate-cancel-btn");
    cancelBtn.style("background-color", "#555");
    cancelBtn.style("color", "#fff");
    cancelBtn.style("border", "2px solid #ff9f43");
    cancelBtn.style("border-radius", "6px");
    cancelBtn.style("padding", "12px 25px");
    cancelBtn.style("font-size", "14px");
    cancelBtn.style("cursor", "pointer");
    cancelBtn.style("transition", "all 0.3s");
    cancelBtn.mousePressed(() => {
      dialogContainer.remove();
      this.inputElement.elt.focus();
      this.inputElement.elt.select();
    });
    cancelBtn.parent(buttonContainer);

    // 鼠标悬停效果
    confirmBtn.elt.onmouseover = () => {
      confirmBtn.style("background-color", "#ffb366");
    };
    confirmBtn.elt.onmouseout = () => {
      confirmBtn.style("background-color", "#ff9f43");
    };
    cancelBtn.elt.onmouseover = () => {
      cancelBtn.style("background-color", "#666");
    };
    cancelBtn.elt.onmouseout = () => {
      cancelBtn.style("background-color", "#555");
    };
  }

  /**
   * 保存完整名字到 localStorage、更新 playerNames 集合并进入游戏
   * @param {string} finalName - 完整名字（可能包含编号，如 "moosry" 或 "moosry#2"）
   */
  async _saveNameAndContinue(finalName) {
    // 保存完整名字到 localStorage
    localStorage.setItem("playerName", finalName);
    console.log("[NameInputPage] Player name saved to localStorage:", finalName);

    // 保存玩家名字到全局变量
    window.playerName = finalName;
    console.log("[NameInputPage] Player name saved to window:", finalName);

    // 提取基础名字（去掉编号）
    const baseName = finalName.split("#")[0];

    // 更新 playerNames 集合中的 count
    await this._incrementNameCount(baseName);

    // 跳转到世界选择页面
    this.switcher.showWorldSelect(this.p);
  }

  draw() {
    const p = this.p;
    if (Assets.bgImageLanguageChoice) {
      p.image(Assets.bgImageLanguageChoice, 0, 0, p.width, p.height);
    } else {
      p.background(20, 10, 40);
    }
    this._drawTitleBanner(p);
  }

  _drawTitleBanner(p) {
    const centerY = p.height * 0.13;
    const bandH = Math.max(72, p.height * 0.115);
    const coreBandW = p.width * 0.52;
    const sideFadeW = p.width * 0.36;
    const bandY = centerY - bandH * 0.5;
    const coreBandX = (p.width - coreBandW) * 0.5;
    const leftOuterX = coreBandX - sideFadeW;
    const rightOuterX = coreBandX + coreBandW + sideFadeW - 1;

    p.push();
    p.resetMatrix();
    p.noStroke();

    // 两侧渐隐光带
    for (let i = 0; i < sideFadeW; i++) {
      const t = i / Math.max(1, sideFadeW - 1);
      p.fill(255, 255, 255, (1 - t) * 108);
      p.rect(leftOuterX + i, bandY, 1, bandH);
      p.rect(rightOuterX - i, bandY, 1, bandH);
    }

    p.fill(255, 255, 255, 248);
    p.textAlign(p.CENTER, p.CENTER);
    if (Assets.customFont) p.textFont(Assets.customFont);
    p.textStyle(p.BOLD);

    p.textSize(Math.floor(p.width * 0.026));
    p.text("Enter Your Player Name", p.width * 0.5, centerY - bandH * 0.2);

    p.textSize(Math.floor(p.width * 0.032));
    p.text("输 入 你 的 昵 称", p.width * 0.5, centerY + bandH * 0.22);

    p.pop();
  }
}
