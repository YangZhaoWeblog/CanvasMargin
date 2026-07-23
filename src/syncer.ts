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

/** 1. 带来源文件路径的 Markdown anchor，用于同步到 Canvas。 */
export interface VaultAnc extends FileAnc {
  sourcePath: string;
}

/** 2. Canvas 中已有 anchor 的最小信息：节点 id 和纵向占位。 */
export interface CanvasAncInfo {
  nodeId: string;
  y: number;
  height: number;
}

/** 3. 同步差异：需要创建的节点，以及 Canvas 里找不到 Markdown 来源的孤儿数量。 */
export interface SyncDiff {
  toCreate: VaultAnc[];
  orphanCount: number;
}

/**
 * 4. 扫描单个 Markdown 文件里的所有摘录 mark。
 * 新格式 id="anc-xxx" 优先；旧格式 class="... anc-xxx" 只做兼容读取。
 */
export function scanFileAncs(content: string): FileAnc[] {
  // 1. seen 用来避免同一个 anc 同时被新旧正则重复收集。
  const results: FileAnc[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  // 2. 先扫新格式：这是当前写入格式。
  const reNew = new RegExp(ANC_ID_RE_GLOBAL.source, "g");
  while ((m = reNew.exec(content)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); results.push({ ancId: m[1], text: m[2] }); }
  }
  // 3. 再扫旧格式：历史数据仍能同步。
  const reOld = new RegExp(ANC_CLASS_RE_GLOBAL.source, "g");
  while ((m = reOld.exec(content)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); results.push({ ancId: m[1], text: m[2] }); }
  }
  return results;
}

/**
 * 5. 从持久化的 .canvas JSON 字符串里扫描所有 CanvasMargin anchor。
 * JSON 损坏时返回空集合，避免同步流程直接崩掉。
 */
export function scanCanvasJsonAncs(json: string): Set<string> {
  const result = new Set<string>();
  try {
    // 1. 只读取 text node；其他 Canvas 节点类型不属于本插件。
    const data = JSON.parse(json);
    const nodes: any[] = data.nodes ?? [];
    for (const node of nodes) {
      if (node.type !== "text") continue;
      // 2. 只认顶层 canvasMargin.anc，不从 node.text 里解析隐藏注释。
      const anc = typeof node.canvasMargin?.anc === "string" ? node.canvasMargin.anc : null;
      if (anc) result.add(anc);
    }
  } catch {
    // 3. 坏 JSON 当作没有可用 anchor。
  }
  return result;
}

/** 6. 从运行中的 Canvas node data 扫描 anchor，并保留节点位置。 */
export function scanCanvasAncs(
  nodes: CanvasNodeData[]
): Map<string, CanvasAncInfo> {
  const result = new Map<string, CanvasAncInfo>();
  for (const node of nodes) {
    // 1. 只处理插件创建的 text node。
    if (node.type !== "text") continue;
    const anc = readMarginMeta(node);
    if (anc) {
      // 2. y/height 用于后续计算新节点应该放在哪里。
      result.set(anc, { nodeId: node.id, y: node.y, height: node.height });
    }
  }
  return result;
}

/** 7. 计算同步差异：Markdown 有但 Canvas 没有的要创建，Canvas 有但 Markdown 没有的是孤儿。 */
export function computeSyncDiff(
  vaultAncs: VaultAnc[],
  canvasAncs: Map<string, CanvasAncInfo>,
): SyncDiff {
  // 1. Markdown anchor 集合是“应该存在”的来源。
  const vaultAncIds = new Set(vaultAncs.map((a) => a.ancId));
  // 2. Canvas 中缺失的 Markdown anchor，需要新建节点。
  const toCreate = vaultAncs.filter((a) => !canvasAncs.has(a.ancId));
  let orphanCount = 0;
  // 3. Canvas 中存在但 Markdown 中不存在的 anchor，计为孤儿。
  for (const ancId of canvasAncs.keys()) {
    if (!vaultAncIds.has(ancId)) orphanCount++;
  }
  return { toCreate, orphanCount };
}

/** 8. 根据现有 CanvasMargin 节点计算下一个新节点的 Y 坐标。 */
export function nextNodeY(canvasAncs: Map<string, CanvasAncInfo>, gap: number): number {
  // 1. 找到所有已同步节点的最低底边。
  let maxBottom = 0;
  for (const info of canvasAncs.values()) {
    const bottom = info.y + info.height;
    if (bottom > maxBottom) maxBottom = bottom;
  }
  // 2. 没有旧节点就从 0 开始；否则放在最低节点下方 gap 像素。
  return maxBottom > 0 ? maxBottom + gap : 0;
}

/** 9. 为缺失的 Markdown anchor 创建 Canvas text node。 */
export function createNodes(
  canvas: Canvas,
  toCreate: VaultAnc[],
  startY: number,
  color: string,
  gap: number,
): number {
  // 1. 从调用方算好的 startY 开始垂直排列。
  let y = startY;
  for (const anc of toCreate) {
    // 2. Canvas text 只放用户摘录文本；metadata 另写顶层 canvasMargin。
    const node = canvas.createTextNode({
      pos: { x: 0, y },
      size: { width: NODE_WIDTH, height: NODE_HEIGHT },
      text: anc.text,
      color,
    });
    node.setData({ ...node.getData(), canvasMargin: { anc: anc.ancId } });
    // 3. 下一个节点接在当前固定高度后面。
    y += NODE_HEIGHT + gap;
  }
  // 4. 统一请求 Canvas 保存，返回实际创建数量。
  canvas.requestSave();
  return toCreate.length;
}
