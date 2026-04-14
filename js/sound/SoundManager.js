const SOUND_PATHS = Object.freeze({
  click: "assets/audio/sxf/click.mp3",
  click_alt: "assets/audio/sxf/click_alt.mp3",
  dead: "assets/audio/sxf/dead.mp3",
  victory: "assets/audio/sxf/victory.mp3",
  dialog_button: "assets/audio/sxf/dialog_button.mp3",
  interact: "assets/audio/sxf/Interact.mp3",
  button: "assets/audio/sxf/button.mp3",
  jump: "assets/audio/sxf/jump.mp3",
  land: "assets/audio/sxf/land.mp3",
  walk: "assets/audio/sxf/walk.mp3",
  electrify: "assets/audio/sxf/electrify.mp3",
  door_open: "assets/audio/sxf/door_open.mp3",
});

const DEFAULT_LEVELS = Object.freeze({
  click: 0.7,
  click_alt: 0.7,
  dead: 0.85,
  victory: 0.9,
  dialog_button: 0.65,
  interact: 0.7,
  button: 0.7,
  jump: 0.8,
  land: 0.75,
  walk: 0.45,
  electrify: 0.85,
  door_open: 0.85,
});

function clamp01(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return 1;
  }
  return Math.max(0, Math.min(1, normalized));
}

function once(target, eventName, handler, options) {
  if (!target || typeof target.addEventListener !== "function") {
    return () => {};
  }

  const wrapped = (event) => {
    target.removeEventListener(eventName, wrapped, options);
    handler(event);
  };

  target.addEventListener(eventName, wrapped, options);
  return () => target.removeEventListener(eventName, wrapped, options);
}

class SoundManager {
  constructor() {
    this._p = null;
    this._sounds = new Map();
    this._masterVolume = 1;
    this._muted = false;
    this._loaded = false;
    this._unlockBound = false;
    this._walkPlaying = false;
    this._patchedMethods = new WeakMap();
    this._instanceWatchStarted = false;
    this._instanceWatchHandle = null;
    this._bootstrapped = false;
    this._startP5InstanceWatcher();
  }

  attachToP5(p) {
    const instance = p || this._getP5Instance();
    if (!instance) {
      throw new Error("[SoundManager] attachToP5(p) requires a p5 instance.");
    }

    this._p = instance;
    this._bindAudioUnlock(instance);
    this._bootstrapSounds();
    return this;
  }

  preload(p = this._p) {
    const instance = p || this._getP5Instance();
    if (!instance) {
      throw new Error("[SoundManager] preload() requires a bound p5 instance.");
    }

    this._p = instance;
    this._bootstrapSounds();
  }

  isLoaded() {
    return this._loaded;
  }

  play(key, options = {}) {
    const sound = this._getSound(key);
    if (!sound) {
      return false;
    }

    if (key === "walk") {
      this.startWalk(options);
      return true;
    }

    this._resumeAudioContext();

    const volumeScale = clamp01(options.volumeScale ?? 1);
    const playbackRate = Number(options.rate ?? 1);
    const restart = options.restart !== false;

    sound.amp(this._getEffectiveVolume(key, volumeScale));
    if (typeof sound.rate === "function") {
      sound.rate(Number.isFinite(playbackRate) ? playbackRate : 1);
    }

    if (restart && typeof sound.isPlaying === "function" && sound.isPlaying()) {
      sound.stop();
    }

    sound.play();
    return true;
  }

  stop(key) {
    if (key === "walk") {
      this.stopWalk();
      return true;
    }

    const sound = this._getSound(key);
    if (!sound) {
      return false;
    }

    sound.stop();
    return true;
  }

