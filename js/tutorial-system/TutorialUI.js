// js/tutorial-system/TutorialUI.js — 教学系统 UI 管理

import { TutorialOverlay } from "./TutorialOverlay.js";
import { t, i18n } from "../i18n.js";

/**
 * TutorialUI - 管理教学系统的所有 UI 元素
 * - 黑幕显示/隐藏
 * - 提示框生成和管理
 * - 多提示同时显示
 * - 高亮效果的应用
 * - 标签和文本管理
 */
export class TutorialUI {
  constructor(p, container) {
    this.p = p;
    this.container = container;

    this.overlay = new TutorialOverlay();
    this.overlay.create(container);

    this._promptBoxes = []; // 所有提示框
    this._labels = []; // 所有标签元素，用于清理
    this._activeElements = []; // 所有创建的 DOM 元素
    this._escHintEl = null; // ESC 跳过提示元素（独立的，不被 _removeAllPrompts 删除）

    // 订阅语言变化，实时更新提示文本
    this._onLangChange = () => this._updatePromptTexts();
    i18n.onChange(this._onLangChange);
  }

  /**
   * 获取黑幕对象（用于高级操作）
   */
  getOverlay() {
    return this.overlay;
  }

  /**
   * 显示黑幕
   * @param {Object} options
   *   - type: 'full' | 'partial'
   *   - visibleRects: [{x, y, width, height}, ...] 仅在 type: 'partial' 时使用
   */
  showOverlay(options = {}) {
    const { type = "full", visibleRects = [] } = options;

    if (type === "full") {
      this.overlay.show([]);
    } else if (type === "partial") {
      this.overlay.show(visibleRects);
    }
  }

  /**
   * 隐藏黑幕
   */
  hideOverlay() {
    this.overlay.hide();
  }

  /**
   * 更新黑幕的可见区域
   * @param {Array<{x, y, width, height}>} visibleRects
   */
  updateOverlayVisibility(visibleRects) {
    this.overlay.updateVisibleRects(visibleRects || []);
  }

  /**
   * 显示单个提示框
   * @param {string} text - 提示文本（支持 i18n key）
   * @param {Object} options
   *   - position: 'top-center' | 'center' | 'bottom-center' | 'custom'
   *   - x, y: 当 position: 'custom' 时的窗口坐标
   *   - isPersistent: 是否持久显示（默认 true）
   *   - isHighlight: 是否使用醒目样式（默认 false）
   */
  showPrompt(text, options = {}) {
    const {
      position = "top-center",
      isPersistent = true,
      isHighlight = false,
      x = 0,
      y = 0,
    } = options;

    // 清理旧的提示框
    this._removeAllPrompts();

    // 创建提示框容器
    const promptBox = document.createElement("div");
    promptBox.className = "tutorial-prompt";
    if (isHighlight) {
      promptBox.classList.add("tutorial-prompt-highlight");
    }

    // 位置样式
    const positionMap = {
      "top-center": {
        top: "60px",
        left: "50%",
        transform: "translateX(-50%)",
      },
      center: {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      },
      "bottom-center": {
        bottom: "60px",
        left: "50%",
        transform: "translateX(-50%)",
      },
      custom: {
        position: "fixed",
        left: x + "px",
        top: y + "px",
        transform: "translate(-50%, -50%)",
      },
    };

    const pos = positionMap[position] || positionMap["top-center"];
    Object.assign(promptBox.style, pos);

    promptBox.style.position = "fixed";
    promptBox.style.zIndex = "5500";
    promptBox.style.maxWidth = "600px";
    promptBox.style.padding = "20px";
    promptBox.style.textAlign = "center";
    promptBox.style.animation = "fadeIn 0.3s ease";

    // 设置文本内容
    const translatedText =
      typeof text === "string"
        ? text.startsWith("tutorial_")
          ? t(text)
          : text
        : text;

    promptBox.textContent = translatedText;

    // 存储原始 text 用于语言切换更新
    promptBox._tutorialTextKey = text;

    // 添加到 DOM
    document.body.appendChild(promptBox);
    this._promptBoxes.push(promptBox);
    this._activeElements.push(promptBox);
  }

  /**
   * 显示多个提示框
   * @param {Array} prompts - [{text, position, style}, ...]
   */
  showMultiplePrompts(prompts = []) {
    // 清理旧的提示框
    this._removeAllPrompts();

    const result = prompts.map((props) => {
      const {
        text,
        position = "top-center",
        style = "prompt",
        x = 0,
        y = 0,
      } = props;

      if (style === "label") {
        // 标签样式
        return this.addLabel({ text, x, y });
      } else {
        // 提示框样式
        const promptBox = document.createElement("div");
        promptBox.className = "tutorial-prompt";

        const positionMap = {
          "top-center": {
            top: "60px",
            left: "50%",
            transform: "translateX(-50%)",
          },
          center: {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          },
          "bottom-center": {
            bottom: "60px",
            left: "50%",
            transform: "translateX(-50%)",
          },
        };

        const pos = positionMap[position] || positionMap["top-center"];
        Object.assign(promptBox.style, pos);

        promptBox.style.position = "fixed";
        promptBox.style.zIndex = "5500";
        promptBox.style.maxWidth = "600px";
        promptBox.style.padding = "20px";
        promptBox.style.textAlign = "center";
        promptBox.style.animation = "fadeIn 0.3s ease";

        const translatedText =
          typeof text === "string"
            ? text.startsWith("tutorial_")
              ? t(text)
              : text
            : text;

        promptBox.textContent = translatedText;
        promptBox._tutorialTextKey = text;

        document.body.appendChild(promptBox);
        this._promptBoxes.push(promptBox);
        this._activeElements.push(promptBox);

        return promptBox;
      }
    });

    return result;
  }

