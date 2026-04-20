import { describe, it, expect } from "vitest";
import { getToolbarAction } from "../src/toolbar";

describe("getToolbarAction", () => {
  it("returns 'annotate' for a plain text selection", () => {
    const doc = "Hello world this is plain text";
    expect(getToolbarAction(doc, 6, 11)).toBe("annotate");
  });

  it("returns 'remove' when cursor is inside an existing mark", () => {
    const doc = 'before <mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">hello</mark> after';
    const innerPos = doc.indexOf("hello") + 2;
    expect(getToolbarAction(doc, innerPos, innerPos)).toBe("remove");
  });

  it("returns null for empty selection outside any mark", () => {
    const doc = "Hello world";
    expect(getToolbarAction(doc, 5, 5)).toBeNull();
  });

  it("returns 'remove' when selection spans part of a mark's inner text", () => {
    const doc = '<mark class="c3 anc-abcdefghij1234567890A">foo bar</mark>';
    const innerStart = doc.indexOf("foo");
    const innerEnd = innerStart + 3;
    expect(getToolbarAction(doc, innerStart, innerEnd)).toBe("remove");
  });

  it("returns 'remove' when cursor is at the very start of the opening tag", () => {
    // Regression: clicking a rendered mark in Live Preview lands cursor at openStart
    const doc = 'before <mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">hello</mark> after';
    const openStart = doc.indexOf("<mark");
    expect(getToolbarAction(doc, openStart, openStart)).toBe("remove");
  });

  it("returns 'remove' when selection covers the entire mark tag including brackets", () => {
    const doc = '<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">hello</mark>';
    expect(getToolbarAction(doc, 0, doc.length)).toBe("remove");
  });
});
