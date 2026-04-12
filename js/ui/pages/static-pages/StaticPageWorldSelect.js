import { PageBase } from "../PageBase.js";
import { ButtonBase } from "../../components/ButtonBase.js";
import { BackButton } from "../../components/BackButton.js";
import { Assets } from "../../../AssetsManager.js";
import { t } from "../../../i18n.js";
import { AudioManager } from "../../../AudioManager.js";

export class StaticPageWorldSelect extends PageBase {
  constructor(switcher, p, eventBus) {
    super(switcher);
    this.p = p;
    this.eventBus = eventBus;
    this._playerNameElement = null;
    this._isRenamingInProgress = false;
  }

  enter() {
    super.enter();

    const p = this.p;

    AudioManager.playBGM("levelChoice");

    const backBtn = new BackButton(p, () => this.switcher.showMainMenu(p));
    this.addElement(backBtn);

    // 添加欢迎信息和改名按钮
    this._createPlayerNameSection();

    const { legacyDemo1Btn, legacyDemo2Btn } = this._createLegacyDemoPanel();
    this._createMemorialLinks();

    // 世界按钮配置（主区域难度入口）
    const worlds = [
      {
        cls: "world-button world-button-2 world-mode-button",
        label: t("world_easy"),
        action: () => this.switcher.showLevelChoiceEasy(p),
      },
      {
        cls: "world-button world-button-2 world-mode-button",
        label: t("world_difficult"),
        action: () => this.switcher.showLevelChoiceHard(p),
      },
    ];

    const btnY = 0.42 * p.height;
    const btnW = 0.23 * p.width;
    const btnH = 0.35 * p.height;
    const btnGap = 0.03 * p.width;
    const totalBtnsWidth = worlds.length * btnW + (worlds.length - 1) * btnGap;
    const startX = (p.width - totalBtnsWidth) / 2;

    const worldBtns = [];
    for (const [index, w] of worlds.entries()) {
      const btnX = startX + index * (btnW + btnGap);
      const btn = new ButtonBase(
        p,
        w.label,
        btnX,
        btnY,
        () => {
          w.action();
        },
        w.cls,
      );
      btn.btn.style("width", btnW + "px");
      btn.btn.style("height", btnH + "px");
      this.addElement(btn);
      worldBtns.push({
        btn: btn.btn,
        callback: () => w.action(),
      });
    }

    // 注册键盘导航（BackButton + 迭代版本按钮 + 主区域难度按钮）
    this.registerNavButtons(
      [
        {
          btn: backBtn.btn,
          callback: () => this.switcher.showMainMenu(p),
        },
        {
          btn: legacyDemo1Btn,
          callback: () => this.switcher.showOpeningSceneDemo1(p),
        },
        {
          btn: legacyDemo2Btn,
          callback: () => this.switcher.showLevelChoiceDemo2(p),
        },
        ...worldBtns,
      ],
      {
        layout: "horizontal",
        onEsc: () => this.switcher.showLanguageChoice(p),
      },
    );
  }

  update() {}

