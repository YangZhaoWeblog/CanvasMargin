import { describe, it, expect } from "vitest";
import {
  ANC_RE,
  ANC_CLASS_RE,
  extractAncFromClass,
  buildMarkTag,
  readMarginMeta,
  writeMarginMeta,
  DEFAULT_SETTINGS,
} from "../src/models";

describe("ANC_RE", () => {
  it("matches a 21-char nanoid anchor in class string", () => {
    const cls = "c5 anc-V1StGXR8_Z5jdHi6B-myT";
    const m = cls.match(ANC_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("V1StGXR8_Z5jdHi6B-myT");
  });

  it("does not match short strings", () => {
    expect("c5 anc-short".match(ANC_RE)).toBeNull();
  });
});

describe("ANC_CLASS_RE", () => {
  it("matches mark tag with anc class in markdown source", () => {
    const md = '<mark class="c5 anc-V1StGXR8_Z5jdHi6B-myT">hello</mark>';
    const m = md.match(ANC_CLASS_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("V1StGXR8_Z5jdHi6B-myT");
    expect(m![2]).toBe("hello");
  });

  it("handles multiword content", () => {
    const md = '<mark class="c3 anc-abcdefghij1234567890A">some long text here</mark>';
    const m = md.match(ANC_CLASS_RE);
    expect(m).not.toBeNull();
    expect(m![2]).toBe("some long text here");
  });
});

describe("extractAncFromClass", () => {
  it("extracts anchor from class string", () => {
    expect(extractAncFromClass("c5 anc-V1StGXR8_Z5jdHi6B-myT")).toBe("V1StGXR8_Z5jdHi6B-myT");
  });

  it("returns null when no anchor", () => {
    expect(extractAncFromClass("c5")).toBeNull();
  });
});

describe("readMarginMeta", () => {
  it("returns ancId when canvasMargin field exists", () => {
    expect(readMarginMeta({ canvasMargin: { anc: "abc123" } })).toBe("abc123");
  });
  it("returns null when no canvasMargin field", () => {
    expect(readMarginMeta({})).toBeNull();
  });
  it("returns null when anc is wrong type", () => {
    expect(readMarginMeta({ canvasMargin: { anc: 123 } })).toBeNull();
  });
  it("returns null when canvasMargin is empty object", () => {
    expect(readMarginMeta({ canvasMargin: {} })).toBeNull();
  });
});

describe("writeMarginMeta", () => {
  it("adds canvasMargin to empty node", () => {
    const result = writeMarginMeta({}, "abc123");
    expect(result).toEqual({ canvasMargin: { anc: "abc123" } });
  });
  it("preserves existing fields", () => {
    const result = writeMarginMeta({ text: "hello", color: "5" }, "abc123");
    expect(result).toEqual({ text: "hello", color: "5", canvasMargin: { anc: "abc123" } });
  });
});

describe("buildMarkTag", () => {
  it("wraps text with mark tag using id= attribute (new format)", () => {
    const result = buildMarkTag("hello world", "5", "V1StGXR8_Z5jdHi6B-myT");
    expect(result).toBe('<mark class="c5" id="anc-V1StGXR8_Z5jdHi6B-myT">hello world</mark>');
  });
});

describe("DEFAULT_SETTINGS", () => {
  it("has correct defaults", () => {
    expect(DEFAULT_SETTINGS.annotationColor).toBe("5");
    expect(DEFAULT_SETTINGS.nodeGap).toBe(20);
  });
});
