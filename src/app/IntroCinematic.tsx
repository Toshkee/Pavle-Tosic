"use client";

import { useEffect, useRef } from "react";

/* One-shot "compile" cinematic — the payoff after the boot screen's
   "system ready — press Enter". Concept: the build finishes and the monitor
   powers on — the SITE ITSELF is the reveal, no logo / name artifact.

     I.   a real build log streams  (lex → parse → typecheck → … → emit),
     II.  a linker bar fills and ramps toward 98 %,
     II.5 it JAMS at 98 % with two micro-stutters (loads the spring),
     III. it SNAPS to 100 %: one phosphor flash washes the screen,
     IV.  CRT COLLAPSE — the whole terminal squishes vertically into a single
          bright phosphor seam (the classic tube power-off line),
     V.   POWER-ON BLOOM — the seam blooms open like an old monitor igniting:
          an aperture expands from the centre line, its frontiers glowing,
          scanlines and a green tint burning off the freshly revealed page.
          What's inside the aperture is the REAL hero (the boot overlay's
          background is dropped at bloom start so the site shows through).

   Pure canvas-2D (no WebGL / three.js), a single time-driven rAF (a dropped
   frame never desyncs), DPR-capped. Reduced motion, a missing 2D context, the
   skip keys/click, or a stall all converge on one onDone() so the visitor is
   never trapped behind the overlay. Mounted ONLY during the boot overlay's
   "cinematic" phase. */

// ---- palette (exact site tokens — phosphor green only, no other hue) ----
const BG = "#0a0f0a";
const ACCENT = "#22c55e";
const BRIGHT = "#5cf08a";
const DEEP = "#16a34a";
const DEEPER = "#15803d";
const NAME_HI = "#d8ffe2";
const NAME_SOFT = "#e6f1e6";
const MUTED = "#8aa08c";
const FAINT = "#5b6b5d";

// ---- log content as pre-coloured segments (drawn in a monospace grid) ----
type Seg = { t: string; c: string };
const sg = (t: string, c: string): Seg => ({ t, c });

const LOG_DESKTOP: Seg[][] = [
  [sg("$ ", BRIGHT), sg("make portfolio", NAME_SOFT)],
  [sg("[00.01] ", FAINT), sg("lex       ", BRIGHT), sg("src/me.ts ........... ", MUTED), sg("412 tok", ACCENT)],
  [sg("[00.04] ", FAINT), sg("parse     ", BRIGHT), sg("building AST ........ ", MUTED), sg("ok", ACCENT)],
  [sg("[00.08] ", FAINT), sg("typecheck ", BRIGHT), sg("Pavle: Developer .... ", MUTED), sg("ok", ACCENT)],
  [sg("[00.12] ", FAINT), sg("resolve   ", BRIGHT), sg("imports / coffee .... ", MUTED), sg("ok", ACCENT)],
  [sg("[00.16] ", FAINT), sg("optimize  ", BRIGHT), sg("--release -O3 ....... ", MUTED), sg("ok", ACCENT)],
  [sg("[00.20] ", FAINT), sg("link      ", BRIGHT), sg("symbols ............. ", MUTED), sg("38", ACCENT)],
  [sg("[00.24] ", FAINT), sg("emit      ", BRIGHT), sg("target: human ....... ", MUTED), sg("ok", ACCENT)],
];
const LOG_MOBILE: Seg[][] = [
  [sg("$ ", BRIGHT), sg("make portfolio", NAME_SOFT)],
  [sg("[01] ", FAINT), sg("lex ....... ", MUTED), sg("ok", ACCENT)],
  [sg("[02] ", FAINT), sg("parse ..... ", MUTED), sg("ok", ACCENT)],
  [sg("[03] ", FAINT), sg("typecheck . ", MUTED), sg("ok", ACCENT)],
  [sg("[04] ", FAINT), sg("link ...... ", MUTED), sg("38", ACCENT)],
  [sg("[05] ", FAINT), sg("emit ...... ", MUTED), sg("ok", ACCENT)],
];