  /**
   * 创建玩家名字显示区域和改名/登出按钮
   */
  _createPlayerNameSection() {
    const p = this.p;

    const panelX = 160;
    const panelY = 40;
    const panel = p.createDiv("");
    panel.addClass("player-name-panel");
    panel.position(panelX, panelY);
    this.addElement(panel);

    // 判断账号 or 游客
    let savedAccount = null;
    try {
      const raw = localStorage.getItem("playerAccount");
      if (raw) savedAccount = JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }

    const isAccount = !!savedAccount;
    const playerName = isAccount
      ? savedAccount.username || "Player"
      : localStorage.getItem("playerName") || "Player";

    const nameTextContainer = p.createDiv("");
    nameTextContainer.addClass("player-name-text");
    nameTextContainer.parent(panel);

    // 「欢迎！」标签（账号和游客都显示）
    const label = p.createDiv(t("player_welcome") + "！");
    label.addClass("player-name-text-label");
    label.parent(nameTextContainer);

    this._playerNameElement = p.createDiv("");
    this._playerNameElement.addClass("player-name-text-name");
    this._playerNameElement.parent(nameTextContainer);

    if (isAccount) {
      // 账号用户：先渲染 👑 再对用户名每个字符应用 rainbow-wave
      const crownSpan = p.createDiv("👑");
      crownSpan.style("font-size", "18px");
      crownSpan.style("font-weight", "bold");
      crownSpan.style("letter-spacing", "0.02em");
      crownSpan.parent(this._playerNameElement);
    }

    for (const char of playerName) {
      const charSpan = p.createDiv(char);
      charSpan.addClass("rainbow-wave");
      charSpan.style("font-size", "18px");
      charSpan.style("font-weight", "bold");
      charSpan.style("letter-spacing", "0.02em");
      charSpan.style("text-shadow", "2px 2px 4px rgba(0, 0, 0, 0.7)");
      charSpan.parent(this._playerNameElement);
    }

    if (isAccount) {
      // 账号用户：「改用户名」+「登出」两个按钮
      const changeUsernameBtn = p.createButton(t("player_change_username"));
      changeUsernameBtn.addClass("player-rename-button");
      changeUsernameBtn.parent(panel);
      changeUsernameBtn.mousePressed(() => this._showAccountRenameDialog());

      const logoutBtn = p.createButton(t("player_logout_button"));
      logoutBtn.addClass("player-rename-button");
      logoutBtn.style("margin-left", "8px");
      logoutBtn.parent(panel);
      logoutBtn.mousePressed(() => {
        localStorage.removeItem("playerAccount");
        localStorage.removeItem("playerName");
        window.playerName = null;
        this.switcher.showNameInput(p);
      });
    } else {
      // 游客：「改名」按钮（原有逻辑不变）
      const renameBtn = p.createButton(t("player_rename_button"));
      renameBtn.addClass("player-rename-button");
      renameBtn.parent(panel);
      renameBtn.mousePressed(() => this._showRenameInputDialog());
    }
  }

  /**
   * 账号用户改用户名对话框
   */
  _showAccountRenameDialog() {
    const p = this.p;

    const dialogContainer = p.createDiv("");
    dialogContainer.addClass("rename-dialog-overlay");
    this.addElement(dialogContainer);

    const dialog = p.createDiv("");
    dialog.addClass("rename-dialog");
    dialog.parent(dialogContainer);

    const title = p.createDiv(t("rename_input_title"));
    title.parent(dialog);

    let savedAccount = null;
    try {
      savedAccount = JSON.parse(localStorage.getItem("playerAccount"));
    } catch (e) {}
    const currentUsername = savedAccount?.username || "";

    const inputField = p.createInput(currentUsername);
    inputField.attribute("maxlength", "12");
    inputField.parent(dialog);

    const buttonContainer = p.createDiv("");
    buttonContainer.style("display", "flex");
    buttonContainer.style("gap", "15px");
    buttonContainer.style("justify-content", "center");
    buttonContainer.parent(dialog);

    const confirmBtn = p.createButton(t("btn_confirm"));
    confirmBtn.mousePressed(async () => {
      const newUsername = inputField.value().trim();
      if (!newUsername) {
        alert(t("name_input_empty"));
        return;
      }
      if (newUsername.length > 12) {
        alert(t("name_input_too_long"));
        return;
      }
      dialogContainer.remove();
      await this._handleAccountRename(newUsername);
    });
    confirmBtn.parent(buttonContainer);

    const cancelBtn = p.createButton(t("btn_cancel"));
    cancelBtn.mousePressed(() => dialogContainer.remove());
    cancelBtn.parent(buttonContainer);

    setTimeout(() => {
      inputField.elt.focus();
      inputField.elt.select();
    }, 100);
  }

