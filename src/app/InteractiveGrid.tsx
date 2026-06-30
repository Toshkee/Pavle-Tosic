"use client";

import { memo, useEffect, useRef } from "react";

/* Interactive blueprint dot-grid that fills the background. Dots "breathe"
   and brighten + grow toward the pointer, painting a soft green spotlight
   that tracks the cursor. When the cursor stops the spotlight settles and the
   render loop FREEZES (a still pointer must cost zero — this fixed full-viewport
   canvas would otherwise re-paint + re-upload forever, competing with scroll on
   weak GPUs); the next mouse move wakes it. Pure canvas (no per-dot DOM node),
   DPR-aware, pointer-events:none so it never blocks clicks.

   Cost control: the loop is capped at ~40fps (a slow ambient glow needs no
   more), base dots are drawn as a SINGLE batched path+fill, only the handful of
   dots inside the spotlight bbox get per-dot work, and the radial glow is filled
   over just its own footprint. Renders one static frame under
   prefers-reduced-motion OR on coarse-pointer/touch devices (no cursor to
   track — the drift would be pure cost there). */

const GAP = 34; // px between dots (CSS px)
const BASE_R = 1.1; // resting dot radius
const MAX_R = 3.3; // radius at the spotlight centre
const REACH = 130; // spotlight radius (px)
const INK = "150, 175, 158"; // resting dot — faint grey-green on dark
const AMBER = "34, 197, 94"; // --color-accent (green) rgb — spotlight
const TAU = Math.PI * 2;
const FPS_INTERVAL = 1000 / 40; // cap the redraw cadence
const LERP = 0.13; // spotlight follow (tuned for the ~40fps cadence)

function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // No pointer to track on touch/coarse devices — animate nothing, just paint
    // one static frame so the grid is still present.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const animate = !reduce && !coarse;

    let w = window.innerWidth;
    let h = window.innerHeight;
    let px = w / 2; // pointer target
    let py = h / 2;
    let sx = px; // smoothed spotlight position
    let sy = py;
    let hasPointer = false;
    let lastMove = 0;

    // Reused across frames so the spotlight pass allocates nothing once warmed
    // (flat triples: gx, gy, e).
    const spot: number[] = [];

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

      // Follow the pointer. Idle no longer wanders: once the spotlight settles on
      // a still cursor, loop() stops the rAF entirely, so there is nothing to
      // drive an autonomous drift (and nothing to cost a frame while you read).
      sx += (px - sx) * LERP;
      sy += (py - sy) * LERP;

      // Soft warm light that travels with the spotlight (under the dots). The
      // gradient is transparent beyond `gr`, so filling only its bounding box
      // is pixel-identical to filling the whole canvas — but far less fill-rate.
      const gr = REACH * 1.7;
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
      glow.addColorStop(0, `rgba(${AMBER}, 0.13)`);
      glow.addColorStop(1, `rgba(${AMBER}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(sx - gr, sy - gr, gr * 2, gr * 2);

      const breathe = 0.5 + 0.5 * Math.sin(t * 0.0008);
      const baseAlpha = 0.07 + 0.03 * breathe;

      // PASS 1 — every dot outside the spotlight shares one colour + alpha, so
      // batch them into a single path and issue ONE fill (instead of ~1700
      // fills + ~1700 freshly-built rgba strings per frame). Dots inside the
      // spotlight bbox are deferred to PASS 2. Splitting on dist<REACH (i.e.
      // e>0) is exact: out-of-reach dots are identical to the old e===0 case.
      let spotLen = 0;
      ctx.fillStyle = `rgba(${INK}, ${baseAlpha})`;
      ctx.beginPath();
      for (let gx = GAP / 2; gx < w; gx += GAP) {
        const inX = Math.abs(gx - sx) < REACH;
        for (let gy = GAP / 2; gy < h; gy += GAP) {
          if (inX && Math.abs(gy - sy) < REACH) {
            const dist = Math.hypot(gx - sx, gy - sy);
            if (dist < REACH) {
              const f = 1 - dist / REACH;
              spot[spotLen++] = gx;
              spot[spotLen++] = gy;
              spot[spotLen++] = f * f; // e
              continue;
            }
          }
          ctx.moveTo(gx + BASE_R, gy);
          ctx.arc(gx, gy, BASE_R, 0, TAU);
        }
      }
      ctx.fill();

      // PASS 2 — the ~58 spotlight dots, each with its own radius/alpha/colour.
      for (let i = 0; i < spotLen; i += 3) {
        const gx = spot[i];
        const gy = spot[i + 1];
        const e = spot[i + 2];
        const r = BASE_R + (MAX_R - BASE_R) * e;
        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, TAU);
        ctx.fillStyle = `rgba(${e > 0.04 ? AMBER : INK}, ${baseAlpha + 0.5 * e})`;
        ctx.fill();
      }
    };

    const IDLE_MS = 1800; // freeze after the pointer has been still this long
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < FPS_INTERVAL) return; // throttle to ~40fps
      last = t - ((t - last) % FPS_INTERVAL);
      draw(t);

      // Freeze once the spotlight has caught up to a still pointer (or the
      // resting centre on load): stop the loop, leaving the last frame painted.
      // The fixed full-viewport canvas then adds nothing to a scroll frame.
      // onMove() and tab-show restart it. (raf === 0 is the "frozen" sentinel.)
      const settled = Math.abs(px - sx) < 0.4 && Math.abs(py - sy) < 0.4;
      const pointerStill = !hasPointer || t - lastMove > IDLE_MS;
      if (settled && pointerStill) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      hasPointer = true;
      px = e.clientX;
      py = e.clientY;
      lastMove = performance.now();
      // Wake the loop if it has frozen at idle.
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const onLeave = () => {
      hasPointer = false;
    };

    // Stop the loop while the tab is hidden; resume on return (unless it was
    // already frozen at idle, in which case the painted frame stands).
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    // Resizing clears the bitmap; under reduced-motion/coarse (no loop) repaint
    // the single static frame. (The initial resize() above runs before `draw`
    // is defined, so the repaint lives only in this listener.)
    const onResize = () => {
      resize();
      // resize() clears the bitmap; if no loop is running (reduced-motion/coarse,
      // or frozen at idle) repaint the static frame so the grid doesn't vanish.
      if (!animate || !raf) draw(performance.now());
    };
    window.addEventListener("resize", onResize);

    if (animate) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(loop);
    } else {
      draw(0); // single static frame
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
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

export default memo(InteractiveGrid);