// ---- timeline (seconds, cumulative) ----
const LINE_INTERVAL = 0.095;
const WIPE_DUR = 0.085;
const CARET_HZ = 1.8;
const BAR_START = 0.9;
const BAR_END = 1.6;
const STALL_START = 1.6;
const STUTTER_T1 = 1.66;
const STUTTER_T2 = 1.73;
const JITTER_BAND = 0.03;
const JITTER_PX = 2;
const SNAP_T = 1.82;
const FLASH_A = 0.24;
const FLASH_DUR = 0.13;
// Act IV — CRT collapse: the terminal squishes into a phosphor seam.
const COLLAPSE_T = 2.0;
const COLLAPSE_DUR = 0.3;
// Seam hold — a beat of pure dark + the humming centre line.
const SEAM_END_T = 2.55;
// Act V — power-on bloom: the aperture opens onto the real hero.
const BLOOM_DUR = 0.6;
const IGNITE_FLASH_A = 0.16;
const IGNITE_FLASH_DUR = 0.1;
const DONE_T = 3.25;
const SAFETY_MS = 6000;

// ---- perf / scaling ----
const MOBILE_BP = 640;
const DPR_CAP = 2;
const SCAN_PERIOD = 3;
const SCAN_DARK_A = 0.05;
const VIGNETTE_A = 0.26;

// ---- easings ----
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeIn = (x: number) => x * x;
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

