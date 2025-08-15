import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

const RAW_FIXTURE: any = {
  version: "perception-2025-08-10",
  image: { w: 100, h: 100 },
  texts: [
    { id: "t1", text: "Play", bbox: [10, 70, 20, 10], conf: 0.9, approxSizePx: 12 },
  ],
  buttons: [
    { id: "b_bad", bbox: [0, 0, 100, 100], cornerRadius: 0, hasCenterText: false, textId: null },
  ],
  blocks: [
    { id: "blk_full", bbox: [0, 0, 100, 100], kind: "section" },
  ],
  contrast: [],
};

beforeEach(() => {
  // @ts-ignore
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => RAW_FIXTURE }));
});

describe("/api/perception/analyze route", () => {
  it("applies strict postprocess by default", async () => {
    const req = new NextRequest("http://test/api/perception/analyze", { method: "POST", body: JSON.stringify(RAW_FIXTURE) });
    const res = await POST(req as any);
    const json: any = await (res as any).json();
    expect((res as any).status).toBe(200);
    expect(Array.isArray(json.buttons)).toBe(true);
    expect(Array.isArray(json.sections)).toBe(true);
    // filtered: fewer buttons than raw fullscreen junk
    expect(json.buttons.length).toBeLessThanOrEqual(RAW_FIXTURE.buttons.length);
    // sections should not include fullscreen 100x100
    const imageArea = RAW_FIXTURE.image.w * RAW_FIXTURE.image.h;
    const hasFullscreen = (json.sections || []).some((s: any) => (s.bbox[2] * s.bbox[3]) / imageArea > 0.7);
    expect(hasFullscreen).toBe(false);
  });

  it("returns raw when ?raw=1", async () => {
    const req = new NextRequest("http://test/api/perception/analyze?raw=1", { method: "POST", body: JSON.stringify(RAW_FIXTURE) });
    const res = await POST(req as any);
    const json: any = await (res as any).json();
    expect(json.buttons).toEqual(RAW_FIXTURE.buttons);
    expect((json.blocks ?? json.sections)).toEqual(RAW_FIXTURE.blocks);
  });
});