  /**
   * 账号改名逻辑（重名检测只查 accountNames，独立命名空间）
   */
  async _handleAccountRename(newUsername) {
    if (this._isRenamingInProgress) return;

    let savedAccount = null;
    try {
      savedAccount = JSON.parse(localStorage.getItem("playerAccount"));
    } catch (e) {}
    if (!savedAccount) return;

    const oldUsername = savedAccount.username;
    if (oldUsername === newUsername) return;

    try {
      const count = await this._getAccountNameCount(newUsername);
      if (count === 0) {
        await this._updateAccountNameAndLeaderboard(
          oldUsername,
          newUsername,
          savedAccount,
        );
      } else {
        this._showAccountRenameDuplicateDialog(
          oldUsername,
          newUsername,
          count,
          savedAccount,
        );
      }
    } catch (error) {
      console.error(
        "[StaticPageWorldSelect] Error checking account name:",
        error,
      );
      alert(t("name_check_error"));
    }
  }

  _showAccountRenameDuplicateDialog(
    oldUsername,
    newUsername,
    count,
    savedAccount,
  ) {
    const p = this.p;

    const dialogContainer = p.createDiv("");
    dialogContainer.addClass("rename-dialog-overlay");
    this.addElement(dialogContainer);

    const dialog = p.createDiv("");
    dialog.addClass("rename-dialog");
    dialog.parent(dialogContainer);

    const messageContent = t("name_duplicate_message")
      .replace(/\n/g, "<br>")
      .replace(
        /{COUNT}/g,
        `<span style="color: #ff9f43; font-weight: bold;">${count}</span>`,
      )
      .replace(
        /{NAME}/g,
        `<span style="color: #feca57; font-weight: bold;">${newUsername}</span>`,
      );

    const message = p.createDiv(messageContent);
    message.style("color", "#e0e0e0");
    message.style("font-size", "16px");
    message.style("margin-bottom", "25px");
    message.style("line-height", "1.6");
    message.parent(dialog);

    const buttonContainer = p.createDiv("");
    buttonContainer.style("display", "flex");
    buttonContainer.style("gap", "15px");
    buttonContainer.style("justify-content", "center");
    buttonContainer.parent(dialog);

    const confirmBtn = p.createButton(t("name_duplicate_confirm_btn"));
    confirmBtn.mousePressed(async () => {
      dialogContainer.remove();
      const finalName = newUsername + "#" + (count + 1);
      await this._updateAccountNameAndLeaderboard(
        oldUsername,
        finalName,
        savedAccount,
      );
    });
    confirmBtn.parent(buttonContainer);

    const cancelBtn = p.createButton(t("name_duplicate_cancel_btn"));
    cancelBtn.mousePressed(() => {
      dialogContainer.remove();
      this._showAccountRenameDialog();
    });
    cancelBtn.parent(buttonContainer);
  }

  /**
   * 执行账号改名：更新 Firestore 排行榜 + accountNames + localStorage
   */
  async _updateAccountNameAndLeaderboard(
    oldUsername,
    newUsername,
    savedAccount,
  ) {
    this._isRenamingInProgress = true;
    const p = this.p;

    const loadingContainer = p.createDiv("");
    loadingContainer.addClass("rename-loading-overlay");
    this.addElement(loadingContainer);
    const loadingText = p.createDiv("改名中...");
    loadingText.addClass("rename-loading-text");
    loadingText.parent(loadingContainer);

    try {
      await this._updateLeaderboardName(oldUsername, newUsername, true);

      // accountNames：增新减旧
      const baseNew = newUsername.split("#")[0];
      const baseOld = oldUsername.split("#")[0];
      await this._incrementAccountNameCount(baseNew);
      await this._decrementAccountNameCount(baseOld);

      // 更新 localStorage
      savedAccount.username = newUsername;
      localStorage.setItem("playerAccount", JSON.stringify(savedAccount));
      localStorage.setItem("playerName", newUsername);
      window.playerName = newUsername;

      loadingContainer.remove();

      // 刷新页面上的名字显示（重建彩虹字符 span）
      if (this._playerNameElement) {
        this._playerNameElement.elt.innerHTML = "";
        const crown = document.createElement("div");
        crown.style.cssText =
          "font-size:18px;font-weight:bold;letter-spacing:0.02em;display:inline-block";
        crown.textContent = "👑";
        this._playerNameElement.elt.appendChild(crown);
        for (const char of newUsername) {
          const span = document.createElement("div");
          span.className = "rainbow-wave";
          span.style.cssText =
            "font-size:18px;font-weight:bold;letter-spacing:0.02em;text-shadow:2px 2px 4px rgba(0,0,0,0.7)";
          span.textContent = char;
          this._playerNameElement.elt.appendChild(span);
        }
      }

      this._isRenamingInProgress = false;
    } catch (error) {
      console.error("[StaticPageWorldSelect] Account rename failed:", error);
      loadingContainer.remove();
      this._isRenamingInProgress = false;
      alert("改名失败，请重试 / Rename failed, please try again");
    }
  }

