/** 1. 通用 anchor 匹配：从 id 或 class 里取出 21 位 nanoid。 */
export const ANC_RE = /anc-([A-Za-z0-9_-]{21})/;

/**
 * 2. 新格式 mark 匹配：只认 id="anc-xxx"。
 * 捕获 1 是 nanoid，捕获 2 是 mark 里的原文。
 */
export const ANC_ID_RE = /<mark\s[^>]*\bid="anc-([A-Za-z0-9_-]{21})"[^>]*>([\s\S]*?)<\/mark>/;

/** 3. 新格式的全局扫描版本：用于遍历一个 Markdown 文件里的所有 mark。 */
export const ANC_ID_RE_GLOBAL = /<mark\s[^>]*\bid="anc-([A-Za-z0-9_-]{21})"[^>]*>([\s\S]*?)<\/mark>/g;

/**
 * 4. 旧格式兼容：读取历史上写在 class 里的 `anc-xxx`。
 * 捕获 1 是 nanoid，捕获 2 是 mark 里的原文。
 */
export const ANC_CLASS_RE = /<mark\s+class="[^"]*anc-([A-Za-z0-9_-]{21})[^"]*">([\s\S]*?)<\/mark>/;

/** 5. 旧格式的全局扫描版本：只读旧数据，不再作为新写入格式。 */
export const ANC_CLASS_RE_GLOBAL = /<mark\s+class="[^"]*anc-([A-Za-z0-9_-]{21})[^"]*">([\s\S]*?)<\/mark>/g;

/** 6. 自动摆放 Canvas 节点时的默认垂直间距。 */
export const NODE_GAP = 20;

/** 7. 自动创建 Canvas text node 的默认宽度。 */
export const NODE_WIDTH = 300;

/** 8. 自动创建 Canvas text node 的默认高度。 */
export const NODE_HEIGHT = 100;

/** 9. 从新格式 id="anc-xxx" 中提取纯 nanoid；不匹配就返回 null。 */
export function extractAncFromId(idStr: string): string | null {
  const m = idStr.match(/^anc-([A-Za-z0-9_-]{21})$/);
  return m ? m[1] : null;
}

/**
 * 10. 从旧格式 class 中提取 nanoid；仅为兼容历史 mark 保留。
 * @deprecated 请使用 extractAncFromId；这里只为兼容历史 mark 保留。
 */
export function extractAncFromClass(classStr: string): string | null {
  const m = classStr.match(ANC_RE);
  return m ? m[1] : null;
}

/** 11. 构造新 mark：新写入永远使用 class 放颜色、id 放 anchor。 */
export function buildMarkTag(text: string, color: string, ancId: string): string {
  return `<mark class="c${color}" id="anc-${ancId}">${text}</mark>`;
}

/** 12. Canvas 节点顶层 metadata：只存 anchor，不混进 node.text。 */
export interface CanvasMarginMeta {
  anc: string;
}

/** 13. 读写 Canvas JSON 时使用的最小节点形状。 */
export interface RawNode {
  text?: string;
  canvasMargin?: CanvasMarginMeta;
  [key: string]: unknown;
}

/** 14. 安全读取 CanvasMargin metadata：类型不对就当没有 anchor。 */
export function readMarginMeta(node: { canvasMargin?: { anc?: unknown } }): string | null {
  const meta = node.canvasMargin;
  if (!meta || typeof meta.anc !== "string") return null;
  return meta.anc;
}

/** 15. 写入 CanvasMargin metadata：保留原节点字段，只覆盖 canvasMargin。 */
export function writeMarginMeta(node: RawNode, ancId: string): RawNode {
  return { ...node, canvasMargin: { anc: ancId } };
}

/** 16. 插件持久化设置：由 Obsidian loadData/saveData 保存。 */
export interface PluginSettings {
  annotationColor: string; // 颜色编号："1"-"6"。
  nodeGap: number;         // 自动摆放节点的垂直间距。
  autoAnnotate: boolean;   // 沉浸摘录：mouseup 有选区就直接写 mark。
  autoSync: boolean;       // 摘录后自动同步到打开的 Canvas。
}

/** 17. 默认设置：loadSettings 会用用户数据覆盖这些默认值。 */
export const DEFAULT_SETTINGS: PluginSettings = {
  annotationColor: "5",
  nodeGap: 20,
  autoAnnotate: false,
  autoSync: false,
};
