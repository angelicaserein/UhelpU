import {
  Player,
  Ground,
  Wall,
  Portal,
  SignboardDemo1,
  KeyPrompt,
  TextPrompt,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import {
  shouldShowLevel1PromptByRule,
  markLevel1ReplayStarted,
} from "./Level1PromptState.js";

export class Level1 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageLevel1";
    const wallThickness = 20;
    this.entities.add(new Wall(0, 0, wallThickness, p.height));
    this.entities.add(
      new Wall(p.width - wallThickness, 0, wallThickness, p.height),
    );
    this.entities.add(new Ground(0, 0, p.width, 80));
    const platformWidth = 200;
    const platformX = p.width - wallThickness - platformWidth;
    this.entities.add(new Ground(platformX, 80, platformWidth, 120, true));
    // 将门改为 Portal，大小统一为 50x50
    const portalSize = 50;
    const portalX = p.width - wallThickness - portalSize;
    const portal = new Portal(portalX, 80 + 120, portalSize, portalSize);
    portal.openPortal(); // Level1 的门默认解锁
    this.entities.add(portal);

    const player = new Player(50, 450, 40, 40);
    player.createListeners();
    this.entities.add(player);

    // 场景内可交互木牌（固定尺寸 100×65，贴合 ground 顶部 y=80）
    const signboard = new SignboardDemo1(
      250,
      80,
      SignboardDemo1.DEFAULT_W,
      SignboardDemo1.DEFAULT_H,
      () => this.getPlayer(),
      eventBus,
    );
    this.entities.add(signboard);

    // 按键提示（WAD 键，玩家和木牌之间，根据距离淡入淡出）
    const keyPrompt = new KeyPrompt(120, 100, this);
    this.entities.add(keyPrompt);

    // 木牌正上方按键提示（仅 C 键）
    const signboardKeyPromptX = signboard.x + SignboardDemo1.DEFAULT_W / 2 - 14;
    const signboardKeyPromptY = signboard.y + SignboardDemo1.DEFAULT_H + 8;
    const cKeyPrompt = new KeyPrompt(
      signboardKeyPromptX,
      signboardKeyPromptY,
      this,
      {
        intent: "interaction",
      },
    );
    this.entities.add(cKeyPrompt);

    const missedPromptWidth = 280;
    const signboardRightX = signboard.x + signboard.w;
    const gapWidth = platformX - signboardRightX;
    const missedPromptX = signboardRightX + (gapWidth - missedPromptWidth) / 2;
    const missedPromptY = signboard.y + 78;
    const missedPrompt = new TextPrompt(missedPromptX, missedPromptY, this, {
      textKey: "level1_missed_prompt",
      width: missedPromptWidth,
      height: 76,
      textSize: 16,
      showDistance: 80,
      hideDistance: 220,
      visibilityFn: () => shouldShowLevel1PromptByRule("beforeRecordHud"),
    });
    this.entities.add(missedPrompt);

    const replayPrompt = new TextPrompt(missedPromptX, missedPromptY, this, {
      textKey: "level1_replay_prompt",
      width: missedPromptWidth,
      height: 110,
      textSize: 16,
      showDistance: 160,
      hideDistance: 440,
      visibilityFn: () => shouldShowLevel1PromptByRule("afterFirstReplay"),
    });
    this.entities.add(replayPrompt);

    this.initSystems(player, 5000, {
      onReplayStart: () => markLevel1ReplayStarted(),
    });
  }
}