  /**
   * 内部：更新所有提示框文本（在语言切换时调用）
   */
  _updatePromptTexts() {
    this._promptBoxes.forEach((box) => {
      if (box && box._tutorialTextKey) {
        const translatedText =
          typeof box._tutorialTextKey === "string"
            ? box._tutorialTextKey.startsWith("tutorial_")
              ? t(box._tutorialTextKey)
              : box._tutorialTextKey
            : box._tutorialTextKey;

        box.textContent = translatedText;
      }
    });

    this._labels.forEach((label) => {
      if (label && label._tutorialTextKey) {
        const translatedText =
          typeof label._tutorialTextKey === "string"
            ? label._tutorialTextKey.startsWith("tutorial_")
              ? t(label._tutorialTextKey)
              : label._tutorialTextKey
            : label._tutorialTextKey;

        label.textContent = translatedText;
      }
    });
  }

  /**
   * 隐藏并移除所有提示框（但保留 ESC 提示）
   */
  _removeAllPrompts() {
    this._promptBoxes.forEach((box) => {
      if (box && box !== this._escHintEl) { // 不删除 ESC 提示
        box.style.animation = "fadeOut 0.2s ease";
        setTimeout(() => {
          if (box && box.parentNode) {
            box.remove();
          }
        }, 200);
      }
    });
    this._promptBoxes = [];
  }

  /**
   * 添加标签到屏幕上
   * @param {Object} options
   *   - text: 标签文本
   *   - x, y: 屏幕坐标
   *   - color?: 标签颜色 (默认 '#f0e5ff')
   */
  addLabel(options) {
    const { text = "", x = 0, y = 0, color = "#f0e5ff" } = options;

    const label = document.createElement("div");
    label.className = "tutorial-label";
    label.style.position = "fixed";
    label.style.left = x + "px";
    label.style.top = y + "px";
    label.style.color = color;

    const translatedText =
      typeof text === "string"
        ? text.startsWith("tutorial_")
          ? t(text)
          : text
        : text;

    label.textContent = translatedText;
    label._tutorialTextKey = text;

    document.body.appendChild(label);
    this._labels.push(label);
    this._activeElements.push(label);

    // 返回 label 对象以便后续操作
    return {
      element: label,
      remove: () => {
        label.remove();
        const idx = this._labels.indexOf(label);
        if (idx !== -1) this._labels.splice(idx, 1);
      },
    };
  }

  /**
   * 在画布右下角（内部）显示 ESC 跳过提示
   */
  showEscHint(canvasRect) {
    if (this._escHintEl && document.body.contains(this._escHintEl)) {
      return;
    }

    const promptBox = document.createElement("div");
    promptBox.className = "tutorial-esc-hint";
    promptBox.id = "esc-hint-element";

    promptBox.style.position = "fixed";
    promptBox.style.zIndex = "5500";

    // 文本
    const translatedText = t("tutorial_press_esc_to_skip");
    promptBox.textContent = translatedText;
    promptBox._tutorialTextKey = "tutorial_press_esc_to_skip";

    document.body.appendChild(promptBox);

    // 获取元素实际尺寸后调整位置（放在画布内部右下角）
    setTimeout(() => {
      const rect = promptBox.getBoundingClientRect();
      const marginFromEdge = 12;

      // 计算位置：在画布内部右下角
      const left = canvasRect.right - rect.width - marginFromEdge;
      const top = canvasRect.bottom - rect.height - marginFromEdge;

      promptBox.style.left = left + "px";
      promptBox.style.top = top + "px";
    }, 0);

    this._escHintEl = promptBox;

    // 语言变化时更新文本
    if (this._updateEscHintText) {
      i18n.offChange(this._updateEscHintText);
    }
    this._updateEscHintText = () => {
      if (this._escHintEl) {
        this._escHintEl.textContent = t("tutorial_press_esc_to_skip");
      }
    };
    i18n.onChange(this._updateEscHintText);
  }

  /**
   * 隐藏 ESC 跳过提示
   */
  hideEscHint() {
    console.log("[hideEscHint] 被调用了");
    if (this._escHintEl) {
      console.log("[hideEscHint] 删除元素");
      this._escHintEl.remove();
      this._escHintEl = null;
    }
    if (this._updateEscHintText) {
      i18n.offChange(this._updateEscHintText);
      this._updateEscHintText = null;
    }
  }

  /**
   * 高亮 DOM 元素
   * @param {HTMLElement} element
   */
  highlightElement(element) {
    if (!element) return;
    element.classList.add("tutorial-highlight");
  }

  /**
   * 移除元素的高亮
   * @param {HTMLElement} element
   */
  unhighlightElement(element) {
    if (!element) return;
    element.classList.remove("tutorial-highlight");
  }

  /**
   * 清理所有 UI 元素
   */
  cleanup() {
    // 注意：不在这里删除 ESC 提示，只在进入 IDLE 状态时删除
    this._removeAllPrompts();

    // 移除所有标签
    this._labels.forEach((label) => {
      if (label && label.remove) {
        label.remove();
      }
    });
    this._labels = [];

    // 移除所有其他活跃元素
    this._activeElements.forEach((el) => {
      if (el && el.remove) {
        el.remove();
      }
    });
    this._activeElements = [];

    // 隐藏黑幕
    this.hideOverlay();

    // 注销语言变化监听
    i18n.offChange(this._onLangChange);
  }

  /**
   * 获取当前活跃元素数量（用于测试/调试）
   */
  getActiveElementCount() {
    return this._activeElements.length + this._labels.length;
  }
}
