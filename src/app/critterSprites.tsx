"use client";

import { motion, type MotionValue } from "framer-motion";

/* Shared pixel-sprite cast — drawn once here, used both by the /lab gallery
   (idling in cells) and by the roaming ambient characters on the real page.
   Every sprite faces +x (right) so a Roamer can mirror it to face travel.
   Idle motion is CSS-keyframed (see CRITTER_KEYFRAMES) so the global
   reduced-motion rule freezes it for free; pupils optionally track a cursor
   via the `look` motion values. */

export const G = "#22c55e"; // accent
export const GB = "#5cf08a"; // bright phosphor
const D = "#0e150e"; // face dark
const D2 = "#06110a"; // deepest
const glow = "drop-shadow(0 0 4px rgba(34,197,94,0.5))";

export type Look = { x: MotionValue<number>; y: MotionValue<number> };

// Keyframes + animation classes. The global prefers-reduced-motion rule zeroes
// all animation durations, so these freeze at their first frame automatically.
export const CRITTER_KEYFRAMES = `
@keyframes cBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes cBob2{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes cBlink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
@keyframes cTail{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
@keyframes cTail2{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}
@keyframes cAnt{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}
@keyframes cLegA{0%,100%{transform:rotate(-17deg)}50%{transform:rotate(17deg)}}
@keyframes cLegB{0%,100%{transform:rotate(17deg)}50%{transform:rotate(-17deg)}}
@keyframes cGlitch{0%,88%,100%{transform:translate(0,0);opacity:1}90%{transform:translate(2px,-1px);opacity:.5}93%{transform:translate(-2px,1px);opacity:.85}96%{transform:translate(1px,0);opacity:.65}}
@keyframes cSquash{0%,100%{transform:translateY(0) scale(1,1)}12%{transform:translateY(3px) scale(1.14,.86)}45%{transform:translateY(-11px) scale(.9,1.12)}72%{transform:translateY(0) scale(1,1)}}
@keyframes cEar{0%,100%{transform:rotate(0)}45%{transform:rotate(-9deg)}}
@keyframes cPulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes cBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
@keyframes cFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.cr-bob{animation:cBob 1.9s ease-in-out infinite;transform-box:fill-box}
.cr-bob2{animation:cBob2 2.3s ease-in-out infinite;transform-box:fill-box}
.cr-float{animation:cFloat 2s ease-in-out infinite;transform-box:fill-box}
.cr-glitch{animation:cGlitch 3.4s steps(1,end) infinite;transform-box:fill-box}
.cr-squash{animation:cSquash 1.5s ease-in-out infinite;transform-box:fill-box}
.cr-breath{animation:cBreath 2.2s ease-in-out infinite;transform-box:fill-box}
.cr-blink{animation:cBlink 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.cr-tail{animation:cTail 1.35s ease-in-out infinite;transform-box:fill-box}
.cr-tail2{animation:cTail2 1.7s ease-in-out infinite;transform-box:fill-box}
.cr-ant{animation:cAnt 0.7s ease-in-out infinite;transform-box:fill-box}
.cr-ear{animation:cEar 2.4s ease-in-out infinite;transform-box:fill-box}
.cr-pulse{animation:cPulse 1.1s ease-in-out infinite}
.cr-legA{animation:cLegA 0.3s ease-in-out infinite;transform-box:fill-box}
.cr-legB{animation:cLegB 0.3s ease-in-out infinite;transform-box:fill-box}
@keyframes cTalkBob{0%,100%{transform:translateY(0)}30%{transform:translateY(-2.5px)}65%{transform:translateY(-0.5px)}}
.cr-talkbob{animation:cTalkBob .5s ease-in-out infinite}
@keyframes cMouth{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.7)}}
.cr-mouth{animation:cMouth .32s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.cr-still .cr-legA,.cr-still .cr-legB{animation-play-state:paused}
`;

/** Injects the shared critter keyframes once. */
export function CritterKeyframes() {
  return <style dangerouslySetInnerHTML={{ __html: CRITTER_KEYFRAMES }} />;
}

const Pupils = ({
  look,
  children,
}: {
  look?: Look;
  children: React.ReactNode;
}) =>
  look ? (
    <motion.g style={{ x: look.x, y: look.y }}>{children}</motion.g>
  ) : (
    <g>{children}</g>
  );

