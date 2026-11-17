import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import frameDark from "../stills/marble-frame-dark.jpg";
import frameStill from "../stills/marble-frame.jpg";
import { linear, mix, outExpo, p } from "../lib/motion";
import { BAR, CLAY, DARK, LIGHT, MONO, SANS } from "../lib/theme";
import { Clip, glass } from "../lib/ui";

/* The work behind the answers, in the statue's marble frame (a still from
   the storyboard, GPT Image 2.6 on Higgsfield: a carved frame with the
   hand wraps round it). The frame stays and the work changes inside it.
   Five projects get a bar each, the ones the site leads with: the client
   work through Vaky, the Infostream company site, the studio's own site and
   CryptoFlow; the other five share the last bar. Each has its demo clip
   (or, where the site has none, its gallery stills) and one number from its
   case study (src/app/projects.ts `kpis`, word for word), on a frosted
   label under the frame. For the three dark sites (Infostream, Vaky.me,
   CryptoFlow) the frame turns to obsidian: the same still edited by
   Seedream 5.0 Pro on Higgsfield, scaled 0.6% so the two windows meet. */
type Project = {
  title: string;
  context: string;
  role: string;
  /** The number, how it counts up, and what it counts. */
  value: number;
  suffix?: string;
  label: [string, string];
  url: string | null;
  /** A demo clip and where to start it, or the gallery stills to page through. */
  clip?: { src: string; start: number };
  stills?: string[];
  ratio: number;
  phone?: boolean;
  /** A dark site: the frame turns to obsidian for it. */
  dark?: boolean;
};

const PROJECTS: Project[] = [
  {
    title: "Reform Fitness",
    context: "Vaky, October 2026",
    role: "Solo build, client work",
    value: 919,
    label: ["tests", "in 98 files"],
    url: null,
    clip: { src: "video/projects/reform-fitness.mp4", start: 5.6 },
    ratio: 720 / 1558,
    phone: true,
  },
  {
    title: "Distinct",
    context: "Vaky, October 2026",
    role: "Solo build, client work",
    value: 23,
    label: ["case study pages", "each in two languages"],
    url: "distinct.co.me",
    stills: ["distinct", "distinct-services", "distinct-work"],
    ratio: 1.6,
  },
  {
    title: "Infostream",
    dark: true,
    context: "Infostream, May to October 2026",
    role: "Solo build, the company's own site",
    value: 301,
    label: ["translated strings", "per language, parity checked"],
    url: "infostream.co.me",
    clip: { src: "video/projects/infostream.mp4", start: 0.5 },
    ratio: 1.6,
  },
  {
    title: "Vaky.me",
    dark: true,
    context: "Vaky, since August 2026",
    role: "Solo build, own studio",
    value: 24,
    label: ["API endpoints", "Pages Functions"],
    url: "vaky.me",
    stills: ["vaky", "vaky-work", "vaky-motion"],
    ratio: 1.6,
  },
  {
    title: "CryptoFlow",
    dark: true,
    context: "General Assembly, rebuilt 2026",
    role: "Solo build",
    value: 125,
    suffix: "×",
    label: ["leverage, from 1×", "settled server-side"],
    url: "cryptofloww.netlify.app",
    clip: { src: "video/projects/cryptoflow.mp4", start: 5.3 },
    ratio: 1.6,
  },
];

// The other five, together on the last bar.
const MORE = [
  { title: "Ronin Duel", clip: "ronin-duel", start: 3.2 },
  { title: "Arc: Anime Tracker", clip: "anime-watchlist", start: 1.7 },
  { title: "Meet2Explore", clip: "meet2explore", start: 1.0 },
  { title: "Villa Vučje", clip: "villa-vucje", start: 1.0 },
  { title: "Mandarina, Petrovac", clip: "mandarina-petrovac", start: 1.0 },
];

/** A line of type that rises out of its own slot. */
const Rise: React.FC<{
  at: number;
  out: number;
  height: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, out, height, children, style }) => {
  const frame = useCurrentFrame();
  const up = p(frame, at, 40, outExpo);
  const away = p(frame, out, 10, linear);
  return (
    <div style={{ clipPath: "inset(0 -120px)", height, ...style }}>
      <div style={{ transform: `translateY(${(1 - up) * 105 - away * 105}%)` }}>{children}</div>
    </div>
  );
};

// The frame's window on the 1920x1080 film (measured on the still: the
// flat grey inside the carved moulding).
const WIN = { left: 466, top: 254, width: 990, height: 554 };
const MID = { x: WIN.left + WIN.width / 2, y: WIN.top + WIN.height / 2 };
const LABEL_TOP = 856;

