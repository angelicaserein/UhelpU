/**
 * 统一的键盘导航管理系统
 *
 * 功能：
 * - 方向键 / WASD 导航按钮
 * - Enter / Space 确认按钮
 * - Esc 返回/关闭
 * - 自动焦点管理和高亮显示
 *
 * 使用：
 *   const nav = new KeyboardNavigationManager(buttons, { onEsc: () => {...} });
 *   nav.activate();
 *   // ... 后续
 *   nav.deactivate();
 */
export class KeyboardNavigationManager {
  constructor(buttons, options = {}) {
    this.buttons = buttons || [];
    this.currentIndex = 0;
    this.isActive = false;

    // 配置项
    this.onEsc = options.onEsc || null;
    this.onNavigate = options.onNavigate || null;
    this.layout = options.layout || "vertical"; // 'vertical' 或 'horizontal' 或 'grid'
    this.rows = options.rows || 1; // 仅在 'grid' 模式下使用
    this.cols = options.cols || 1;

    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  /**
   * 添加按钮到导航系统
   */
  addButton(button) {
    if (!this.buttons.includes(button)) {
      this.buttons.push(button);
    }
  }

  /**
   * 移除按钮
   */
  removeButton(button) {
    const idx = this.buttons.indexOf(button);
    if (idx !== -1) {
      this.buttons.splice(idx, 1);
      if (this.currentIndex >= this.buttons.length) {
        this.currentIndex = Math.max(0, this.buttons.length - 1);
      }
      this._updateFocus();
    }
  }

  /**
   * 清空所有按钮
   */
  clear() {
    this.buttons = [];
    this.currentIndex = 0;
  }

  /**
   * 激活键盘导航
   */
  activate() {
    if (this.isActive) return;
    this.isActive = true;
    document.addEventListener("keydown", this._handleKeyDown);

    // 确保设置初始焦点到第一个按钮
    this.currentIndex = 0;
    this._updateFocus();

    // 调试信息：打印按钮配置
    console.log(
      `[KeyboardNavigationManager] Activated with ${this.buttons.length} buttons`,
    );
    this.buttons.forEach((btn, idx) => {
      const hasCallback = !!btn.callback;
      console.log(
        `  [${idx}] btn.btn:`,
        btn.btn,
        `hasCallback: ${hasCallback}`,
      );
    });
  }

  /**
   * 停用键盘导航
   */
  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;
    document.removeEventListener("keydown", this._handleKeyDown);
    this._clearFocus();
  }

  /**
   * 设置焦点到指定索引
   */
  setFocus(index) {
    if (index < 0 || index >= this.buttons.length) return;
    this.currentIndex = index;
    this._updateFocus();
  }

  /**
   * 获取当前焦点按钮
   */
  getFocusedButton() {
    return this.buttons[this.currentIndex] || null;
  }

  /**
   * 处理键盘输入
   */
  _handleKeyDown(e) {
    if (!this.isActive || this.buttons.length === 0) {
      return;
    }

    console.log(
      `[KeyboardNavigationManager] Key pressed: ${e.code}, isActive: ${this.isActive}, buttonCount: ${this.buttons.length}`,
    );

    // 导航键：方向键 / WASD
    const isNavigationKey = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
    ].includes(e.code);

    if (isNavigationKey) {
      e.preventDefault();
      console.log(`[KeyboardNavigationManager] Navigation key: ${e.code}`);
      this._navigate(e.code);
      return;
    }

