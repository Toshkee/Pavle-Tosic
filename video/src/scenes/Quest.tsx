import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { hash, outExpo, p } from "../lib/motion";
import { CLAY, H, MONO, SANS, W } from "../lib/theme";

/* Toshkee's Quest (/play), drawn again for the film the way the game draws
   itself: a dot-matrix night, the bug and the page as text pixel art
   (quest/sprites.ts), the PixelLab hero from the game's own sprite sheet
   (quest/hero.ts: 124 px cells; idle, death, walk, roll, hurt, attack).
   The slips are the first mission's own lines (quest/missions.ts). */
const GROUND = 770;
const SPEED = 4.5;
const HERO_X = 560;
const SCALE = 3;
const CELL = 124;
const G = 14;

// He leaps a pit, cuts a bug down, picks up the first lost page.
const JUMP = { from: 72, to: 114 };
const PIT = { from: 910, to: 1036 };
const ATTACK = 164;
const HIT = 180;
const PICK = 262;
const PAGE_X = HERO_X + PICK * SPEED + 26;

const BUG = [
  ["..d..d..", ".dddddd.", "dwddddwd", "dddddddd", ".d.dd.d.", "d..dd..d"],
  ["..d..d..", ".dddddd.", "dwddddwd", "dddddddd", "d.dddd.d", ".d.dd.d."],
];
const BUG_PAL: Record<string, string> = { d: CLAY, w: "#ffffff" };
const PAGE = [
  "wwwwww..", "wwwwwww.", "wllllwww", "wwwwwwww", "wllllllw",
  "wwwwwwww", "wlllllww", "wwwwwwww", "wllllllw", "wwwwwwww",
];
const PAGE_PAL: Record<string, string> = { w: "#f4f1e8", l: "#9a9a9a" };

const art = (
  ctx: CanvasRenderingContext2D,
  rows: string[],
  pal: Record<string, string>,
  x: number,
  y: number,
  scale: number,
) => {
  const left = Math.round(x - (rows[0].length * scale) / 2);
  const top = Math.round(y - rows.length * scale);
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (!pal[ch]) return;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(left + c * scale, top + r * scale, scale, scale);
    }),
  );
};

