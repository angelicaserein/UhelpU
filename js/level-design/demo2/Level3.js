import { Player, Ground, Wall, Portal } from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";

export class Level3 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);

    // this.bgAssetKey = "bgImageDemo2Level3";

    const wallThickness = 20;
    this.entities.add(new Wall(0, 0, wallThickness, p.height));
    this.entities.add(
      new Wall(p.width - wallThickness, 0, wallThickness, p.height),
    );
    this.entities.add(new Ground(0, 0, p.width, 80));

    const portalSize = 50;
    const portalX = p.width - wallThickness - portalSize;
    const portal = new Portal(portalX, 80, portalSize, portalSize);
    portal.openPortal();
    this.entities.add(portal);

    const player = new Player(50, 450, 40, 40);
    player.createListeners();
    this.entities.add(player);

    this.initSystems(player);
  }
}
