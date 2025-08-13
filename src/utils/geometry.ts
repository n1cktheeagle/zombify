// Geometry utilities for box operations
// Boxes are [x, y, w, h]

export type BBox = [number, number, number, number];

export type ScoredBox = {
  id: string;
  kind: "button" | "section";
  bbox: BBox;
  score: number; // 0..1
  label?: string | null;
  textId?: string | null;
};

export function iou(a: BBox, b: BBox): number {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;

  const ax2 = ax + aw;
  const ay2 = ay + ah;
  const bx2 = bx + bw;
  const by2 = by + bh;

  const interX1 = Math.max(ax, bx);
  const interY1 = Math.max(ay, by);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interW = Math.max(0, interX2 - interX1);
  const interH = Math.max(0, interY2 - interY1);
  const interArea = interW * interH;

  const areaA = Math.max(0, aw) * Math.max(0, ah);
  const areaB = Math.max(0, bw) * Math.max(0, bh);
  const union = areaA + areaB - interArea;
  if (union <= 0) return 0;
  return interArea / union;
}

// Non-maximum suppression: keep highest scored boxes, suppress those with IoU > iouThresh
export function nms(boxes: ScoredBox[], iouThresh: number): ScoredBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: ScoredBox[] = [];
  for (const candidate of sorted) {
    let overlaps = false;
    for (const k of kept) {
      if (iou(candidate.bbox, k.bbox) > iouThresh) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) kept.push(candidate);
  }
  return kept;
}


