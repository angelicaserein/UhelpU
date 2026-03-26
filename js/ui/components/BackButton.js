import { ButtonBase } from "./ButtonBase.js";

export class BackButton extends ButtonBase {
  constructor(p, onClick) {
    super(p, "◀", 0.05 * p.width, 0.06 * p.height, onClick, "back-button");
    this.btn.style("width", 0.04 * p.width + "px");
    this.btn.style("height", 0.065 * p.height + "px");
  }
}
