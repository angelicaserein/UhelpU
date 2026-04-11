import { PageBase } from "../PageBase.js";
import { Assets } from "../../../AssetsManager.js";
import { i18n } from "../../../i18n.js";
import { t } from "../../../i18n.js";

const PROJECT_ID = "uhelpu";
const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";
const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_API = `https://identitytoolkit.googleapis.com/v1`;

export class NameInputPage extends PageBase {
  constructor(switcher, p) {
    super(switcher);
    this.p = p;
    this.inputElement = null;
    this._onKeyDown = null;
  }

  enter() {
    super.enter();

    const p = this.p;

    // 账号用户优先
    const savedAccount = localStorage.getItem("playerAccount");
    if (savedAccount) {
      try {
        window.playerName = JSON.parse(savedAccount).username;
      } catch (e) {
        localStorage.removeItem("playerAccount");
      }
      if (window.playerName) {
        setTimeout(() => this.switcher.showWorldSelect(p), 100);
        return;
      }
    }

    // 游客
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      window.playerName = savedName;
      setTimeout(() => this.switcher.showWorldSelect(p), 100);
      return;
    }

    // 显示身份选择 UI
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

    // 输入框（供游客填写昵称）
    this.inputElement = p.createInput(window.playerName || "");
    this.inputElement.addClass("name-input-field");
    this.inputElement.attribute("maxlength", "12");
    this.inputElement.attribute("placeholder", t("name_input_placeholder"));
    this.inputElement.parent(container);

    // 三个主按钮
    const btnRow = p.createDiv("");
    btnRow.style("display", "flex");
    btnRow.style("gap", "10px");
    btnRow.style("justify-content", "center");
    btnRow.style("margin-top", "12px");
    btnRow.parent(container);

    const guestBtn = p.createButton(t("btn_play_as_guest"));
    guestBtn.addClass("name-input-confirm-button");
    guestBtn.parent(btnRow);
    guestBtn.mousePressed(() => this._handleGuestPlay());

    const loginBtn = p.createButton(t("btn_login"));
    loginBtn.addClass("name-input-confirm-button");
    loginBtn.parent(btnRow);
    loginBtn.mousePressed(() => this._showLoginForm());

    const registerBtn = p.createButton(t("btn_register"));
    registerBtn.addClass("name-input-confirm-button");
    registerBtn.parent(btnRow);
    registerBtn.mousePressed(() => this._showRegisterForm());

    // 返回按钮
    const backButton = p.createButton(t("btn_back"));
    backButton.addClass("name-input-back-button");
    backButton.parent(container);
    backButton.mousePressed(() => this.switcher.showLanguageChoice(p));

    // Enter → 游客流程，ESC → 返回
    this._onKeyDown = (e) => {
      if (e.code === "Enter") {
        this._handleGuestPlay();
      } else if (e.code === "Escape") {
        this.switcher.showLanguageChoice(p);
      }
    };
    document.addEventListener("keydown", this._onKeyDown);

