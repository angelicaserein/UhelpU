/**
 * @fileoverview Translates a set of movement intents into a concrete set of actions,
 * 将一组移动意图转换为具体的动作集，
 * applying any ability conditions (e.g. must be on ground to jump).
 * 并根据能力条件进行过滤（例如：必须站在地面上才能跳跃）。
 */

/**
 * Validates player intents and returns the subset that can actually execute
 * given the current ability conditions (ground state, cooldowns, etc.).
 * 验证玩家意图，返回在当前能力条件（地面状态、冷却等）下可执行的子集。
 *
 * @param {Set<string>} intent           - Desired actions from IntentResolver.
 * 期望执行的动作，来自 IntentResolver。
 * @param {BasicControlComponent} controlComponent - Current ability state.
 * 当前能力状态组件。
 * @returns {Set<string>} Approved actions to pass to PhysicsApplier.
 * 经过验证、可传递给 PhysicsApplier 的动作集合。
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
    // 跳跃要求角色在上一帧时处于地面上
    // (wasOnGround covers both direct ground contact and coyote time).
    // （wasOnGround 涵盖直接接触地面和土狼时间两种情况）。
    if (
      intent.has("wantsJump") &&
      controlComponent.abilityCondition["wasOnGround"]
    ) {
      action.add("jump");
    }

    return action;
  }
}