/* ── 1. Droid Mk2 — refined take on the rappel droid (floating drone) ── */
export function DroidMk2({ look }: { look?: Look }) {
  return (
    <svg width={78} height={90} viewBox="0 0 64 74" fill="none" shapeRendering="crispEdges" style={{ filter: glow, display: "block" }}>
      <ellipse cx={32} cy={71} rx={13} ry={2.6} fill="rgba(34,197,94,0.3)" className="cr-pulse" />
      <g className="cr-bob">
        <rect x={31} y={4} width={2} height={8} fill={G} />
        <circle cx={32} cy={3} r={2.4} fill={GB} className="cr-pulse" />
        <rect x={12} y={11} width={40} height={30} rx={6} fill={G} />
        <rect x={16} y={15} width={32} height={22} rx={4} fill={D2} />
        <g className="cr-blink">
          <rect x={21} y={21} width={8} height={9} rx={2} fill={D} />
          <rect x={35} y={21} width={8} height={9} rx={2} fill={D} />
          <Pupils look={look}>
            <rect x={23} y={23} width={4} height={5} rx={1} fill={GB} />
            <rect x={37} y={23} width={4} height={5} rx={1} fill={GB} />
          </Pupils>
        </g>
        <path d="M26 33 Q32 37 38 33" stroke={GB} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <rect x={8} y={23} width={5} height={3} rx={1} fill={G} />
        <rect x={51} y={23} width={5} height={3} rx={1} fill={G} />
        <rect x={18} y={41} width={28} height={16} rx={3} fill={G} />
        <rect x={21} y={44} width={22} height={10} rx={2} fill={D2} />
        <rect x={24} y={47} width={16} height={1.5} fill="rgba(34,197,94,0.4)" />
        <circle cx={32} cy={52} r={1.7} fill={GB} className="cr-pulse" />
      </g>
    </svg>
  );
}

/* ── 2. Beetle Mk2 — refined bug (top-down, facing right, tripod legs) ── */
export function BeetleMk2() {
  const hips = [12, 18, 24];
  return (
    <svg width={66} height={56} viewBox="0 0 52 44" fill="none" shapeRendering="crispEdges" style={{ filter: glow, display: "block" }}>
      <g>
        {hips.map((hx, i) => (
          <g key={`t${i}`} className={i % 2 ? "cr-legA" : "cr-legB"} style={{ transformOrigin: `${hx}px 14px`, animationDelay: `${i * 0.1}s` }}>
            <rect x={hx - 1} y={5} width={2} height={10} fill={G} />
          </g>
        ))}
        {hips.map((hx, i) => (
          <g key={`b${i}`} className={i % 2 ? "cr-legB" : "cr-legA"} style={{ transformOrigin: `${hx}px 30px`, animationDelay: `${i * 0.1}s` }}>
            <rect x={hx - 1} y={29} width={2} height={10} fill={G} />
          </g>
        ))}
      </g>
      <rect x={5} y={12} width={27} height={20} rx={9} fill={G} />
      <rect x={8} y={15} width={20} height={14} rx={6} fill={D} />
      <rect x={14} y={12} width={2} height={20} fill="rgba(92,240,138,0.5)" />
      <rect x={20} y={12} width={2} height={20} fill="rgba(92,240,138,0.32)" />
      <rect x={9} y={20} width={2} height={2} fill={GB} />
      <rect x={31} y={15} width={11} height={14} rx={4} fill={G} />
      <rect x={33} y={17} width={6} height={10} rx={2} fill={D} />
      <rect x={34} y={18} width={2} height={2} fill={GB} />
      <rect x={34} y={24} width={2} height={2} fill={GB} />
      <g className="cr-ant" style={{ transformOrigin: "42px 18px" }}>
        <rect x={41} y={15} width={7} height={2} rx={1} fill={G} />
      </g>
      <g className="cr-ant" style={{ transformOrigin: "42px 26px", animationDelay: "0.2s" }}>
        <rect x={41} y={27} width={7} height={2} rx={1} fill={G} />
      </g>
    </svg>
  );
}

/* ── 3. Terminal Cat — sits, tail flick, ears twitch, blink, eye-track ── */
export function TerminalCat({ look, talking }: { look?: Look; talking?: boolean }) {
  return (
    <svg width={72} height={78} viewBox="0 0 56 60" fill="none" shapeRendering="crispEdges" style={{ filter: glow, display: "block" }}>
      <g className="cr-breath" style={{ transformOrigin: "28px 58px" }}>
        <path d="M17 58 Q13 40 28 38 Q43 40 39 58 Z" fill={G} />
        <path d="M22 57 Q20 45 28 44 Q36 45 34 57 Z" fill={D2} />
        <g className="cr-ear" style={{ transformOrigin: "18px 22px" }}>
          <path d="M14 24 L17 11 L24 20 Z" fill={G} />
        </g>
        <g className="cr-ear" style={{ transformOrigin: "38px 22px", animationDelay: "0.5s" }}>
          <path d="M42 24 L39 11 L32 20 Z" fill={G} />
        </g>
        <rect x={14} y={18} width={28} height={24} rx={10} fill={G} />
        <rect x={17} y={21} width={22} height={17} rx={8} fill={D2} />
        <g className="cr-blink">
          <rect x={21} y={26} width={5} height={7} rx={2} fill={D} />
          <rect x={30} y={26} width={5} height={7} rx={2} fill={D} />
          <Pupils look={look}>
            <rect x={22} y={28} width={3} height={4} rx={1} fill={GB} />
            <rect x={31} y={28} width={3} height={4} rx={1} fill={GB} />
          </Pupils>
        </g>
        <g className={talking ? "cr-mouth" : undefined}>
          <path d="M27 35 L29 35 L28 37 Z" fill={GB} />
        </g>
        <g stroke="rgba(34,197,94,0.5)" strokeWidth={1}>
          <path d="M18 32 L8 30" />
          <path d="M18 35 L8 36" />
          <path d="M38 32 L48 30" />
          <path d="M38 35 L48 36" />
        </g>
      </g>
    </svg>
  );
}

