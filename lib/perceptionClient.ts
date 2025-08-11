export type PerceptionText = {
  id: string;
  text: string;
  bbox: [number, number, number, number];
  conf: number;
  approxSizePx: number;
};

export type PerceptionContrast = {
  id: string;
  textId: string;
  ratio: number;
  wcag: "PASS" | "WARN" | "FAIL";
};

export type PerceptionBlock = {
  id: string;
  bbox: [number, number, number, number];
  kind: "section" | "card" | "unknown";
};

export type PerceptionGrid = {
  cols: number;
  gutterPx: number;
  confidence: number;
} | null;

export type PerceptionButton = {
  id: string;
  bbox: [number, number, number, number];
  cornerRadius: number;
  hasCenterText: boolean;
  textId?: string | null;
};

export type PerceptionPalette = {
  dominant: string[];
  mode: "dark" | "light";
} | null;

export type PerceptionMetrics = {
  medianVSpace: number;
  leftEdgeVariancePx: number;
} | null;

export type PerceptionSource = {
  ocr: string;
  cv: string;
};

export type PerceptionImage = {
  w: number;
  h: number;
  hash: string;
};

export type PerceptionJson = {
  version: string;
  image: PerceptionImage;
  texts: PerceptionText[];
  contrast: PerceptionContrast[];
  blocks: PerceptionBlock[];
  grid: PerceptionGrid;
  buttons: PerceptionButton[];
  palette: PerceptionPalette;
  metrics: PerceptionMetrics;
  source: PerceptionSource;
};

export type AnalyzeModes = Array<"ocr" | "geometry" | "contrast" | "palette">;

export async function analyzeImage(imageUrl: string, modes: AnalyzeModes = ["ocr", "geometry", "contrast", "palette"], init?: RequestInit): Promise<PerceptionJson> {
  const base = process.env.NEXT_PUBLIC_PERCEPTION_URL || "/api/perception";
  const res = await fetch(`${base}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, target_width: 1440, modes }),
    ...init,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Perception analyze failed: ${res.status} ${text}`);
  }
  try {
    return JSON.parse(text) as PerceptionJson;
  } catch (e) {
    throw new Error(`Perception JSON parse error: ${(e as Error).message}. Body: ${text.slice(0, 200)}...`);
  }
}
