import { describe, it, expect } from "vitest";
import {
  ANC_RE,
  ANC_CLASS_RE,
  CARD_META_RE,
  NODE_GAP,
  NODE_WIDTH,
  extractAncFromClass,
  extractAncFromMeta,
  buildMarkTag,
  buildNodeText,
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

describe("extractAncFromMeta", () => {
  it("extracts anc from card metadata", () => {
    const text = 'hello\n<!--card:{"anc":"abc123def456789012345"}-->';
    expect(extractAncFromMeta(text)).toBe("abc123def456789012345");
  });

  it("returns null when no anc field", () => {
    const text = 'hello\n<!--card:{"id":123}-->';
    expect(extractAncFromMeta(text)).toBeNull();
  });

  it("returns null when no metadata", () => {
    expect(extractAncFromMeta("plain text")).toBeNull();
  });
});

describe("buildMarkTag", () => {
  it("wraps text with mark tag using id= attribute (new format)", () => {
    const result = buildMarkTag("hello world", "5", "V1StGXR8_Z5jdHi6B-myT");
    expect(result).toBe('<mark class="c5" id="anc-V1StGXR8_Z5jdHi6B-myT">hello world</mark>');
  });
});

describe("buildNodeText", () => {
  it("creates node text with anchor metadata", () => {
    const result = buildNodeText("hello world", "V1StGXR8_Z5jdHi6B-myT");
    expect(result).toBe('hello world\n<!--card:{"anc":"V1StGXR8_Z5jdHi6B-myT"}-->');
  });
});

describe("DEFAULT_SETTINGS", () => {
  it("has correct defaults", () => {
    expect(DEFAULT_SETTINGS.annotationColor).toBe("5");
    expect(DEFAULT_SETTINGS.nodeGap).toBe(20);
  });
});
