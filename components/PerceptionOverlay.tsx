"use client";
import React, { useEffect, useRef, useState } from "react";

type BBox = [number, number, number, number];

type Props = {
  imageUrl: string;
  targetWidth: number; // same as you send to backend
  imageNatural: { w: number; h: number };
  texts?: { id: string; bbox: BBox }[];
  buttons?: { id: string; bbox: BBox }[];
  blocks?: { id: string; bbox: BBox; kind?: string }[];
  grid?: { cols: number | null; gutterPx: number | null; confidence: number } | null;
  gridCandidates?: Array<{ cols: number; gutterPx: number; confidence: number }>;
  show: { texts: boolean; buttons: boolean; blocks: boolean; grid: boolean };
  highlightedButtonIds?: string[];
  hoveredButtonId?: string | null;
};

export default function PerceptionOverlay({
  imageUrl,
  targetWidth,
  imageNatural,
  texts = [],
  buttons = [],
  blocks = [],
  grid,
  gridCandidates = [],
  show,
  highlightedButtonIds = [],
  hoveredButtonId = null,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [noGridMsg, setNoGridMsg] = useState<string | null>(null);

  function normalizeBBox(input: any, naturalW: number, naturalH: number): BBox | null {
    if (!input) return null;
    // Array form: either [x,y,w,h] or [x1,y1,x2,y2]
    if (Array.isArray(input) && input.length === 4) {
      const [a, b, c, d] = input.map((n) => Number(n) || 0);
      // If c,d look like coordinates within natural bounds and greater than a,b, treat as x2,y2
      if (c > a && d > b && c <= naturalW && d <= naturalH) {
        return [a, b, c - a, d - b];
      }
      return [a, b, c, d];
    }
    // Object form: {x,y,w,h} or {x1,y1,x2,y2}
    if (typeof input === 'object') {
      const x = Number((input as any).x ?? (input as any).x1) || 0;
      const y = Number((input as any).y ?? (input as any).y1) || 0;
      const w = Number((input as any).w ?? (((input as any).x2 ?? 0) - x)) || 0;
      const h = Number((input as any).h ?? (((input as any).y2 ?? 0) - y)) || 0;
      return [x, y, w, h];
    }
    return null;
  }

  function draw() {
    const cvs = canvasRef.current;
    const img = imgRef.current;
    if (!cvs || !img) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    // Fit canvas to displayed image size with crisp lines (account for devicePixelRatio)
    const displayW = img.clientWidth || img.naturalWidth || targetWidth;
    const displayH = Math.round((imageNatural.h / imageNatural.w) * displayW);
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    cvs.width = Math.round(displayW * dpr);
    cvs.height = Math.round(displayH * dpr);
    cvs.style.width = `${displayW}px`;
    cvs.style.height = `${displayH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, displayW, displayH);
    console.log('overlay: buttons', buttons?.length || 0, 'blocks', blocks?.length || 0);

    const drawBox = (bboxIn: any, lineWidth: number, dash: number[], label?: string, stroke?: string) => {
      const norm = normalizeBBox(bboxIn, imageNatural.w, imageNatural.h);
      if (!norm) return;
      const s = displayW / targetWidth;
      const bbox: BBox = [norm[0] * s, norm[1] * s, norm[2] * s, norm[3] * s];
      const [x, y, w, h] = bbox;
      const s2 = displayW / targetWidth;
      ctx.save();
      ctx.setLineDash(dash);
      ctx.lineWidth = lineWidth;
      if (stroke) ctx.strokeStyle = stroke;
      ctx.strokeRect(x, y, w, h);
      if (label) {
        ctx.font = "12px ui-sans-serif, system-ui";
        const pad = 4;
        const textW = ctx.measureText(label).width + pad * 2;
        const textH = 16;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(x, Math.max(0, y - textH), textW, textH);
        ctx.fillStyle = "#111";
        ctx.fillText(label, x + pad, Math.max(12, y - 4));
      }
      ctx.restore();
    };

    // blocks (draw all, yellow)
    if (show.blocks && blocks.length) {
      blocks.forEach((b) => drawBox(b.bbox, 2, [], (b as any).kind || 'block', '#f59e0b'));
    }

    // buttons (draw all in blue/cyan; highlight selected/hovered)
    if (show.buttons && buttons.length) {
      const ids = new Set(highlightedButtonIds || []);
      buttons.forEach((b) => {
        const isHover = hoveredButtonId && b.id === hoveredButtonId;
        const isSelected = ids.has(b.id);
        const stroke = isHover ? '#22d3ee' : (isSelected ? '#06b6d4' : '#3b82f6');
        const dash = isHover ? [2, 2] : (isSelected ? [4, 3] : [6, 4]);
        const label = (b as any).label || 'button';
        drawBox(b.bbox, isHover ? 2.5 : 2, dash, label, stroke);
      });
    }

    // texts
    if (show.texts && texts.length) {
      ctx.strokeStyle = "#ef4444"; // red
      texts.forEach((t) => drawBox(t.bbox, 1.5, [2, 2]));
    }

    // grid
    setNoGridMsg(null);
    if (show.grid && grid) {
      const threshold = 0.2; // show warning below this confidence
      if (!grid || !grid.cols || grid.cols < 2 || grid.gutterPx == null) {
        // draw candidates if present
        if (gridCandidates && gridCandidates.length) {
          const scale = displayW / targetWidth;
          ctx.save();
          gridCandidates.slice(0, 6).forEach((gc) => {
            const cols = gc.cols;
            const gutter = gc.gutterPx;
            const totalGutters = cols - 1;
            const colW = (targetWidth - gutter * totalGutters) / cols;
            if (colW <= 0) return;
            // gutters
            ctx.fillStyle = "rgba(255, 214, 0, 0.08)";
            for (let i = 0; i < totalGutters; i++) {
              const gx = (i + 1) * colW + i * gutter;
              ctx.fillRect(Math.round(gx * scale), 0, Math.round(gutter * scale), displayH);
            }
            // centers
            ctx.strokeStyle = "rgba(255, 214, 0, 0.6)";
            ctx.setLineDash([6, 6]);
            for (let c = 0; c < cols; c++) {
              const x0 = c * (colW + gutter);
              const cx = x0 + colW / 2;
              const cxS = Math.round(cx * scale);
              ctx.beginPath();
              ctx.moveTo(cxS, 0);
              ctx.lineTo(cxS, displayH);
              ctx.stroke();
            }
          });
          ctx.restore();
        } else {
          setNoGridMsg("No grid detected");
        }
      } else {
        const scale = displayW / targetWidth;
        const totalGutters = grid.cols - 1;
        const gutter = grid.gutterPx ?? 0;
        const colW = (targetWidth - gutter * totalGutters) / grid.cols;
        if (colW > 0) {
          ctx.save();
          // Gutters as translucent bands
          ctx.fillStyle = "rgba(255, 225, 0, 0.18)";
          for (let i = 0; i < totalGutters; i++) {
            const gx = (i + 1) * colW + i * gutter;
            ctx.fillRect(Math.round(gx * scale), 0, Math.round(gutter * scale), displayH);
          }
          // Column outlines and center lines
          ctx.setLineDash([3, 2]);
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(255, 215, 0, 0.95)";
          ctx.beginPath();
          for (let c = 0; c < grid.cols; c++) {
            const x0 = c * (colW + grid.gutterPx);
            const cx = x0 + colW / 2;
            // column box
            ctx.strokeRect(Math.round(x0 * scale), 0, Math.round(colW * scale), displayH);
            // center line
            const cxS = Math.round(cx * scale);
            ctx.moveTo(cxS, 0);
            ctx.lineTo(cxS, displayH);
          }
          ctx.stroke();
          ctx.restore();
        } else {
          setNoGridMsg("Grid math invalid");
        }
      }
    }
  }

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    draw();
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, targetWidth, imageNatural.w, imageNatural.h, texts, buttons, blocks, grid, show, highlightedButtonIds, hoveredButtonId]);

  return (
    <div className="relative w-full">
      <img ref={imgRef} src={imageUrl} alt="analyzed" className="w-full h-auto block rounded-lg" onLoad={draw} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />
      {noGridMsg && (
        <div className="absolute left-2 top-2 text-xs px-2 py-1 rounded bg-yellow-900/70 text-yellow-50 border border-yellow-600">
          {noGridMsg}
        </div>
      )}
    </div>
  );
}