/* ── 4. Daemon — a background-daemon imp (horns, trident, fangs) ── */
export function Daemon({ look, talking }: { look?: Look; talking?: boolean }) {
  return (
    <svg width={72} height={82} viewBox="0 0 56 64" fill="none" shapeRendering="crispEdges" style={{ filter: glow, display: "block" }}>
      <g className="cr-float">
        <g className="cr-tail2" style={{ transformOrigin: "10px 32px" }}>
          <rect x={9} y={16} width={2} height={28} fill={GB} />
          <rect x={5} y={15} width={10} height={2} fill={GB} />
          <path d="M6 16 L6 9 M10 16 L10 7 M14 16 L14 9" stroke={GB} strokeWidth={2} fill="none" />
        </g>
        <path d="M18 60 Q16 42 28 42 Q40 42 38 60 Z" fill={G} />
        <path d="M22 59 Q21 47 28 46 Q35 47 34 59 Z" fill={D2} />
        <path d="M18 20 L14 9 L23 17 Z" fill={G} />
        <path d="M38 20 L42 9 L33 17 Z" fill={G} />
        <rect x={15} y={16} width={26} height={22} rx={9} fill={G} />
        <rect x={18} y={19} width={20} height={16} rx={7} fill={D2} />
        <path d="M20 24 L26 26 M36 24 L30 26" stroke={G} strokeWidth={2} strokeLinecap="round" />
        <g className="cr-blink">
          <Pupils look={look}>
            <rect x={22} y={25} width={4} height={4} rx={1} fill={GB} />
            <rect x={30} y={25} width={4} height={4} rx={1} fill={GB} />
          </Pupils>
        </g>
        <g className={talking ? "cr-mouth" : undefined}>
          <path d="M22 31 q6 4 12 0" stroke={GB} strokeWidth={1.4} fill="none" />
          <path d="M24 31 l1 3 l1 -3 Z" fill={GB} />
          <path d="M31 31 l1 3 l1 -3 Z" fill={GB} />
        </g>
      </g>
    </svg>
  );
}

/* ── 5. Ghost — floating pixel spectre with an occasional glitch ── */
export function Ghost({ look, talking }: { look?: Look; talking?: boolean }) {
  return (
    <svg width={64} height={68} viewBox="0 0 52 56" fill="none" shapeRendering="crispEdges" style={{ filter: glow, display: "block" }}>
      <g className="cr-bob2">
        <g className="cr-glitch">
          <path d="M8 30 Q8 10 26 10 Q44 10 44 30 L44 48 L38 42 L32 48 L26 42 L20 48 L14 42 L8 48 Z" fill="rgba(34,197,94,0.9)" />
          <g className="cr-blink">
            <rect x={18} y={24} width={6} height={8} rx={3} fill={D2} />
            <rect x={28} y={24} width={6} height={8} rx={3} fill={D2} />
            <Pupils look={look}>
              <rect x={20} y={27} width={3} height={4} rx={1} fill={GB} />
              <rect x={30} y={27} width={3} height={4} rx={1} fill={GB} />
            </Pupils>
          </g>
          <g className={talking ? "cr-mouth" : undefined}>
            <ellipse cx={26} cy={38} rx={3} ry={2.4} fill={D2} />
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ── 6. Blob — a bouncing terminal slime, squash-and-stretch ── */
export function Blob({ look, talking }: { look?: Look; talking?: boolean }) {
  return (
    <svg width={64} height={58} viewBox="0 0 52 46" fill="none" shapeRendering="crispEdges" style={{ filter: glow, display: "block" }}>
      <g className="cr-squash" style={{ transformOrigin: "26px 44px" }}>
        <path d="M6 44 Q4 22 26 20 Q48 22 46 44 Z" fill={G} />
        <path d="M11 43 Q10 28 26 26 Q42 28 41 43 Z" fill={D2} />
        <ellipse cx={18} cy={30} rx={3} ry={4} fill="rgba(92,240,138,0.4)" />
        <g className="cr-blink">
          <rect x={18} y={31} width={5} height={7} rx={2} fill={D} />
          <rect x={29} y={31} width={5} height={7} rx={2} fill={D} />
          <Pupils look={look}>
            <rect x={19} y={33} width={3} height={4} rx={1} fill={GB} />
            <rect x={30} y={33} width={3} height={4} rx={1} fill={GB} />
          </Pupils>
        </g>
        <g className={talking ? "cr-mouth" : undefined}>
          <path d="M22 40 q4 3 8 0" stroke={GB} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
