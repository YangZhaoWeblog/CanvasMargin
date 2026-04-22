import { describe, it, expect } from "vitest";
import { findAncInCanvasJson, findAncInMdContent } from "../src/jumper";

describe("findAncInCanvasJson", () => {
  it("finds the node ID containing the given anc", () => {
    const json = JSON.stringify({
      nodes: [
        { id: "n1", type: "text", text: "hello", canvasMargin: { anc: "abc12345678901234567" }, x: 0, y: 0, width: 300, height: 100 },
        { id: "n2", type: "text", text: "no anchor", x: 0, y: 100, width: 300, height: 100 },
      ],
      edges: [],
    });
    const result = findAncInCanvasJson(json, "abc12345678901234567");
    expect(result).not.toBeNull();
    expect(result!.nodeId).toBe("n1");
  });

  it("returns null when anc not found", () => {
    const json = JSON.stringify({ nodes: [], edges: [] });
    expect(findAncInCanvasJson(json, "abc12345678901234567")).toBeNull();
  });
});

describe("findAncInMdContent", () => {
  it("finds the character offset of the mark tag", () => {
    const md = 'line 1\n<mark class="c5 anc-abc12345678901234567">hi</mark>\nline 3';
    const result = findAncInMdContent(md, "abc12345678901234567");
    expect(result).not.toBeNull();
    expect(result!.offset).toBe(7);
  });

  it("returns null when anc not found", () => {
    expect(findAncInMdContent("plain text", "abc12345678901234567")).toBeNull();
  });
});