const draw = (ctx: CanvasRenderingContext2D, frame: number) => {
  const cam = frame * SPEED;
  const dot = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#0d0d0e";
  ctx.fillRect(0, 0, W, H);

  // Stars, a few of them warm.
  for (let k = 0; k < 150; k++) {
    const x = (((hash(k) * 2600 - cam * 0.03) % 2000) + 2000) % 2000;
    const y = hash(k + 500) * 500;
    ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(frame / 46 + k));
    ctx.fillStyle = hash(k + 77) < 0.14 ? CLAY : "#6a6a6a";
    dot(x, y, 1.2 + hash(k + 900) * 1.5);
  }

  // A crescent moon, in the scenery's dim coral.
  ctx.fillStyle = CLAY;
  for (let y = -80; y <= 80; y += 10) {
    for (let x = -80; x <= 80; x += 10) {
      if (Math.hypot(x, y) > 76 || Math.hypot(x - 30, y + 12) < 70) continue;
      ctx.globalAlpha = 0.7;
      dot(1690 + x - cam * 0.02, 250 + y, 3.3);
    }
  }

  // Two ridges of hills, the far one slower, their tops lit.
  for (const [pitch, slow, base, a, b, tone, lit] of [
    [12, 0.12, 250, 80, 44, "#232324", 0.3],
    [14, 0.3, 130, 56, 26, "#333335", 0.5],
  ] as const) {
    const off = (cam * slow) % pitch;
    for (let x = -off; x < W + pitch; x += pitch) {
      const wx = x + cam * slow;
      const h = base + a * Math.sin(wx / (pitch * 26)) + b * Math.sin(wx / (pitch * 9) + 1.3);
      const top = GROUND - Math.round(h / pitch) * pitch;
      for (let y = top; y < GROUND; y += pitch) {
        const crest = y === top;
        ctx.fillStyle = crest ? CLAY : tone;
        ctx.globalAlpha = crest ? lit : 1;
        dot(x, y, pitch * 0.2);
      }
    }
  }

  // Pines along the way.
  for (let k = -1; k < 14; k++) {
    const wx = k * 380 + hash(k + 40) * 160;
    const x = wx - cam * 0.6;
    if (x < -120 || x > W + 120) continue;
    const tall = 9 + Math.floor(hash(k + 3) * 6);
    const autumn = hash(k + 21) < 0.3;
    for (let r = 0; r < tall; r++) {
      const half = Math.ceil(((r + 1) / tall) * 4);
      for (let c = -half; c <= half; c++) {
        ctx.fillStyle = autumn && hash(k * 97 + r * 13 + c) > 0.45 ? CLAY : "#4a4a4c";
        ctx.globalAlpha = autumn ? 0.6 : 1;
        dot(x + c * 11, GROUND - 34 - (tall - r) * 11, 3);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#3a3a3c";
    for (let r = 0; r < 3; r++) dot(x, GROUND - 12 - r * 11, 3);
  }

  // The ground he runs on, with a pit whose walls are full coral.
  const off = cam % G;
  for (let x = -off; x < W + G; x += G) {
    const wx = x + cam;
    const ix = Math.round(wx / G);
    const inPit = wx > PIT.from && wx < PIT.to;
    const wall = !inPit && (wx + G > PIT.from && wx < PIT.from + 2 || wx - G < PIT.to && wx > PIT.to - 2);
    for (let row = 0; GROUND + row * G < H + G; row++) {
      if (inPit) break;
      const y = GROUND + row * G;
      if (wall && row < 9) {
        ctx.fillStyle = CLAY;
        ctx.globalAlpha = 1 - row * 0.09;
        dot(x, y, 3.4);
        continue;
      }
      ctx.fillStyle = row === 0 ? "#a4a4a4" : "#505052";
      ctx.globalAlpha = row === 0 ? 1 : Math.max(0.12, 0.8 - row * 0.05) * (0.6 + 0.4 * hash(ix * 31 + row));
      dot(x, y, row === 0 ? 3.4 : 2.6);
    }
    if (inPit || wall) continue;
    ctx.globalAlpha = 1;
    if (hash(ix + 5) > 0.62) {
      ctx.fillStyle = "#7c7c7e";
      dot(x, GROUND - 11, 2.2);
      if (hash(ix + 6) > 0.6) dot(x + 3, GROUND - 21, 1.8);
    }
    if (hash(ix + 9) > 0.95) {
      ctx.fillStyle = CLAY;
      ctx.globalAlpha = 0.85;
      dot(x, GROUND - 24, 2.8);
    }
  }
  ctx.globalAlpha = 1;

  // The bug, walking at him until the sword lands.
  const bugX = HERO_X + 150 + HIT * SPEED + (HIT - frame) * 0.7 - cam;
  if (frame < HIT) {
    art(ctx, BUG[Math.floor(frame / 9) % 2], BUG_PAL, bugX, GROUND - 6 - Math.abs(Math.sin(frame / 6)) * 5, 9);
  } else if (frame < HIT + 44) {
    const t = frame - HIT;
    const at = HERO_X + 150 - t * SPEED;
    ctx.fillStyle = CLAY;
    for (let k = 0; k < 26; k++) {
      const vx = (hash(k + 300) - 0.3) * 15;
      const vy = -5 - hash(k + 400) * 11;
      ctx.globalAlpha = Math.max(0, 1 - t / 44);
      const size = 6 + hash(k + 500) * 8;
      ctx.fillRect(at + vx * t, GROUND - 40 + vy * t + 0.42 * t * t, size, size);
    }
    // The sword's sparks.
    ctx.fillStyle = "#ffffff";
    for (let k = 0; k < 10; k++) {
      ctx.globalAlpha = Math.max(0, 1 - t / 16);
      const angle = hash(k + 600) * Math.PI * 2;
      ctx.fillRect(at + Math.cos(angle) * t * 7, GROUND - 50 + Math.sin(angle) * t * 7, 5, 5);
    }
  }
  ctx.globalAlpha = 1;

  // The lost page, in the blue glow of things to collect.
  const pageX = PAGE_X - cam;
  const pageY = GROUND - 96 + Math.sin(frame / 14) * 9;
  if (frame < PICK) {
    const glow = ctx.createRadialGradient(pageX, pageY - 34, 4, pageX, pageY - 34, 92);
    glow.addColorStop(0, "rgba(47,124,246,.5)");
    glow.addColorStop(1, "rgba(47,124,246,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(pageX - 100, pageY - 130, 200, 200);
    art(ctx, PAGE, PAGE_PAL, pageX, pageY, 7);
  } else if (frame < PICK + 36) {
    const t = frame - PICK;
    for (let k = 0; k < 14; k++) {
      const angle = (k / 14) * Math.PI * 2;
      ctx.globalAlpha = Math.max(0, 1 - t / 36);
      ctx.fillStyle = k % 2 ? "#ffffff" : "#6aa5ff";
      ctx.fillRect(HERO_X + 20 + Math.cos(angle) * t * 5, GROUND - 130 + Math.sin(angle) * t * 5 - t * 1.6, 6, 6);
    }
  }
  ctx.globalAlpha = 1;
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  background: "rgba(26,26,26,.92)",
  border: "1px solid #333",
  borderRadius: 9,
  color: "#d8d8d8",
  fontFamily: MONO,
  fontSize: 18,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  lineHeight: 1,
  padding: "12px 16px",
};

const Slip: React.FC<{ at: number; until?: number; small: string; children: React.ReactNode }> = ({
  at,
  until = 9999,
  small,
  children,
}) => {
  const frame = useCurrentFrame();
  if (frame < at || frame >= until) return null;
  const drop = p(frame, at, 22, outExpo);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 136, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: "#f3efe6",
          color: "#1d1b17",
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 30,
          lineHeight: 1.45,
          textAlign: "center",
          padding: "20px 38px",
          borderRadius: 4,
          boxShadow: "0 18px 44px rgba(0,0,0,.55)",
          clipPath: "polygon(0 3%, 100% 0, 99.2% 100%, 0.8% 97%)",
          transform: `translateY(${(1 - drop) * -22}px) rotate(-1.2deg)`,
          opacity: p(frame, at, 6),
        }}
      >
        {children}
        <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 16, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8378" }}>
          {small}
        </div>
      </div>
    </div>
  );
};

