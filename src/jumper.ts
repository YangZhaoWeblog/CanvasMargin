import { readMarginMeta } from "./models";

export interface CanvasSearchResult {
  nodeId: string;
}

export interface MdSearchResult {
  offset: number;
}

/** Search a Canvas JSON string for a node containing the given anc ID. */
export function findAncInCanvasJson(json: string, ancId: string): CanvasSearchResult | null {
  try {
    const data = JSON.parse(json);
    const nodes: any[] = data.nodes ?? [];
    for (const node of nodes) {
      if (node.type !== "text") continue;
      const anc = readMarginMeta(node);
      if (anc === ancId) {
        return { nodeId: node.id };
      }
    }
  } catch {
    // Invalid JSON, skip
  }
  return null;
}

/** Search md content for a <mark> tag with the given anc ID. Returns the character offset. */
export function findAncInMdContent(content: string, ancId: string): MdSearchResult | null {
  const pattern = `anc-${ancId}`;
  const idx = content.indexOf(pattern);
  if (idx === -1) return null;
  const markStart = content.lastIndexOf("<mark", idx);
  if (markStart === -1) return null;
  return { offset: markStart };
}
