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
