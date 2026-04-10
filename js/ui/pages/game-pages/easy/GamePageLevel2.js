import { GamePageBaseDemo2 } from "../GamePageBaseDemo2.js";

export class GamePageLevel2 extends GamePageBaseDemo2 {
  constructor(switcher, p) {
    console.log("[GamePageLevel2] Constructor called");
    super(switcher, p, 2, "easy_hint_level2", "easy_level2", {
      showButtons: false,
    });

    // 获取 p5.js canvas 的位置信息
    const canvas = p.canvas;
    if (canvas && this._gameTimer && this._gameTimer.element) {
      const canvasRect = canvas.getBoundingClientRect();

      // 计算计时器应该放在 canvas 右上角的位置（往上挪5px，往右挪30px）
      const timerX = canvasRect.left + canvasRect.width - 110;
      const timerY = canvasRect.top + 30;

      // 应用样式：浅粉色数字，无背景
      this._gameTimer.element.style.position = "fixed";
      this._gameTimer.element.style.left = `${timerX}px`;
      this._gameTimer.element.style.top = `${timerY}px`;
      this._gameTimer.element.style.right = "auto";
      this._gameTimer.element.style.transform = "none";
      this._gameTimer.element.style.fontSize = "18px";
      this._gameTimer.element.style.fontWeight = "bold";
      this._gameTimer.element.style.fontFamily = "'Courier New', monospace";
      this._gameTimer.element.style.color = "#DAC6EE";
      this._gameTimer.element.style.background = "transparent";
      this._gameTimer.element.style.border = "none";
      this._gameTimer.element.style.padding = "0px";
      this._gameTimer.element.style.textShadow = "none";
      this._gameTimer.element.style.zIndex = "1200";
    }
  }

  draw() {
    super.draw();
  }
}