/** Gallery stills, one pushing the last up and out, like pages scrolled. */
const Stills: React.FC<{ names: string[]; width: number; height: number }> = ({
  names,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  const each = (BAR - 6) / names.length;
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden" }}>
      {names.map((name, i) => {
        const inn = i === 0 ? 1 : p(frame, i * each, 22, outExpo);
        const out = i === names.length - 1 ? 0 : p(frame, (i + 1) * each, 22, outExpo);
        return (
          <Img
            key={name}
            src={staticFile(`images/projects/${name}.webp`)}
            style={{
              position: "absolute",
              inset: 0,
              width,
              height,
              objectFit: "cover",
              objectPosition: "top",
              transform: `translateY(${(1 - inn) * 100 - out * 30}%) scale(${1.04 - 0.04 * p(frame, i * each, each, linear)})`,
            }}
          />
        );
      })}
    </div>
  );
};

/** What fills the window: wiped in from the right over the one before. */
const Window: React.FC<{ children: React.ReactNode; background?: string }> = ({ children, background }) => {
  const frame = useCurrentFrame();
  const enter = p(frame, 0, 34, outExpo);
  return (
    <div
      style={{
        position: "absolute",
        ...WIN,
        overflow: "hidden",
        background: background ?? "#d6d4d0",
        clipPath: `inset(0 0 0 ${(1 - enter) * 100}%)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1.06 - 0.06 * enter})` }}>{children}</div>
      {/* The window's inner shadow, so the work sits in the stone. */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 6px 18px rgba(0,0,0,.28)" }} />
    </div>
  );
};

/** The frosted label under the frame: number, title, figure, what it counts. */
const Label: React.FC<{ index: string; dark?: boolean; children: React.ReactNode }> = ({
  index,
  dark,
  children,
}) => {
  const frame = useCurrentFrame();
  const up = p(frame, 6, 40, outExpo);
  const leave = p(frame, BAR - 9, 9, linear);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: LABEL_TOP,
        display: "flex",
        justifyContent: "center",
        opacity: up * (1 - leave),
        transform: `translateY(${(1 - up) * 24}px)`,
      }}
    >
      <div
        style={{
          ...glass(dark ? DARK : LIGHT, 18),
          color: dark ? DARK.ink : LIGHT.ink,
          display: "flex",
          alignItems: "baseline",
          gap: 22,
          borderRadius: 999,
          padding: "16px 34px",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: 20, letterSpacing: "0.12em", color: CLAY }}>{index}</span>
        {children}
      </div>
    </div>
  );
};

const Beat: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const frame = useCurrentFrame();
  const count = Math.round(project.value * p(frame, 8, 46, outExpo));
  const media = (width: number, height: number) =>
    project.clip ? (
      <Clip
        src={project.clip.src}
        start={project.clip.start}
        style={{ width, height, display: "block", objectFit: "cover", objectPosition: "top" }}
      />
    ) : (
      <Stills names={project.stills ?? []} width={width} height={height} />
    );
  // A phone screen stands upright in the middle, its other two screens
  // either side.
  const phoneH = WIN.height - 44;
  const phoneW = phoneH * project.ratio;
  return (
    <AbsoluteFill>
      <Window background={project.phone ? "#e7e5e1" : undefined}>
        {project.phone ? (
          <>
            {[
              { shot: "reform-fitness-schedule", x: -300 },
              { shot: "reform-fitness-panel", x: 300 },
            ].map(({ shot, x }) => (
              <Img
                key={shot}
                src={staticFile(`images/projects/${shot}.webp`)}
                style={{
                  position: "absolute",
                  left: (WIN.width - phoneW) / 2 + x,
                  top: 22 + 30,
                  width: phoneW * 0.9,
                  height: phoneH * 0.9,
                  objectFit: "cover",
                  objectPosition: "top",
                  borderRadius: 26,
                  opacity: 0.6,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: (WIN.width - phoneW) / 2,
                top: 22,
                width: phoneW,
                height: phoneH,
                borderRadius: 30,
                overflow: "hidden",
                boxShadow: "0 30px 60px -20px rgba(0,0,0,.45)",
              }}
            >
              {media(phoneW, phoneH)}
            </div>
          </>
        ) : (
          media(WIN.width, WIN.height)
        )}
      </Window>
      <Label index={`0${index + 1}`} dark={project.dark}>
        <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>{project.title}</span>
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: CLAY,
            fontVariantNumeric: "tabular-nums",
            minWidth: `${String(project.value).length + (project.suffix ? 1 : 0)}ch`,
          }}
        >
          {count.toLocaleString("en-US")}
          {project.suffix}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 19 }}>
          {project.label[0]}, {project.label[1]}
        </span>
      </Label>
      {project.phone && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: LABEL_TOP + 84,
            textAlign: "center",
            fontFamily: MONO,
            fontSize: 16,
            opacity: p(frame, 30, 20) * (1 - p(frame, BAR - 9, 9, linear)),
          }}
        >
          a private app: its demo build, with made-up members
        </div>
      )}
    </AbsoluteFill>
  );
};

