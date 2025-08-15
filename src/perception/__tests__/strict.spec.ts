import { describe, it, expect } from "vitest";
import { postprocess } from "../../perception/postprocess";
// @ts-ignore - JSON fixtures
import rpg from "./__fixtures__/rpg-inventory.json";
// @ts-ignore - JSON fixtures
import leetify from "./__fixtures__/leetify-clubs.json";

describe("strict perception", () => {
  it("ignores left sidebar and top bar on Leetify", () => {
    const out = postprocess(leetify as any);
    for (const b of out.buttons) {
      expect(b.bbox[0]).toBeGreaterThan(160);
      expect(b.bbox[1]).toBeGreaterThan(72);
    }
    for (const s of out.blocks || []) {
      expect(s.bbox[0]).toBeGreaterThan(160);
      expect(s.bbox[1]).toBeGreaterThan(72);
    }
  });

  it("does not convert long sentences to buttons; still keeps real CTAs", () => {
    const out = postprocess(rpg as any);
    const labels = new Set(out.texts?.map((t: any) => t.text ?? ""));
    const hasRepair = out.buttons.some((b) => (b.textId && labels.has("Repair")) || /repair/i.test(b.label ?? ""));
    expect(hasRepair).toBe(true);
    const longText = (rpg as any).texts.find((t: any) => /These pants look great/.test(t.text));
    if (longText) {
      const [x, y, w, h] = longText.bbox as [number, number, number, number];
      const center: [number, number] = [x + w / 2, y + h / 2];
      const hit = out.buttons.some((b) => {
        const [bx, by, bw, bh] = b.bbox as [number, number, number, number];
        return center[0] >= bx && center[0] <= bx + bw && center[1] >= by && center[1] <= by + bh;
      });
      expect(hit).toBe(false);
    }
  });

  it("rejects full-viewport section; allows at most one card or abstains", () => {
    const out = postprocess(rpg as any);
    const imageArea = (rpg as any).image.w * (rpg as any).image.h;
    const huge = (out.blocks || []).some((s) => (s.bbox[2] * s.bbox[3]) / imageArea > 0.7);
    expect(huge).toBe(false);
    expect((out.blocks || []).length).toBeLessThanOrEqual(1);
  });
});


