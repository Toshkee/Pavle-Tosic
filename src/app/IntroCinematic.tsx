"use client";

import { useEffect, useRef } from "react";

/* One-shot "compile" cinematic — the payoff after the boot screen's
   "system ready — press Enter". Concept: make:name.

     I.   a real build log streams  (lex → parse → typecheck → … → emit),
     II.  a linker bar fills and ramps toward 98 %,
     II.5 it JAMS at 98 % with two micro-stutters (loads the spring),
     III. it SNAPS to 100 %: one phosphor flash washes the screen and every
          source character on the log lifts off its line and freezes mid-air,
     IV.  the frozen code streams inward — arcing, depth-scaled, motion-blurred
          — and WELDS the letters of "Pavle Tošić" out of itself, left-first,
     V.   a CRT ignition (bloom + shockwave ring + scan sweep) fires, a green
          "✓ build passed" stamps in with the role, the CRT framing dilates
          away and the welded name dissolves straight into the real hero.

   Pure canvas-2D (no WebGL / three.js), a single time-driven rAF (a dropped
   frame never desyncs), DPR-capped, viewport-scaled particle counts. Reduced
   motion, a missing 2D context, the skip keys/click, or a stall all converge
   on one onDone() so the visitor is never trapped behind the overlay. The name
   is rasterised in the site's live Mononoki face so the weld lines up with the
   page underneath. Mounted ONLY during the boot overlay's "cinematic" phase. */

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

const NAME = "Pavle Tošić";
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
const WELD_START = 2.02;
const WELD_DUR_EACH = 0.55;
const WELD_STAGGER = 0.26;
const CURL_MULT = 0.42;
const TRAIL_DT = 0.06;
const NAME_SOLID_START = 2.66;
const NAME_SOLID_DUR = 0.22;
const PARTICLE_FADE_DUR = 0.3;
const IGNITE_T = 2.84;
const BLOOM_A = 0.18;
const BLOOM_DUR = 0.11;
const RING_DUR = 0.34;
const RING_MAX_FRAC = 0.62;
const SCAN_SWEEP_DUR = 0.28;
const PASSED_T = 2.98;
const CHECK_DUR = 0.2;
const ROLE_DECODE_DUR = 0.26;
// Hold the fully-resolved name + "build passed" for ~1s before handing off.
const FRAMING_FADE_START = 4.2;
const FRAMING_FADE_END = 4.5;
const HANDOFF_T = 4.3;
const HANDOFF_DUR = 0.18;
const NAME_LIFT = 10;
const DONE_T = 4.46;
const SAFETY_MS = 6000;

// ---- perf / scaling ----
const PCAP_DESKTOP = 170;
const PCAP_MOBILE = 90;
const MOBILE_BP = 640;
const MASK_ALPHA_THRESH = 96;
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
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