type Glyph = { ch: string; x: number; y: number };

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

    const safety = setTimeout(finish, SAFETY_MS);

    // The site is set in Mononoki via a next/font CSS variable; read the real
    // resolved family so the log matches the page rather than a generic mono.
    const fam =
      getComputedStyle(document.body).fontFamily ||
      'ui-monospace, "SFMono-Regular", Menlo, monospace';

    // ---- layout state (recomputed on resize) ----
    let W = 0;
    let H = 0;
    let isMobile = false;
    let LOG: Seg[][] = LOG_DESKTOP;
    let logFs = 13;
    let lineH = 20;
    let charW = 8;
    let logFont = "";
    let termX = 0;
    let termTop = 0;
    let barW = 0;
    let barH = 0;
    let logGlyphs: Glyph[] = [];
    let lineW: number[] = [];
    let vignette: CanvasGradient | null = null;
    let scanTile: HTMLCanvasElement | null = null;

    const buildLogGlyphs = () => {
      logGlyphs = [];
      lineW = [];
      for (let li = 0; li < LOG.length; li++) {
        const baseY = termTop + li * lineH;
        let x = termX;
        for (const s of LOG[li]) {
          for (const ch of s.t) {
            if (ch !== " ") logGlyphs.push({ ch, x, y: baseY });
            x += charW;
          }
        }
        lineW[li] = x - termX;
      }
    };

    const buildFraming = () => {
      const g = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.25,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.72
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${VIGNETTE_A})`);
      vignette = g;
      const tile = document.createElement("canvas");
      tile.width = 1;
      tile.height = SCAN_PERIOD;
      const t = tile.getContext("2d");
      if (t) {
        t.fillStyle = "#000";
        t.fillRect(0, 0, 1, 1);
        scanTile = tile;
      }
    };

    const resize = () => {
      W = mount.clientWidth || window.innerWidth;
      H = mount.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      isMobile = Math.min(W, H) < MOBILE_BP;
      LOG = isMobile ? LOG_MOBILE : LOG_DESKTOP;

      logFs = Math.max(
        isMobile ? 12 : 11,
        Math.round(Math.min(W, H) * (isMobile ? 0.022 : 0.0165))
      );
      lineH = Math.round(logFs * 1.55);
      logFont = `500 ${logFs}px ${fam}`;
      ctx.font = logFont;
      charW = ctx.measureText("0").width || logFs * 0.6;

      // The terminal streams in a left column, its block centred on the middle
      // of the screen so the compile reads as happening "in place".
      termX = Math.round(W * 0.14);
      termTop = Math.round(H * 0.5 - (LOG.length * lineH) / 2 + logFs);
      barW = Math.min(560, W * 0.46);
      barH = Math.round(logFs * 0.72);

      buildLogGlyphs();
      buildFraming();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // The boot overlay behind this canvas has a solid background; the power-on
    // bloom reveals the real hero THROUGH cleared canvas pixels, so that
    // background must be dropped exactly when the aperture starts opening
    // (never earlier — it also masks the site while the chunk mounts).
    const overlay = mount.closest<HTMLElement>(".boot-overlay");
    let overlayCleared = false;
    const clearOverlayBg = () => {
      if (overlayCleared) return;
      overlayCleared = true;
      if (overlay) overlay.style.background = "transparent";
    };

    // ---- Act I / II / II.5 — the terminal ----
    const drawTerminal = (t: number) => {
      let ox = 0;
      let oy = 0;
      const jitter =
        (t >= STUTTER_T1 && t < STUTTER_T1 + JITTER_BAND) ||
        (t >= STUTTER_T2 && t < STUTTER_T2 + JITTER_BAND);
      if (jitter) {
        ox = (Math.floor(t * 140) % 2 ? 1 : -1) * JITTER_PX;
        oy = (Math.floor(t * 90) % 2 ? 1 : -1) * JITTER_PX;
      }
      const lift = t >= BAR_START ? 8 * easeOut(clamp01((t - BAR_START) / 0.3)) : 0;

      ctx.save();
      ctx.translate(ox, oy - lift);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = logFont;
      ctx.shadowBlur = 0;

      const count = Math.min(LOG.length, Math.floor(t / LINE_INTERVAL) + 1);
      for (let li = 0; li < count; li++) {
        const ly = termTop + li * lineH;
        const newest = li === count - 1;
        const wipe = newest ? clamp01((t - li * LINE_INTERVAL) / WIPE_DUR) : 1;
        let x = termX;
        const clip = newest && wipe < 1;
        if (clip) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(termX, ly - lineH * 0.82, lineW[li] * easeOut(wipe), lineH);
          ctx.clip();
        }
        for (const s of LOG[li]) {
          ctx.fillStyle = s.c;
          ctx.fillText(s.t, x, ly);
          x += s.t.length * charW;
        }
        if (clip) ctx.restore();
        // blinking caret trailing the newest fully-revealed line
        if (newest && wipe >= 1 && Math.floor(t * CARET_HZ) % 2 === 0) {
          ctx.fillStyle = ACCENT;
          ctx.fillRect(x + 2, ly - lineH * 0.7, charW * 0.62, lineH * 0.74);
        }
      }

      if (t >= BAR_START) drawBar(t);
      ctx.restore();
    };

    const drawBar = (t: number) => {
      const by = termTop + LOG.length * lineH + lineH * 0.5;
      let pct: number;
      if (t >= SNAP_T) {
        pct = 100; // snapped — the beat before the collapse reads "done"
      } else if (t < BAR_END) {
        pct = easeInOut(clamp01((t - BAR_START) / (BAR_END - BAR_START))) * 98;
      } else {
        // stall: 98 → 97 → 98 → 99 flicker, holding the spring before the snap
        pct = [98, 97, 98, 99][Math.floor((t - STALL_START) / 0.05) % 4];
      }
      const frac = pct / 100;

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = logFont;
      ctx.shadowBlur = 0;

      ctx.strokeStyle = DEEPER;
      ctx.lineWidth = 1;
      ctx.strokeRect(termX + 0.5, by + 0.5, barW, barH);
      ctx.fillStyle = DEEP;
      ctx.fillRect(termX, by, barW * frac, barH);
      // segment gaps
      ctx.fillStyle = BG;
      for (let gx = termX + 6; gx < termX + barW * frac; gx += 6) {
        ctx.fillRect(gx, by, 1, barH);
      }
      // leading edge
      ctx.fillStyle = BRIGHT;
      ctx.fillRect(termX + barW * frac - 2, by, 2, barH);

      ctx.fillStyle = NAME_HI;
      ctx.fillText(`${Math.round(pct)}%`, termX + barW + 12, by + barH / 2);

      // pulsing status label below the bar
      const ly = by + barH + lineH * 0.9;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = ACCENT;
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 9);
      ctx.fillText("●", termX, ly);
      ctx.globalAlpha = 1;
      ctx.fillStyle = MUTED;
      ctx.fillText("  link · emitting binary", termX, ly);
    };

    // ---- the phosphor seam — shared by collapse, hold and bloom ----
    const drawSeam = (t: number, intensity: number) => {
      const cy = H / 2;
      // soft glow band around the line
      const glowH = 26 * intensity;
      const g = ctx.createLinearGradient(0, cy - glowH, 0, cy + glowH);
      g.addColorStop(0, "rgba(34,197,94,0)");
      g.addColorStop(0.5, `rgba(92,240,138,${0.32 * intensity})`);
      g.addColorStop(1, "rgba(34,197,94,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, cy - glowH, W, glowH * 2);
      // the line itself, with a faint mains-hum flicker
      const hum = 0.85 + 0.15 * Math.sin(t * 34);
      ctx.fillStyle = NAME_HI;
      ctx.globalAlpha = intensity * hum;
      ctx.fillRect(0, cy - 1, W, 2);
      ctx.globalAlpha = 1;
    };

    // ---- Act IV — CRT collapse: the terminal squishes into the seam ----
    const drawCollapse = (t: number) => {
      const p = clamp01((t - COLLAPSE_T) / COLLAPSE_DUR);
      const sy = Math.max(0.004, 1 - easeIn(p));
      ctx.save();
      // squash toward the centre line, with a slight horizontal stretch —
      // the classic tube-deflection death.
      ctx.translate(W / 2, H / 2);
      ctx.scale(1 + 0.08 * easeIn(p), sy);
      ctx.translate(-W / 2, -H / 2);
      drawTerminal(SNAP_T); // the last full frame, frozen
      ctx.restore();
      drawSeam(t, easeIn(p));
    };

    // ---- Act V — power-on bloom: the aperture opens onto the real site ----
    const drawBloom = (t: number) => {
      clearOverlayBg();
      const p = clamp01((t - SEAM_END_T) / BLOOM_DUR);
      const e = easeOut(p);
      const cy = H / 2;
      const hh = cy * e; // aperture half-height

      // Everything OUTSIDE the aperture stays the page's own dark field, so
      // fully-open means fully gone. Inside is cleared — the live hero.
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      if (cy - hh > 0) ctx.fillRect(0, 0, W, cy - hh);
      if (cy - hh > 0) ctx.fillRect(0, cy + hh, W, cy - hh + 1);

      if (p >= 1) return;
      // green phosphor tint + scanlines burning off the revealed page
      ctx.globalAlpha = 0.1 * (1 - p);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(0, cy - hh, W, hh * 2);
      if (scanTile) {
        const pat = ctx.createPattern(scanTile, "repeat");
        if (pat) {
          ctx.globalAlpha = 0.1 * (1 - p);
          ctx.fillStyle = pat;
          ctx.fillRect(0, cy - hh, W, hh * 2);
        }
      }
      // glowing frontiers of the opening aperture
      ctx.globalAlpha = 0.85 * (1 - p * 0.6);
      ctx.fillStyle = BRIGHT;
      ctx.fillRect(0, cy - hh, W, 1.5);
      ctx.fillRect(0, cy + hh - 1.5, W, 1.5);
      ctx.globalAlpha = 1;
    };

    // CRT framing (scanlines + vignette) — rides along until the collapse
    // squeezes the picture away, then it dies with the tube.
    const drawFraming = (t: number) => {
      const a =
        t < COLLAPSE_T ? 1 : 1 - clamp01((t - COLLAPSE_T) / COLLAPSE_DUR);
      if (a <= 0) return;
      if (scanTile) {
        const pat = ctx.createPattern(scanTile, "repeat");
        if (pat) {
          ctx.globalAlpha = SCAN_DARK_A * a;
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;
        }
      }
      if (vignette) {
        ctx.globalAlpha = a;
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    };

    // ---- frame loop ----
    let startT = -1;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (startT < 0) startT = now;
      const t = (now - startT) / 1000;

      if (t < SEAM_END_T) {
        // screen is still a solid tube — opaque dark field
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, W, H);
        if (t < COLLAPSE_T) {
          drawTerminal(t);
        } else if (t < COLLAPSE_T + COLLAPSE_DUR) {
          drawCollapse(t);
        } else {
          drawSeam(t, 1); // the held seam, humming in the dark
        }
        drawFraming(t);
      } else {
        drawBloom(t);
      }

      // phosphor flash at the snap — masks the bar → collapse swap
      if (t >= SNAP_T && t < SNAP_T + FLASH_DUR) {
        ctx.globalAlpha = FLASH_A * (1 - (t - SNAP_T) / FLASH_DUR);
        ctx.fillStyle = BRIGHT;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      // ignition flash as the aperture starts to open
      if (t >= SEAM_END_T && t < SEAM_END_T + IGNITE_FLASH_DUR) {
        ctx.globalAlpha = IGNITE_FLASH_A * (1 - (t - SEAM_END_T) / IGNITE_FLASH_DUR);
        ctx.fillStyle = NAME_HI;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      if (t >= DONE_T) {
        clearTimeout(safety);
        finish();
        // Stop here: frame() already re-scheduled this rAF at the top, but the
        // aperture is fully open (canvas fully cleared), so the ~30 fullscreen
        // draws that would otherwise run during the 520ms leave/unmount are
        // pure waste landing exactly at the reveal. cleanup() stays as the
        // unmount backstop.
        cancelAnimationFrame(raf);
        return;
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
      if (overlay) overlay.style.background = "";
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [onDone]);

  return (
    <div ref={mountRef} className="absolute inset-0 cursor-pointer" aria-hidden />
  );
}
