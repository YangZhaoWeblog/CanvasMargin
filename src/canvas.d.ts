// Minimal type declarations for Obsidian Canvas internal API.
// Based on obsidian-advanced-canvas. These are undocumented APIs.

import { ItemView } from "obsidian";

export interface CanvasView extends ItemView {
  canvas: Canvas;
}

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

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
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  getData(): CanvasNodeData;
  getBBox(): BBox;
}

export interface Canvas {
  nodes: Map<string, CanvasNode>;
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
