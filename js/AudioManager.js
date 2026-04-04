const TRACKS = {
  menu: "assets/audio/bgm/menu.mp3",
  setting: "assets/audio/bgm/setting.mp3",
  level1: "assets/audio/bgm/level1.mp3",
  level2: "assets/audio/bgm/level2.mp3",
  level3: "assets/audio/bgm/level3.mp3",
  level4: "assets/audio/bgm/level4.mp3",
  level5: "assets/audio/bgm/level5.mp3",
  level6: "assets/audio/bgm/level6.mp3",
  level7: "assets/audio/bgm/level7.mp3",
  level8: "assets/audio/bgm/level8.mp3",
  level9: "assets/audio/bgm/level9.mp3",
  level10: "assets/audio/bgm/level10.mp3",
  levelChoice: "assets/audio/bgm/levelchoice.mp3",
  gameOver: "assets/audio/bgm/gameover.mp3",
  gameWin: "assets/audio/bgm/gamewin.mp3",
  openingStory: "assets/audio/bgm/openingstory.mp3",
  achieves: "assets/audio/bgm/achieves.mp3",
};

const SFX_TRACKS = {
  click: "assets/audio/sxf/click.mp3",
  dead: "assets/audio/sxf/dead.mp3",
};

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const FADE_INTERVAL = 50;  // ms per tick
const FADE_STEPS = 800 / FADE_INTERVAL; // 800ms total fade

class AudioManagerImpl {
  constructor() {
    this._bgmVolume = 0.7;
    this._sfxVolume = 0.7;
    this._bgmMap = new Map();
    this._sfxMap = new Map();
    this._currentBgmKey = null;
    this._currentBgm = null;
    this._fadeOutTimer = null;
    this._fadeInTimer = null;
    this._fadingOutBgm = null;
    this._bindUnlockGesture();
  }

  _bindUnlockGesture() {
    const unlock = () => {
      if (this._currentBgm && this._currentBgm.paused) {
        this._currentBgm.play().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  _getOrCreateBgm(trackKey) {
    if (this._bgmMap.has(trackKey)) {
      return this._bgmMap.get(trackKey);
    }

    const src = TRACKS[trackKey];
    if (!src) return null;

    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = this._bgmVolume;
    this._bgmMap.set(trackKey, audio);
    return audio;
  }

  _getOrCreateSfx(trackKey) {
    if (this._sfxMap.has(trackKey)) {
      return this._sfxMap.get(trackKey);
    }

    const src = SFX_TRACKS[trackKey];
    if (!src) return null;

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = this._sfxVolume;
    this._sfxMap.set(trackKey, audio);
    return audio;
  }

  _clearFadeTimers() {
    if (this._fadeOutTimer) {
      clearInterval(this._fadeOutTimer);
      this._fadeOutTimer = null;
      // 立即停掉仍在淡出中的旧音频，防止它变成"孤儿"继续播放
      if (this._fadingOutBgm) {
        this._fadingOutBgm.pause();
        this._fadingOutBgm.currentTime = 0;
        this._fadingOutBgm = null;
      }
    }
    if (this._fadeInTimer) { clearInterval(this._fadeInTimer); this._fadeInTimer = null; }
  }

  _fadeOut(audio, onComplete) {
    this._fadingOutBgm = audio;
    const startVolume = audio.volume;
    let step = 0;
    this._fadeOutTimer = setInterval(() => {
      step++;
      audio.volume = clamp01(startVolume * (1 - step / FADE_STEPS));
      if (step >= FADE_STEPS) {
        clearInterval(this._fadeOutTimer);
        this._fadeOutTimer = null;
        this._fadingOutBgm = null;
        audio.volume = 0;
        if (onComplete) onComplete();
      }
    }, FADE_INTERVAL);
  }

  _fadeIn(audio) {
    const target = this._bgmVolume;
    let step = 0;
    this._fadeInTimer = setInterval(() => {
      step++;
      audio.volume = clamp01(target * (step / FADE_STEPS));
      if (step >= FADE_STEPS) {
        clearInterval(this._fadeInTimer);
        this._fadeInTimer = null;
        audio.volume = target;
      }
    }, FADE_INTERVAL);
  }

  playBGM(trackKey) {
    const next = this._getOrCreateBgm(trackKey);
    if (!next) {
      console.warn(`[AudioManager] Unknown BGM track: ${trackKey}`);
      return;
    }

    if (this._currentBgmKey === trackKey) {
      if (next.paused) {
        this._clearFadeTimers();
        next.volume = 0;
        next.play().catch(() => {});
        this._fadeIn(next);
      }
      return;
    }

    this._clearFadeTimers();
    const prevBgm = this._currentBgm;
    this._currentBgm = next;
    this._currentBgmKey = trackKey;

    if (prevBgm) {
      this._fadeOut(prevBgm, () => {
        prevBgm.pause();
        prevBgm.currentTime = 0;
        next.volume = 0;
        next.play().catch(() => {});
        this._fadeIn(next);
      });
    } else {
      next.volume = 0;
      next.play().catch(() => {});
      this._fadeIn(next);
    }
  }

  stopBGM() {
    if (!this._currentBgm) return;
    this._clearFadeTimers();
    const bgm = this._currentBgm;
    this._currentBgm = null;
    this._currentBgmKey = null;
    this._fadeOut(bgm, () => {
      bgm.pause();
      bgm.currentTime = 0;
    });
  }

  setBGMVolume(volume01) {
    this._bgmVolume = clamp01(volume01);
    for (const audio of this._bgmMap.values()) {
      audio.volume = this._bgmVolume;
    }
  }

  getBGMVolume() {
    return this._bgmVolume;
  }

  setSFXVolume(volume01) {
    this._sfxVolume = clamp01(volume01);
    for (const audio of this._sfxMap.values()) {
      audio.volume = this._sfxVolume;
    }
  }

  getSFXVolume() {
    return this._sfxVolume;
  }

  playSFX(trackKey) {
    const base = this._getOrCreateSfx(trackKey);
    if (!base) {
      console.warn(`[AudioManager] Unknown SFX track: ${trackKey}`);
      return;
    }

    // Clone to allow overlapping click sounds.
    const instance = base.cloneNode();
    instance.volume = this._sfxVolume;
    instance.play().catch(() => {});
  }
}

export const AudioManager = new AudioManagerImpl();
