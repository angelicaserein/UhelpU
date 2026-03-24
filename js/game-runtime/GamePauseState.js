let paused = false;

export function setGamePaused(value) {
  paused = !!value;
}

export function isGamePaused() {
  return paused;
}
