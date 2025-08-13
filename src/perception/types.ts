// Shared types for perception post-processing

export type OCRText = {
  id: string;
  text: string;
  bbox: [number, number, number, number];
  conf: number;
  approxSizePx: number;
};

export type RawButton = {
  id: string;
  bbox: [number, number, number, number];
  cornerRadius: number;
  hasCenterText: boolean;
  textId: string | null;
};

export type Block = {
  id: string;
  bbox: [number, number, number, number];
  kind: "section" | "other";
};

export type Contrast = {
  id: string;
  textId: string;
  ratio: number;
  wcag: "PASS" | "WARN" | "FAIL";
};

export type Perception = {
  image: { w: number; h: number };
  texts: OCRText[];
  buttons: RawButton[];
  blocks: Block[];
  contrast: Contrast[];
  palette: { mode: "dark" | "light" };
  metrics?: { medianVSpace?: number; leftEdgeVariancePx?: number };
};

export type ScoredBox = {
  id: string;
  kind: "button" | "section";
  bbox: [number, number, number, number]; // x,y,w,h
  score: number; // 0..1
  label?: string | null; // from OCR, if any
  textId?: string | null;
};

export type PostProcessResult = {
  buttons: ScoredBox[];
  sections: ScoredBox[];
  debug?: {
    rejected: ScoredBox[]; // for UI overlay toggles
    params: Record<string, number | string>;
  };
};


