import { describe, it, expect } from "vitest";
import { getToolbarAction } from "../src/toolbar";

// New format: id="anc-xxx"
const NEW = (ancId: string, color: string, text: string) =>
  `<mark class="c${color}" id="anc-${ancId}">${text}</mark>`;
// Old format: class="cN anc-xxx"
const OLD = (ancId: string, color: string, text: string) =>
  `<mark class="c${color} anc-${ancId}">${text}</mark>`;

describe("getToolbarAction", () => {
  // ── 无选区场景：一律返回 null ──

  it("returns null for cursor (no selection) in plain text", () => {
    expect(getToolbarAction("Hello world", 5, 5)).toBeNull();
  });

  it("returns null for cursor (no selection) inside a new-format mark", () => {
    const doc = `before ${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hello")} after`;
    const innerPos = doc.indexOf("hello") + 2;
    expect(getToolbarAction(doc, innerPos, innerPos)).toBeNull();
  });

  it("returns null for cursor (no selection) inside an old-format mark", () => {
    const doc = `before ${OLD("V1StGXR8_Z5jdHi6B-myT", "5", "hello")} after`;
    const innerPos = doc.indexOf("hello") + 2;
    expect(getToolbarAction(doc, innerPos, innerPos)).toBeNull();
  });

  it("returns null for cursor at the opening tag boundary", () => {
    const doc = `before ${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hello")} after`;
    const openStart = doc.indexOf("<mark");
    expect(getToolbarAction(doc, openStart, openStart)).toBeNull();
  });

  // ── 有选区场景：annotate 或 remove ──

  it("returns 'annotate' for a plain text selection", () => {
    expect(getToolbarAction("Hello world this is plain text", 6, 11)).toBe("annotate");
  });

  it("returns 'remove' when selection spans part of mark inner text (new format)", () => {
    const doc = NEW("abcdefghij1234567890A", "3", "foo bar");
    const innerStart = doc.indexOf("foo");
    expect(getToolbarAction(doc, innerStart, innerStart + 3)).toBe("remove");
  });

  it("returns 'remove' when selection spans part of mark inner text (old format)", () => {
    const doc = OLD("abcdefghij1234567890A", "3", "foo bar");
    const innerStart = doc.indexOf("foo");
    expect(getToolbarAction(doc, innerStart, innerStart + 3)).toBe("remove");
  });

  it("returns 'remove' when selection covers the entire mark tag", () => {
    const doc = NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hello");
    expect(getToolbarAction(doc, 0, doc.length)).toBe("remove");
  });

  it("returns 'annotate' for selection after a mark tag", () => {
    const doc = `${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hello")} some plain text`;
    const afterMark = doc.indexOf(" some plain");
    expect(getToolbarAction(doc, afterMark + 1, afterMark + 5)).toBe("annotate");
  });
});
