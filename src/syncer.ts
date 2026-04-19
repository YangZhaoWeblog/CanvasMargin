import {
  ANC_CLASS_RE_GLOBAL,
  extractAncFromMeta,
  buildNodeText,
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

/** Scan a single md file's content for all <mark class="cN anc-xxx">text</mark> entries. */
export function scanFileAncs(content: string): FileAnc[] {
  const results: FileAnc[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(ANC_CLASS_RE_GLOBAL.source, "g");
  while ((m = re.exec(content)) !== null) {
    results.push({ ancId: m[1], text: m[2] });
  }
  return results;
}

/** Scan Canvas node data for all anc IDs in <!--card:{...}--> metadata. */
export function scanCanvasAncs(
  nodes: Pick<CanvasNodeData, "id" | "type" | "text" | "y" | "height">[]
): Map<string, CanvasAncInfo> {
  const result = new Map<string, CanvasAncInfo>();
  for (const node of nodes) {
    if (node.type !== "text" || !node.text) continue;
    const anc = extractAncFromMeta(node.text);
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
    const text = buildNodeText(anc.text, anc.ancId);
    canvas.createTextNode({
      pos: { x: 0, y },
      size: { width: NODE_WIDTH, height: NODE_HEIGHT },
      text,
      color,
    });
    y += NODE_HEIGHT + gap;
  }
  canvas.requestSave();
  return toCreate.length;
}
