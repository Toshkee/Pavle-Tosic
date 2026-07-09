"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useAnimationFrame, useMotionValue } from "framer-motion";
import type { Look } from "./critterSprites";

/* Stationed tour guides. Each critter holds ONE fixed post on its home
   section (no roaming) and explains, line by line, how the site is actually
   built — a speech bubble types the words out while the critter bobs and
   works its mouth. The whole script is rAF-driven, so it freezes in hidden
   tabs like every other character, and a click on the critter or the bubble
   skips ahead (or replays a finished tour).

   The page gates the cast to desktop + non-reduced-motion, so nothing here
   needs its own reduced-motion branch. */

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const CPS = 34; // typing speed, chars/sec
const START_DELAY = 1000; // let the section entrance land before speaking
const HOLD_MS = 4200; // dwell on a finished line before the next
const CLOSE_MS = 240; // bubble fade-out (matches guide-out in globals.css)

type Phase = "wait" | "typing" | "hold" | "closing" | "done";

type GuideView = {
  open: boolean;
  closing: boolean;
  line: number;
  shown: number;
  typing: boolean;
};

/* The script engine: walks wait → (typing → hold)×lines → closing → done on
   the shared framer rAF loop. State lives in a ref; React only re-renders on
   actual character/phase changes. */
function useGuideScript(lines: string[]) {
  const [view, setView] = useState<GuideView>({
    open: false,
    closing: false,
    line: 0,
    shown: 0,
    typing: false,
  });
  const s = useRef({ phase: "wait" as Phase, t: 0, line: 0, shown: 0 });

  const commit = () => {
    const { phase, line, shown } = s.current;
    setView({
      open: phase === "typing" || phase === "hold" || phase === "closing",
      closing: phase === "closing",
      line,
      shown,
      typing: phase === "typing",
    });
  };

  useAnimationFrame((_, delta) => {
    const st = s.current;
    if (st.phase === "done") return;
    st.t += Math.min(delta, 60);
    if (st.phase === "wait") {
      if (st.t > START_DELAY) {
        st.phase = "typing";
        st.t = 0;
        commit();
      }
    } else if (st.phase === "typing") {
      const len = lines[st.line].length;
      const target = Math.min(len, Math.floor((st.t / 1000) * CPS));
      if (target !== st.shown) {
        st.shown = target;
        if (st.shown >= len) {
          st.phase = "hold";
          st.t = 0;
        }
        commit();
      }
    } else if (st.phase === "hold") {
      if (st.t > HOLD_MS) {
        if (st.line < lines.length - 1) {
          st.line += 1;
          st.shown = 0;
          st.phase = "typing";
        } else {
          st.phase = "closing";
        }
        st.t = 0;
        commit();
      }
    } else if (st.phase === "closing") {
      if (st.t > CLOSE_MS) {
        st.phase = "done";
        commit();
      }
    }
  });

  // Click: finish the current line, jump to the next, or replay a done tour.
  const advance = () => {
    const st = s.current;
    if (st.phase === "wait" || st.phase === "done") {
      st.phase = "typing";
      st.line = 0;
      st.shown = 0;
    } else if (st.phase === "typing") {
      st.shown = lines[st.line].length;
      st.phase = "hold";
    } else if (st.phase === "hold") {
      if (st.line < lines.length - 1) {
        st.line += 1;
        st.shown = 0;
        st.phase = "typing";
      } else {
        st.phase = "closing";
      }
    } else {
      return; // closing — let it finish
    }
    st.t = 0;
    commit();
  };

  return { ...view, advance };
}

function Bubble({
  text,
  typing,
  closing,
  tail,
  style,
  onClick,
}: {
  text: string;
  typing: boolean;
  closing: boolean;
  tail: "down" | "left";
  style: CSSProperties;
  onClick: () => void;
}) {
  return (
    <div
      aria-hidden
      onClick={onClick}
      style={style}
      className={`guide-bubble font-mono ${
        tail === "left" ? "guide-tail-left" : "guide-tail-down"
      } ${closing ? "guide-bubble-out" : ""}`}
    >
      {text}
      {typing && <span className="guide-caret" />}
    </div>
  );
}

/* Bubble-only variant — the swinging rappel droid keeps its own rig, so its
   commentary is pinned to the stage instead of following the pendulum. */
