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

    let raf = 0;
    let start = 0;
    let last = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!start) start = now;
      if (now - last < 90) return; // throttle to ~11 fps — a favicon needs no more
      last = now;
      const pulse = 0.5 + 0.5 * Math.sin(((now - start) / 1000) * 2.0);

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

      link.href = canvas.toDataURL("image/png");
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      link.href = original; // restore the static coin
    };
  }, []);

  return null;
}
