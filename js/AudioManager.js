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
};

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

class AudioManagerImpl {
  constructor() {
    this._bgmVolume = 0.7;
    this._sfxVolume = 0.7;
    this._bgmMap = new Map();
    this._sfxMap = new Map();
    this._currentBgmKey = null;
    this._currentBgm = null;
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

  playBGM(trackKey) {
    const next = this._getOrCreateBgm(trackKey);
    if (!next) {
      console.warn(`[AudioManager] Unknown BGM track: ${trackKey}`);
      return;
    }

    if (this._currentBgmKey === trackKey) {
      next.volume = this._bgmVolume;
      if (next.paused) {
        next.play().catch(() => {});
      }
      return;
    }

    if (this._currentBgm) {
      this._currentBgm.pause();
      this._currentBgm.currentTime = 0;
    }

    this._currentBgm = next;
    this._currentBgmKey = trackKey;
    this._currentBgm.volume = this._bgmVolume;
    this._currentBgm.play().catch(() => {});
  }

  stopBGM() {
    if (!this._currentBgm) return;
    this._currentBgm.pause();
    this._currentBgm.currentTime = 0;
    this._currentBgm = null;
    this._currentBgmKey = null;
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
