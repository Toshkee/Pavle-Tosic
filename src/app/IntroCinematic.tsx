"use client";

import { useEffect, useRef } from "react";

/* One-shot "hacker boot" cinematic, played right after the boot screen once the
   visitor presses Enter / clicks continue:

     1. a curtain of green "code rain" falls top → bottom (Matrix-style), then
     2. the rain dissolves as "Pavle Tošić" DECRYPTS into place — every glyph
        scrambles through random characters and locks left → right — while a
        small "PT" monogram pops in above and the role decodes below.

   Pure canvas-2D (no WebGL / three.js), so it matches the terminal aesthetic,
   weighs almost nothing, and can't fail to initialise a GPU context. The name
   is set in the site's real Mononoki face (read from the computed style), so
   the reveal lines up with the page underneath.

   Mounted ONLY during the boot overlay's "cinematic" phase, so a normal page
   load never pays for it. Reduced motion, a missing 2D context, or a stall all
   call onDone() so the visitor is never trapped behind the overlay. */

const NAME = "Pavle Tošić";
const ROLE = "software developer";
const SCRAMBLE = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789!<>/{}[]=+*#%&";
const RAIN = "01<>/{}[]()=+*;:#%&|ABCDEF0123456789abcdef";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

function roundRectPath(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  c.beginPath();
  if (typeof c.roundRect === "function") {
    c.roundRect(x, y, w, h, r);
    return;
  }
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export default function IntroCinematic({ onDone }: { onDone: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    };

    const mount = mountRef.current;
    if (!mount) return finish();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return finish();
    }

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block";
    const ctx = canvas.getContext("2d");
    if (!ctx) return finish();
    mount.appendChild(canvas);

    const safety = setTimeout(finish, 5000);

    // The site is set in Mononoki via a next/font CSS variable; read the real
    // resolved family so the name matches the page rather than a generic mono.
    const fam =
      getComputedStyle(document.body).fontFamily ||
      'ui-monospace, "SFMono-Regular", Menlo, monospace';

    const chars = Array.from(NAME);
    const CELL = 16; // code-rain cell size (css px)

    // ---- timeline (seconds) ----
    const DECODE_START = 0.7;
    const STAGGER = 0.055;
    const SETTLE = 0.5;
    const RAIN_FADE_END = 1.65;
    const MONO_START = 1.6;
    const ROLE_START = 1.8;
    const HOLD_UNTIL = 2.5;
    const FADE = 0.5;
    const lastLock = DECODE_START + (chars.length - 1) * STAGGER + SETTLE;

    // ---- layout (recomputed on resize) ----
    let W = 0;
    let H = 0;
    let cols = 0;
    let drops: number[] = [];
    let nameFs = 64;
    let startX = 0;
    let total = 0;
    let widths: number[] = [];
    let baseY = 0;

    const resize = () => {
      W = mount.clientWidth || window.innerWidth;
      H = mount.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const nextCols = Math.ceil(W / CELL) + 1;
      if (nextCols !== cols) {
        cols = nextCols;
        // Spread heads across the full height so the rain fills the screen from
        // the very first frame instead of streaming in from the top.
        drops = new Array(cols)
          .fill(0)
          .map(() => Math.floor(Math.random() * (H / CELL)));
      }

      // Fit the name to ~82% of the viewport width (one measure-and-scale pass).
      nameFs = 80;
      ctx.font = `700 ${nameFs}px ${fam}`;
      const t0 = ctx.measureText(NAME).width || 1;
      nameFs = Math.max(26, Math.min(92, (nameFs * (W * 0.82)) / t0));
      ctx.font = `700 ${nameFs}px ${fam}`;
      widths = chars.map((c) => ctx.measureText(c).width);
      total = widths.reduce((a, b) => a + b, 0);
      startX = (W - total) / 2;
      baseY = H * 0.5;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const drawRain = (alpha: number) => {
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `700 ${CELL}px ${fam}`;
      ctx.shadowBlur = 0;
      for (let i = 0; i < cols; i++) {
        const head = drops[i];
        for (let k = 0; k < 6; k++) {
          const row = head - k;
          const yy = row * CELL;
          if (yy < -CELL || yy > H) continue;
          const g = RAIN[Math.abs((i * 31 + row * 17 + k) % RAIN.length)];
          if (k === 0) {
            ctx.fillStyle = `rgba(206,255,216,${alpha})`;
          } else {
            ctx.fillStyle = `rgba(34,197,94,${alpha * (1 - k / 6) * 0.6})`;
          }
          ctx.fillText(g, i * CELL, yy);
        }
        drops[i] += 1;
        if (drops[i] * CELL > H && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
    };

    const drawName = (t: number, a: number) => {
      if (t < DECODE_START) return;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = `700 ${nameFs}px ${fam}`;
      let x = startX;
      for (let i = 0; i < chars.length; i++) {
        const real = chars[i];
        if (real === " ") {
          x += widths[i];
          continue;
        }
        const lockAt = DECODE_START + i * STAGGER + SETTLE;
        const locked = t >= lockAt;
        const glyph = locked
          ? real
          : SCRAMBLE[(Math.floor(t * 20) + i * 7) % SCRAMBLE.length];
        ctx.shadowColor = "rgba(92,240,138,0.85)";
        ctx.shadowBlur = locked ? nameFs * 0.24 : nameFs * 0.1;
        ctx.fillStyle = locked
          ? `rgba(216,255,226,${a})`
          : `rgba(92,240,138,${a * 0.6})`;
        ctx.fillText(glyph, x, baseY);
        x += widths[i];
      }
      ctx.shadowBlur = 0;

      // a thin scan-line that draws across the name once it has locked
      const up = clamp01((t - lastLock) / 0.45);
      if (up > 0) {
        const w = total * 1.02 * easeOut(up);
        const ly = baseY + nameFs * 0.2;
        ctx.fillStyle = `rgba(92,240,138,${a * 0.5})`;
        ctx.fillRect(W / 2 - w / 2, ly, w, Math.max(1, nameFs * 0.018));
      }
    };

    const drawMono = (t: number, a: number) => {
      const p = clamp01((t - MONO_START) / 0.45);
      if (p <= 0) return;
      const s = easeOutBack(p);
      const boxFs = Math.max(18, Math.min(32, W / 16));
      const size = boxFs * 1.7;
      ctx.save();
      // sit clear above the name's cap height with a small gap
      ctx.translate(W / 2, baseY - nameFs * 0.72 - size * 0.5 - 18);
      ctx.scale(s, s);
      ctx.globalAlpha = a * clamp01(p * 1.6);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(92,240,138,0.85)";
      roundRectPath(ctx, -size / 2, -size / 2, size, size, 7);
      ctx.stroke();
      ctx.fillStyle = "rgba(216,255,226,1)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${boxFs}px ${fam}`;
      ctx.shadowColor = "rgba(92,240,138,0.8)";
      ctx.shadowBlur = boxFs * 0.35;
      ctx.fillText("PT", 0, boxFs * 0.06);
      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    const drawRole = (t: number, a: number) => {
      const p = clamp01((t - ROLE_START) / 0.55);
      if (p <= 0) return;
      const fs = Math.max(11, Math.min(16, W / 42));
      const text = ROLE.toUpperCase().split("").join(" ");
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `400 ${fs}px ${fam}`;
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(138,160,140,${a * p})`;
      ctx.fillText(text, W / 2, baseY + nameFs * 0.62 + fs);
    };

    let startT = -1;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (startT < 0) startT = now;
      const t = (now - startT) / 1000;

      ctx.clearRect(0, 0, W, H);

      let rainA = t < 0.2 ? t / 0.2 : 1;
      if (t > DECODE_START) {
        rainA *= clamp01(1 - (t - DECODE_START) / (RAIN_FADE_END - DECODE_START));
      }
      if (rainA > 0.01) drawRain(rainA);

      const contentA =
        t < HOLD_UNTIL ? 1 : clamp01(1 - (t - HOLD_UNTIL) / FADE);
      drawName(t, contentA);
      drawMono(t, contentA);
      drawRole(t, contentA);

      // Hand off mid-fade so the site reveals underneath the overlay's own
      // fade-out (the canvas keeps fading to 0 until BootIntro unmounts it).
      if (t >= HOLD_UNTIL + FADE * 0.6) {
        clearTimeout(safety);
        finish();
      }
    };
    raf = requestAnimationFrame(frame);

    const onSkip = () => {
      clearTimeout(safety);
      finish();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    mount.addEventListener("click", onSkip);

    return () => {
      clearTimeout(safety);
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      mount.removeEventListener("click", onSkip);
      ro.disconnect();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [onDone]);

  return <div ref={mountRef} className="absolute inset-0 cursor-pointer" aria-hidden />;
}
