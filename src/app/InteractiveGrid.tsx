"use client";

import { useEffect, useRef } from "react";

/* Interactive blueprint dot-grid that fills the background. Dots "breathe"
   and brighten + grow toward the pointer, painting a soft amber spotlight
   that tracks the cursor. When idle or on touch devices the spotlight drifts
   on its own, so there is always visible motion. Pure canvas (no per-dot DOM
   node), DPR-aware, pointer-events:none so it never blocks clicks, and it
   renders a single static frame under prefers-reduced-motion. */

const GAP = 34; // px between dots (CSS px)
const BASE_R = 1.1; // resting dot radius
const MAX_R = 3.3; // radius at the spotlight centre
const REACH = 175; // spotlight radius (px)
const INK = "33, 28, 22"; // --color-ink rgb
const AMBER = "224, 133, 58"; // --color-accent rgb

export default function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let w = window.innerWidth;
    let h = window.innerHeight;
    let px = w / 2; // pointer target
    let py = h / 2;
    let sx = px; // smoothed spotlight position
    let sy = py;
    let hasPointer = false;
    let lastMove = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // Follow the pointer; wander on a slow path when idle or on touch.
      const idle = !hasPointer || t - lastMove > 2600;
      if (idle) {
        px = w * (0.5 + 0.34 * Math.sin(t * 0.00017));
        py = h * (0.5 + 0.32 * Math.sin(t * 0.00023 + 1.3));
      }
      sx += (px - sx) * 0.08;
      sy += (py - sy) * 0.08;

      // Soft warm light that travels with the spotlight (under the dots).
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, REACH * 1.7);
      glow.addColorStop(0, `rgba(${AMBER}, 0.13)`);
      glow.addColorStop(1, `rgba(${AMBER}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const breathe = 0.5 + 0.5 * Math.sin(t * 0.0008);

      for (let gx = GAP / 2; gx < w; gx += GAP) {
        for (let gy = GAP / 2; gy < h; gy += GAP) {
          const dist = Math.hypot(gx - sx, gy - sy);
          const f = Math.max(0, 1 - dist / REACH); // 0..1 falloff
          const e = f * f; // ease the spotlight edge
          const r = BASE_R + (MAX_R - BASE_R) * e;
          const a = 0.07 + 0.03 * breathe + 0.5 * e;

          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${e > 0.04 ? AMBER : INK}, ${a})`;
          ctx.fill();
        }
      }
    };

    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      hasPointer = true;
      px = e.clientX;
      py = e.clientY;
      lastMove = performance.now();
    };
    const onLeave = () => {
      hasPointer = false;
    };

    window.addEventListener("resize", resize);
    if (reduce) {
      draw(0); // single static frame
    } else {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseleave", onLeave);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
