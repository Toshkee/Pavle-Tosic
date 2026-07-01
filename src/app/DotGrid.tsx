"use client";

import { memo, useEffect, useRef } from "react";

/* Static blueprint dot-grid texture behind everything. Drawn ONCE (and again on
   resize) — no rAF loop and no pointer tracking; the cursor spotlight this
   replaced is gone, so the matrix rain is now the page's only moving light.
   DPR-aware, pointer-events:none so it never blocks clicks. */

const GAP = 34; // px between dots (CSS px)
const DOT_R = 1.1;
const INK = "150, 175, 158"; // faint grey-green on dark
const ALPHA = 0.09;
const TAU = Math.PI * 2;

function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Every dot shares one colour + alpha — batch the whole grid into a
      // single path and issue ONE fill.
      ctx.fillStyle = `rgba(${INK}, ${ALPHA})`;
      ctx.beginPath();
      for (let gx = GAP / 2; gx < w; gx += GAP) {
        for (let gy = GAP / 2; gy < h; gy += GAP) {
          ctx.moveTo(gx + DOT_R, gy);
          ctx.arc(gx, gy, DOT_R, 0, TAU);
        }
      }
      ctx.fill();
    };
    draw();

    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}

export default memo(DotGrid);
