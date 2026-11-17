import React from "react";
import { Img, Loop, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { GLYPHS, MARK_ICONS } from "./icons.generated";
import { H, MONO, W, type Theme } from "./theme";
import { useT } from "./stage";
import { type Pt } from "./motion";

/* The site's pieces, redrawn in its own px and classes' values (Landing.tsx,
   QuickQuestions.tsx, AskBar.tsx, globals.css), so a scene can move every
   part of a page on its own. */

/** A Lucide glyph, the ones the site's tiles and buttons use. */
export const Glyph: React.FC<{
  name: string;
  size: number;
  color?: string;
  stroke?: number;
  style?: React.CSSProperties;
}> = ({ name, size, color = "currentColor", stroke = 2, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...style }}
    dangerouslySetInnerHTML={{ __html: GLYPHS[name] }}
  />
);

/** A brand mark from the skills card, by its Iconify id. */
export const Mark: React.FC<{ id: string; size: number; color?: string }> = ({
  id,
  size,
  color,
}) => {
  const icon = MARK_ICONS[id];
  return (
    <svg
      width={(size * icon.w) / icon.h}
      height={size}
      viewBox={`0 0 ${icon.w} ${icon.h}`}
      style={{ display: "block", color }}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
};

/** `.glass` from globals.css. */
export const glass = (t: Theme, blur = 28): React.CSSProperties => ({
  background: t.dark ? "rgba(10,10,10,.55)" : "rgba(255,255,255,.55)",
  border: `1px solid ${t.dark ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.55)"}`,
  boxShadow: t.dark
    ? "inset 0 1px 0 rgba(255,255,255,.08), 0 20px 50px -20px rgba(0,0,0,.6)"
    : "inset 0 1px 0 rgba(255,255,255,.7), 0 20px 50px -20px rgba(0,0,0,.25)",
  backdropFilter: `blur(${blur}px) saturate(1.4)`,
});

/** The frosted pills of the landing's top bar and footer. */
export const pill = (t: Theme): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 999,
  border: `1px solid ${t.line}`,
  background: t.dark ? "rgba(10,10,10,.7)" : "rgba(255,255,255,.7)",
  padding: "8px 14px",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 500,
  color: t.ink,
  backdropFilter: "blur(8px)",
  whiteSpace: "nowrap",
});

export const OpenToWork: React.FC = () => {
  const t = useT();
  return (
    <div style={pill(t)}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: "#10b981" }} />
      Open to work
    </div>
  );
};

export const CvPill: React.FC = () => {
  const t = useT();
  return (
    <div style={pill(t)}>
      <Glyph name="FileText" size={16} />
      CV
    </div>
  );
};

export const ThemeToggle: React.FC<{ pressed?: boolean }> = ({ pressed }) => {
  const t = useT();
  return (
    <div
      style={{
        ...pill(t),
        width: 40,
        height: 40,
        padding: 0,
        justifyContent: "center",
        background: pressed ? t.surface : pill(t).background,
        transform: pressed ? "scale(.94)" : undefined,
      }}
    >
      <Glyph name={t.dark ? "Sun" : "Moon"} size={18} />
    </div>
  );
};

/** The question box: the landing's pill, or the chat's (arrow up). */
export const AskBar: React.FC<{
  width?: number;
  text: string;
  placeholder?: string;
  caret?: boolean;
  /** 0 to 1: the send button going down under a click. */
  press?: number;
  chat?: boolean;
  /** The paperclip the chat shows while it waits for a job ad. */
  attach?: boolean;
  style?: React.CSSProperties;
}> = ({ width = 512, text, placeholder = "Ask me anything…", caret, press = 0, chat, attach, style }) => {
  const t = useT();
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 32) % 2 === 0;
  return (
    <div
      style={{
        width,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        borderRadius: chat ? 28 : 999,
        border: `1px solid ${text ? t.lineStrong : t.line}`,
        background: chat ? t.surface : t.dark ? "rgba(10,10,10,.4)" : "rgba(255,255,255,.4)",
        backdropFilter: chat ? undefined : "blur(16px)",
        padding: chat ? "8px 8px 8px 20px" : "8px 8px 8px 24px",
        ...style,
      }}
    >
      <div
        style={{
          flex: 1,
          fontSize: 16,
          lineHeight: "24px",
          color: t.ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {text ? (
          <span>{text}</span>
        ) : (
          <span style={{ opacity: t.dark ? 0.75 : 0.55 }}>{caret ? "" : placeholder}</span>
        )}
        {caret && (
          <span
            style={{
              display: "inline-block",
              width: 1.5,
              height: 19,
              marginLeft: 1,
              verticalAlign: -3,
              background: t.ink,
              opacity: blink ? 1 : 0,
            }}
          />
        )}
        {!text && caret && <span style={{ opacity: t.dark ? 0.6 : 0.45 }}>{placeholder}</span>}
      </div>
      {attach && (
        <div style={{ width: 40, height: 40, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Glyph name="Paperclip" size={20} color={t.ink} />
        </div>
      )}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          background: t.send,
          display: "grid",
          placeItems: "center",
          opacity: text ? 1 : 0.6,
          transform: `scale(${1 - 0.12 * press})`,
          flexShrink: 0,
        }}
      >
        <Glyph name={chat ? "ArrowUp" : "ArrowRight"} size={20} color="#fff" />
      </div>
    </div>
  );
};

export const TILES = [
  { label: "Me", icon: "Laugh", color: "#329696" },
  { label: "Projects", icon: "BriefcaseBusiness", color: "#3E9858" },
  { label: "Skills", icon: "Layers", color: "#D2694A" },
  { label: "Experience", icon: "Route", color: "#4F7FD9" },
  { label: "Fun", icon: "PartyPopper", color: "#B95F9D" },
  { label: "Contact", icon: "UserRoundSearch", color: "#C19433" },
  { label: "Job fit", icon: "ClipboardCheck", color: "#5E7A8C" },
  { label: "Quest", icon: "Gamepad2", color: "#D94848" },
] as const;

export const Tile: React.FC<{
  label: string;
  icon: string;
  color: string;
  hover?: number;
  style?: React.CSSProperties;
}> = ({ label, icon, color, hover = 0, style }) => {
  const t = useT();
  return (
    <div
      style={{
        width: 106,
        height: 72,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 16,
        border: `1px solid ${hover > 0.5 ? t.lineStrong : t.line}`,
        background: hover > 0.5 ? t.surface : t.dark ? "rgba(10,10,10,.4)" : "rgba(255,255,255,.4)",
        backdropFilter: "blur(16px)",
        ...style,
      }}
    >
      <Glyph name={icon} size={22} color={color} />
      <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 500, color: t.ink }}>
        {label}
      </span>
    </div>
  );
};