export function GuideBubble({
  lines,
  style,
  tail = "left",
}: {
  lines: string[];
  style: CSSProperties;
  tail?: "down" | "left";
}) {
  const g = useGuideScript(lines);
  if (!g.open) return null;
  return (
    <Bubble
      text={lines[g.line].slice(0, g.shown)}
      typing={g.typing}
      closing={g.closing}
      tail={tail}
      style={style}
      onClick={g.advance}
    />
  );
}

/* Bubble box used for post clearance checks (matches .guide-bubble metrics —
   a rough height is fine, the check pads by BUBBLE_GAP anyway). */
const BUBBLE_W = 270;
const BUBBLE_H = 88;
const BUBBLE_GAP = 12;
const MIN_BOTTOM = 130; // stays clear of the Ask AI launcher + terminal bar

/* A critter at its post: fixed position, pupils tracking the cursor, a talk
   bob + mouth while its line types, and the bubble floating just above. */
export default function GuideCritter({
  lines,
  post,
  w,
  h,
  children,
}: {
  lines: string[];
  post: { right: number; bottom: number };
  w: number;
  h: number;
  children: (look: Look, talking: boolean) => ReactNode;
}) {
  const g = useGuideScript(lines);
  const [bottom, setBottom] = useState(post.bottom);
  const bottomRef = useRef(post.bottom);
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);

  // Find clear ground: ONE layout scan after the section entrance lands (plus
  // on resize), never per frame. If the default post (or its bubble) sits on
  // copy or media, step through nearby heights and settle on the first clear
  // one; if everything is busy, stay put — the bubble panel is opaque anyway.
  useEffect(() => {
    const fit = () => {
      const rects = Array.from(
        document.querySelectorAll(
          "#content h1, #content h2, #content h3, #content p, #content li, #content a, #content button, #content video, #content img, #content pre"
        ),
        (el) => el.getBoundingClientRect()
      ).filter((r) => r.width > 0 && r.height > 0);
      const W = window.innerWidth;
      const H = window.innerHeight;
      const PAD = 6;
      const candidates = [
        post.bottom,
        post.bottom - 40,
        post.bottom - 70,
        post.bottom + 50,
        post.bottom + 110,
        post.bottom + 180,
      ];
      let next = post.bottom;
      for (const b of candidates) {
        if (b < MIN_BOTTOM || H - b - h - BUBBLE_GAP - BUBBLE_H < 70) continue;
        const cb = { l: W - post.right - w, r: W - post.right, t: H - b - h, b: H - b };
        const bb = {
          l: W - (post.right - 8) - BUBBLE_W,
          r: W - (post.right - 8),
          t: cb.t - BUBBLE_GAP - BUBBLE_H,
          b: cb.t - BUBBLE_GAP,
        };
        const hit = rects.some(
          (r) =>
            (r.left < cb.r + PAD && r.right > cb.l - PAD && r.top < cb.b + PAD && r.bottom > cb.t - PAD) ||
            (r.left < bb.r + PAD && r.right > bb.l - PAD && r.top < bb.b + PAD && r.bottom > bb.t - PAD)
        );
        if (!hit) {
          next = b;
          break;
        }
      }
      bottomRef.current = next;
      setBottom(next);
    };
    // The entrance animation is still translating content for ~600ms — rects
    // measured mid-flight would be offset. Fit once it lands.
    const t = window.setTimeout(fit, 700);
    window.addEventListener("resize", fit);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", fit);
    };
  }, [post.bottom, post.right, w, h]);

  // Pupils aim at the cursor. The post is fixed, so the eye position is pure
  // arithmetic — no layout reads, ever.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth - post.right - w / 2;
      const cy = window.innerHeight - bottomRef.current - h / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy) || 1;
      lookX.set(clamp((dx / d) * 2.6, -2.6, 2.6));
      lookY.set(clamp((dy / d) * 2.4, -2, 2));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [post.right, w, h, lookX, lookY]);

  return (
    <>
      <div
        aria-hidden
        onClick={g.advance}
        title="click me"
        className={g.typing ? "cr-talkbob" : undefined}
        style={{
          position: "fixed",
          right: post.right,
          bottom,
          width: w,
          height: h,
          zIndex: 40,
          cursor: "pointer",
          // the "find clear ground" nudge reads as a little hop, not a teleport
          transition: "bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {children({ x: lookX, y: lookY }, g.typing)}
      </div>
      {g.open && (
        <Bubble
          text={lines[g.line].slice(0, g.shown)}
          typing={g.typing}
          closing={g.closing}
          tail="down"
          style={{
            right: post.right - 8,
            bottom: bottom + h + BUBBLE_GAP,
            transition: "bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onClick={g.advance}
        />
      )}
    </>
  );
}