export const Quest: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) draw(ctx, frame);
  });

  // Which cell of the sheet he is in.
  let row = 2;
  let col = Math.floor(frame / 6) % 6;
  let lift = 0;
  if (frame >= JUMP.from && frame < JUMP.to) {
    const t = (frame - JUMP.from) / (JUMP.to - JUMP.from);
    row = 3;
    col = 2;
    lift = Math.sin(Math.PI * t) * 190;
  } else if (frame >= ATTACK && frame < ATTACK + 28) {
    row = 5;
    col = Math.floor((frame - ATTACK) / 4);
  }
  const caption = p(frame, 214, 50, outExpo);
  const out = p(frame, 344, 16);

  return (
    <AbsoluteFill style={{ background: "#0d0d0e", fontFamily: SANS }}>
      <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0 }} />

      <div
        style={{
          position: "absolute",
          left: HERO_X - 64 * SCALE,
          top: GROUND - 92 * SCALE - lift,
          width: CELL * SCALE,
          height: CELL * SCALE,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("images/quest/hero.png")}
          style={{
            position: "absolute",
            left: -col * CELL * SCALE,
            top: -row * CELL * SCALE,
            width: 992 * SCALE,
            height: 744 * SCALE,
            maxWidth: "none",
            imageRendering: "pixelated",
          }}
        />
      </div>

      <div style={{ position: "absolute", left: 48, top: 44, display: "flex", gap: 12 }}>
        <span style={chip}>Toshkee's Quest</span>
        <span style={chip}>Mission 1 of 5</span>
        <span style={{ ...chip, color: CLAY, letterSpacing: "0.2em" }}>♥♥♥</span>
      </div>
      <div style={{ position: "absolute", right: 48, top: 44 }}>
        <span style={chip}>
          Pages{" "}
          <b style={{ color: frame >= PICK ? "#6aa5ff" : "#d8d8d8", transform: `scale(${1 + 0.5 * (p(frame, PICK, 6) - p(frame, PICK + 6, 14))})` }}>
            {frame >= PICK ? 1 : 0} / 5
          </b>
        </span>
      </div>

      <Slip at={22} until={PICK + 8} small="the bad deploy">
        Two in the morning. Someone ran plain wrangler deploy.
      </Slip>
      <Slip at={PICK + 8} small="toshkee's quest">
        Page 1 of 5. /work/reform-fitness is back.
      </Slip>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(13,13,14,.94) 14%, rgba(13,13,14,0) 36%)",
          opacity: caption,
        }}
      />
      <div style={{ position: "absolute", left: 96, bottom: 70, clipPath: "inset(0 -120px)", height: 112 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            color: "#fafafa",
            fontSize: 86,
            lineHeight: "112px",
            fontWeight: 800,
            letterSpacing: "-0.045em",
            transform: `translateY(${(1 - caption) * 105}%)`,
          }}
        >
          And yes, it ships with a game.
          <span style={{ ...chip, fontSize: 22, letterSpacing: "0.04em", textTransform: "none", fontWeight: 400 }}>
            pavletosic.com/play
          </span>
        </div>
      </div>
      <AbsoluteFill style={{ background: "#0a0a0a", opacity: out }} />
    </AbsoluteFill>
  );
};
