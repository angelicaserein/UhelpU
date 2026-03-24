// EventTypes.js
// Central registry of all EventBus event name constants.
// Import this instead of using raw string literals to catch typos at development time.

export const EventTypes = Object.freeze({
    // Level lifecycle
    LOAD_LEVEL:          "loadLevel",
    UNLOAD_LEVEL:        "unloadLevel",
    RETURN_LEVEL_CHOICE: "returnLevelChoice",

    // Game result
    AUTO_RESULT: "autoResult",

    // Pause / resume
    PAUSE_GAME:  "pauseGame",
    RESUME_GAME: "resumeGame",

    // Signboard interactions
    SIGNBOARD_INTERACTED:    "signboardInteracted",
    SIGNBOARD_OUT_OF_RANGE:  "signboardOutOfRange",
});
