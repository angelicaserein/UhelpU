let hasOpenedRecordHudUi = false;
let hasEnteredReplayState = false;

export function markLevel1RecordHudOpened() {
  hasOpenedRecordHudUi = true;
}

export function shouldShowLevel1MissedPrompt() {
  return !hasOpenedRecordHudUi;
}

export function markLevel1ReplayStarted() {
  hasEnteredReplayState = true;
}

export function shouldShowLevel1ReplayPrompt() {
  return hasEnteredReplayState;
}

export function shouldShowLevel1PromptByRule(rule = "beforeRecordHud") {
  if (rule === "afterFirstReplay") return shouldShowLevel1ReplayPrompt();
  return shouldShowLevel1MissedPrompt();
}

export function resetLevel1PromptState() {
  hasOpenedRecordHudUi = false;
  hasEnteredReplayState = false;
}
