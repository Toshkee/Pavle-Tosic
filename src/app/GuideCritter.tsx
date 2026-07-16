"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode, useState } from "react";
import { useAnimationFrame, useMotionValue } from "framer-motion";
import type { Look } from "./critterSprites";

/* Peeking tour guides. Each critter lives BEHIND the bottom terminal bar
   (z 40 < the bar's z 50) and pops up over its top edge to deliver its
   section's lines — typed into a speech bubble while the critter bobs and
   works its mouth — then sinks back down, leaving a tiny sliver poking out.
   Clicking the sliver (or the critter/bubble mid-script) advances or replays.
   The whole script is rAF-driven, so it freezes in hidden tabs like every
   other character.

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
  lurk: boolean;
  line: number;
  shown: number;
  typing: boolean;
};

/* The script engine: walks wait → (typing → hold)×lines → closing → done on
   the shared framer rAF loop. State lives in a ref; React only re-renders on
   actual character/phase changes. `autoPlay: false` starts the script already
   "done" — the critter lurks and only speaks when clicked. Use it on slides
   whose text runs to the bottom edge, where an auto-opened bubble would sit
   on top of real copy. */
function useGuideScript(lines: string[], autoPlay = true) {
  const [view, setView] = useState<GuideView>({
    open: false,
    closing: false,
    lurk: !autoPlay,
    line: 0,
    shown: 0,
    typing: false,
  });
  const s = useRef({
    phase: (autoPlay ? "wait" : "done") as Phase,
    t: 0,
    line: 0,
    shown: 0,
  });

  const commit = () => {
    const { phase, line, shown } = s.current;
    setView({
      open: phase === "typing" || phase === "hold" || phase === "closing",
      closing: phase === "closing",
      lurk: phase === "done",
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

const BUBBLE_GAP = 12;
const BAR_TOP = 40; // closed terminal bar height the critter hides behind
const PEEK_BOTTOM = 52; // risen: feet still tucked behind the bar
const LURK_PX = 16; // done: head sliver poking over the bar's top edge

/* A critter peeking from behind the bottom terminal bar: rises to speak,
   sinks when the script ends, lurks at LURK_PX for a click-to-replay. */
export default function PeekCritter({
  lines,
  right,
  w,
  h,
  autoPlay,
  children,
}: {
  lines: string[];
  right: number;
  w: number;
  h: number;
  autoPlay?: boolean;
  children: (look: Look, talking: boolean) => ReactNode;
}) {
  const g = useGuideScript(lines, autoPlay);
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);

  // wait → fully hidden below the edge · open → risen · done → lurking
  const started = g.line > 0 || g.shown > 0 || g.open || g.lurk;
  const y = g.open ? PEEK_BOTTOM : started ? BAR_TOP + LURK_PX - h : -h - 24;

  // Pupils aim at the cursor. The post is fixed, so the eye position is pure
  // arithmetic — no layout reads, ever.
  const yRef = useRef(y);
  useEffect(() => {
    yRef.current = y;
  }, [y]);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth - right - w / 2;
      const cy = window.innerHeight - yRef.current - h / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy) || 1;
      lookX.set(clamp((dx / d) * 2.6, -2.6, 2.6));
      lookY.set(clamp((dy / d) * 2.4, -2, 2));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [right, w, h, lookX, lookY]);

  return (
    <>
      <div
        aria-hidden
        onClick={g.advance}
        title="click me"
        className={g.typing ? "cr-talkbob" : undefined}
        style={{
          position: "fixed",
          right,
          bottom: y,
          width: w,
          height: h,
          // Below the terminal bar (z-50): the bar's opaque panel crops the
          // critter's lower body so it reads as emerging from behind it.
          zIndex: 40,
          cursor: "pointer",
          transition: "bottom 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
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
            right: right - 8,
            bottom: PEEK_BOTTOM + h + BUBBLE_GAP,
            zIndex: 40,
          }}
          onClick={g.advance}
        />
      )}
    </>
  );
}
