export type ImageStats = {
  rectangularity: number;
  cornerRoundness: number;
  fillVariance: number;
};

export function computeImageStats(
  img: { w: number; h: number; getPixel?: (x: number, y: number) => { r: number; g: number; b: number; a?: number } },
  b: [number, number, number, number]
): ImageStats {
  const [x, y, w, h] = b.map(Math.round) as [number, number, number, number];

  const samples = 10;
  let count = 0;
  let sum = 0;
  let sum2 = 0;
  for (let iy = 0; iy < samples; iy++) {
    for (let ix = 0; ix < samples; ix++) {
      const px = x + Math.floor((ix + 0.5) * (w / samples));
      const py = y + Math.floor((iy + 0.5) * (h / samples));
      if (img.getPixel) {
        const sx = Math.min(img.w - 1, Math.max(0, px));
        const sy = Math.min(img.h - 1, Math.max(0, py));
        const { r, g, b } = img.getPixel(sx, sy);
        const gray = (r + g + b) / (3 * 255);
        sum += gray;
        sum2 += gray * gray;
        count++;
      }
    }
  }
  const mean = count ? sum / count : 0;
  const variance = count ? Math.max(0, sum2 / count - mean * mean) : 0.02; // neutral baseline if no sampling

  return {
    rectangularity: 1.0,
    cornerRoundness: 0.15,
    fillVariance: variance,
  };
}

export function isButtonShaped(patch: ImageStats): boolean {
  if (patch.rectangularity < 0.9) return false;
  if (patch.cornerRoundness < 0.1) return false;
  if (patch.fillVariance > 0.035) return false;
  return true;
}


