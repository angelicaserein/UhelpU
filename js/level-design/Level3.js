import {
  Player,
  Ground,
  Wall,
  Portal,
  Button,
  Signboard,
} from "../game-entity-model/index.js";
import { BaseLevel } from "./BaseLevel.js";
import { WireRenderer } from "./WireRenderer.js";

export class Level3 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageLevel3";
    const wallThickness = 20;
    this.entities.add(new Wall(0, 0, wallThickness, p.height));
    this.entities.add(
      new Wall(p.width - wallThickness, 0, wallThickness, p.height),
    );
    this._button1 = new Button(700, 280, 20, 5); // 右按钮
    this._button2 = new Button(215, 80, 20, 5); // 左按钮
    this._portal = new Portal(1025, 280, 50, 50);
    this.entities.add(new Ground(0, 0, p.width, 80));
    this._rightPlatform = new Ground(500, 250, 1000, 30, true);
    this.entities.add(this._rightPlatform);

    this.entities.add(this._portal);
    this.entities.add(this._button1);
    this.entities.add(this._button2);

    const signboard = new Signboard(
      800,
      80,
      200,
      45,
      () => this.getPlayer(),
      eventBus,
      { imageKey: "tileImage_signboard2" },
    );
    this.entities.add(signboard);

    const player = new Player(50, 450, 40, 40);
    player.createListeners();
    this.entities.add(player);

    this.initSystems(player);

    this._wireRenderer = new WireRenderer({
      button1: this._button1,
      button2: this._button2,
      portal: this._portal,
      entities: this.entities,
    });
  }

  updateCollision(_p = this.p, eventBus = this.eventBus) {
    this.collisionSystem.collisionEntry(eventBus);
    this._wireRenderer.update();
  }

  draw(p = this.p) {
    // Spikes first, then ground (ground covers spike bases)
    for (const entity of this.entities) {
      if (entity.type === "spike") entity.draw(p);
    }
    for (const entity of this.entities) {
      if (entity.type === "ground") entity.draw(p);
    }

    // Wires drawn below other entities (portal, player on top)
    this._wireRenderer.draw(p);

    for (const entity of this.entities) {
      if (entity.type !== "spike" && entity.type !== "ground") {
        entity.draw(p);
      }
    }

    if (this.recordSystem.draw) this.recordSystem.draw(p);

    this._button1.releaseButton();
    this._button2.releaseButton();
  }
}
