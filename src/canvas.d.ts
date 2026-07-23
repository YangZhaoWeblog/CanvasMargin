// 1. Obsidian Canvas 内部 API 的最小类型声明。
// 2. 这些 API 没有官方文档；这里只声明本插件实际用到的字段和方法。

import { ItemView } from "obsidian";

/** 3. Canvas view 暴露内部 canvas 对象，main.ts 通过它操作节点。 */
export interface CanvasView extends ItemView {
  canvas: Canvas;
}

/** 4. Canvas 节点的边界盒，用于 zoomToBbox 聚焦节点。 */
export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** 5. 持久化和运行时都会用到的 Canvas node data 形状。 */
export interface CanvasNodeData {
  id: string;
  type: string;
  text?: string;
  file?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  canvasMargin?: { anc: string };
}

/** 6. 运行时 Canvas node：可以读写 data，也能拿到边界盒。 */
export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  getData(): CanvasNodeData;
  setData(data: CanvasNodeData): void;
  getBBox(): BBox;
}

/** 7. 本插件使用到的 Canvas 实例能力：创建、保存、选择和缩放。 */
export interface Canvas {
  nodes: Map<string, CanvasNode>;
  selection: Set<CanvasNode>;
  createTextNode(options: {
    pos: { x: number; y: number };
    size: { width: number; height: number };
    text: string;
    focus?: boolean;
    color?: string;
  }): CanvasNode;
  addNode(node: CanvasNode): void;
  removeNode(node: CanvasNode): void;
  requestSave(): void;
  zoomToBbox(bbox: BBox): void;
  selectOnly(node: CanvasNode): void;
  getData(): { nodes: CanvasNodeData[]; edges: any[] };
}
