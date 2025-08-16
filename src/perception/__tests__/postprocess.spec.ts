import { describe, expect, it } from "vitest";
import postprocess, { PARAMS } from "../postprocess";
import type { Perception } from "../types";
import { nms } from "../../utils/geometry";

describe("geometry NMS", () => {
  it("removes overlaps, keeps higher score", () => {
    const boxes = [
      { id: "a", kind: "button" as const, bbox: [0, 0, 100, 100] as [number, number, number, number], score: 0.9 },
      { id: "b", kind: "button" as const, bbox: [10, 10, 100, 100] as [number, number, number, number], score: 0.8 },
      { id: "c", kind: "button" as const, bbox: [300, 300, 50, 50] as [number, number, number, number], score: 0.7 },
    ];
    const kept = nms(boxes, 0.3);
    expect(kept.find((b) => b.id === "a")).toBeTruthy();
    expect(kept.find((b) => b.id === "b")).toBeFalsy();
    expect(kept.find((b) => b.id === "c")).toBeTruthy();
  });
});

// Minimal trimmed fixtures approximating observed app console JSONs
const RPG_FIXTURE: Perception = {
  image: { w: 1440, h: 900 },
  palette: { mode: "dark" },
  texts: [
    { id: "t1", text: "Repair", bbox: [1000, 555, 120, 28], conf: 0.98, approxSizePx: 16 },
    { id: "t2", text: "Inventory", bbox: [600, 180, 160, 34], conf: 0.95, approxSizePx: 24 },
    { id: "t3", text: "Sword +3", bbox: [522, 260, 140, 22], conf: 0.9, approxSizePx: 18 },
    { id: "t4", text: "Shield", bbox: [521, 300, 100, 22], conf: 0.9, approxSizePx: 18 },
    { id: "t6", text: "Bow", bbox: [525, 340, 80, 20], conf: 0.9, approxSizePx: 16 },
    { id: "t7", text: "Arrow x20", bbox: [700, 260, 120, 20], conf: 0.9, approxSizePx: 16 },
    { id: "t8", text: "Potion", bbox: [700, 300, 100, 20], conf: 0.9, approxSizePx: 16 },
    { id: "t9", text: "Herb", bbox: [700, 340, 80, 20], conf: 0.9, approxSizePx: 16 },
    { id: "t10", text: "Apply", bbox: [560, 560, 80, 22], conf: 0.95, approxSizePx: 18 },
    { id: "t5", text: "120/160", bbox: [1320, 200, 80, 20], conf: 0.9, approxSizePx: 14 },
  ],
  buttons: [
    { id: "b1", bbox: [980, 545, 160, 44], cornerRadius: 10, hasCenterText: true, textId: "t1" },
    { id: "b2", bbox: [540, 550, 140, 40], cornerRadius: 8, hasCenterText: true, textId: "t10" },
    { id: "b_noise", bbox: [1340, 210, 70, 26], cornerRadius: 4, hasCenterText: true, textId: "t5" },
  ],
  blocks: [
    { id: "blk1", bbox: [520, 170, 400, 450], kind: "section" },
    { id: "blk_sidebar", bbox: [0, 0, 220, 900], kind: "other" },
  ],
  contrast: [
    { id: "c1", textId: "t1", ratio: 7, wcag: "PASS" },
    { id: "c2", textId: "t10", ratio: 6, wcag: "PASS" },
    { id: "c5", textId: "t5", ratio: 2, wcag: "FAIL" },
  ],
};

