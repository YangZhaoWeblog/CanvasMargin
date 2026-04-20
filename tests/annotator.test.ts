import { describe, it, expect } from "vitest";
import { annotateSelection, shouldSkipAnnotation, removeAnnotation } from "../src/annotator";

// Helper: new format mark tag
const NEW = (ancId: string, color: string, text: string) =>
  `<mark class="c${color}" id="anc-${ancId}">${text}</mark>`;
// Helper: old format mark tag (backward compat)
const OLD = (ancId: string, color: string, text: string) =>
  `<mark class="c${color} anc-${ancId}">${text}</mark>`;

describe("annotateSelection", () => {
  it("wraps plain selected text with mark tag (new id= format)", () => {
    const doc = "Hello world, this is a test.";
    const result = annotateSelection(doc, 13, 17, "5");
    expect(result.newDoc).toMatch(/<mark class="c5" id="anc-[A-Za-z0-9_-]{21}">this<\/mark>/);
    expect(result.ancId).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(result.newDoc).toContain("Hello world, ");
    expect(result.newDoc).toContain(" is a test.");
  });

  it("preserves multiline content around selection", () => {
    const doc = "Line 1\nLine 2\nLine 3";
    const result = annotateSelection(doc, 7, 13, "3");
    expect(result.newDoc).toContain("Line 1\n");
    expect(result.newDoc).toMatch(/<mark class="c3" id="anc-[A-Za-z0-9_-]{21}">Line 2<\/mark>/);
    expect(result.newDoc).toContain("\nLine 3");
  });

  it("generates unique IDs for different calls", () => {
    const doc = "Hello world";
    const r1 = annotateSelection(doc, 0, 5, "5");
    const r2 = annotateSelection(doc, 0, 5, "5");
    expect(r1.ancId).not.toBe(r2.ancId);
  });

  it("uses the specified color number", () => {
    const doc = "Hello world";
    const result = annotateSelection(doc, 0, 5, "1");
    expect(result.newDoc).toContain('class="c1"');
    expect(result.newDoc).toContain('id="anc-');
  });

  it("handles selection at start of document", () => {
    const doc = "Hello world";
    const result = annotateSelection(doc, 0, 5, "5");
    expect(result.newDoc).toMatch(/^<mark class="c5" id="anc-[A-Za-z0-9_-]{21}">Hello<\/mark> world$/);
  });

  it("handles selection at end of document", () => {
    const doc = "Hello world";
    const result = annotateSelection(doc, 6, 11, "5");
    expect(result.newDoc).toMatch(/^Hello <mark class="c5" id="anc-[A-Za-z0-9_-]{21}">world<\/mark>$/);
  });
});

describe("shouldSkipAnnotation", () => {
  it("returns false for plain text selection", () => {
    const doc = "Hello world this is text";
    expect(shouldSkipAnnotation(doc, 6, 11)).toBe(false);
  });

  it("returns true when selection is entirely inside a new-format mark", () => {
    const doc = `before ${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "selected text")} after`;
    const innerStart = doc.indexOf("selected");
    const innerEnd = innerStart + "selected".length;
    expect(shouldSkipAnnotation(doc, innerStart, innerEnd)).toBe(true);
  });

  it("returns true when selection is entirely inside an old-format mark (compat)", () => {
    const doc = `before ${OLD("V1StGXR8_Z5jdHi6B-myT", "5", "selected text")} after`;
    const innerStart = doc.indexOf("selected");
    const innerEnd = innerStart + "selected".length;
    expect(shouldSkipAnnotation(doc, innerStart, innerEnd)).toBe(true);
  });

  it("returns true when selection spans across a mark boundary (new format)", () => {
    const doc = `Hello ${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "world")} foo`;
    const from = 0;
    const to = doc.indexOf("world") + 3;
    expect(shouldSkipAnnotation(doc, from, to)).toBe(true);
  });

  it("returns false when selection is adjacent to a mark but not overlapping", () => {
    const doc = `Hello ${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "world")} foo`;
    const closingTag = doc.indexOf("</mark>");
    const from = closingTag + "</mark>".length;
    const to = from + 4;
    expect(shouldSkipAnnotation(doc, from, to)).toBe(false);
  });
});

describe("removeAnnotation", () => {
  it("removes a new-format mark tag when cursor is inside it", () => {
    const doc = `before ${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hello world")} after`;
    const innerStart = doc.indexOf("hello");
    const result = removeAnnotation(doc, innerStart, innerStart);
    expect(result).not.toBeNull();
    expect(result!.newDoc).toBe("before hello world after");
    expect(result!.from).toBe("before ".length);
    expect(result!.to).toBe("before hello world".length);
  });

  it("removes an old-format mark tag (backward compat)", () => {
    const doc = `before ${OLD("V1StGXR8_Z5jdHi6B-myT", "5", "hello world")} after`;
    const innerStart = doc.indexOf("hello");
    const result = removeAnnotation(doc, innerStart, innerStart);
    expect(result).not.toBeNull();
    expect(result!.newDoc).toBe("before hello world after");
  });

  it("removes a new-format mark when selection overlaps inner text", () => {
    const doc = `x ${NEW("abcdefghij1234567890A", "3", "foo bar")} y`;
    const innerStart = doc.indexOf("foo");
    const innerEnd = innerStart + 3;
    const result = removeAnnotation(doc, innerStart, innerEnd);
    expect(result).not.toBeNull();
    expect(result!.newDoc).toBe("x foo bar y");
  });

  it("returns null when cursor is not inside any mark", () => {
    expect(removeAnnotation("plain text without any marks", 5, 5)).toBeNull();
  });

  it("returns null when cursor is after a mark", () => {
    const doc = `${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hi")} after`;
    const afterMark = doc.indexOf(" after") + 1;
    expect(removeAnnotation(doc, afterMark, afterMark)).toBeNull();
  });
});
