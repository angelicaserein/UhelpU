/**
 * @fileoverview Translates a set of movement intents into a concrete set of actions,
 * applying any ability conditions (e.g. must be on ground to jump).
 */

/**
 * Validates player intents and returns the subset that can actually execute
 * given the current ability conditions (ground state, cooldowns, etc.).
 *
 * @param {Set<string>} intent           - Desired actions from IntentResolver.
 * @param {BasicControlComponent} controlComponent - Current ability state.
 * @returns {Set<string>} Approved actions to pass to PhysicsApplier.
 */
export class BasicActionValidator {
    validate(intent, controlComponent) {
        const action = new Set();

        if (intent.has("wantsLeft")) {
            action.add("movesLeft");
        } else if (intent.has("wantsRight")) {
            action.add("movesRight");
        } else if (intent.has("wantsStopX")) {
            action.add("stopX");
        }

        // Jump requires the character to have been on the ground last frame
        // (wasOnGround covers both direct ground contact and coyote time).
        if (intent.has("wantsJump") && controlComponent.abilityCondition["wasOnGround"]) {
            action.add("jump");
        }

        return action;
    }
}
