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
  ) {
    if (records.length === 0) return "// 没有放置任何实体";

    const lines = [];
    lines.push("// ── 编辑器导出的实体 ──────────────────────────────────");
    lines.push("//");
    lines.push(`// 房间数量: ${roomCount}`);
    for (let i = 0; i < roomCount; i++) {
      lines.push(
        `//   Room ${i}: x ∈ [${i * canvasWidth}, ${(i + 1) * canvasWidth})`,
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
        lines.push(`new ${g.ctor}(${e.x}, ${e.y}, ${w}, ${h}),`);
      }
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
  ) {
    const code = EditorExporter.generateCode(
      records,
      roomCount,
      canvasWidth,
      canvasHeight,
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
