import { nanoid } from "nanoid";
import { buildMarkTag } from "./models";

export interface AnnotationResult {
  newDoc: string;
  ancId: string;
  selectedText: string;
}

export function annotateSelection(
  doc: string,
  from: number,
  to: number,
  color: string,
): AnnotationResult {
  const selectedText = doc.slice(from, to);
  const ancId = nanoid();
  const markTag = buildMarkTag(selectedText, color, ancId);
  const newDoc = doc.slice(0, from) + markTag + doc.slice(to);
  return { newDoc, ancId, selectedText };
}

/**
 * Returns true if the selection [from, to) overlaps with an existing <mark> tag,
 * meaning the selection should NOT be re-annotated.
 *
 * Supports both new (id="anc-xxx") and old (class="cN anc-xxx") formats.
 */
export function shouldSkipAnnotation(doc: string, from: number, to: number): boolean {
  // Match both new format (id=) and old format (class=) mark tags
  const openRe = /<mark\s[^>]*>/g;
  const closeStr = "</mark>";

  let m: RegExpExecArray | null;
  while ((m = openRe.exec(doc)) !== null) {
    const openStart = m.index;
    const openEnd = openStart + m[0].length;
    // Find the corresponding </mark>
    const closeStart = doc.indexOf(closeStr, openEnd);
    if (closeStart === -1) continue;
    const closeEnd = closeStart + closeStr.length;

    // Case 1: selection is entirely within the inner text (openEnd..closeStart)
    if (from >= openEnd && to <= closeStart) return true;

    // Case 2: selection partially overlaps the opening tag region (openStart..openEnd)
    if (from < openEnd && to > openStart) return true;

    // Case 3: selection partially overlaps the closing tag region (closeStart..closeEnd)
    if (from < closeEnd && to > closeStart) return true;
  }

  return false;
}

export interface RemoveResult {
  newDoc: string;
  from: number; // start of plain text in new doc
  to: number;   // end of plain text in new doc
}

/**
 * Find the <mark> tag containing the cursor/selection [from, to) and strip it.
 * Returns null if no mark contains the position.
 */
export function removeAnnotation(doc: string, from: number, to: number): RemoveResult | null {
  const openRe = /<mark\s[^>]*>/g;
  const closeStr = "</mark>";

  let m: RegExpExecArray | null;
  while ((m = openRe.exec(doc)) !== null) {
    const openStart = m.index;
    const openEnd = openStart + m[0].length;
    const closeStart = doc.indexOf(closeStr, openEnd);
    if (closeStart === -1) continue;
    const closeEnd = closeStart + closeStr.length;

    // Match: selection within inner text, OR selection overlaps the mark tag itself
    const withinInner = from >= openEnd && to <= closeStart;
    const overlapsTag = from < closeEnd && to > openStart;
    if (withinInner || overlapsTag) {
      const innerText = doc.slice(openEnd, closeStart);
      const newDoc = doc.slice(0, openStart) + innerText + doc.slice(closeEnd);
      return {
        newDoc,
        from: openStart,
        to: openStart + innerText.length,
      };
    }
  }
  return null;
}