  /**
   * 显示改名输入对话框
   */
  _showRenameInputDialog() {
    const p = this.p;

    // 创建对话框容器
    const dialogContainer = p.createDiv("");
    dialogContainer.addClass("rename-dialog-overlay");
    this.addElement(dialogContainer);

    // 对话框内容
    const dialog = p.createDiv("");
    dialog.addClass("rename-dialog");
    dialog.parent(dialogContainer);

    // 提示文字
    const title = p.createDiv(t("rename_input_title"));
    title.parent(dialog);

    // 输入框
    const inputField = p.createInput(localStorage.getItem("playerName") || "");
    inputField.attribute("maxlength", "12");
    inputField.parent(dialog);

    // 按钮容器
    const buttonContainer = p.createDiv("");
    buttonContainer.style("display", "flex");
    buttonContainer.style("gap", "15px");
    buttonContainer.style("justify-content", "center");
    buttonContainer.parent(dialog);

    // 确认按钮
    const confirmBtn = p.createButton(t("btn_confirm"));
    confirmBtn.mousePressed(async () => {
      const newName = inputField.value().trim();

      // 验证
      if (!newName) {
        alert(t("name_input_empty"));
        return;
      }

      if (newName.length > 12) {
        alert(t("name_input_too_long"));
        return;
      }

      // 关闭输入框对话框
      dialogContainer.remove();

      // 处理改名
      await this._handleRename(newName);
    });
    confirmBtn.parent(buttonContainer);

    // 取消按钮
    const cancelBtn = p.createButton(t("btn_cancel"));
    cancelBtn.mousePressed(() => {
      dialogContainer.remove();
    });
    cancelBtn.parent(buttonContainer);

    // 自动聚焦输入框
    setTimeout(() => {
      inputField.elt.focus();
      inputField.elt.select();
    }, 100);
  }

  /**
   * 处理改名逻辑
   */
  async _handleRename(newName) {
    if (this._isRenamingInProgress) {
      return;
    }

    const oldName = localStorage.getItem("playerName") || "";
    const p = this.p;

    // 如果新旧名字相同，不做处理
    if (oldName === newName) {
      return;
    }

    try {
      // 查询新名字的 count
      const count = await this._getPlayerNameCount(newName);

      if (count === 0) {
        // 新名字未被使用，直接使用
        await this._updateNameAndLeaderboard(oldName, newName);
      } else {
        // 新名字已被使用，显示确认对话框
        this._showRenameDuplicateConfirmDialog(oldName, newName, count);
      }
    } catch (error) {
      console.error(
        "[StaticPageWorldSelect] Error checking new name count:",
        error,
      );
      alert(t("name_check_error"));
    }
  }

