import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";
import { TutorialManager } from "../../../../tutorial-system/TutorialManager.js";
import { EventTypes } from "../../../../event-system/EventTypes.js";

// 自动导入 i18n-tutorial.js 以注册翻译
import "../../../../tutorial-system/i18n-tutorial.js";

export class GamePageLevel1 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    super(switcher, p, 1, "easy_hint_level1", "easy_level1", {
      showButtons: false,
    });
    this.tutorial = null;
    this._onTutorialStartRequested = null;
    this._level = null; // 会在 enter() 中设置

    // 应用 Easy 风格计时器
    if (this._gameTimer) {
      this._gameTimer.applyEasyStyle(p.canvas);
    }
  }

  enter() {
    // 先调用父类 enter
    super.enter();

    // 获取关卡实例（从 window._easyLevel1Current）
    // Level1 在构造函数中会设置这个全局引用
    const level = window._easyLevel1Current;

    if (level && level.recordSystem) {
      this._level = level;
      console.log(
        "[GamePageLevel1] ✓ Got level instance from window._easyLevel1Current",
      );

      this.tutorial = new TutorialManager(
        document.body,
        this._level,
        this._level.recordSystem,
        this.switcher.eventBus,
        this._p, // 传递 p5 实例
      );

      this._onTutorialStartRequested = () => {
        console.log("[GamePageLevel1] Tutorial start requested!");
        if (this.tutorial) {
          this.tutorial.start();
        }
      };

      if (this.switcher.eventBus) {
        this.switcher.eventBus.subscribe(
          EventTypes.TUTORIAL_START_REQUESTED,
          this._onTutorialStartRequested,
        );
      }

      console.log("[GamePageLevel1] ✓ Tutorial manager created and ready");
    } else {
      console.warn(
        "[GamePageLevel1] ✗ Could not get level from window._easyLevel1Current",
      );
      console.warn(
        "[GamePageLevel1] window._easyLevel1Current:",
        window._easyLevel1Current,
      );
    }
  }

  exit() {
    // 注销事件监听
    if (this._onTutorialStartRequested && this.switcher.eventBus) {
      this.switcher.eventBus.unsubscribe(
        EventTypes.TUTORIAL_START_REQUESTED,
        this._onTutorialStartRequested,
      );
    }

    // 清理教学系统
    if (this.tutorial) {
      this.tutorial.destroy();
      this.tutorial = null;
    }

    // 调用父类 exit
    super.exit();
  }
}