/** The last bar: the other five, cut in the window half a beat each. */
const More: React.FC = () => {
  const frame = useCurrentFrame();
  const each = Math.floor((BAR - 10) / MORE.length);
  const now = Math.min(MORE.length - 1, Math.floor(frame / each));
  const item = MORE[now];
  return (
    <AbsoluteFill>
      <Window>
        {MORE.map((m, i) =>
          i === now ? (
            <Clip
              key={m.clip}
              src={`video/projects/${m.clip}.mp4`}
              start={m.start}
              style={{ width: WIN.width, height: WIN.height, display: "block", objectFit: "cover", objectPosition: "top" }}
            />
          ) : null,
        )}
      </Window>
      <Label index="06 to 10">
        <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em" }}>And five more</span>
        <span style={{ fontFamily: MONO, fontSize: 19 }}>{item.title}</span>
      </Label>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: LABEL_TOP + 84,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 17,
          opacity: p(frame, 30, 20) * (1 - p(frame, BAR - 9, 9, linear)),
        }}
      >
        all ten, each with what broke, at pavletosic.com/work
      </div>
    </AbsoluteFill>
  );
};

export const Work: React.FC = () => {
  const frame = useCurrentFrame();
  const wipe = p(frame, 0, 26, outExpo);
  const total = BAR * (PROJECTS.length + 2);
  // The whole frame eases in toward the window over the scene.
  const push = mix(1.08, 1, p(frame, 0, total, linear));
  // Obsidian while a dark site is in the window, eased over its wipe.
  const darkness = PROJECTS.reduce((sum, project, i) => {
    const prevDark = i > 0 && PROJECTS[i - 1].dark;
    if (!project.dark || prevDark) return sum;
    let end = i;
    while (end + 1 < PROJECTS.length && PROJECTS[end + 1].dark) end++;
    return sum + p(frame, BAR + i * BAR, 34, outExpo) - p(frame, BAR + (end + 1) * BAR, 34, outExpo);
  }, 0);
  return (
    <AbsoluteFill
      style={{
        fontFamily: SANS,
        color: LIGHT.ink,
        background: "#e9e7e3",
        clipPath: wipe < 1 ? `inset(${(1 - wipe) * 100}% 0 0 0)` : undefined,
      }}
    >
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `${MID.x}px ${MID.y}px` }}>
        <Img src={frameStill} style={{ position: "absolute", left: 0, top: -3, width: 1920, height: 1086 }} />
        <Img
          src={frameDark}
          style={{ position: "absolute", left: 0, top: -3, width: 1920, height: 1086, opacity: darkness }}
        />

        {/* One bar of title, in the empty frame. */}
        <Sequence durationInFrames={BAR} layout="none">
          <div
            style={{
              position: "absolute",
              ...WIN,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Rise at={10} out={BAR - 12} height={110}>
              <div style={{ fontSize: 92, lineHeight: "110px", fontWeight: 800, letterSpacing: "-0.045em" }}>
                Ten projects
              </div>
            </Rise>
            <Rise at={18} out={BAR - 11} height={110}>
              <div
                style={{
                  fontSize: 92,
                  lineHeight: "110px",
                  fontWeight: 800,
                  letterSpacing: "-0.045em",
                  color: "#6b6b72",
                }}
              >
                behind every answer.
              </div>
            </Rise>
          </div>
        </Sequence>

        {PROJECTS.map((project, i) => (
          // Each stays a little past its bar, under the next one's wipe.
          <Sequence key={project.title} from={BAR + i * BAR} durationInFrames={BAR + 34} layout="none">
            <Beat project={project} index={i} />
          </Sequence>
        ))}
        <Sequence from={BAR + PROJECTS.length * BAR} durationInFrames={BAR} layout="none">
          <More />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