    // 确认键：Enter / Space
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      console.log("[KeyboardNavigationManager] Activation key pressed");
      this._activateCurrentButton();
      return;
    }

    // ESC 键：返回/关闭（仅当 onEsc 回调存在时）
    if (e.code === "Escape") {
      e.preventDefault();
      console.log("[KeyboardNavigationManager] ESC pressed");
      if (this.onEsc && typeof this.onEsc === "function") {
        console.log("[KeyboardNavigationManager] Calling onEsc callback");
        this.onEsc();
      }
      return;
    }
  }

  /**
   * 根据布局处理导航
   */
  _navigate(keyCode) {
    const oldIndex = this.currentIndex;

    if (this.layout === "grid") {
      this._navigateGrid(keyCode);
    } else if (this.layout === "horizontal") {
      this._navigateHorizontal(keyCode);
    } else {
      // 默认竖直导航
      this._navigateVertical(keyCode);
    }

    if (this.currentIndex !== oldIndex) {
      this._updateFocus();
      if (this.onNavigate) {
        this.onNavigate(this.currentIndex);
      }
    }
  }

  /**
   * 竖直导航（上下）
   */
  _navigateVertical(keyCode) {
    const isUp = ["ArrowUp", "KeyW"].includes(keyCode);
    const isDown = ["ArrowDown", "KeyS"].includes(keyCode);

    if (isUp) {
      this.currentIndex =
        (this.currentIndex - 1 + this.buttons.length) % this.buttons.length;
    } else if (isDown) {
      this.currentIndex = (this.currentIndex + 1) % this.buttons.length;
    }
  }

  /**
   * 水平导航（左右）
   */
  _navigateHorizontal(keyCode) {
    const isLeft = ["ArrowLeft", "KeyA"].includes(keyCode);
    const isRight = ["ArrowRight", "KeyD"].includes(keyCode);

    if (isLeft) {
      this.currentIndex =
        (this.currentIndex - 1 + this.buttons.length) % this.buttons.length;
    } else if (isRight) {
      this.currentIndex = (this.currentIndex + 1) % this.buttons.length;
    }
  }

  /**
   * 网格导航（上下左右）
   */
  _navigateGrid(keyCode) {
    const cols = this.cols || 1;
    const rows = this.rows || 1;
    const currentCol = this.currentIndex % cols;
    const currentRow = Math.floor(this.currentIndex / cols);

    let newCol = currentCol;
    let newRow = currentRow;

    if (keyCode === "ArrowUp" || keyCode === "KeyW") {
      newRow = (currentRow - 1 + rows) % rows;
    } else if (keyCode === "ArrowDown" || keyCode === "KeyS") {
      newRow = (currentRow + 1) % rows;
    } else if (keyCode === "ArrowLeft" || keyCode === "KeyA") {
      newCol = (currentCol - 1 + cols) % cols;
    } else if (keyCode === "ArrowRight" || keyCode === "KeyD") {
      newCol = (currentCol + 1) % cols;
    }

    const newIndex = newRow * cols + newCol;
    if (newIndex < this.buttons.length) {
      this.currentIndex = newIndex;
    }
  }

  /**
   * 激活当前焦点按钮
   */
  _activateCurrentButton() {
    console.log(
      `[KeyboardNavigationManager] _activateCurrentButton: currentIndex=${this.currentIndex}`,
    );

    const btn = this.getFocusedButton();
    if (!btn) {
      console.warn(
        "[KeyboardNavigationManager] getFocusedButton returned null/undefined",
      );
      return;
    }

    console.log("[KeyboardNavigationManager] Focused button object:", btn);

    if (!btn.btn) {
      console.warn(
        "[KeyboardNavigationManager] btn.btn is null/undefined, button structure:",
        btn,
      );
      return;
    }

    const p5Btn = btn.btn;
    const buttonElement = p5Btn.elt || p5Btn;

    console.log("[KeyboardNavigationManager] p5Btn:", p5Btn);
    console.log("[KeyboardNavigationManager] buttonElement:", buttonElement);

    if (!buttonElement) {
      console.warn("[KeyboardNavigationManager] Button element not found");
      return;
    }

    console.log("[KeyboardNavigationManager] Activating button:", p5Btn);
    console.log("[KeyboardNavigationManager] Has callback:", !!btn.callback);

    // 方式1: 使用存储的回调函数（最可靠）
    if (btn.callback && typeof btn.callback === "function") {
      try {
        console.log(
          "[KeyboardNavigationManager] Executing direct callback...",
        );
        btn.callback();
        console.log(
          "[KeyboardNavigationManager] Direct callback executed successfully!",
        );
        return;
      } catch (e) {
        console.warn(
          "[KeyboardNavigationManager] Direct callback failed:",
          e.message,
        );
      }
    }

    // 方式2: 触发 mousedown + mouseup 事件（更接近实际点击）
    try {
      console.log(
        "[KeyboardNavigationManager] Trying mousedown+mouseup events...",
      );
      const downEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      const upEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      buttonElement.dispatchEvent(downEvent);
      buttonElement.dispatchEvent(upEvent);
      console.log(
        "[KeyboardNavigationManager] mousedown+mouseup events dispatched",
      );
      return;
    } catch (e) {
      console.warn(
        "[KeyboardNavigationManager] Event dispatch failed:",
        e.message,
      );
    }

    // 方式3: 直接调用 click()
    if (buttonElement.click && typeof buttonElement.click === "function") {
      try {
        console.log("[KeyboardNavigationManager] Trying HTML click()...");
        buttonElement.click();
        console.log("[KeyboardNavigationManager] HTML click() succeeded");
        return;
      } catch (e) {
        console.warn(
          "[KeyboardNavigationManager] HTML click() failed:",
          e.message,
        );
      }
    }

    console.error(
      "[KeyboardNavigationManager] All activation methods failed for button:",
      p5Btn,
    );
  }

  /**
   * 更新焦点显示
   */
  _updateFocus() {
    console.log(
      `[KeyboardNavigationManager] _updateFocus: currentIndex=${this.currentIndex}, totalButtons=${this.buttons.length}`,
    );
    this.buttons.forEach((btn, idx) => {
      if (btn && btn.btn) {
        const isFocused = idx === this.currentIndex;
        const btnElement = btn.btn.elt || btn.btn;
        console.log(
          `  [${idx}] Focus: ${isFocused}, btn.btn:`,
          btn.btn,
          `btElement:`,
          btnElement,
        );
        if (isFocused) {
          btn.btn.addClass("kb-focused");
          console.log(`    → Added kb-focused class`);
        } else {
          btn.btn.removeClass("kb-focused");
        }
      } else {
        console.warn(
          `[${idx}] Button is invalid: btn=${btn}, btn.btn=${btn?.btn}`,
        );
      }
    });
  }

  /**
   * 清除所有焦点
   */
  _clearFocus() {
    this.buttons.forEach((btn) => {
      if (btn && btn.btn) {
        btn.btn.removeClass("kb-focused");
      }
    });
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.deactivate();
    this.clear();
  }
}
