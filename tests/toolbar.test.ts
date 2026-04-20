import { describe, it, expect } from "vitest";
import { getToolbarAction } from "../src/toolbar";

// New format: id="anc-xxx"
const NEW = (ancId: string, color: string, text: string) =>
  `<mark class="c${color}" id="anc-${ancId}">${text}</mark>`;
// Old format: class="cN anc-xxx"
const OLD = (ancId: string, color: string, text: string) =>
  `<mark class="c${color} anc-${ancId}">${text}</mark>`;

describe("getToolbarAction", () => {
  it("returns 'annotate' for a plain text selection", () => {
    expect(getToolbarAction("Hello world this is plain text", 6, 11)).toBe("annotate");
  });

  it("returns 'remove' when cursor is inside a new-format mark", () => {
    const doc = `before ${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hello")} after`;
    const innerPos = doc.indexOf("hello") + 2;
    expect(getToolbarAction(doc, innerPos, innerPos)).toBe("remove");
  });

  it("returns 'remove' when cursor is inside an old-format mark (compat)", () => {
    const doc = `before ${OLD("V1StGXR8_Z5jdHi6B-myT", "5", "hello")} after`;
    const innerPos = doc.indexOf("hello") + 2;
    expect(getToolbarAction(doc, innerPos, innerPos)).toBe("remove");
  });

  it("returns null for empty selection outside any mark", () => {
    expect(getToolbarAction("Hello world", 5, 5)).toBeNull();
  });

  it("returns 'remove' when selection spans part of a new-format mark's inner text", () => {
    const doc = NEW("abcdefghij1234567890A", "3", "foo bar");
    const innerStart = doc.indexOf("foo");
    expect(getToolbarAction(doc, innerStart, innerStart + 3)).toBe("remove");
  });

  it("returns 'remove' when cursor is at the very start of the opening tag (new format)", () => {
    const doc = `before ${NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hello")} after`;
    const openStart = doc.indexOf("<mark");
    expect(getToolbarAction(doc, openStart, openStart)).toBe("remove");
  });

  it("returns 'remove' when cursor is at the very start of the opening tag (old format)", () => {
    const doc = `before ${OLD("V1StGXR8_Z5jdHi6B-myT", "5", "hello")} after`;
    const openStart = doc.indexOf("<mark");
    expect(getToolbarAction(doc, openStart, openStart)).toBe("remove");
  });

  it("returns 'remove' when selection covers the entire new-format mark tag", () => {
    const doc = NEW("V1StGXR8_Z5jdHi6B-myT", "5", "hello");
    expect(getToolbarAction(doc, 0, doc.length)).toBe("remove");
  });
});
