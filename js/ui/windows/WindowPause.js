// WindowPause.js — 暂停悬浮窗
import { WindowBase } from './WindowBase.js';
import { i18n, t } from '../../i18n.js';

export class WindowPause extends WindowBase {
  /**
   * @param {p5}      p           - p5 实例
    * @param {object}  callbacks   - { onResume, onBackMenu, onBackLevelChoice, onSetting, onHint }
   */
  constructor(p, callbacks = {}) {
    const w = 280;
    const x = Math.round((p.width - w) / 2);
    const y = Math.round(p.height * 0.25);
    super(p, t('pause_title'), x, y, w);
    this.container.addClass('window-pause-top');

    this._callbacks = callbacks;

    // 让默认的 ✕ 关闭按钮同时触发 resume，保持游戏不卡在暂停
    this.closeBtn.mousePressed(() => {
      if (this._callbacks.onResume) this._callbacks.onResume();
    });

    this._i18nHandler = () => this._refreshLabels();
    i18n.onChange(this._i18nHandler);

    this._buildContent();
  }

  open() {
    super.open();
    this.container.style('z-index', '2147483646');
  }

  _buildContent() {
    const p = this.p;
    const area = this.contentArea;

    // 说明文字
    this._hint = p.createDiv(t('pause_hint'));
    this._hint.style('color', '#c8b8e8');
    this._hint.style('font-size', '13px');
    this._hint.style('text-align', 'center');
    this._hint.style('margin-bottom', '16px');
    this._hint.parent(area);

    // ── Resume 按钮 ────────────────────────────────────────────────
    this._resumeBtn = p.createButton(t('pause_resume'));
    this._resumeBtn.addClass('pause-btn pause-btn-resume');
    this._resumeBtn.parent(area);
    this._resumeBtn.mousePressed(() => {
      this.close();
      if (this._callbacks.onResume) this._callbacks.onResume();
    });

    // ── Setting 按钮 ──────────────────────────────────────────────
    this._settingBtn = p.createButton(t('pause_setting'));
    this._settingBtn.addClass('pause-btn pause-btn-setting');
    this._settingBtn.parent(area);
    this._settingBtn.mousePressed(() => {
      if (this._callbacks.onSetting) this._callbacks.onSetting();
    });

    // ── Hint 按钮 ─────────────────────────────────────────────────
    this._hintBtn = p.createButton(t('pause_hint_btn'));
    this._hintBtn.addClass('pause-btn pause-btn-hint');
    this._hintBtn.parent(area);
    this._hintBtn.mousePressed(() => {
      if (this._callbacks.onHint) this._callbacks.onHint();
    });

    // ── Restart Level 按钮 ───────────────────────────────────────
    this._restartBtn = p.createButton(t('pause_restart'));
    this._restartBtn.addClass('pause-btn pause-btn-restart');
    this._restartBtn.parent(area);
    this._restartBtn.mousePressed(() => {
      this.close();
      if (this._callbacks.onRestartLevel) this._callbacks.onRestartLevel();
    });

    // ── Back to Level Choice 按钮 ────────────────────────────────
    this._levelChoiceBtn = p.createButton(t('pause_back_level_choice'));
    this._levelChoiceBtn.addClass('pause-btn pause-btn-level-choice');
    this._levelChoiceBtn.parent(area);
    this._levelChoiceBtn.mousePressed(() => {
      this.close();
      if (this._callbacks.onBackLevelChoice) this._callbacks.onBackLevelChoice();
    });

    // ── Back to Menu 按钮 ──────────────────────────────────────────
    this._menuBtn = p.createButton(t('pause_back_menu'));
    this._menuBtn.addClass('pause-btn pause-btn-menu');
    this._menuBtn.parent(area);
    this._menuBtn.mousePressed(() => {
      this.close();
      if (this._callbacks.onBackMenu) this._callbacks.onBackMenu();
    });
  }

  _refreshLabels() {
    this.setTitle(t('pause_title'));
    this._hint && this._hint.html(t('pause_hint'));
    this._resumeBtn && this._resumeBtn.html(t('pause_resume'));
    this._settingBtn && this._settingBtn.html(t('pause_setting'));
    this._hintBtn && this._hintBtn.html(t('pause_hint_btn'));
    this._restartBtn && this._restartBtn.html(t('pause_restart'));
    this._levelChoiceBtn && this._levelChoiceBtn.html(t('pause_back_level_choice'));
    this._menuBtn && this._menuBtn.html(t('pause_back_menu'));
  }

  remove() {
    i18n.offChange(this._i18nHandler);
    super.remove();
  }
}
