"use client";

import { memo, useEffect, useRef } from "react";

/* Digital-rain background — faint columns of falling phosphor glyphs behind the
   section deck (replaces the old 3D "data-core"). The canvas is TRANSPARENT so
   it composites over the dot-grid; instead of the classic translucent-black
   fade we clearRect every frame and draw each column as a self-fading trail
   (bright head → dim tail).

   It REACTS to the active SECTION: changing sections fires a brief "surge"
   (columns speed up + brighten, then settle), so moving through the deck feels
   like the rain responds. The canvas is CSS-blurred so the glyphs melt into
   soft streaks of light — with the aurora blobs gone, this is what tints the
   page green.

   Perf: rendered at 1x (the blur hides retina sharpness), redraw capped at
   ~30fps, the loop
   PAUSES while the tab is hidden, and under prefers-reduced-motion we paint one
   sparse static frame and never loop. */

const HEAD = "92, 240, 138"; // --color-accent-ink — bright leading glyph
const TRAIL = "34, 197, 94"; // --color-accent — dimmer trail
const GLYPHS = "01ｱｶｻﾀﾅﾊﾏﾔﾗﾜｷｸｹｺｦﾉ<>[]{}=/\\+*01ﾂﾃﾄﾆﾇﾂ01";
const FONT_SIZE = 15; // px (CSS)
const TRAIL_LEN = 16; // glyphs lit above the head
const FPS = 1000 / 30;
const BASE_ALPHA = 0.65; // global dimmer — the rain carries the page's ambient colour now
const BLUR_PX = 4; // CSS blur — melts glyphs into soft light streaks (ambience, not noise)

const rand = (n: number) => Math.floor(Math.random() * n);

function MatrixRain({ sectionIndex = 0 }: { sectionIndex?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surgeRef = useRef(0); // 0→1 burst on section change, decays each frame
  const firstRef = useRef(true);

  // Section change → surge (skip the initial mount so it doesn't fire on load).
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    surgeRef.current = 1;
  }, [sectionIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let heads = new Float32Array(0); // head row per column (float)
    let speeds = new Float32Array(0); // rows/sec per column
    let grid = new Uint16Array(0); // glyph index per cell [col * rows + row]

    const setup = () => {
      // The canvas is CSS-blurred, so retina sharpness is wasted — render at 1x.
      const dpr = 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${FONT_SIZE}px ui-monospace, Menlo, monospace`;
      cols = Math.ceil(w / FONT_SIZE);
      rows = Math.ceil(h / FONT_SIZE) + 2;
      heads = new Float32Array(cols);
      speeds = new Float32Array(cols);
      grid = new Uint16Array(cols * rows);
      for (let c = 0; c < cols; c++) {
        heads[c] = -rand(rows); // stagger starts above the top
        speeds[c] = 6 + Math.random() * 10; // rows per second
      }
      for (let i = 0; i < grid.length; i++) grid[i] = rand(GLYPHS.length);
    };
    setup();

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const surge = surgeRef.current;
      const speedMul = 1 + surge * 2.2;
      for (let c = 0; c < cols; c++) {
        const hd = heads[c];
        const hInt = Math.floor(hd);
        const x = c * FONT_SIZE;
        for (let k = 0; k < TRAIL_LEN; k++) {
          const row = hInt - k;
          if (row < 0 || row >= rows) continue;
          const glyph = GLYPHS[grid[c * rows + row]];
          if (k === 0) {
            const a = (0.85 + 0.15 * surge) * BASE_ALPHA;
            ctx.fillStyle = `rgba(${HEAD}, ${Math.min(a, 0.95)})`;
          } else {
            const fade = 1 - k / TRAIL_LEN;
            const a = fade * fade * (0.55 + 0.3 * surge) * BASE_ALPHA;
            ctx.fillStyle = `rgba(${TRAIL}, ${a})`;
          }
          ctx.fillText(glyph, x, row * FONT_SIZE);
        }
        heads[c] = hd + speeds[c] * speedMul * dt;
        // Occasionally re-randomise the leading glyph (the classic flicker).
        if (hInt >= 0 && hInt < rows && Math.random() < 0.5) {
          grid[c * rows + hInt] = rand(GLYPHS.length);
        }
        // Reset once the whole trail has fallen past the bottom.
        if ((heads[c] - TRAIL_LEN) * FONT_SIZE > h) {
          heads[c] = -rand(10);
          speeds[c] = 6 + Math.random() * 10;
        }
      }
      surgeRef.current = surge < 0.002 ? 0 : surge * 0.94; // ~0.5s decay
    };

    const staticFrame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `rgba(${TRAIL}, 0.16)`;
      for (let c = 0; c < cols; c++) {
        ctx.fillText(GLYPHS[rand(GLYPHS.length)], c * FONT_SIZE, rand(rows) * FONT_SIZE);
      }
    };

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!last) last = t;
      const elapsed = t - last;
      if (elapsed < FPS) return;
      last = t;
      draw(Math.min(elapsed, 100) / 1000); // seconds; clamp tab-switch jumps
    };

    const onResize = () => {
      setup();
      if (reduce) staticFrame();
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduce && !raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);
    if (reduce) {
      staticFrame();
    } else {
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: -8, filter: `blur(${BLUR_PX}px)` }}
    />
  );
}

export default memo(MatrixRain);