/* The site's film (FilmBackdrop.tsx): the kickboxer statue, obsidian for
   dark and marble for light, a wash of the page colour over it as
   `.film::after` lays it. The site's clips are cut to loop, so a long scene
   just starts the clip again. */
const FILM_FRAMES = { dark: 452, light: 260 };
export const Film: React.FC<{
  theme: Theme;
  zoom?: number;
  /** 0 to 1 more of the page colour, for the scenes with type on the film. */
  wash?: number;
}> = ({ theme, zoom = 1, wash = 0 }) => {
  const frame = useCurrentFrame();
  const src = staticFile(theme.dark ? "video/film-dark-wide.mp4" : "video/film-light-wide.mp4");
  const length = theme.dark ? FILM_FRAMES.dark : FILM_FRAMES.light;
  const lap = Math.floor(frame / length);
  const video: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: W,
    height: H,
    objectFit: "cover",
  };
  const mid = theme.dark ? 62 : 32;
  const edge = theme.dark ? 30 : 8;
  const tone = (pct: number) =>
    theme.dark
      ? `rgba(10,10,10,${Math.min(1, pct / 100 + wash * 0.3)})`
      : `rgba(255,255,255,${Math.min(1, pct / 100 + wash * 0.4)})`;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: theme.bg }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
        <Sequence from={lap * length} layout="none">
          <OffthreadVideo muted src={src} style={video} />
        </Sequence>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top, ${tone(70)}, transparent 14%), radial-gradient(ellipse 60% 55% at 50% 45%, ${tone(mid)}, ${tone(edge)})`,
        }}
      />
    </div>
  );
};

/* One of the film's own shots (src/clips): the statue filmed for this
   film, full frame. `rate` plays it faster, `shade` is a CSS background
   laid over it where type has to be read. */
export const Shot: React.FC<{
  src: string;
  rate?: number;
  zoom?: number;
  shade?: string;
  style?: React.CSSProperties;
}> = ({ src, rate = 1, zoom = 1, shade, style }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>
    <OffthreadVideo
      muted
      src={src}
      playbackRate={rate}
      style={{
        position: "absolute",
        inset: 0,
        width: W,
        height: H,
        objectFit: "cover",
        transform: `scale(${zoom})`,
      }}
    />
    {shade && <div style={{ position: "absolute", inset: 0, background: shade }} />}
  </div>
);

/** A looping clip from the site, starting `start` seconds in. */
export const Clip: React.FC<{
  src: string;
  start: number;
  style?: React.CSSProperties;
}> = ({ src, start, style }) => (
  <OffthreadVideo muted src={staticFile(src)} trimBefore={Math.round(start * 60)} style={style} />
);

/* "Thinking…" before the first token, as `.shine` runs it on the site: the
   ink at half strength and a band of full ink sweeping across it every
   1.8 s. Two layers and a mask, because `background-clip: text` painted
   its gradient as a solid bar in some rendered frames. */
export const Thinking: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useT();
  const at = 100 - ((frame % 108) / 108) * 100;
  const band = "linear-gradient(100deg, transparent 40%, #000 50%, transparent 60%)";
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ color: t.ink, opacity: 0.5 }}>Thinking…</span>
      <span
        style={{
          position: "absolute",
          inset: 0,
          color: t.ink,
          WebkitMaskImage: band,
          maskImage: band,
          WebkitMaskSize: "250% 100%",
          maskSize: "250% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: `${at}% 0`,
          maskPosition: `${at}% 0`,
        }}
      >
        Thinking…
      </span>
    </span>
  );
};

/** A small mono note beside the picture: what the viewer is looking at. */
export const Note: React.FC<{
  at: Pt;
  children: React.ReactNode;
  /** 0 to 1. */
  show: number;
  align?: "left" | "right";
  dark?: boolean;
}> = ({ at, children, show, align = "left", dark }) => (
  <div
    style={{
      position: "absolute",
      left: align === "left" ? at.x : undefined,
      right: align === "right" ? W - at.x : undefined,
      top: at.y,
      fontFamily: MONO,
      fontSize: 22,
      lineHeight: "30px",
      letterSpacing: "0.02em",
      color: dark ? "#fafafa" : "#0a0a0a",
      opacity: show,
      transform: `translateY(${(1 - show) * 14}px)`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

export { Img, Loop };
