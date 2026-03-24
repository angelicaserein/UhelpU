import { WindowBase } from './WindowBase.js';
import { i18n, t } from '../../i18n.js';

export class WindowHint extends WindowBase {
  /**
   * @param {p5} p
   * @param {number} levelNumber
  * @param {string} hintKey
   * @param {number} x
   * @param {number} y
   */
  constructor(p, levelNumber, hintKey, x, y) {
    const w = 300;
    const defaultX = x ?? 24;
    const defaultY = y ?? Math.round(p.height * 0.16);
    super(p, t('hint_title'), defaultX, defaultY, w);
    this.container.addClass('window-hint-top');

    this.levelNumber = levelNumber;
    this.hintKey = hintKey || '';

    this._i18nHandler = () => this._refreshLabels();
    i18n.onChange(this._i18nHandler);

    this._buildContent();
  }

  open() {
    super.open();
    this.container.style('z-index', '2147483647');
  }

  _buildContent() {
    const p = this.p;
    this._textEl = p.createDiv(this._getHintText());
    this._textEl.addClass('window-hint-text');
    this._textEl.parent(this.contentArea);
  }

  _getHintText() {
    if (!this.hintKey) return '';
    return t(this.hintKey);
  }

  _refreshLabels() {
    this.setTitle(t('hint_title'));
    if (this._textEl) this._textEl.html(this._getHintText());
  }

  setHintKey(key) {
    this.hintKey = key;
    if (this._textEl) this._textEl.html(this._getHintText());
  }

  remove() {
    i18n.offChange(this._i18nHandler);
    super.remove();
  }
}
