import { describe, it, expect } from "vitest";
import { annotateSelection } from "../src/annotator";

describe("annotateSelection", () => {
  it("wraps plain selected text with mark tag", () => {
    const doc = "Hello world, this is a test.";
    const result = annotateSelection(doc, 13, 17, "5");
    expect(result.newDoc).toMatch(/<mark class="c5 anc-[A-Za-z0-9_-]{21}">this<\/mark>/);
    expect(result.ancId).toMatch(/^[A-Za-z0-9_-]{21}$/);
    expect(result.newDoc).toContain("Hello world, ");
    expect(result.newDoc).toContain(" is a test.");
  });

  it("preserves multiline content around selection", () => {
    const doc = "Line 1\nLine 2\nLine 3";
    const result = annotateSelection(doc, 7, 13, "3");
    expect(result.newDoc).toContain("Line 1\n");
    expect(result.newDoc).toMatch(/<mark class="c3 anc-[A-Za-z0-9_-]{21}">Line 2<\/mark>/);
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
    expect(result.newDoc).toContain('class="c1 anc-');
  });

  it("handles selection at start of document", () => {
    const doc = "Hello world";
    const result = annotateSelection(doc, 0, 5, "5");
    expect(result.newDoc).toMatch(/^<mark class="c5 anc-[A-Za-z0-9_-]{21}">Hello<\/mark> world$/);
  });

  it("handles selection at end of document", () => {
    const doc = "Hello world";
    const result = annotateSelection(doc, 6, 11, "5");
    expect(result.newDoc).toMatch(/^Hello <mark class="c5 anc-[A-Za-z0-9_-]{21}">world<\/mark>$/);
  });
});
