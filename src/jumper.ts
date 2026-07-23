import { readMarginMeta } from "./models";

export interface CanvasSearchResult {
  nodeId: string;
}

/** 1. Markdown 查找结果：offset 是目标 <mark> 在文档中的字符位置。 */
export interface MdSearchResult {
  offset: number;
}

/** 2. 在 .canvas JSON 中查找带指定 anc 的 text node。 */
export function findAncInCanvasJson(json: string, ancId: string): CanvasSearchResult | null {
  try {
    // 1. Canvas 文件本质是 JSON；这里只关心 nodes 数组。
    const data = JSON.parse(json);
    const nodes: any[] = data.nodes ?? [];
    for (const node of nodes) {
      // 2. 只查 text node，因为插件只创建 Canvas text node。
      if (node.type !== "text") continue;
      // 3. 只读顶层 canvasMargin metadata。
      const anc = readMarginMeta(node);
      if (anc === ancId) {
        return { nodeId: node.id };
      }
    }
  } catch {
    // 4. 坏 JSON 不阻断跳转，交给调用方继续找下一个 Canvas 文件。
  }
  return null;
}

/** 3. 在 Markdown 文本中查找指定 anc 所在的 <mark> 开始位置。 */
export function findAncInMdContent(content: string, ancId: string): MdSearchResult | null {
  // 1. 先定位 anc-xxx 字符串；新旧格式都会包含它。
  const pattern = `anc-${ancId}`;
  const idx = content.indexOf(pattern);
  if (idx === -1) return null;
  // 2. 再向前找最近的 <mark，返回的是整个 mark 的起点。
  const markStart = content.lastIndexOf("<mark", idx);
  if (markStart === -1) return null;
  return { offset: markStart };
}
