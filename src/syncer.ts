import {
  ANC_ID_RE_GLOBAL,
  ANC_CLASS_RE_GLOBAL,
  readMarginMeta,
  NODE_WIDTH,
  NODE_HEIGHT,
} from "./models";
import type { Canvas, CanvasNodeData } from "./canvas";

export interface FileAnc {
  ancId: string;
  text: string;
}

export interface VaultAnc extends FileAnc {
  sourcePath: string;
}

export interface CanvasAncInfo {
  nodeId: string;
  y: number;
  height: number;
}

export interface SyncDiff {
  toCreate: VaultAnc[];
  orphanCount: number;
}

/**
 * Scan a single md file's content for all annotated marks.
 * Supports both new format (id="anc-xxx") and old format (class="cN anc-xxx").
 */
export function scanFileAncs(content: string): FileAnc[] {
  const results: FileAnc[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  // New format: id="anc-xxx"
  const reNew = new RegExp(ANC_ID_RE_GLOBAL.source, "g");
  while ((m = reNew.exec(content)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); results.push({ ancId: m[1], text: m[2] }); }
  }
  // Old format: class="cN anc-xxx" (backward compat)
  const reOld = new RegExp(ANC_CLASS_RE_GLOBAL.source, "g");
  while ((m = reOld.exec(content)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); results.push({ ancId: m[1], text: m[2] }); }
  }
  return results;
}

/** Scan a Canvas JSON string for all anc IDs. Returns a Set of ancIds.
 * Safe: returns empty Set on malformed JSON. */
export function scanCanvasJsonAncs(json: string): Set<string> {
  const result = new Set<string>();
  try {
    const data = JSON.parse(json);
    const nodes: any[] = data.nodes ?? [];
    for (const node of nodes) {
      if (node.type !== "text") continue;
      const anc = typeof node.canvasMargin?.anc === "string" ? node.canvasMargin.anc : null;
      if (anc) result.add(anc);
    }
  } catch {
    // Malformed JSON — return empty set
  }
  return result;
}

/** Scan Canvas node data for all anc IDs from canvasMargin metadata. */
export function scanCanvasAncs(
  nodes: CanvasNodeData[]
): Map<string, CanvasAncInfo> {
  const result = new Map<string, CanvasAncInfo>();
  for (const node of nodes) {
    if (node.type !== "text") continue;
    const anc = readMarginMeta(node);
    if (anc) {
      result.set(anc, { nodeId: node.id, y: node.y, height: node.height });
    }
  }
  return result;
}

/** Compute which vault ancs need new Canvas nodes, and count orphans. */
export function computeSyncDiff(
  vaultAncs: VaultAnc[],
  canvasAncs: Map<string, CanvasAncInfo>,
): SyncDiff {
  const vaultAncIds = new Set(vaultAncs.map((a) => a.ancId));
  const toCreate = vaultAncs.filter((a) => !canvasAncs.has(a.ancId));
  let orphanCount = 0;
  for (const ancId of canvasAncs.keys()) {
    if (!vaultAncIds.has(ancId)) orphanCount++;
  }
  return { toCreate, orphanCount };
}

/** Calculate the Y position for the next new node based on existing Canvas nodes. */
export function nextNodeY(canvasAncs: Map<string, CanvasAncInfo>, gap: number): number {
  let maxBottom = 0;
  for (const info of canvasAncs.values()) {
    const bottom = info.y + info.height;
    if (bottom > maxBottom) maxBottom = bottom;
  }
  return maxBottom > 0 ? maxBottom + gap : 0;
}

/** Create Canvas nodes for the given anchors. */
export function createNodes(
  canvas: Canvas,
  toCreate: VaultAnc[],
  startY: number,
  color: string,
  gap: number,
): number {
  let y = startY;
  for (const anc of toCreate) {
    const node = canvas.createTextNode({
      pos: { x: 0, y },
      size: { width: NODE_WIDTH, height: NODE_HEIGHT },
      text: anc.text,
      color,
    });
    node.setData({ ...node.getData(), canvasMargin: { anc: anc.ancId } });
    y += NODE_HEIGHT + gap;
  }
  canvas.requestSave();
  return toCreate.length;
}
