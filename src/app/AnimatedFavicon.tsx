"use client";

import { useEffect } from "react";

/* Progressive enhancement for the tab icon: the server already ships a static
   "PT" phosphor coin (src/app/icon.png). Once JS runs, this redraws that same
   coin to a small canvas with a gently pulsing glow and swaps it into the
   <link rel="icon"> — a real, Chrome-compatible animated favicon (GIF/APNG
   favicons don't animate in Chrome). Skipped under reduced-motion, and rAF
   naturally pauses while the tab is hidden, so it costs nothing in the
   background. Falls back to the static icon on unmount. */
export default function AnimatedFavicon() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!link) return;
    const original = link.href;

    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.44;

    // Pre-render ONE full pulse cycle to cached data-URLs, then just cycle
    // them on a timer. Re-drawing + re-encoding a PNG on a rAF loop for the
    // whole session (the old approach) is steady background main-thread work.
    const FRAMES = 35; // ≈ the old 90ms/frame cadence over one π-second cycle
    const PERIOD = Math.PI * 1000; // ms — sin(2t) repeats every π seconds
    const frames: string[] = [];
    const draw = (pulse: number) => {
      ctx.clearRect(0, 0, size, size);
      // pulsing phosphor glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 1.3);
      glow.addColorStop(0, `rgba(34,197,94,${0.26 + 0.4 * pulse})`);
      glow.addColorStop(1, "rgba(34,197,94,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);
      // coin body
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = "#0a1a0f";
      ctx.fill();
      // rim
      ctx.lineWidth = size * 0.055;
      ctx.strokeStyle = `rgba(92,240,138,${0.6 + 0.4 * pulse})`;
      ctx.shadowColor = "rgba(92,240,138,0.9)";
      ctx.shadowBlur = size * (0.03 + 0.07 * pulse);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // PT monogram
      ctx.fillStyle = "#5cf08a";
      ctx.font = `700 ${Math.round(size * 0.4)}px ui-monospace, Menlo, "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(92,240,138,0.85)";
      ctx.shadowBlur = size * 0.03 * (1 + pulse);
      ctx.fillText("PT", cx, cy + size * 0.02);
      ctx.shadowBlur = 0;
    };
    for (let i = 0; i < FRAMES; i++) {
      draw(0.5 + 0.5 * Math.sin(((i / FRAMES) * PERIOD * 2.0) / 1000));
      frames.push(canvas.toDataURL("image/png"));
    }

    let frame = 0;
    const id = setInterval(() => {
      if (document.hidden) return; // costs nothing in the background
      link.href = frames[frame];
      frame = (frame + 1) % FRAMES;
    }, Math.round(PERIOD / FRAMES));

    return () => {
      clearInterval(id);
      link.href = original; // restore the static coin
    };
  }, []);

  return null;
}
