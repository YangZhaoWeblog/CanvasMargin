import { describe, it, expect } from "vitest";
import { scanFileAncs, scanCanvasAncs, computeSyncDiff, nextNodeY } from "../src/syncer";

describe("scanFileAncs", () => {
  it("extracts all anc IDs and their text from a markdown string", () => {
    const md = [
      'Some text before',
      '<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">highlighted one</mark>',
      'middle text',
      '<mark class="c3 anc-abcdefghij1234567890A">highlighted two</mark>',
      'end text',
    ].join("\n");
    const result = scanFileAncs(md);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ ancId: "V1StGXR8_Z5jdHi6B-myT", text: "highlighted one" });
    expect(result[1]).toEqual({ ancId: "abcdefghij1234567890A", text: "highlighted two" });
  });

  it("returns empty array when no marks", () => {
    expect(scanFileAncs("plain text")).toEqual([]);
  });

  it("handles mark tag spanning multiple words", () => {
    const md = '<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">hello world foo</mark>';
    const result = scanFileAncs(md);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("hello world foo");
  });
});

describe("scanCanvasAncs", () => {
  it("extracts anc IDs from Canvas node data", () => {
    const nodes = [
      { id: "n1", type: "text", text: 'hello\n<!--card:{"anc":"abc12345678901234567"}-->', x: 0, y: 0, width: 300, height: 100 },
      { id: "n2", type: "text", text: 'no anchor here', x: 0, y: 100, width: 300, height: 100 },
      { id: "n3", type: "text", text: '<!--card:{"anc":"def12345678901234567","id":99}-->', x: 0, y: 200, width: 300, height: 100 },
    ];
    const result = scanCanvasAncs(nodes);
    expect(result).toEqual(
      new Map([
        ["abc12345678901234567", { nodeId: "n1", y: 0, height: 100 }],
        ["def12345678901234567", { nodeId: "n3", y: 200, height: 100 }],
      ])
    );
  });

  it("returns empty map when no ancs", () => {
    const nodes = [{ id: "n1", type: "text", text: "plain", x: 0, y: 0, width: 300, height: 100 }];
    expect(scanCanvasAncs(nodes).size).toBe(0);
  });
});

describe("computeSyncDiff", () => {
  it("identifies new ancs that need Canvas nodes", () => {
    const vaultAncs = [
      { ancId: "aaa12345678901234567", text: "text A", sourcePath: "note1.md" },
      { ancId: "bbb12345678901234567", text: "text B", sourcePath: "note1.md" },
      { ancId: "ccc12345678901234567", text: "text C", sourcePath: "note2.md" },
    ];
    const canvasAncs = new Map([["aaa12345678901234567", { nodeId: "n1", y: 0, height: 100 }]]);
    const diff = computeSyncDiff(vaultAncs, canvasAncs);
    expect(diff.toCreate).toHaveLength(2);
    expect(diff.toCreate[0].ancId).toBe("bbb12345678901234567");
    expect(diff.toCreate[1].ancId).toBe("ccc12345678901234567");
    expect(diff.orphanCount).toBe(0);
  });

  it("counts orphans: canvas has anc not in vault", () => {
    const vaultAncs = [{ ancId: "aaa12345678901234567", text: "text A", sourcePath: "note1.md" }];
    const canvasAncs = new Map([
      ["aaa12345678901234567", { nodeId: "n1", y: 0, height: 100 }],
      ["zzz12345678901234567", { nodeId: "n2", y: 100, height: 100 }],
    ]);
    const diff = computeSyncDiff(vaultAncs, canvasAncs);
    expect(diff.toCreate).toHaveLength(0);
    expect(diff.orphanCount).toBe(1);
  });

  it("returns empty when fully synced", () => {
    const vaultAncs = [{ ancId: "aaa12345678901234567", text: "text A", sourcePath: "note1.md" }];
    const canvasAncs = new Map([["aaa12345678901234567", { nodeId: "n1", y: 0, height: 100 }]]);
    const diff = computeSyncDiff(vaultAncs, canvasAncs);
    expect(diff.toCreate).toHaveLength(0);
    expect(diff.orphanCount).toBe(0);
  });
});

describe("nextNodeY", () => {
  it("returns 0 when no existing nodes", () => {
    expect(nextNodeY(new Map(), 20)).toBe(0);
  });

  it("returns maxBottom + gap", () => {
    const canvasAncs = new Map([
      ["a".repeat(21), { nodeId: "n1", y: 0, height: 100 }],
      ["b".repeat(21), { nodeId: "n2", y: 120, height: 100 }],
    ]);
    expect(nextNodeY(canvasAncs, 20)).toBe(240);
  });
});
