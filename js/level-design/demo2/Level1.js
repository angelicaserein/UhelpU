import {
  Player,
  Ground,
  Wall,
  Portal,
  NPCDemo2,
  SignboardDemo2,
  Button,
  Spike,
} from "../../game-entity-model/index.js";
import { BaseLevel } from "../BaseLevel.js";
import { ButtonSpikeLinkSystem } from "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js";

export class Level1 extends BaseLevel {
  constructor(p, eventBus) {
    super(p, eventBus);
    this.bgAssetKey = "bgImageDemo2Level";

    // ── 编辑器导出的实体 ───────────────────────────────────────
    //
    // 房间数量: 1
    //   Room 0: x ∈ [0, 1366)

    // ── 边界墙壁 ──────────────────────────────────────────────
    this.entities.add(new Wall(0, 0, 20, 768));
    this.entities.add(new Wall(1346, 0, 20, 768));

    // ── 地面 ──────────────────────────────────────────────────
    this.entities.add(new Ground(0, 0, p.width, 80));

    // ── Portal ────────────────────────────────────────────────
    const portal = new Portal(1250, 80, 50, 50);
    portal.openPortal();
    this.entities.add(portal);

    // ── NPC ───────────────────────────────────────────────────
    this.entities.add(
      new NPCDemo2(220, 80, 40, 40, {
        //参数分别是：x, y, width, height, getPlayer函数，eventBus，npcId，对话文本数组，疲劳对话文本
        getPlayer: () => this._player,
        eventBus: this.eventBus,
        npcId: "level1_npc",
        dialogueLines: [
          "d2_npc_level1_line1",
          "d2_npc_level1_line2",
          "d2_npc_level1_line3",
        ],
        exhaustedLine: "d2_npc_level1_exhausted",
      }),
    );

    // ── Signboard ─────────────────────────────────────────────
    this.entities.add(
      new SignboardDemo2(340, 80, 100, 65, () => this._player, this.eventBus, {
        textKey: "d2_signboard_level1_front",
      }),
    );

    // ── ButtonSpikeLinkSystem ─────────────────────────────────
    const bsBtn_0 = new Button(470, 80, 34, 16);
    const bsSpike_0 = new Spike(610, 80, 100, 20);
    this._bsSys_0 = new ButtonSpikeLinkSystem(
      { button: bsBtn_0, spikes: [bsSpike_0] },
      { startColorIndex: 0 },
    );
    this.entities.add(bsBtn_0);
    this.entities.add(bsSpike_0);

    const bsBtn_1 = new Button(780, 80, 34, 16);
    const bsSpike_1 = new Spike(870, 80, 320, 20);
    this._bsSys_1 = new ButtonSpikeLinkSystem(
      { button: bsBtn_1, spikes: [bsSpike_1] },
      { startColorIndex: 1 },
    );
    this.entities.add(bsBtn_1);
    this.entities.add(bsSpike_1);

    // ── 玩家 ──────────────────────────────────────────────────
    this._player = new Player(80, 240, 40, 40);
    this._player.createListeners();
    this.entities.add(this._player);

    // ── 系统初始化（录制 / 物理 / 碰撞） ─────────────────────
    this.initSystems(this._player);
  }

  updatePhysics() {
    super.updatePhysics();
    this._bsSys_0.update();
    this._bsSys_1.update();
  }
}