  startWalk(options = {}) {
    const sound = this._getSound("walk");
    if (!sound) {
      return false;
    }

    this._resumeAudioContext();

    const volumeScale = clamp01(options.volumeScale ?? 1);
    const playbackRate = Number(options.rate ?? 1);

    sound.amp(this._getEffectiveVolume("walk", volumeScale));
    if (typeof sound.rate === "function") {
      sound.rate(Number.isFinite(playbackRate) ? playbackRate : 1);
    }

    if (typeof sound.setLoop === "function") {
      sound.setLoop(true);
    } else if (typeof sound.loop === "function") {
      sound.loop(true);
    }

    if (typeof sound.isPlaying !== "function" || !sound.isPlaying()) {
      sound.play();
    }

    this._walkPlaying = true;
    return true;
  }

  stopWalk() {
    const sound = this._getSound("walk");
    if (!sound) {
      return false;
    }

    if (typeof sound.stop === "function") {
      sound.stop();
    }
    this._walkPlaying = false;
    return true;
  }

  isWalkPlaying() {
    const walk = this._getSound("walk");
    if (!walk || typeof walk.isPlaying !== "function") {
      return this._walkPlaying;
    }
    return walk.isPlaying();
  }

  has(key) {
    return Object.prototype.hasOwnProperty.call(SOUND_PATHS, key);
  }

  setVolume(volume01) {
    this._masterVolume = clamp01(volume01);
    this._applyVolumeToAll();
    return this._masterVolume;
  }

  getVolume() {
    return this._masterVolume;
  }

  setMuted(muted) {
    this._muted = Boolean(muted);
    this._applyVolumeToAll();

    if (this._muted) {
      this.stopWalk();
    }

    return this._muted;
  }

  toggleMute() {
    return this.setMuted(!this._muted);
  }

  isMuted() {
    return this._muted;
  }

  patchMethod(target, methodName, options = {}) {
    if (!target || typeof target[methodName] !== "function") {
      throw new Error(
        `[SoundManager] Cannot patch missing method: ${methodName}`,
      );
    }

    const before =
      typeof options.before === "function"
        ? options.before
        : typeof options.before === "string"
          ? () => this.play(options.before)
          : null;

    const after =
      typeof options.after === "function"
        ? options.after
        : typeof options.after === "string"
          ? () => this.play(options.after)
          : null;

    const original = target[methodName];
    let targetPatchedMethods = this._patchedMethods.get(target);
    if (!targetPatchedMethods) {
      targetPatchedMethods = new Map();
      this._patchedMethods.set(target, targetPatchedMethods);
    }

    if (targetPatchedMethods.has(methodName)) {
      return targetPatchedMethods.get(methodName).restore;
    }

    const manager = this;
    const wrapped = function patchedSoundMethod(...args) {
      if (before) {
        before.call(this, args, manager);
      }
      const result = original.apply(this, args);
      if (after) {
        after.call(this, args, result, manager);
      }
      return result;
    };

    target[methodName] = wrapped;

    const restore = () => {
      if (target[methodName] === wrapped) {
        target[methodName] = original;
      }
      const patched = this._patchedMethods.get(target);
      patched?.delete(methodName);
      if (patched && patched.size === 0) {
        this._patchedMethods.delete(target);
      }
    };

    targetPatchedMethods.set(methodName, { restore, original });
    return restore;
  }

  patchMethods(target, patchMap) {
    const restores = [];
    for (const [methodName, options] of Object.entries(patchMap || {})) {
      restores.push(this.patchMethod(target, methodName, options));
    }
    return () => {
      for (const restore of restores.reverse()) {
        restore();
      }
    };
  }

  createCallback(soundKey, callback, options = {}) {
    return (...args) => {
      if (options.when !== "after") {
        this.play(soundKey, options.playOptions);
      }

      const result = callback?.(...args);

      if (options.when === "after") {
        this.play(soundKey, options.playOptions);
      }

      return result;
    };
  }

  _bindAudioUnlock(p) {
    if (this._unlockBound || typeof window === "undefined") {
      return;
    }

    const unlock = () => {
      this._resumeAudioContext(p);
    };

    once(window, "pointerdown", unlock, { passive: true });
    once(window, "keydown", unlock);
    this._unlockBound = true;
  }

