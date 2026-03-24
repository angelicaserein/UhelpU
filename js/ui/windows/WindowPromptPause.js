// WindowPromptPause.js - 带暂停功能的提示浮窗
// 继承 WindowPrompt 的样式，打开时暂停全局游戏，关闭时恢复

import { WindowPrompt } from "./WindowPrompt.js";
import { setGamePaused } from "../../game-runtime/GamePauseState.js";

export class WindowPromptPause extends WindowPrompt {
  /**
   * @param {p5} p - p5实例
   * @param {string} contentKey - i18n内容键
   * @param {Object} options - 可选配置（同 WindowPrompt）
   */
  constructor(p, contentKey = "", options = {}) {
    super(p, contentKey, options);
  }

  open() {
    setGamePaused(true);
    document.body.classList.add("game-paused");
    super.open();
  }

  close() {
    setGamePaused(false);
    document.body.classList.remove("game-paused");
    super.close();
  }

  remove() {
    if (this.isVisible) {
      setGamePaused(false);
      document.body.classList.remove("game-paused");
    }
    super.remove();
  }
}
