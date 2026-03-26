/**
 * EditorExporter — 将编辑器放置的实体导出为可粘贴的代码
 *
 * 生成的代码格式完全匹配项目现有实体构造方式：
 *   new Ground(x, y, w, h)
 *   new Portal(x, y, w, h)
 */

import { EntityTool } from "./EditorConfig.js";

export class EditorExporter {
  /**
   * 将放置列表转换为代码字符串
   * @param {import('./EditorEntityManager.js').PlacedEntity[]} entities
   * @returns {string}
   */
  static generateCode(entities) {
    if (entities.length === 0) return "// 没有放置任何实体";

    const lines = [];
    lines.push("// ── 编辑器导出的实体 ──────────────────────────────────");

    const grounds = entities.filter((e) => e.tool === EntityTool.GROUND);
    const portals = entities.filter((e) => e.tool === EntityTool.PORTAL);

    if (grounds.length > 0) {
      lines.push("");
      lines.push("// Ground");
      for (const g of grounds) {
        lines.push(`new Ground(${g.x}, ${g.y}, ${g.w}, ${g.h}),`);
      }
    }

    if (portals.length > 0) {
      lines.push("");
      lines.push("// Portal");
      for (const pt of portals) {
        lines.push(`new Portal(${pt.x}, ${pt.y}, ${pt.w}, ${pt.h}),`);
      }
    }

    return lines.join("\n");
  }

  /**
   * 生成代码并复制到剪贴板
   * @param {import('./EditorEntityManager.js').PlacedEntity[]} entities
   * @returns {Promise<string>} 生成的代码
   */
  static async copyToClipboard(entities) {
    const code = EditorExporter.generateCode(entities);
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