  _getP5Instance() {
    if (this._p) {
      return this._p;
    }

    const globalP5 = globalThis.p5;
    if (globalP5 && globalP5.instance) {
      return globalP5.instance;
    }

    return null;
  }

  _startP5InstanceWatcher() {
    if (
      this._instanceWatchStarted ||
      typeof globalThis.requestAnimationFrame !== "function"
    ) {
      return;
    }

    this._instanceWatchStarted = true;

    const watch = () => {
      const instance = this._getP5Instance();
      if (instance) {
        this._p = instance;
        this._bindAudioUnlock(instance);
        this._bootstrapSounds();
        this._instanceWatchHandle = null;
        return;
      }

      this._instanceWatchHandle = globalThis.requestAnimationFrame(watch);
    };

    watch();
  }

  _bootstrapSounds() {
    if (this._bootstrapped) {
      return;
    }

    const globalP5 = globalThis.p5;
    if (!globalP5 || typeof globalP5.SoundFile !== "function") {
      return;
    }

    for (const key of Object.keys(SOUND_PATHS)) {
      this._ensureSoundEntry(key);
    }

    this._bootstrapped = true;
    this._loaded = true;
    this._applyVolumeToAll();
  }

  _resumeAudioContext(p = this._p) {
    const instance = p || this._getP5Instance();
    if (!instance || typeof instance.getAudioContext !== "function") {
      return;
    }

    const audioContext = instance.getAudioContext();
    if (!audioContext || audioContext.state === "running") {
      return;
    }

    if (typeof instance.userStartAudio === "function") {
      Promise.resolve(instance.userStartAudio()).catch(() => {});
      return;
    }

    if (typeof audioContext.resume === "function") {
      Promise.resolve(audioContext.resume()).catch(() => {});
    }
  }

  _getSound(key) {
    if (!this.has(key)) {
      console.warn(`[SoundManager] Unknown or unloaded sound key: ${key}`);
      return null;
    }

    this._bootstrapSounds();

    const entry = this._ensureSoundEntry(key);
    if (!entry) {
      return null;
    }

    const isLoaded =
      entry.loaded ||
      (typeof entry.sound.isLoaded === "function" && entry.sound.isLoaded());
    if (!isLoaded) {
      return null;
    }

    entry.loaded = true;
    return entry.sound;
  }

  _ensureSoundEntry(key) {
    if (!this.has(key)) {
      return null;
    }

    if (this._sounds.has(key)) {
      return this._sounds.get(key);
    }

    const globalP5 = globalThis.p5;
    if (!globalP5 || typeof globalP5.SoundFile !== "function") {
      return null;
    }

    const path = SOUND_PATHS[key];
    const entry = {
      sound: null,
      loaded: false,
    };

    entry.sound = new globalP5.SoundFile(
      path,
      () => {
        entry.loaded = true;
        this._applyVolumeToSound(key, entry.sound);
        console.log(`[SoundManager] Loaded ${key}: ${path}`);
      },
      (error) => {
        console.warn(`[SoundManager] Failed to load ${key}: ${path}`, error);
      },
    );

    this._sounds.set(key, entry);
    return entry;
  }

  _getEffectiveVolume(key, volumeScale = 1) {
    if (this._muted) {
      return 0;
    }

    const defaultLevel = DEFAULT_LEVELS[key] ?? 1;
    return clamp01(this._masterVolume * defaultLevel * volumeScale);
  }

  _applyVolumeToAll() {
    for (const [key, entry] of this._sounds.entries()) {
      this._applyVolumeToSound(key, entry.sound);
    }
  }

  _applyVolumeToSound(key, sound) {
    if (!sound || typeof sound.amp !== "function") {
      return;
    }
    sound.amp(this._getEffectiveVolume(key));
  }
}

export const soundManager = new SoundManager();
export { SOUND_PATHS };