  /**
   * 显示改名重名确认对话框
   */
  _showRenameDuplicateConfirmDialog(oldName, newName, count) {
    const p = this.p;

    // 创建对话框容器
    const dialogContainer = p.createDiv("");
    dialogContainer.addClass("rename-dialog-overlay");
    this.addElement(dialogContainer);

    // 对话框内容
    const dialog = p.createDiv("");
    dialog.addClass("rename-dialog");
    dialog.parent(dialogContainer);

    // 提示文字
    const messageContent = t("name_duplicate_message")
      .replace(/\n/g, "<br>")
      .replace(
        /{COUNT}/g,
        `<span style="color: #ff9f43; font-weight: bold;">${count}</span>`,
      )
      .replace(
        /{NAME}/g,
        `<span style="color: #feca57; font-weight: bold;">${newName}</span>`,
      );

    const message = p.createDiv(messageContent);
    message.style("color", "#e0e0e0");
    message.style("font-size", "16px");
    message.style("margin-bottom", "25px");
    message.style("line-height", "1.6");
    message.parent(dialog);

    // 按钮容器
    const buttonContainer = p.createDiv("");
    buttonContainer.style("display", "flex");
    buttonContainer.style("gap", "15px");
    buttonContainer.style("justify-content", "center");
    buttonContainer.parent(dialog);

    // "就要用！"按钮
    const confirmBtn = p.createButton(t("name_duplicate_confirm_btn"));
    confirmBtn.mousePressed(async () => {
      dialogContainer.remove();
      // 分配编号
      const finalNewName = newName + "#" + (count + 1);
      await this._updateNameAndLeaderboard(oldName, finalNewName);
    });
    confirmBtn.parent(buttonContainer);

    // "换一个"按钮
    const cancelBtn = p.createButton(t("name_duplicate_cancel_btn"));
    cancelBtn.mousePressed(() => {
      dialogContainer.remove();
      this._showRenameInputDialog();
    });
    cancelBtn.parent(buttonContainer);
  }

  /**
   * 从 playerNames 集合获取名字的使用次数
   */
  async _getPlayerNameCount(playerName) {
    const PROJECT_ID = "uhelpu";
    const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
    const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

    try {
      const docId = playerName.toLowerCase();
      const url = `${FIRESTORE_API}/playerNames/${docId}?key=${API_KEY}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return 0;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const count = data.fields?.count?.integerValue || 0;
      return parseInt(count);
    } catch (error) {
      console.error(
        `[StaticPageWorldSelect] Error getting name count: ${error}`,
      );
      return 0;
    }
  }

  /**
   * 增加 playerNames 中名字的计数
   */
  async _incrementPlayerNameCount(baseName) {
    const PROJECT_ID = "uhelpu";
    const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
    const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

    try {
      const docId = baseName.toLowerCase();
      const currentCount = await this._getPlayerNameCount(baseName);
      const newCount = currentCount + 1;

      const docData = {
        fields: {
          count: { integerValue: newCount },
        },
      };

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

      console.log(
        `[StaticPageWorldSelect] ✓ Updated "${baseName}" count to ${newCount}`,
      );
      return true;
    } catch (error) {
      console.error(
        `[StaticPageWorldSelect] Error incrementing name count: ${error}`,
      );
      return false;
    }
  }

  /**
   * accountNames 集合：获取账号用户名的使用次数（与 playerNames 完全独立）
   */
  async _getAccountNameCount(username) {
    const PROJECT_ID = "uhelpu";
    const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
    const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
    try {
      const docId = username.toLowerCase();
      const url = `${FIRESTORE_API}/accountNames/${docId}?key=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return 0;
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return parseInt(data.fields?.count?.integerValue || 0);
    } catch (error) {
      console.error(
        `[StaticPageWorldSelect] Error getting account name count:`,
        error,
      );
      return 0;
    }
  }

