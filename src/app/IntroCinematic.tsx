"use client";

import { useEffect, useRef } from "react";

/* One-shot "compile" cinematic — the payoff after the boot screen's
   "system ready — press Enter". Concept: make:brand.

     I.   a real build log streams  (lex → parse → typecheck → … → emit),
     II.  a linker bar fills and ramps toward 98 %,
     II.5 it JAMS at 98 % with two micro-stutters (loads the spring),
     III. it SNAPS to 100 %: one phosphor flash washes the screen,
     IV.  the brand LOGO POPS in — centred, scaling up with a little overshoot —
          as the compiled artifact, on a soft phosphor glow,
     V.   a CRT ignition (bloom + shockwave ring + scan sweep) fires from the
          logo, a green "✓ build passed" stamps in with the role beneath it, the
          CRT framing dilates away and the logo dissolves into the real hero.

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

const ROLE = "software developer";
const SCRAMBLE = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789!<>/{}[]=+*#%&";

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
// Act IV — the logo pops in as the compiled artifact.
const LOGO_SRC = "/images/pavle-logo.png";
const LOGO_ASPECT = 482 / 560; // h / w of the transparent asset
// The art's alpha-weighted centre sits right & slightly low of its bounding box
// (the body/arm/coin outweigh the faint motion streaks on the left), so we place
// THAT point — not the box centre — at screen centre, or it reads as off-centre.
const LOGO_CX = 0.618;
const LOGO_CY = 0.516;
const LOGO_POP_T = 1.95;
const LOGO_POP_DUR = 0.5;
// Act V — ignition + "build passed" fire from the settled logo.
const IGNITE_T = 2.3;
const BLOOM_A = 0.18;
const BLOOM_DUR = 0.11;
const RING_DUR = 0.34;
const RING_MAX_FRAC = 0.62;
const SCAN_SWEEP_DUR = 0.28;
const PASSED_T = 2.52;
const CHECK_DUR = 0.2;
const ROLE_DECODE_DUR = 0.26;
// Hold the logo + "build passed" before handing off to the hero.
const FRAMING_FADE_START = 4.2;
const FRAMING_FADE_END = 4.5;
const HANDOFF_T = 4.3;
const HANDOFF_DUR = 0.18;
const LOGO_LIFT = 10;
const DONE_T = 4.46;
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
// overshoot-and-settle, for the logo pop
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

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

    // Preload the brand logo that pops in for the reveal. If it never loads,
    // drawLogo just no-ops and the rest of the cinematic is unaffected.
    const logo = new Image();
    let logoReady = false;
    logo.onload = () => {
      logoReady = true;
    };
    logo.src = LOGO_SRC;

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

    // Shared centred rect for the logo + its ignition + the caption beneath, so
    // the three stay aligned across resizes.
    const logoRect = () => {
      const maxW = W * (isMobile ? 0.82 : 0.5);
      const maxH = H * (isMobile ? 0.44 : 0.56);
      let w = maxW;
      let h = w * LOGO_ASPECT;
      if (h > maxH) {
        h = maxH;
        w = h / LOGO_ASPECT;
      }
      return { cx: W / 2, cy: H * 0.44, w, h };
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
      if (t < BAR_END) {
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

    // ---- Act IV — the logo pops in, centred ----
    const drawLogo = (t: number) => {
      if (!logoReady || t < LOGO_POP_T) return;
      const p = clamp01((t - LOGO_POP_T) / LOGO_POP_DUR);
      const { cx, cy, w, h } = logoRect();
      const scale = 0.55 + 0.45 * easeOutBack(p);
      const alpha = easeOut(clamp01(p * 1.5));
      const dw = w * scale;
      const dh = h * scale;

      // Soft phosphor glow behind the logo so it seats on the green-black field.
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, dw * 0.6);
      glow.addColorStop(0, "rgba(34,197,94,0.28)");
      glow.addColorStop(1, "rgba(34,197,94,0)");
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = glow;
      ctx.fillRect(cx - dw, cy - dh, dw * 2, dh * 2);
      // Offset so the art's visual centroid — not its bounding box — lands at
      // (cx, cy), which is where the glow, ring and caption are all centred.
      ctx.drawImage(logo, cx - LOGO_CX * dw, cy - LOGO_CY * dh, dw, dh);
      ctx.restore();
    };

    // ---- Act V — ignition (ring + scan) firing from the logo ----
    const drawIgnition = (t: number) => {
      const { cx, cy, w, h } = logoRect();
      // shockwave ring
      const rp = clamp01((t - IGNITE_T) / RING_DUR);
      if (rp < 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, rp * Math.min(W, H) * RING_MAX_FRAC, 0, Math.PI * 2);
        ctx.strokeStyle = BRIGHT;
        ctx.globalAlpha = 0.5 * (1 - rp);
        ctx.lineWidth = 2 * (1 - rp) + 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // a single scan-line sweeping down the logo
      const sp = clamp01((t - IGNITE_T) / SCAN_SWEEP_DUR);
      if (sp < 1) {
        const y = cy - h / 2 + sp * h;
        ctx.fillStyle = BRIGHT;
        ctx.globalAlpha = 0.5 * (1 - sp);
        ctx.fillRect(cx - (w * 0.9) / 2, y, w * 0.9, 1.5);
        ctx.globalAlpha = 1;
      }
    };

    // ---- Act V — "✓ build passed · role", centred under the logo ----
    const drawPassed = (t: number) => {
      const { cx, cy, h } = logoRect();
      const y = cy + h / 2 + logFs * 2.0;
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = logFont;
      ctx.shadowBlur = 0;

      const s = logFs * 0.62;
      const checkGap = logFs * 0.5;
      const bpW = ctx.measureText("build passed").width;
      const dotW = ctx.measureText("  ·  ").width;
      const roleW = ctx.measureText(ROLE).width; // stable (monospace, fixed len)
      const startX = cx - (s + checkGap + bpW + dotW + roleW) / 2;

      // self-drawing check mark
      const cp = clamp01((t - PASSED_T) / CHECK_DUR);
      const ax = startX;
      const ay = y - s * 0.5;
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = Math.max(1.5, logFs * 0.13);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const k1 = clamp01(cp / 0.4);
      const k2 = clamp01((cp - 0.4) / 0.6);
      ctx.moveTo(ax, ay + s * 0.55);
      ctx.lineTo(ax + s * 0.32 * k1, ay + s * 0.55 + s * 0.32 * k1);
      if (k2 > 0) {
        ctx.lineTo(ax + s * 0.32 + s * 0.7 * k2, ay + s * 0.87 - s * 0.92 * k2);
      }
      ctx.stroke();

      const tx = startX + s + checkGap;
      ctx.fillStyle = ACCENT;
      ctx.fillText("build passed", tx, y);
      ctx.fillStyle = FAINT;
      ctx.fillText("  ·  ", tx + bpW, y);

      // role decodes once, left → right
      const rp = clamp01((t - PASSED_T - 0.05) / ROLE_DECODE_DUR);
      let role = "";
      for (let i = 0; i < ROLE.length; i++) {
        role +=
          i / ROLE.length < rp || ROLE[i] === " "
            ? ROLE[i]
            : SCRAMBLE[(Math.floor(t * 22) + i * 7) % SCRAMBLE.length];
      }
      ctx.fillStyle = MUTED;
      ctx.fillText(role, tx + bpW + dotW, y);
      ctx.restore();
    };

    const drawFraming = (t: number) => {
      let a = 1;
      if (t >= FRAMING_FADE_START) {
        a = clamp01(
          1 - (t - FRAMING_FADE_START) / (FRAMING_FADE_END - FRAMING_FADE_START)
        );
      }
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

      // handoff: lift the logo a touch as the canvas fades, so it dissolves
      // INTO the hero rather than hard-cutting.
      const hoff = clamp01((t - HANDOFF_T) / HANDOFF_DUR);
      canvas.style.opacity = String(1 - easeIn(hoff));
      const lift = -easeIn(hoff) * LOGO_LIFT;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      if (t < SNAP_T) {
        drawTerminal(t);
      } else {
        ctx.save();
        ctx.translate(0, lift);
        drawLogo(t);
        if (t >= IGNITE_T) drawIgnition(t);
        if (t >= PASSED_T) drawPassed(t);
        ctx.restore();
      }

      // phosphor flash at the snap — masks the swap from log to logo
      if (t >= SNAP_T && t < SNAP_T + FLASH_DUR) {
        ctx.globalAlpha = FLASH_A * (1 - (t - SNAP_T) / FLASH_DUR);
        ctx.fillStyle = BRIGHT;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      // CRT ignition bloom
      if (t >= IGNITE_T && t < IGNITE_T + BLOOM_DUR) {
        ctx.globalAlpha = BLOOM_A * (1 - (t - IGNITE_T) / BLOOM_DUR);
        ctx.fillStyle = NAME_HI;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      drawFraming(t);

      // Hand off mid-fade so the overlay's own fade-out overlaps the last bright
      // logo frames (the canvas keeps fading until BootIntro unmounts).
      if (t >= DONE_T) {
        clearTimeout(safety);
        finish();
        // Stop here: frame() already re-scheduled this rAF at the top, but the
        // canvas is fully faded out now, so the ~30 fullscreen draws that would
        // otherwise run during the 520ms leave/unmount are pure waste landing
        // exactly at the reveal. cleanup() stays as the unmount backstop.
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
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [onDone]);

  return (
    <div ref={mountRef} className="absolute inset-0 cursor-pointer" aria-hidden />
  );
}
