import { EventTypes } from "../event-system/EventTypes.js";
import { BasicPhysicsApplier } from "../character-control-system/PhysicsApplier.js";
import { Player } from "../game-entity-model/characters/Player.js";
import { Button } from "../game-entity-model/interactables/Button.js";
import { NPCDemo1 } from "../game-entity-model/interactables/NPCDemo1.js";
import { NPC as NPCDemo2 } from "../game-entity-model/interactables/NPCDemo2.js";
import { SignboardDemo1 } from "../game-entity-model/interactables/SignboardDemo1.js";
import { SignboardDemo2 } from "../game-entity-model/interactables/SignboardDemo2.js";
import { TeleportPoint } from "../game-entity-model/interactables/TeleportPoint.js";
import { BtnWirePortalSystem } from "../mechanism-system/demo2/BtnWirePortalSystem.js";
import { soundManager } from "./SoundManager.js";

let installed = false;

function installButtonPatch() {
  if (Button.prototype.__soundPatchInstalled) {
    return;
  }

  const originalPressButton = Button.prototype.pressButton;
  const originalReleaseButton = Button.prototype.releaseButton;

  Button.prototype.pressButton = function patchedPressButton() {
    const result = originalPressButton.call(this);

    if (!this._soundPressLatched && this.isPressed) {
      this._soundPressLatched = true;
      this._soundPendingButtonSound = !this.isWirePortalButton;
    }

    if (this._soundPendingButtonSound) {
      const played = soundManager.play("button");
      if (played) {
        this._soundPendingButtonSound = false;
      }
    }

    return result;
  };

  Button.prototype.releaseButton = function patchedReleaseButton() {
    const result = originalReleaseButton.call(this);

    Promise.resolve().then(() => {
      if (!this.isPressed) {
        this._soundPressLatched = false;
        this._soundPendingButtonSound = false;
      }
    });

    return result;
  };

  Button.prototype.__soundPatchInstalled = true;
}

function installBtnWirePortalPatch() {
  if (BtnWirePortalSystem.prototype.__soundPatchInstalled) {
    return;
  }

  const originalUpdate = BtnWirePortalSystem.prototype.update;
  BtnWirePortalSystem.prototype.update = function patchedUpdate() {
    this._soundPrevState = this._state;

    const result = originalUpdate.call(this);

    if (this._soundPrevState !== "charging" && this._state === "charging") {
      soundManager.play("electrify");
    }

    return result;
  };

  BtnWirePortalSystem.prototype.__soundPatchInstalled = true;
}

function installPhysicsPatches() {
  if (BasicPhysicsApplier.prototype.__soundPatchInstalled) {
    return;
  }

  const originalApply = BasicPhysicsApplier.prototype.apply;
  BasicPhysicsApplier.prototype.apply = function patchedApply(
    action,
    controlComponent,
    movementComponent,
  ) {
    const result = originalApply.call(
      this,
      action,
      controlComponent,
      movementComponent,
    );

    if (action.has("jump")) {
      soundManager.play("jump");
    }

    return result;
  };

  BasicPhysicsApplier.prototype.__soundPatchInstalled = true;
}

function installPlayerPatches() {
  if (Player.prototype.__soundPatchInstalled) {
    return;
  }

  const originalDraw = Player.prototype.draw;
  Player.prototype.draw = function patchedDraw(p) {
    if (this.deathState && this.deathState.isDead) {
      soundManager.stopWalk();
    }

    const isOnGround =
      this.controllerManager?.currentControlComponent?.abilityCondition?.[
        "isOnGround"
      ];
    const velX = this.movementComponent?.velX ?? 0;
    const shouldPlayLand =
      !this._wasOnGround && isOnGround && this._prevVelY < -1.5;

    if (shouldPlayLand) {
      soundManager.play("land");
    }

    if (isOnGround && Math.abs(velX) > 0.05) {
      soundManager.startWalk();
    } else {
      soundManager.stopWalk();
    }

    return originalDraw.call(this, p);
  };

  Player.prototype.__soundPatchInstalled = true;
}

function installNpcPatch(NpcClass) {
  if (NpcClass.prototype.__soundPatchInstalled) {
    return;
  }

  const originalHandleInteraction = NpcClass.prototype._handleInteraction;
  NpcClass.prototype._handleInteraction = function patchedHandleInteraction() {
    const wasDialogueActive = this._dialogueActive;
    const shouldPlayDialogButton =
      this._inRange &&
      this._dialogueActive &&
      !this._useExhaustedLine &&
      this._dialogueIndex + 1 < this.dialogueLines.length;

    if (shouldPlayDialogButton) {
      soundManager.play("dialog_button");
    }

    const result = originalHandleInteraction.call(this);

    if (!wasDialogueActive && this._dialogueActive) {
      soundManager.play("interact");
    }

    return result;
  };

  NpcClass.prototype.__soundPatchInstalled = true;
}

function installSignboardPatch(SignboardClass) {
  if (SignboardClass.prototype.__soundInteractPatchInstalled) {
    return;
  }

  const originalTryInteract = SignboardClass.prototype.tryInteract;
  SignboardClass.prototype.tryInteract = function patchedTryInteract() {
    const shouldPlayInteract = this.isPlayerOverlapping();
    const result = originalTryInteract.call(this);

    if (shouldPlayInteract) {
      soundManager.play("interact");
    }

    return result;
  };

  SignboardClass.prototype.__soundInteractPatchInstalled = true;
}

function installTeleportPointPatch() {
  if (TeleportPoint.prototype.__soundInteractPatchInstalled) {
    return;
  }

  const originalActivate = TeleportPoint.prototype.activate;
  TeleportPoint.prototype.activate = function patchedActivate() {
    const result = originalActivate.call(this);
    soundManager.play("interact");
    return result;
  };

  TeleportPoint.prototype.__soundInteractPatchInstalled = true;
}

function installVictoryPatch(eventBus) {
  if (!eventBus || eventBus.__soundVictoryPatchInstalled) {
    return;
  }

  eventBus.__soundVictoryPlayed = false;

  eventBus.subscribe(EventTypes.AUTO_RESULT, (result) => {
    if (result === "autoResult1") {
      if (eventBus.__soundVictoryPlayed) {
        return;
      }

      eventBus.__soundVictoryPlayed = true;
      soundManager.play("victory");
      soundManager.stopWalk();
    }
  });

  eventBus.subscribe(EventTypes.LOAD_LEVEL, () => {
    eventBus.__soundVictoryPlayed = false;
  });

  eventBus.subscribe(EventTypes.UNLOAD_LEVEL, () => {
    eventBus.__soundVictoryPlayed = false;
  });

  eventBus.subscribe(EventTypes.RETURN_LEVEL_CHOICE, () => {
    eventBus.__soundVictoryPlayed = false;
  });

  eventBus.__soundVictoryPatchInstalled = true;
}

export function installSoundPatches(eventBus) {
  if (installed) {
    installVictoryPatch(eventBus);
    return;
  }

  installButtonPatch();
  installBtnWirePortalPatch();
  installPhysicsPatches();
  installPlayerPatches();
  installNpcPatch(NPCDemo1);
  installNpcPatch(NPCDemo2);
  installSignboardPatch(SignboardDemo1);
  installSignboardPatch(SignboardDemo2);
  installTeleportPointPatch();
  installVictoryPatch(eventBus);

  installed = true;
}