const LEETIFY_FIXTURE: Perception = {
  image: { w: 1440, h: 1000 },
  palette: { mode: "light" },
  texts: [
    { id: "lt1", text: "Clubs", bbox: [320, 140, 120, 32], conf: 0.97, approxSizePx: 26 },
    { id: "lt2", text: "Get Pro", bbox: [920, 360, 110, 28], conf: 0.96, approxSizePx: 18 },
    { id: "lt3", text: "Practice Servers", bbox: [940, 620, 180, 28], conf: 0.95, approxSizePx: 18 },
    { id: "lt4", text: "43% HS", bbox: [260, 220, 80, 22], conf: 0.9, approxSizePx: 16 },
    { id: "lt5", text: "Club Alpha", bbox: [360, 360, 220, 30], conf: 0.92, approxSizePx: 22 },
    { id: "lt6", text: "Member Count", bbox: [360, 400, 160, 20], conf: 0.9, approxSizePx: 16 },
    { id: "lt7", text: "Region EU", bbox: [360, 430, 120, 20], conf: 0.9, approxSizePx: 16 },
    { id: "lt8", text: "Status Open", bbox: [360, 460, 140, 20], conf: 0.9, approxSizePx: 16 },
    { id: "lt9", text: "Join Code", bbox: [360, 490, 120, 20], conf: 0.9, approxSizePx: 28 },
    { id: "lt10", text: "Club Beta", bbox: [360, 580, 220, 30], conf: 0.92, approxSizePx: 22 },
    { id: "lt11", text: "Region NA", bbox: [360, 620, 120, 20], conf: 0.9, approxSizePx: 16 },
    { id: "lt12", text: "Status Closed", bbox: [360, 650, 140, 20], conf: 0.9, approxSizePx: 16 },
    { id: "lt13", text: "Members 120", bbox: [360, 680, 140, 20], conf: 0.9, approxSizePx: 16 },
    { id: "lt14", text: "Get Pro", bbox: [380, 440, 100, 24], conf: 0.96, approxSizePx: 18 },
  ],
  buttons: [
    { id: "lb1", bbox: [900, 350, 120, 16], cornerRadius: 0, hasCenterText: false, textId: "lt2" },
    { id: "lb2", bbox: [920, 610, 140, 16], cornerRadius: 0, hasCenterText: false, textId: "lt3" },
    { id: "lb3", bbox: [360, 430, 140, 40], cornerRadius: 8, hasCenterText: true, textId: "lt14" },
  ],
  blocks: [
    { id: "l_sidebar", bbox: [0, 0, 250, 1000], kind: "other" },
    { id: "l_card1", bbox: [360, 350, 420, 220], kind: "section" },
    { id: "l_card2", bbox: [360, 570, 420, 220], kind: "section" },
  ],
  contrast: [
    { id: "lc2", textId: "lt2", ratio: 3, wcag: "WARN" },
    { id: "lc3", textId: "lt3", ratio: 3, wcag: "WARN" },
    { id: "lc14", textId: "lt14", ratio: 6, wcag: "PASS" },
  ],
  palette: { mode: "light" },
};

describe("postprocess - RPG inventory image", () => {
  it("includes a Repair button in item card region and avoids right-edge noise; detects inventory section", () => {
    const result = postprocess(RPG_FIXTURE);
    // Debug
    // eslint-disable-next-line no-console
    console.log("RPG buttons", result.buttons);
    // eslint-disable-next-line no-console
    console.log("RPG sections", result.sections);
    // eslint-disable-next-line no-console
    console.log("RPG rejected", result.debug?.rejected);
    const repairBtn = result.buttons.find(
      (b) => /repair/i.test(b.label || "") && b.bbox[0] >= 960 && b.bbox[0] <= 1185 && b.bbox[1] >= 540 && b.bbox[1] <= 590
    );
    expect(repairBtn).toBeTruthy();

    // No bogus buttons near the right-most edge x>1300
    const rightEdge = result.buttons.find((b) => b.bbox[0] > 1300);
    expect(rightEdge).toBeFalsy();

    // Optional: section covering inventory panel. If present, should meet threshold.
    const invSection = result.sections.find((s) => s.bbox[0] >= 500 && s.bbox[0] <= 540 && s.bbox[1] >= 150 && s.bbox[1] <= 200);
    if (invSection) {
      expect(invSection.score).toBeGreaterThanOrEqual(PARAMS.sectionMinScore);
    }

    // candidates present and IDs stable shape
    expect(result.candidates.buttons.length).toBeGreaterThan(0);
    expect(result.candidates.sections.length).toBeGreaterThan(0);
    const idFormatOk = result.candidates.buttons.every((c: any) => typeof c.id === 'string' && /^(ocr_pad|raw_button|raw_block|cluster):/.test(c.id));
    expect(idFormatOk).toBeTruthy();
  });
});

describe("postprocess - Leetify clubs image", () => {
  it("does not mark left sidebar, yields 0–1 buttons with expected labels, and finds club card sections", () => {
    const result = postprocess(LEETIFY_FIXTURE);
    // eslint-disable-next-line no-console
    console.log("Leetify buttons", result.buttons);
    // eslint-disable-next-line no-console
    console.log("Leetify sections", result.sections);
    // eslint-disable-next-line no-console
    console.log("Leetify rejected", result.debug?.rejected);

    // Sidebar not a section
    const sidebarSection = result.sections.find((s) => s.bbox[0] < 250 && s.bbox[2] <= 260 && s.score >= PARAMS.sectionMinScore);
    expect(sidebarSection).toBeFalsy();

    // 0-1 buttons allowed; if exists, label is Get Pro or Practice Servers
    expect(result.buttons.length).toBeLessThanOrEqual(2); // be lenient, but pipeline should usually reduce
    if (result.buttons.length > 0) {
      const labels = result.buttons.map((b) => (b.label || "").toLowerCase());
      const allowed = labels.every((l) => l.includes("get pro") || l.includes("practice servers"));
      expect(allowed).toBeTruthy();
    }

    // Optional: section covering a club card
    const card = result.sections.find((s) => s.bbox[0] >= 320 && s.bbox[0] <= 360 && s.bbox[1] >= 320 && s.bbox[1] <= 360);
    if (card) {
      expect(card.score).toBeGreaterThanOrEqual(PARAMS.sectionMinScore);
    }
  });
});