    setTimeout(() => this.inputElement.elt.focus(), 100);
  }

  exit() {
    if (this._onKeyDown) {
      document.removeEventListener("keydown", this._onKeyDown);
    }
    super.exit();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 游客流程（使用 playerNames 集合）
  // ─────────────────────────────────────────────────────────────────────────

  async _handleGuestPlay() {
    const playerName = this.inputElement.value().trim();

    if (!playerName) {
      alert(t("name_input_empty"));
      return;
    }
    if (playerName.length > 12) {
      alert(t("name_input_too_long"));
      this.inputElement.elt.select();
      return;
    }

    try {
      const count = await this._getPlayerNameCount(playerName);
      if (count === 0) {
        await this._saveGuestAndContinue(playerName);
      } else {
        this._showDuplicateConfirmDialog(playerName, count);
      }
    } catch (error) {
      console.error("[NameInputPage] Error checking name count:", error);
      alert(t("name_check_error"));
    }
  }

  async _saveGuestAndContinue(finalName) {
    localStorage.setItem("playerName", finalName);
    window.playerName = finalName;
    const baseName = finalName.split("#")[0];
    await this._incrementNameCount(baseName);
    this.switcher.showWorldSelect(this.p);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 登录表单
  // ─────────────────────────────────────────────────────────────────────────

  _showLoginForm() {
    const p = this.p;
    const overlay = this._createOverlay();

    const dialog = p.createDiv("");
    dialog.addClass("name-duplicate-dialog");
    dialog.parent(overlay);

    const titleEl = p.createDiv(t("auth_login_title"));
    titleEl.style("color", "#feca57");
    titleEl.style("font-size", "20px");
    titleEl.style("font-weight", "bold");
    titleEl.style("margin-bottom", "18px");
    titleEl.parent(dialog);

    const emailInput = p.createInput("");
    emailInput.attribute("type", "email");
    emailInput.attribute("placeholder", t("auth_email_placeholder"));
    emailInput.addClass("name-input-field");
    emailInput.style("display", "block");
    emailInput.style("margin", "0 auto 10px auto");
    emailInput.parent(dialog);

    const passwordInput = p.createInput("");
    passwordInput.attribute("type", "password");
    passwordInput.attribute("placeholder", t("auth_password_placeholder"));
    passwordInput.addClass("name-input-field");
    passwordInput.style("display", "block");
    passwordInput.style("margin", "0 auto 18px auto");
    passwordInput.parent(dialog);

    const btnRow = p.createDiv("");
    btnRow.style("display", "flex");
    btnRow.style("gap", "12px");
    btnRow.style("justify-content", "center");
    btnRow.parent(dialog);

    const confirmBtn = p.createButton(t("btn_confirm"));
    confirmBtn.addClass("name-duplicate-confirm-btn");
    confirmBtn.parent(btnRow);
    confirmBtn.mousePressed(async () => {
      const email = emailInput.value().trim();
      const password = passwordInput.value();
      if (!email || !password) {
        alert(t("name_input_empty"));
        return;
      }
      confirmBtn.attribute("disabled", "true");
      confirmBtn.elt.style.opacity = "0.5";
      try {
        const { localId } = await this._loginWithFirebaseAuth(email, password);
        const { username } = await this._getUserByUid(localId);
        overlay.remove();
        localStorage.setItem("playerName", username);
        localStorage.setItem("playerAccount", JSON.stringify({ uid: localId, username, email, isAccount: true }));
        window.playerName = username;
        this.switcher.showWorldSelect(p);
      } catch (err) {
        console.error("[NameInputPage] Login error:", err);
        confirmBtn.removeAttribute("disabled");
        confirmBtn.elt.style.opacity = "1";
        alert(t("auth_login_error"));
      }
    });

    const cancelBtn = p.createButton(t("btn_cancel"));
    cancelBtn.addClass("name-duplicate-cancel-btn");
    cancelBtn.parent(btnRow);
    cancelBtn.mousePressed(() => overlay.remove());

    setTimeout(() => emailInput.elt.focus(), 100);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 注册表单
  // ─────────────────────────────────────────────────────────────────────────

  _showRegisterForm() {
    const p = this.p;
    const overlay = this._createOverlay();

    const dialog = p.createDiv("");
    dialog.addClass("name-duplicate-dialog");
    dialog.parent(overlay);

    const titleEl = p.createDiv(t("auth_register_title"));
    titleEl.style("color", "#feca57");
    titleEl.style("font-size", "20px");
    titleEl.style("font-weight", "bold");
    titleEl.style("margin-bottom", "18px");
    titleEl.parent(dialog);

    const usernameInput = p.createInput(this.inputElement ? this.inputElement.value().trim() : "");
    usernameInput.attribute("maxlength", "12");
    usernameInput.attribute("placeholder", t("auth_username_placeholder"));
    usernameInput.addClass("name-input-field");
    usernameInput.style("display", "block");
    usernameInput.style("margin", "0 auto 10px auto");
    usernameInput.parent(dialog);

    const emailInput = p.createInput("");
    emailInput.attribute("type", "email");
    emailInput.attribute("placeholder", t("auth_email_placeholder"));
    emailInput.addClass("name-input-field");
    emailInput.style("display", "block");
    emailInput.style("margin", "0 auto 10px auto");
    emailInput.parent(dialog);

    const passwordInput = p.createInput("");
    passwordInput.attribute("type", "password");
    passwordInput.attribute("placeholder", t("auth_password_placeholder"));
    passwordInput.addClass("name-input-field");
    passwordInput.style("display", "block");
    passwordInput.style("margin", "0 auto 18px auto");
    passwordInput.parent(dialog);

    const btnRow = p.createDiv("");
    btnRow.style("display", "flex");
    btnRow.style("gap", "12px");
    btnRow.style("justify-content", "center");
    btnRow.parent(dialog);

    const confirmBtn = p.createButton(t("btn_confirm"));
    confirmBtn.addClass("name-duplicate-confirm-btn");
    confirmBtn.parent(btnRow);
    confirmBtn.mousePressed(async () => {
      const username = usernameInput.value().trim();
      const email = emailInput.value().trim();
      const password = passwordInput.value();

      if (!username) { alert(t("name_input_empty")); return; }
      if (username.length > 12) { alert(t("name_input_too_long")); return; }
      if (!email || !password) { alert(t("name_input_empty")); return; }

      confirmBtn.attribute("disabled", "true");
      confirmBtn.elt.style.opacity = "0.5";

      try {
        const count = await this._getAccountNameCount(username);
        confirmBtn.removeAttribute("disabled");
        confirmBtn.elt.style.opacity = "1";

        if (count > 0) {
          overlay.remove();
          this._showRegisterDuplicateDialog(username, email, password, count);
          return;
        }

        overlay.remove();
        await this._doRegister(username, email, password);
      } catch (err) {
        console.error("[NameInputPage] Register check error:", err);
        confirmBtn.removeAttribute("disabled");
        confirmBtn.elt.style.opacity = "1";
        alert(t("name_check_error"));
      }
    });

    const cancelBtn = p.createButton(t("btn_cancel"));
    cancelBtn.addClass("name-duplicate-cancel-btn");
    cancelBtn.parent(btnRow);
    cancelBtn.mousePressed(() => overlay.remove());

    setTimeout(() => usernameInput.elt.focus(), 100);
  }

  _showRegisterDuplicateDialog(username, email, password, count) {
    const p = this.p;
    const overlay = this._createOverlay();

    const dialog = p.createDiv("");
    dialog.addClass("name-duplicate-dialog");
    dialog.parent(overlay);

    const messageContent = t("name_duplicate_message")
      .replace(/\n/g, "<br>")
      .replace(/{COUNT}/g, `<span style="color: #ff9f43; font-weight: bold;">${count}</span>`)
      .replace(/{NAME}/g, `<span style="color: #feca57; font-weight: bold;">${username}</span>`);

    const message = p.createDiv(messageContent);
    message.style("color", "#e0e0e0");
    message.style("font-size", "16px");
    message.style("margin-bottom", "25px");
    message.style("line-height", "1.6");
    message.parent(dialog);

    const btnRow = p.createDiv("");
    btnRow.style("display", "flex");
    btnRow.style("gap", "15px");
    btnRow.style("justify-content", "center");
    btnRow.parent(dialog);

    const confirmBtn = p.createButton(t("name_duplicate_confirm_btn"));
    confirmBtn.addClass("name-duplicate-confirm-btn");
    confirmBtn.parent(btnRow);
    confirmBtn.mousePressed(async () => {
      overlay.remove();
      const finalName = username + "#" + (count + 1);
      await this._doRegister(finalName, email, password);
    });

    const cancelBtn = p.createButton(t("name_duplicate_cancel_btn"));
    cancelBtn.addClass("name-duplicate-cancel-btn");
    cancelBtn.parent(btnRow);
    cancelBtn.mousePressed(() => overlay.remove());
  }

  async _doRegister(username, email, password) {
    try {
      const { localId } = await this._registerWithFirebaseAuth(email, password);
      await this._createUserDoc(localId, username, email);
      const baseName = username.split("#")[0];
      await this._incrementAccountNameCount(baseName);

      // 在覆盖 playerName 之前先读出旧的游客名（若有）
      const existingGuestName = localStorage.getItem("playerName");

      localStorage.setItem("playerName", username);
      localStorage.setItem("playerAccount", JSON.stringify({ uid: localId, username, email, isAccount: true }));
      window.playerName = username;

      if (existingGuestName && existingGuestName !== username) {
        this._showGuestTransferDialog(existingGuestName, username);
      } else {
        this.switcher.showWorldSelect(this.p);
      }
    } catch (err) {
      console.error("[NameInputPage] Registration error:", err);
      alert(t("auth_register_error"));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 游客成绩迁移
  // ─────────────────────────────────────────────────────────────────────────

  _showGuestTransferDialog(guestName, newUsername) {
    const p = this.p;
    const overlay = this._createOverlay();

    const dialog = p.createDiv("");
    dialog.addClass("name-duplicate-dialog");
    dialog.parent(overlay);

    const message = p.createDiv(
      t("auth_transfer_guest_prompt").replace(/{NAME}/g, `<span style="color: #feca57; font-weight: bold;">${guestName}</span>`)
    );
    message.style("color", "#e0e0e0");
    message.style("font-size", "16px");
    message.style("margin-bottom", "25px");
    message.style("line-height", "1.6");
    message.parent(dialog);

    const btnRow = p.createDiv("");
    btnRow.style("display", "flex");
    btnRow.style("gap", "15px");
    btnRow.style("justify-content", "center");
    btnRow.parent(dialog);

    const confirmBtn = p.createButton(t("auth_transfer_confirm"));
    confirmBtn.addClass("name-duplicate-confirm-btn");
    confirmBtn.parent(btnRow);
    confirmBtn.mousePressed(async () => {
      overlay.remove();
      await this._transferGuestScores(guestName, newUsername);
      this.switcher.showWorldSelect(p);
    });

    const skipBtn = p.createButton(t("auth_transfer_skip"));
    skipBtn.addClass("name-duplicate-cancel-btn");
    skipBtn.parent(btnRow);
    skipBtn.mousePressed(() => {
      overlay.remove();
      this.switcher.showWorldSelect(p);
    });
  }

  async _transferGuestScores(guestName, newUsername) {
    console.log(`[NameInputPage] Transferring scores from "${guestName}" to "${newUsername}"`);
    const levelFormats = ["easy_level", "demo2_level", "level"];
    for (const format of levelFormats) {
      for (let i = 1; i <= 10; i++) {
        const levelId = `${format}${i}`;
        try {
          const listUrl = `${FIRESTORE_API}/leaderboard/${levelId}/scores?key=${API_KEY}&pageSize=100`;
          const listResponse = await fetch(listUrl);
          if (!listResponse.ok) continue;

          const listData = await listResponse.json();
          const docs = listData.documents || [];

          for (const doc of docs) {
            const fields = doc.fields || {};
            const docIsAccount = fields.isAccount?.booleanValue || false;
            if (fields.playerName?.stringValue === guestName && !docIsAccount) {
              const patchUrl = `${doc.name}?key=${API_KEY}&updateMask.fieldPaths=playerName`;
              await fetch(patchUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fields: { playerName: { stringValue: newUsername } } }),
              });
            }
          }
        } catch (err) {
          console.warn(`[NameInputPage] Error transferring scores for ${levelId}:`, err);
        }
      }
    }
    await this._decrementPlayerNameCount(guestName.split("#")[0]);
    console.log(`[NameInputPage] ✓ Transfer complete`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 游客重名确认（与原来完全一致）
  // ─────────────────────────────────────────────────────────────────────────

  _showDuplicateConfirmDialog(playerName, count) {
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

    const buttonContainer = this.p.createDiv("");
    buttonContainer.style("display", "flex");
    buttonContainer.style("gap", "15px");
    buttonContainer.style("justify-content", "center");
    buttonContainer.parent(dialog);

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
    confirmBtn.mousePressed(async () => {
      dialogContainer.remove();
      const finalName = playerName + "#" + (count + 1);
      await this._saveGuestAndContinue(finalName);
    });
    confirmBtn.parent(buttonContainer);

    const cancelBtn = this.p.createButton(t("name_duplicate_cancel_btn"));
    cancelBtn.addClass("name-duplicate-cancel-btn");
    cancelBtn.style("background-color", "#555");
    cancelBtn.style("color", "#fff");
    cancelBtn.style("border", "2px solid #ff9f43");
    cancelBtn.style("border-radius", "6px");
    cancelBtn.style("padding", "12px 25px");
    cancelBtn.style("font-size", "14px");
    cancelBtn.style("cursor", "pointer");
    cancelBtn.mousePressed(() => {
      dialogContainer.remove();
      this.inputElement.elt.focus();
      this.inputElement.elt.select();
    });
    cancelBtn.parent(buttonContainer);

    confirmBtn.elt.onmouseover = () => confirmBtn.style("background-color", "#ffb366");
    confirmBtn.elt.onmouseout = () => confirmBtn.style("background-color", "#ff9f43");
    cancelBtn.elt.onmouseover = () => cancelBtn.style("background-color", "#666");
    cancelBtn.elt.onmouseout = () => cancelBtn.style("background-color", "#555");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Firebase Auth REST
  // ─────────────────────────────────────────────────────────────────────────

  async _callAuthAPI(endpoint, body) {
    const url = `${AUTH_API}/${endpoint}?key=${API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }
    return data;
  }

  async _loginWithFirebaseAuth(email, password) {
    return this._callAuthAPI("accounts:signInWithPassword", { email, password, returnSecureToken: true });
  }

  async _registerWithFirebaseAuth(email, password) {
    return this._callAuthAPI("accounts:signUp", { email, password, returnSecureToken: true });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Firestore users 集合
  // ─────────────────────────────────────────────────────────────────────────

  async _createUserDoc(uid, username, email) {
    const url = `${FIRESTORE_API}/users/${uid}?key=${API_KEY}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          username: { stringValue: username },
          email: { stringValue: email },
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async _getUserByUid(uid) {
    const url = `${FIRESTORE_API}/users/${uid}?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      username: data.fields?.username?.stringValue || "",
      email: data.fields?.email?.stringValue || "",
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // playerNames 集合（游客命名空间）
  // ─────────────────────────────────────────────────────────────────────────

  async _getPlayerNameCount(playerName) {
    try {
      const docId = playerName.toLowerCase();
      const url = `${FIRESTORE_API}/playerNames/${docId}?key=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return 0;
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return parseInt(data.fields?.count?.integerValue || 0);
    } catch (error) {
      console.error(`[NameInputPage] Error getting player name count:`, error);
      return 0;
    }
  }

  async _incrementNameCount(playerName) {
    try {
      const docId = playerName.toLowerCase();
      const currentCount = await this._getPlayerNameCount(playerName);
      const url = `${FIRESTORE_API}/playerNames/${docId}?key=${API_KEY}`;
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { count: { integerValue: currentCount + 1 } } }),
      });
    } catch (error) {
      console.error(`[NameInputPage] Error incrementing name count:`, error);
    }
  }

  async _decrementPlayerNameCount(baseName) {
    try {
      const docId = baseName.toLowerCase();
      const currentCount = await this._getPlayerNameCount(baseName);
      if (currentCount <= 1) {
        const url = `${FIRESTORE_API}/playerNames/${docId}?key=${API_KEY}`;
        await fetch(url, { method: "DELETE" });
      } else {
        const url = `${FIRESTORE_API}/playerNames/${docId}?key=${API_KEY}`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { count: { integerValue: currentCount - 1 } } }),
        });
      }
    } catch (error) {
      console.error(`[NameInputPage] Error decrementing player name count:`, error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // accountNames 集合（账号命名空间，独立于 playerNames）
  // ─────────────────────────────────────────────────────────────────────────

  async _getAccountNameCount(username) {
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
      console.error(`[NameInputPage] Error getting account name count:`, error);
      return 0;
    }
  }

  async _incrementAccountNameCount(username) {
    try {
      const docId = username.toLowerCase();
      const currentCount = await this._getAccountNameCount(username);
      const url = `${FIRESTORE_API}/accountNames/${docId}?key=${API_KEY}`;
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { count: { integerValue: currentCount + 1 } } }),
      });
    } catch (error) {
      console.error(`[NameInputPage] Error incrementing account name count:`, error);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 工具：创建遮罩层
  // ─────────────────────────────────────────────────────────────────────────

  _createOverlay() {
    const overlay = this.p.createDiv("");
    overlay.style("position", "fixed");
    overlay.style("top", "0");
    overlay.style("left", "0");
    overlay.style("width", "100%");
    overlay.style("height", "100%");
    overlay.style("background-color", "rgba(0, 0, 0, 0.7)");
    overlay.style("display", "flex");
    overlay.style("justify-content", "center");
    overlay.style("align-items", "center");
    overlay.style("z-index", "10000");
    this.addElement(overlay);
    return overlay;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 绘制
  // ─────────────────────────────────────────────────────────────────────────

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
    p.text("Choose your identity", p.width * 0.5, centerY - bandH * 0.2);

    p.textSize(Math.floor(p.width * 0.032));
    p.text("选 择 你 的 身 份", p.width * 0.5, centerY + bandH * 0.22);

    p.pop();
  }
}