  async _incrementAccountNameCount(username) {
    const PROJECT_ID = "uhelpu";
    const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
    const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
    try {
      const docId = username.toLowerCase();
      const currentCount = await this._getAccountNameCount(username);
      const url = `${FIRESTORE_API}/accountNames/${docId}?key=${API_KEY}`;
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: { count: { integerValue: currentCount + 1 } },
        }),
      });
    } catch (error) {
      console.error(
        `[StaticPageWorldSelect] Error incrementing account name count:`,
        error,
      );
    }
  }

  async _decrementAccountNameCount(username) {
    const PROJECT_ID = "uhelpu";
    const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
    const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
    try {
      const docId = username.toLowerCase();
      const currentCount = await this._getAccountNameCount(username);
      if (currentCount <= 1) {
        const url = `${FIRESTORE_API}/accountNames/${docId}?key=${API_KEY}`;
        await fetch(url, { method: "DELETE" });
      } else {
        const url = `${FIRESTORE_API}/accountNames/${docId}?key=${API_KEY}`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: { count: { integerValue: currentCount - 1 } },
          }),
        });
      }
    } catch (error) {
      console.error(
        `[StaticPageWorldSelect] Error decrementing account name count:`,
        error,
      );
    }
  }

  /**
   * 更新所有关卡排行榜中的旧名字为新名字
   * @param {string} oldName
   * @param {string} newName
   * @param {boolean} isAccount - true=只更新账号记录，false=只更新游客记录
   */
  async _updateLeaderboardName(oldName, newName, isAccount = false) {
    const PROJECT_ID = "uhelpu";
    const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
    const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

    try {
      const levelFormats = ["easy_level", "hard_level", "demo2_level", "level"];
      let totalQueryCount = 0;
      let totalUpdateCount = 0;
      let levelIdsChecked = [];

      console.log(
        `\n========== 开始更新排行榜（使用 fallback 方法） ==========`,
      );
      console.log(
        `[StaticPageWorldSelect] 旧名字: "${oldName}" → 新名字: "${newName}"`,
      );

      for (const format of levelFormats) {
        for (let i = 1; i <= 10; i++) {
          const levelId = `${format}${i}`;
          levelIdsChecked.push(levelId);

          try {
            console.log(`\n--- 处理关卡: ${levelId} ---`);

            // 使用 fallback 方法：直接列出所有 scores 文档
            const listUrl = `${FIRESTORE_API}/leaderboard/${levelId}/scores?key=${API_KEY}&pageSize=100`;

            console.log(
              `[StaticPageWorldSelect] 列出 scores 文档 URL: ${listUrl}`,
            );

            const listResponse = await fetch(listUrl);

            console.log(
              `[StaticPageWorldSelect] 列表响应状态: ${listResponse.status}`,
            );

            if (!listResponse.ok) {
              console.warn(
                `[StaticPageWorldSelect] 列出文档失败: HTTP ${listResponse.status}`,
              );
              continue;
            }

            const listData = await listResponse.json();

            console.log(
              `[StaticPageWorldSelect] 列表响应结构: documents=${listData.documents ? "存在" : "不存在"}, keys=${Object.keys(listData).join(", ")}`,
            );

            const allDocs = listData.documents || [];

            console.log(
              `[StaticPageWorldSelect] ${levelId} 总共有 ${allDocs.length} 个 scores 文档`,
            );

            // 找出 playerName == oldName 且 isAccount 身份匹配的文档
            const matchingDocs = allDocs.filter((doc) => {
              const playerName = doc.fields?.playerName?.stringValue;
              const docIsAccount = doc.fields?.isAccount?.booleanValue || false;
              const isMatch =
                playerName === oldName && docIsAccount === isAccount;
              if (isMatch) {
                console.log(
                  `[StaticPageWorldSelect]   ⭐ 匹配到旧名字: "${playerName}" (isAccount=${docIsAccount}) 在 ${doc.name}`,
                );
              }
              return isMatch;
            });

            console.log(
              `[StaticPageWorldSelect] ${levelId} 找到 ${matchingDocs.length} 条旧名字记录`,
            );

            if (matchingDocs.length > 0) {
              for (let idx = 0; idx < matchingDocs.length; idx++) {
                const doc = matchingDocs[idx];
                const docPath = doc.name;
                const fields = doc.fields || {};
                const currentPlayerName =
                  fields.playerName?.stringValue || "Unknown";

                totalQueryCount++;

                console.log(
                  `[StaticPageWorldSelect] [记录 ${totalQueryCount}] 文档路径: ${docPath}`,
                );
                console.log(
                  `[StaticPageWorldSelect] [记录 ${totalQueryCount}] 当前名字: "${currentPlayerName}"`,
                );

                // 构造更新数据 - 只更新 playerName 字段
                const updateData = {
                  fields: {
                    playerName: { stringValue: newName },
                  },
                };

                // 使用 updateMask 指定只更新 playerName 字段
                // docPath 已经包含完整路径，直接使用即可
                const updateUrl = `https://firestore.googleapis.com/v1/${docPath}?key=${API_KEY}&updateMask.fieldPaths=playerName`;

                console.log(
                  `[StaticPageWorldSelect] [记录 ${totalQueryCount}] PATCH 请求 URL:`,
                );
                console.log(`                        ${updateUrl}`);
                console.log(
                  `[StaticPageWorldSelect] [记录 ${totalQueryCount}] 更新数据: ${JSON.stringify(updateData)}`,
                );

                const updateResponse = await fetch(updateUrl, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(updateData),
                });

                console.log(
                  `[StaticPageWorldSelect] [记录 ${totalQueryCount}] PATCH 返回状态码: ${updateResponse.status}`,
                );

                if (updateResponse.ok) {
                  totalUpdateCount++;
                  const updateResponseData = await updateResponse.json();
                  console.log(
                    `[StaticPageWorldSelect] [记录 ${totalQueryCount}] ✓ 更新成功 (成功/总计: ${totalUpdateCount}/${totalQueryCount})`,
                  );
                  console.log(
                    `[StaticPageWorldSelect] [记录 ${totalQueryCount}] 更新后的文档名字: ${updateResponseData.fields?.playerName?.stringValue || "Unknown"}`,
                  );
                } else {
                  const errorText = await updateResponse.text();
                  console.error(
                    `[StaticPageWorldSelect] [记录 ${totalQueryCount}] ✗ 更新失败: HTTP ${updateResponse.status}`,
                  );
                  console.error(
                    `[StaticPageWorldSelect] [记录 ${totalQueryCount}] 错误详情: ${errorText}`,
                  );
                  console.error(
                    `[StaticPageWorldSelect] [记录 ${totalQueryCount}] PATCH URL 是: ${updateUrl}`,
                  );
                }
              }
            }
          } catch (e) {
            console.error(
              `[StaticPageWorldSelect] 处理 ${levelId} 时出错: ${e.message}`,
              e,
            );
          }
        }
      }

      console.log(`\n========== 排行榜更新完成 ==========`);
      console.log(
        `[StaticPageWorldSelect] 检查的关卡列表: ${levelIdsChecked.join(", ")}`,
      );
      console.log(
        `[StaticPageWorldSelect] ✓ 排行榜更新完成: 共找到 ${totalQueryCount} 条记录，成功更新 ${totalUpdateCount} 条`,
      );
      console.log(`\n`);

      return totalUpdateCount;
    } catch (error) {
      console.error(
        "[StaticPageWorldSelect] Error updating leaderboard:",
        error,
      );
      return 0;
    }
  }

  /**
   * 执行改名：更新排行榜和保存新名字
   */
  async _updateNameAndLeaderboard(oldName, newName) {
    this._isRenamingInProgress = true;
    const p = this.p;

    console.log(
      `\n\n╔════════════════════════════════════════════════════════════╗`,
    );
    console.log(
      `║           开始改名流程 - 旧名: "${oldName}" → 新名: "${newName}"`,
    );
    console.log(
      `╚════════════════════════════════════════════════════════════╝\n`,
    );

    // 显示 loading 对话框
    const loadingContainer = p.createDiv("");
    loadingContainer.addClass("rename-loading-overlay");
    this.addElement(loadingContainer);

    const loadingText = p.createDiv("改名中...");
    loadingText.addClass("rename-loading-text");
    loadingText.parent(loadingContainer);

    try {
      console.log(`[改名流程] 1/3 - 开始更新排行榜...`);
      // 更新排行榜中的所有记录
      const updateCount = await this._updateLeaderboardName(
        oldName,
        newName,
        false,
      );
      console.log(
        `[改名流程] 1/3 - 排行榜更新完成，共更新 ${updateCount} 条记录\n`,
      );

      // 提取新名字的基础名字（去掉编号）
      const baseName = newName.split("#")[0];

      console.log(
        `[改名流程] 2/3 - 更新 playerNames 集合，基础名字: "${baseName}"...`,
      );
      // 增加新名字的计数
      await this._incrementPlayerNameCount(baseName);
      console.log(`[改名流程] 2/3 - playerNames 集合更新完成\n`);

      console.log(`[改名流程] 3/3 - 保存新名字到本地和 window...`);
      // 保存新名字到 localStorage
      localStorage.setItem("playerName", newName);
      window.playerName = newName;
      console.log(`[改名流程] 3/3 - 本地存储完成\n`);

      console.log(`[改名流程] ✓ 改名成功: "${oldName}" → "${newName}"\n`);

      // 隐藏 loading，更新欢迎信息
      loadingContainer.remove();

      // 同步更新页面上的欢迎名字（清空旧的字符，添加新的字符）
      if (this._playerNameElement) {
        this._playerNameElement.elt.innerHTML = "";
        for (const char of newName) {
          const charSpan = document.createElement("div");
          charSpan.className = "rainbow-wave";
          charSpan.style.fontSize = "18px";
          charSpan.style.fontWeight = "bold";
          charSpan.style.letterSpacing = "0.02em";
          charSpan.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.7)";
          charSpan.textContent = char;
          this._playerNameElement.elt.appendChild(charSpan);
        }
      }

      console.log(
        `╔════════════════════════════════════════════════════════════╗`,
      );
      console.log(`║                      改名流程完成✓`);
      console.log(
        `╚════════════════════════════════════════════════════════════╝\n`,
      );

      this._isRenamingInProgress = false;
    } catch (error) {
      console.error("[改名流程] ✗ 改名失败:", error);
      loadingContainer.remove();
      this._isRenamingInProgress = false;
      alert("改名失败，请重试 / Rename failed, please try again");
    }
  }

  draw() {
    const p = this.p;
    p.background(30, 15, 50);
    if (Assets.bgImageWorldSelect) {
      p.image(Assets.bgImageWorldSelect, 0, 0, p.width, p.height);
    }
  }

  _createMemorialLinks() {
    const p = this.p;
    const panelWidth = 340;
    const panelX = p.width - panelWidth - 28;
    const panelY = 28;

    const panel = p.createDiv("");
    panel.addClass("world-memorial-panel");
    panel.style("width", panelWidth + "px");
    panel.position(panelX, panelY);

    const title = p.createDiv(t("world_memorial_title"));
    title.addClass("world-memorial-title");
    title.parent(panel);

    const oldDemoLink = p.createA(
      "https://lsironman789.github.io/Demo1-copy/Demo1/",
      t("world_memorial_earliest"),
      "_blank",
    );
    oldDemoLink.attribute("rel", "noopener noreferrer");
    oldDemoLink.addClass("world-memorial-link");
    oldDemoLink.parent(panel);

    const lavaIdeaLink = p.createA(
      "https://lsironman789.github.io/lava-level/lava/",
      t("world_memorial_discarded"),
      "_blank",
    );
    lavaIdeaLink.attribute("rel", "noopener noreferrer");
    lavaIdeaLink.addClass("world-memorial-link");
    lavaIdeaLink.parent(panel);

    this.addElement(panel);
  }

  _createLegacyDemoPanel() {
    const p = this.p;
    const panelWidth = 220;
    const memorialPanelX = p.width - 340 - 28;
    const panelX = memorialPanelX - panelWidth - 12;
    const panelY = 28;

    const panel = p.createDiv("");
    panel.addClass("world-memorial-panel");
    panel.style("width", panelWidth + "px");
    panel.position(panelX, panelY);

    const title = p.createDiv(t("world_legacy_title"));
    title.addClass("world-memorial-title");
    title.parent(panel);

    const legacyDemo1Btn = p.createButton(t("world_legacy_demo1"));
    legacyDemo1Btn.addClass("world-memorial-link");
    legacyDemo1Btn.addClass("world-memorial-link-button");
    legacyDemo1Btn.parent(panel);
    legacyDemo1Btn.mousePressed(() => {
      AudioManager.playSFX("click");
      this.switcher.showOpeningSceneDemo1(p);
    });

    const legacyDemo2Btn = p.createButton(t("world_legacy_demo2"));
    legacyDemo2Btn.addClass("world-memorial-link");
    legacyDemo2Btn.addClass("world-memorial-link-button");
    legacyDemo2Btn.parent(panel);
    legacyDemo2Btn.mousePressed(() => {
      AudioManager.playSFX("click");
      this.switcher.showLevelChoiceDemo2(p);
    });

    this.addElement(panel);
    this.addElement(legacyDemo1Btn);
    this.addElement(legacyDemo2Btn);

    return { legacyDemo1Btn, legacyDemo2Btn };
  }
}
