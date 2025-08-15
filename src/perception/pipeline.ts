import type { Perception } from "./types";
import { generateCandidates } from "./candidateGen";
import { filterWithGPT } from "./gptFilter";
import { validateAndFinalize } from "./validate";

export async function analyzePerception(perception: Perception, opts?: { model?: string }) {
  const cands = generateCandidates(perception);
  const gpt = await filterWithGPT({ imageMeta: { w: perception.image.w, h: perception.image.h }, texts: cands.textSpans, candidates: { buttons: cands.buttonBoxes, sections: cands.sectionBoxes } }, opts);
  const final = validateAndFinalize(perception, gpt, {});
  return { ...perception, buttons: final.buttons, sections: final.sections };
}


