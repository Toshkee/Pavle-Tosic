"use client";

import { memo, useEffect, useRef } from "react";

/* Digital-rain background — faint columns of falling phosphor glyphs behind the
   section deck (replaces the old 3D "data-core"). The canvas is TRANSPARENT so
   it composites over the dot-grid; instead of the classic translucent-black
   fade we clearRect every frame and draw each column as a self-fading trail
   (bright head → dim tail).

   It REACTS to the active SECTION: changing sections fires a brief "surge"
   (columns speed up + brighten, then settle), so moving through the deck feels
   like the rain responds. The glyphs are blurred into soft streaks of light —
   with the aurora blobs gone, this is what tints the page green.

   Perf: the blur is BAKED into a pre-rendered glyph atlas (gaussian blur is
   linear, so pre-blurred sprites composite the same as blurring the frame).
   The old approach — sharp fillText + a CSS blur(4px) on the element — made
   the GPU re-blur the whole viewport on every repaint, and each of the ~2000
   glyphs per frame paid fillText + an rgba() string allocation. Now a frame is
   plain drawImage blits with globalAlpha set once per trail tier, and there is
   no CSS filter at all (kept only as a fallback where ctx.filter is missing).
   And because the output is bokeh, the canvas renders at HALF resolution and
   the browser upscales it — the bilinear stretch is invisible inside the blur
   and quarters the pixels every blit touches (which is what keeps the sprite
   path cheap even under software rasterization). Redraw capped at ~30fps, the
   loop PAUSES while the tab is hidden, and under prefers-reduced-motion we
   paint one sparse static frame and never loop. */

const HEAD = "92, 240, 138"; // --color-accent-ink — bright leading glyph
const TRAIL = "34, 197, 94"; // --color-accent — dimmer trail
const GLYPHS = "01ｱｶｻﾀﾅﾊﾏﾔﾗﾜｷｸｹｺｦﾉ<>[]{}=/\\+*01ﾂﾃﾄﾆﾇﾂ01";
const FONT_SIZE = 15; // px (CSS)
const TRAIL_LEN = 16; // glyphs lit above the head
const FPS = 1000 / 30;
const BASE_ALPHA = 0.65; // global dimmer — the rain carries the page's ambient colour now
const BLUR_PX = 4; // baked into the glyph atlas — melts glyphs into soft light streaks (CSS px)

// Internal render scale: the layout stays in CSS px, but the canvas backing
// store (and the atlas) live at half size and the browser stretches it back up.
const RES = 0.5;
const STEP = FONT_SIZE * RES; // one grid cell, in device px
// Sprites need room for the baked blur to bleed (~2.5σ of the scaled blur).
const PAD = Math.ceil(BLUR_PX * RES * 2.5);
const CELL = Math.ceil(FONT_SIZE * RES + PAD * 2);
const FONT = `${FONT_SIZE * RES}px ui-monospace, Menlo, monospace`;

const rand = (n: number) => Math.floor(Math.random() * n);

// Glyph atlas: every glyph pre-drawn in both colours at full alpha, blurred
// once here instead of per frame (at the render scale, so the baked blur
// matches BLUR_PX after the upscale). Row 0 = head colour, row 1 = trail.
// Returns null where ctx.filter is unsupported (the caller then falls back to
// sharp fillText under the old CSS element blur).
function buildAtlas(): HTMLCanvasElement | null {
  const atlas = document.createElement("canvas");
  atlas.width = GLYPHS.length * CELL;
  atlas.height = CELL * 2;
  const ctx = atlas.getContext("2d");
  if (!ctx || !("filter" in ctx)) return null;
  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.filter = `blur(${BLUR_PX * RES}px)`;
  for (let row = 0; row < 2; row++) {
    ctx.fillStyle = `rgb(${row === 0 ? HEAD : TRAIL})`;
    for (let i = 0; i < GLYPHS.length; i++) {
      ctx.fillText(GLYPHS[i], i * CELL + PAD, row * CELL + PAD);
    }
  }
  return atlas;
}

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

    const atlas = buildAtlas();
    // No ctx.filter support (old Safari): draw sharp and blur the element the
    // old way. Everyone else gets pre-blurred sprites and no CSS filter.
    canvas.style.filter = atlas ? "" : `blur(${BLUR_PX}px)`;

    let dw = 0; // canvas backing size, device px (RES × CSS px)
    let dh = 0;
    let cols = 0;
    let rows = 0;
    let heads = new Float32Array(0); // head row per column (float)
    let speeds = new Float32Array(0); // rows/sec per column
    let grid = new Uint16Array(0); // glyph index per cell [col * rows + row]

    const setup = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      dw = Math.ceil(w * RES);
      dh = Math.ceil(h * RES);
      canvas.width = dw;
      canvas.height = dh;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.textBaseline = "top";
      ctx.font = FONT;
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

    // One sprite blit. With the atlas the blur is already in the pixels; the
    // fallback draws sharp text (the element's CSS blur softens it instead).
    const blit = (glyphIdx: number, headRow: boolean, x: number, y: number) => {
      if (atlas) {
        ctx.drawImage(
          atlas,
          glyphIdx * CELL,
          headRow ? 0 : CELL,
          CELL,
          CELL,
          x - PAD,
          y - PAD,
          CELL,
          CELL
        );
      } else {
        ctx.fillStyle = `rgb(${headRow ? HEAD : TRAIL})`;
        ctx.fillText(GLYPHS[glyphIdx], x, y);
      }
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, dw, dh);
      const surge = surgeRef.current;
      const speedMul = 1 + surge * 2.2;
      // Trail tiers share an alpha, so draw tier-by-tier: globalAlpha is set
      // TRAIL_LEN times per frame instead of per glyph.
      for (let k = 0; k < TRAIL_LEN; k++) {
        if (k === 0) {
          ctx.globalAlpha = Math.min((0.85 + 0.15 * surge) * BASE_ALPHA, 0.95);
        } else {
          const fade = 1 - k / TRAIL_LEN;
          ctx.globalAlpha = fade * fade * (0.55 + 0.3 * surge) * BASE_ALPHA;
        }
        for (let c = 0; c < cols; c++) {
          const row = Math.floor(heads[c]) - k;
          if (row < 0 || row >= rows) continue;
          blit(grid[c * rows + row], k === 0, c * STEP, row * STEP);
        }
      }
      ctx.globalAlpha = 1;
      for (let c = 0; c < cols; c++) {
        const hInt = Math.floor(heads[c]);
        heads[c] += speeds[c] * speedMul * dt;
        // Occasionally re-randomise the leading glyph (the classic flicker).
        if (hInt >= 0 && hInt < rows && Math.random() < 0.5) {
          grid[c * rows + hInt] = rand(GLYPHS.length);
        }
        // Reset once the whole trail has fallen past the bottom.
        if ((heads[c] - TRAIL_LEN) * STEP > dh) {
          heads[c] = -rand(10);
          speeds[c] = 6 + Math.random() * 10;
        }
      }
      surgeRef.current = surge < 0.002 ? 0 : surge * 0.94; // ~0.5s decay
    };

    const staticFrame = () => {
      ctx.clearRect(0, 0, dw, dh);
      ctx.globalAlpha = 0.16;
      for (let c = 0; c < cols; c++) {
        blit(rand(GLYPHS.length), false, c * STEP, rand(rows) * STEP);
      }
      ctx.globalAlpha = 1;
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
      style={{ zIndex: -8 }}
    />
  );
}

export default memo(MatrixRain);
