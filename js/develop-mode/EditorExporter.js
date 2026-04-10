/**
 * EditorExporter — 将编辑器放置的实体导出为可粘贴的代码
 *
 * 生成的代码格式完全匹配项目现有实体构造方式：
 *   new Ground(x, y, w, h)
 *   new Portal(x, y, w, h)
 *   new Platform(x, y, w, h)
 *   new Spike(x, y, w, h)
 */

import { EntityTool } from "./EditorConfig.js";

export class EditorExporter {
  /**
   * 将放置记录转换为代码字符串
   * @param {import('./EditorEntityManager.js').PlacedRecord[]} records
   * @returns {string}
   */
  static generateCode(
    records,
    roomCount = 2,
    canvasWidth = 800,
    canvasHeight = 600,
    spawn = null,
  ) {
    const lines = [];
    lines.push(
      "// ── 编辑器导出的实体 ───────────────────────────────────────",
    );
    lines.push("//");
    lines.push(`// 房间数量: ${roomCount}`);
    for (let i = 0; i < roomCount; i++) {
      lines.push(
        `//   Room ${i}: x ∈ [${i * canvasWidth}, ${(i + 1) * canvasWidth})`,
      );
    }

    // 玩家出生点
    if (spawn) {
      lines.push("//");
      lines.push("// 玩家出生点:");
      lines.push(
        `this._player = new Player(${spawn.x}, ${spawn.y}, ${spawn.w}, ${spawn.h});`,
      );
    }
    lines.push("//");
    lines.push("// 自动墙壁（左/右边界）:");
    lines.push(
      `//   new Wall(0, 0, 20, ${canvasHeight}),  // 最左侧墙 (Room 0)`,
    );
    lines.push(
      `//   new Wall(${roomCount * canvasWidth - 20}, 0, 20, ${canvasHeight}),  // 最右侧墙 (Room ${roomCount - 1})`,
    );

    const groups = [
      { tool: EntityTool.GROUND, label: "Ground", ctor: "Ground" },
      { tool: EntityTool.PLATFORM, label: "Platform", ctor: "Platform" },
      { tool: EntityTool.SPIKE, label: "Spike", ctor: "Spike" },
      { tool: EntityTool.WALL, label: "Wall", ctor: "Wall" },
      { tool: EntityTool.PORTAL, label: "Portal", ctor: "Portal" },
      { tool: EntityTool.NPC, label: "NPC", ctor: "NPC" },
      { tool: EntityTool.SIGNBOARD, label: "Signboard", ctor: "Signboard" },
      { tool: EntityTool.CHECKPOINT, label: "Checkpoint", ctor: "Checkpoint" },
      { tool: EntityTool.ENEMY, label: "Enemy", ctor: "Enemy" },
    ];

    for (const g of groups) {
      const items = records.filter((r) => r.tool === g.tool);
      if (items.length === 0) continue;
      lines.push("");
      lines.push(`// ${g.label}`);
      for (const r of items) {
        const e = r.gameEntity;
        const w = e.collider ? e.collider.w : 50;
        const h = e.collider ? e.collider.h : 50;
        if (g.tool === EntityTool.ENEMY) {
          const speed = e._speed ?? 2;
          const direction = r.direction ?? 1;
          lines.push(`new ${g.ctor}(${e.x}, ${e.y}, ${w}, ${h}, { speed: ${speed}, direction: ${direction} }),`);
        } else {
          lines.push(`new ${g.ctor}(${e.x}, ${e.y}, ${w}, ${h}),`);
        }
      }
    }

    // BtnWirePortalSystem 复合实体导出
    const wpItems = records.filter((r) => r.tool === EntityTool.WIRE_PORTAL);
    if (wpItems.length > 0) {
      lines.push("");
      lines.push("// BtnWirePortalSystem");
      lines.push(
        '// import { Button } from "../game-entity-model/interactables/Button.js";',
      );
      lines.push(
        '// import { BtnWirePortalSystem } from "../mechanism-system/demo2/BtnWirePortalSystem.js";',
      );
      wpItems.forEach((r, idx) => {
        const btn = r.gameEntity;
        const ptl = r.portalEntity;
        const bw = btn.collider ? btn.collider.w : 34;
        const bh = btn.collider ? btn.collider.h : 16;
        const pw = ptl.collider ? ptl.collider.w : 50;
        const ph = ptl.collider ? ptl.collider.h : 50;
        lines.push(
          `const wpBtn_${idx} = new Button(${btn.x}, ${btn.y}, ${bw}, ${bh});`,
        );
        lines.push(
          `const wpPortal_${idx} = new Portal(${ptl.x}, ${ptl.y}, ${pw}, ${ph});`,
        );
        lines.push(
          `const wpSys_${idx} = new BtnWirePortalSystem({ button: wpBtn_${idx}, portal: wpPortal_${idx} });`,
        );
      });
      lines.push("// wpBtn / wpPortal 需要加入 Room 实体列表");
      lines.push("// wpSys 需要在 update() 和 draw() 中调用");
    }

    // ButtonSpikeLinkSystem 复合实体导出
    const bsItems = records.filter((r) => r.tool === EntityTool.BTN_SPIKE);
    if (bsItems.length > 0) {
      lines.push("");
      lines.push("// ButtonSpikeLinkSystem");
      lines.push(
        '// import { Button } from "../game-entity-model/interactables/Button.js";',
      );
      lines.push(
        '// import { Spike } from "../game-entity-model/interactables/Spike.js";',
      );
      lines.push(
        '// import { ButtonSpikeLinkSystem } from "../mechanism-system/demo2/ButtonSpikeLinkSystem.js";',
      );
      bsItems.forEach((r, idx) => {
        const btn = r.gameEntity;
        const spk = r.spikeEntity;
        const bw = btn.collider ? btn.collider.w : 34;
        const bh = btn.collider ? btn.collider.h : 16;
        const sw = spk.collider ? spk.collider.w : 100;
        const sh = spk.collider ? spk.collider.h : 20;
        lines.push(
          `const bsBtn_${idx} = new Button(${btn.x}, ${btn.y}, ${bw}, ${bh});`,
        );
        lines.push(
          `const bsSpike_${idx} = new Spike(${spk.x}, ${spk.y}, ${sw}, ${sh});`,
        );
        lines.push(
          `const bsSys_${idx} = new ButtonSpikeLinkSystem({ button: bsBtn_${idx}, spikes: [bsSpike_${idx}] }, { startColorIndex: ${r.startColorIndex ?? idx} });`,
        );
      });
      lines.push("// bsBtn / bsSpike 需要加入 Room 实体列表");
      lines.push("// bsSys 需要在 update() 中调用");
    }

    // ButtonPlatformLinkSystem 复合实体导出
    const bpItems = records.filter((r) => r.tool === EntityTool.BTN_PLATFORM);
    if (bpItems.length > 0) {
      lines.push("");
      lines.push("// ButtonPlatformLinkSystem");
      lines.push(
        '// import { Button } from "../game-entity-model/interactables/Button.js";',
      );
      lines.push(
        '// import { Platform } from "../game-entity-model/terrain/Platform.js";',
      );
      lines.push(
        '// import { ButtonPlatformLinkSystem } from "../mechanism-system/demo2/ButtonPlatformLinkSystem.js";',
      );
      bpItems.forEach((r, idx) => {
        const btn = r.gameEntity;
        const platforms = r.platformEntities || [];
        const platformLinks = r.platformLinks || [];
        const bw = btn.collider ? btn.collider.w : 34;
        const bh = btn.collider ? btn.collider.h : 16;
        lines.push(
          `const bpBtn_${idx} = new Button(${btn.x}, ${btn.y}, ${bw}, ${bh});`,
        );
        const platVarNames = [];
        platforms.forEach((plt, pi) => {
          const pw = plt.collider ? plt.collider.w : 160;
          const ph = plt.collider ? plt.collider.h : 30;
          const varName = `bpPlat_${idx}_${pi}`;
          platVarNames.push(varName);
          lines.push(
            `const ${varName} = new Platform(${plt.x}, ${plt.y}, ${pw}, ${ph});`,
          );
        });
        const platformsArray = platVarNames
          .map((v, pi) => {
            const mode = platformLinks[pi]?.mode || "disappear";
            return `{ platform: ${v}, mode: "${mode}" }`;
          })
          .join(", ");
        lines.push(
          `const bpSys_${idx} = new ButtonPlatformLinkSystem({ button: bpBtn_${idx}, platforms: [${platformsArray}] }, collisionSystem, { startColorIndex: ${r.startColorIndex ?? idx} });`,
        );
      });
      lines.push("// bpBtn / bpPlat 需要加入 Room 实体列表");
      lines.push("// bpSys 需要在 update() 和 draw() 中调用");
    }

    return lines.join("\n");
  }

  /**
   * 生成代码并复制到剪贴板
   * @param {import('./EditorEntityManager.js').PlacedRecord[]} records
   * @returns {Promise<string>} 生成的代码
   */
  static async copyToClipboard(
    records,
    roomCount = 2,
    canvasWidth = 800,
    canvasHeight = 600,
    spawn = null,
  ) {
    const code = EditorExporter.generateCode(
      records,
      roomCount,
      canvasWidth,
      canvasHeight,
      spawn,
    );
    try {
      await navigator.clipboard.writeText(code);
    } catch (_e) {
      // 降级：使用旧版 API
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    return code;
  }
}