type Glyph = { ch: string; x: number; y: number };
type Pt = { x: number; y: number };
type Particle = {
  ch: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  stag: number;
  side: number;
};

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
    // resolved family so the name/log match the page rather than a generic mono.
    const fam =
      getComputedStyle(document.body).fontFamily ||
      'ui-monospace, "SFMono-Regular", Menlo, monospace';

    // ---- layout state (recomputed on resize) ----
    let W = 0;
    let H = 0;
    let isMobile = false;
    let LOG: Seg[][] = LOG_DESKTOP;
    let PCAP = PCAP_DESKTOP;
    let logFs = 13;
    let lineH = 20;
    let charW = 8;
    let logFont = "";
    let glyphFont = "";
    let heroFs = 64;
    let heroFont = "";
    let nameW = 0;
    let nameX = 0;
    let nameBaseY = 0;
    let termX = 0;
    let termTop = 0;
    let barW = 0;
    let barH = 0;
    let logGlyphs: Glyph[] = [];
    let lineW: number[] = [];
    let namePoints: Pt[] = [];
    let particles: Particle[] = [];
    let spawned = false;
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

    // Rasterise the name once to an offscreen canvas and sample its lit pixels
    // into target points — the letterforms the code welds into. CSS-pixel scale
    // (no dpr) so the points map straight onto the dpr-scaled main context.
    const buildNameMask = () => {
      namePoints = [];
      const off = document.createElement("canvas");
      const padX = Math.ceil(heroFs * 0.18);
      off.width = Math.ceil(nameW) + padX * 2;
      off.height = Math.ceil(heroFs * 1.5);
      const o = off.getContext("2d");
      if (!o) return;
      const baseY = Math.round(heroFs * 1.06);
      o.fillStyle = "#fff";
      o.textAlign = "left";
      o.textBaseline = "alphabetic";
      o.font = `700 ${heroFs}px ${fam}`;
      o.fillText(NAME, padX, baseY);
      let data: Uint8ClampedArray;
      try {
        data = o.getImageData(0, 0, off.width, off.height).data;
      } catch {
        return; // tainted/blocked — solid name still renders, weld just no-ops
      }
      const step = Math.max(2, Math.round(heroFs * 0.05));
      const pts: Pt[] = [];
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3] > MASK_ALPHA_THRESH) {
            pts.push({ x: nameX + (x - padX), y: nameBaseY - baseY + y });
          }
        }
      }
      if (pts.length > PCAP) {
        const stride = pts.length / PCAP;
        const out: Pt[] = [];
        for (let i = 0; i < PCAP; i++) out.push(pts[Math.floor(i * stride)]);
        namePoints = out;
      } else {
        namePoints = pts;
      }
      namePoints.sort((a, b) => a.x - b.x); // weld resolves left → right
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
      PCAP = isMobile ? PCAP_MOBILE : PCAP_DESKTOP;

      logFs = Math.max(
        isMobile ? 12 : 11,
        Math.round(Math.min(W, H) * (isMobile ? 0.022 : 0.0165))
      );
      lineH = Math.round(logFs * 1.55);
      logFont = `500 ${logFs}px ${fam}`;
      glyphFont = `600 ${logFs}px ${fam}`;
      ctx.font = logFont;
      charW = ctx.measureText("0").width || logFs * 0.6;

      // Hero name — fit to the left of the column with a right-hand margin.
      heroFs = Math.max(
        30,
        Math.min(92, Math.round(Math.min(W, H) * (isMobile ? 0.082 : 0.088)))
      );
      nameX = Math.round(W * 0.14);
      ctx.font = `700 ${heroFs}px ${fam}`;
      nameW = ctx.measureText(NAME).width;
      const availW = W - nameX - W * 0.06;
      if (nameW > availW) {
        heroFs = Math.max(28, Math.floor((heroFs * availW) / nameW));
        ctx.font = `700 ${heroFs}px ${fam}`;
        nameW = ctx.measureText(NAME).width;
      }
      heroFont = `700 ${heroFs}px ${fam}`;
      nameBaseY = Math.round(H * 0.5);

      // The terminal streams in the same left column the name welds into, the
      // block centred on the name's baseline so the code collapses in place.
      termX = nameX;
      termTop = Math.round(nameBaseY - (LOG.length * lineH) / 2 + logFs);
      barW = Math.min(560, W * 0.46);
      barH = Math.round(logFs * 0.72);

      buildLogGlyphs();
      buildNameMask();
      buildFraming();
      particles = [];
      spawned = false;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const spawnParticles = () => {
      const n = namePoints.length;
      const g = logGlyphs.length;
      if (!n || !g) return;
      const minX = namePoints[0].x;
      const span = Math.max(1, namePoints[n - 1].x - minX);
      particles = namePoints.map((pt, i) => {
        const og = logGlyphs[(i * 7) % g];
        return {
          ch: og.ch,
          sx: og.x,
          sy: og.y,
          tx: pt.x,
          ty: pt.y,
          stag: ((pt.x - minX) / span) * WELD_STAGGER,
          side: i % 2 === 0 ? 1 : -1,
        };
      });
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

    // ---- one glyph of flying code (used for the weld + its motion trails) ----
    const posAt = (p: Particle, prog: number) => {
      const arc = Math.sin(prog * Math.PI);
      return {
        x: lerp(p.sx, p.tx, prog) + arc * heroFs * 0.12 * p.side,
        y: lerp(p.sy, p.ty, prog) + arc * heroFs * CURL_MULT * p.side,
        s: (0.62 + 0.38 * prog) * (1 + arc * 0.18),
      };
    };
    const drawGlyph = (
      ch: string,
      x: number,
      y: number,
      s: number,
      a: number,
      color: string
    ) => {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    };

    // ---- Act III / IV — detonate + weld ----
    const drawWeld = (t: number) => {
      if (!spawned) {
        spawnParticles();
        spawned = true;
      }
      // The code dissolves once the name has ignited, leaving the solid name
      // pristine for the hold + handoff (matches the site's crisp name).
      const pa = 1 - clamp01((t - IGNITE_T) / PARTICLE_FADE_DUR);
      if (pa > 0) {
        ctx.font = glyphFont;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const trails = isMobile ? 1 : 2;
        for (const pr of particles) {
          const prog = clamp01((t - WELD_START - pr.stag) / WELD_DUR_EACH);
          const main = posAt(pr, prog);
          if (prog > 0.04) {
            for (let k = 1; k <= trails; k++) {
              const tp = posAt(pr, Math.max(0, prog - k * TRAIL_DT));
              drawGlyph(pr.ch, tp.x, tp.y, tp.s, (0.5 / (k + 1)) * pa, DEEP);
            }
          }
          const locked = prog > 0.96;
          ctx.shadowColor = ACCENT;
          ctx.shadowBlur = locked ? 0 : 6 * (1 - prog);
          drawGlyph(pr.ch, main.x, main.y, main.s, pa, locked ? NAME_HI : BRIGHT);
        }
        ctx.shadowBlur = 0;
      }

      // the crisp name takes over so legibility never rides on particle spread
      const solid = clamp01((t - NAME_SOLID_START) / NAME_SOLID_DUR);
      if (solid > 0) {
        ctx.save();
        ctx.globalAlpha = solid;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = heroFont;
        ctx.shadowColor = "rgba(92,240,138,0.85)";
        ctx.shadowBlur = heroFs * 0.2;
        ctx.fillStyle = NAME_HI;
        ctx.fillText(NAME, nameX, nameBaseY);
        ctx.restore();
        ctx.shadowBlur = 0;
      }
    };

    // ---- Act V — ignition + "build passed" + role ----
    const drawIgnition = (t: number) => {
      const cx = nameX + nameW / 2;
      const cy = nameBaseY - heroFs * 0.33;
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
      // a single scan-line sweeping down the name
      const sp = clamp01((t - IGNITE_T) / SCAN_SWEEP_DUR);
      if (sp < 1) {
        const y = nameBaseY - heroFs * 0.95 + sp * heroFs * 1.1;
        ctx.fillStyle = BRIGHT;
        ctx.globalAlpha = 0.6 * (1 - sp);
        ctx.fillRect(nameX, y, nameW, 1.5);
        ctx.globalAlpha = 1;
      }
    };

    const drawPassed = (t: number) => {
      const y = nameBaseY + heroFs * 0.62;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = logFont;
      ctx.shadowBlur = 0;

      // self-drawing check mark
      const cp = clamp01((t - PASSED_T) / CHECK_DUR);
      const s = logFs * 0.62;
      const ax = termX;
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

      ctx.fillStyle = ACCENT;
      const tx = ax + s + logFs * 0.5;
      ctx.fillText("build passed", tx, y);
      const bw = ctx.measureText("build passed").width;
      ctx.fillStyle = FAINT;
      ctx.fillText("  ·  ", tx + bw, y);
      const dw = ctx.measureText("  ·  ").width;

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
      ctx.fillText(role, tx + bw + dw, y);
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

      // handoff: lift the welded name a touch as the canvas fades, so it
      // dissolves INTO the hero rather than hard-cutting.
      const hoff = clamp01((t - HANDOFF_T) / HANDOFF_DUR);
      canvas.style.opacity = String(1 - easeIn(hoff));
      const lift = -easeIn(hoff) * NAME_LIFT;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      if (t < SNAP_T) {
        drawTerminal(t);
      } else {
        ctx.save();
        ctx.translate(0, lift);
        drawWeld(t);
        if (t >= IGNITE_T) drawIgnition(t);
        if (t >= PASSED_T) drawPassed(t);
        ctx.restore();
      }

      // phosphor flash at the snap — hides the swap from log to particles
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

      // Hand off mid-fade so the overlay's own fade-out overlaps the last
      // bright name frames (the canvas keeps fading until BootIntro unmounts).
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
