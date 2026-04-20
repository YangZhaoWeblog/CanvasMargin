/** Matches anc-{21 chars} in a class string. Group 1 = the nanoid. */
export const ANC_RE = /anc-([A-Za-z0-9_-]{21})/;

/** Matches a full <mark> tag with anc class. Group 1 = nanoid, Group 2 = inner text. */
export const ANC_CLASS_RE = /<mark\s+class="[^"]*anc-([A-Za-z0-9_-]{21})[^"]*">([\s\S]*?)<\/mark>/;

/** Global version for scanning all marks in a file. */
export const ANC_CLASS_RE_GLOBAL = /<mark\s+class="[^"]*anc-([A-Za-z0-9_-]{21})[^"]*">([\s\S]*?)<\/mark>/g;

/** Matches <!--card:{JSON}--> metadata. Group 1 = the JSON string. */
export const CARD_META_RE = /<!--card:(.*?)-->/;

/** Default gap between auto-placed nodes (px). */
export const NODE_GAP = 20;

/** Default width for auto-created nodes (px). */
export const NODE_WIDTH = 300;

/** Default height for auto-created nodes (px). */
export const NODE_HEIGHT = 100;

/** Extract anc ID from a class string like "c5 anc-xxx". Returns null if not found. */
export function extractAncFromClass(classStr: string): string | null {
  const m = classStr.match(ANC_RE);
  return m ? m[1] : null;
}

/** Extract anc field from <!--card:{...}--> metadata in text. Returns null if not found. */
export function extractAncFromMeta(text: string): string | null {
  const m = CARD_META_RE.exec(text);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    return typeof obj.anc === "string" ? obj.anc : null;
  } catch {
    return null;
  }
}

/** Build a <mark> tag string: `<mark class="cN anc-{id}">text</mark>` */
export function buildMarkTag(text: string, color: string, ancId: string): string {
  return `<mark class="c${color} anc-${ancId}">${text}</mark>`;
}

/** Build Canvas node text with anchor metadata appended. */
export function buildNodeText(text: string, ancId: string): string {
  return `${text}\n<!--card:${JSON.stringify({ anc: ancId })}-->`;
}

export interface PluginSettings {
  annotationColor: string; // "1"-"6"
  nodeGap: number;         // px between auto-placed nodes
  autoAnnotate: boolean;   // silent mode: mouseup with selection → annotate immediately
  autoSync: boolean;       // after annotating, sync to open Canvas immediately
}

export const DEFAULT_SETTINGS: PluginSettings = {
  annotationColor: "5",
  nodeGap: 20,
  autoAnnotate: false,
  autoSync: false,
};
