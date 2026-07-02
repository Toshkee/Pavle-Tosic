"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { bugPos, droidPos } from "./characterBus";

/* A pixel "bug" (dev pun) that crawls all over the page — wandering the whole
   viewport in 2D, rotating to face where it's headed, ducking behind the text
   and back on top (z-layer toggle), trotting over to greet the cursor, hopping
   away startled from clicks, and occasionally visiting the droid to say hi. */

const SIZE = 44; // sprite box (SIZE×SIZE), rotated about its centre
const HALF = SIZE / 2;

const KEYFRAMES = `
@keyframes ptLeg    { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
@keyframes ptLegAlt { 0%,100%{transform:rotate(15deg)} 50%{transform:rotate(-15deg)} }
@keyframes ptAnt    { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} }
.pt-stand .pt-legs g { animation-play-state: paused }
`;

const legStyle = (hx: number, hy: number, alt: boolean, delay: number, walk: boolean) => ({
  transformBox: "view-box" as const,
  transformOrigin: `${hx}px ${hy}px`,
  animation: walk ? `${alt ? "ptLegAlt" : "ptLeg"} 0.42s ease-in-out infinite` : undefined,
  animationDelay: `${delay}s`,
});

/* Top-down beetle, drawn facing +x (right). Blocky / crisp-edged. */
function BugSprite({ walk }: { walk: boolean }) {
  const hips = [16, 22, 28];
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 44 44" fill="none" shapeRendering="crispEdges"
      style={{ display: "block", filter: "drop-shadow(0 0 3px rgba(34,197,94,0.55))" }}>
      {/* legs — top row + bottom row, tripod-alternating; the .pt-legs group
          pauses (via the container's .pt-stand class) whenever the bug stands
          still, while the antennae keep sniffing */}
      <g className="pt-legs">
        {hips.map((hx, i) => (
          <g key={`t${i}`} style={legStyle(hx, 15, i % 2 === 0, i * 0.14, walk)}>
            <rect x={hx - 1} y={7} width={2} height={9} fill="#22c55e" />
          </g>
        ))}
        {hips.map((hx, i) => (
          <g key={`b${i}`} style={legStyle(hx, 29, i % 2 === 1, i * 0.14, walk)}>
            <rect x={hx - 1} y={28} width={2} height={9} fill="#22c55e" />
          </g>
        ))}
      </g>

      {/* abdomen */}
      <rect x={6} y={15} width={22} height={14} fill="#22c55e" />
      <rect x={8} y={17} width={18} height={10} fill="#0e150e" />
      <rect x={14} y={15} width={2} height={14} fill="rgba(34,197,94,0.4)" />
      <rect x={20} y={15} width={2} height={14} fill="rgba(34,197,94,0.4)" />
      <rect x={9} y={20} width={2} height={2} fill="#5cf08a" />{/* tail light */}

      {/* head */}
      <rect x={28} y={17} width={9} height={10} fill="#22c55e" />
      <rect x={30} y={19} width={5} height={6} fill="#0e150e" />
      <rect x={31} y={16} width={2} height={2} fill="#5cf08a" />{/* eyes */}
      <rect x={31} y={26} width={2} height={2} fill="#5cf08a" />

      {/* antennae */}
      <g style={{ transformBox: "view-box", transformOrigin: "37px 18px",
        animation: walk ? "ptAnt 0.9s ease-in-out infinite" : undefined }}>
        <rect x={37} y={15} width={5} height={2} fill="#22c55e" />
      </g>
      <g style={{ transformBox: "view-box", transformOrigin: "37px 26px",
        animation: walk ? "ptAnt 0.9s ease-in-out infinite" : undefined, animationDelay: "0.2s" }}>
        <rect x={37} y={27} width={5} height={2} fill="#22c55e" />
      </g>
    </svg>
  );
}

export default function WalkingBug({
  overZ = 45,
  underZ = 0,
}: {
  // z when crawling OVER the text / UNDER it. The real page passes its own
  // layers so the bug stays above the ambient bg but below the nav/terminal.
  overZ?: number;
  underZ?: number;
} = {}) {
  const reduce = useReducedMotion() ?? false;
  const walk = !reduce;
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(160); // sprite top-left
  const y = useMotionValue(260);
  const heading = useMotionValue(0);
  const headingSpring = useSpring(heading, { stiffness: 55, damping: 13 });
  const headingCont = useRef(0);
  const target = useRef({ x: 160, y: 260 });
  const pauseUntil = useRef(0);
  const cursor = useRef<{ x: number; y: number; t: number } | null>(null);
  const startledUntil = useRef(0); // click nearby → hop + dash away
  const visiting = useRef(false); // currently strolling over to the droid
  const nextVisit = useRef(0);
  const standing = useRef(false); // mirrors the .pt-stand class (freezes legs)
  const scale = useMotionValue(1); // top-down "hop" reads as a scale pulse

  const setStanding = (s: boolean) => {
    if (standing.current === s) return;
    standing.current = s;
    containerRef.current?.classList.toggle("pt-stand", s);
  };

  // A happy 360° spin ("trick"), layered on top of the heading rotation —
  // the bug's answer to the droid's backflip.
  const spin = useMotionValue(0);
  const spinning = useRef(false);
  const lastSpin = useRef(0);
  const spriteRotate = useTransform(
    [headingSpring, spin],
    (v: number[]) => v[0] + v[1] * 360,
  );

  const doSpin = () => {
    if (reduce || spinning.current) return;
    spinning.current = true;
    animate(spin, 1, {
      duration: 0.55,
      ease: [0.4, 0, 0.5, 1],
      onComplete: () => {
        spin.set(0);
        spinning.current = false;
      },
    });
  };

  const pickTarget = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const m = 24;
    target.current = {
      x: m + Math.random() * (w - SIZE - 2 * m),
      y: m + Math.random() * (h - SIZE - 2 * m),
    };
  };

  useEffect(() => {
    if (!walk) return;
    pickTarget();
    // First droid visit lands within the visitor's first ~10s so the meetup
    // is actually seen; later ones are spaced out (but not too far).
    nextVisit.current = Date.now() + 6000 + Math.random() * 4000;
    return () => {
      bugPos.active = false;
    };
  }, [walk]);

  useAnimationFrame((_, delta) => {
    if (!walk) return;
    const dt = Math.min(delta, 60) / 1000;
    const now = Date.now();

    const cx = x.get();
    const cy = y.get();
    // publish position for the droid (it looks down + waves when we're close)
    bugPos.x = cx + HALF;
    bugPos.y = cy + HALF;
    bugPos.active = true;

    const startled = now < startledUntil.current;

    // If the cursor is nearby, trot toward it (curious, not scared) — unless
    // we just got spooked by a click.
    let following = false;
    const cur = cursor.current;
    if (!startled && cur && now - cur.t < 2600) {
      const cd = Math.hypot(cur.x - (cx + HALF), cur.y - (cy + HALF));
      if (cd < 260) {
        following = true;
        visiting.current = false;
        target.current = { x: cur.x - HALF, y: cur.y - HALF };
      }
    }

    // Every so often, stroll over to the droid and say hi.
    if (!startled && !following && droidPos.active && now > nextVisit.current) {
      visiting.current = true;
      nextVisit.current = now + 16000 + Math.random() * 10000;
    }
    if (visiting.current && !following) {
      if (!droidPos.active) visiting.current = false;
      // stand just under the droid (it hangs from its thread above)
      else target.current = { x: droidPos.x - HALF, y: droidPos.y + 34 - HALF };
    }

    if (!startled && !following && now < pauseUntil.current) {
      setStanding(true);
      return;
    }

    const dx = target.current.x - cx;
    const dy = target.current.y - cy;
    const dist = Math.hypot(dx, dy);

    if (following && dist < 30) {
      // reached the cursor — say hi with an occasional spin, then wait beside it
      if (now - lastSpin.current > 1500) {
        lastSpin.current = now;
        doSpin();
      }
      setStanding(true);
      return;
    }
    if (visiting.current && !following && dist < 34) {
      // made it to the droid — spin hello, then admire it for a moment
      visiting.current = false;
      doSpin();
      pauseUntil.current = now + 1600;
      setStanding(true);
      return;
    }
    if (!following && !visiting.current && dist < 6) {
      if (Math.random() < 0.35) pauseUntil.current = now + 400 + Math.random() * 1400;
      pickTarget();
      return;
    }

    setStanding(false);
    // px/s: spooked dash > eager cursor-trot > droid stroll > wander
    const speed = startled ? 250 : following ? 132 : visiting.current ? 112 : 92;
    x.set(cx + (dx / dist) * speed * dt);
    y.set(cy + (dy / dist) * speed * dt);

    // face travel direction, unwrapped so it never spins the long way round
    const raw = (Math.atan2(dy, dx) * 180) / Math.PI;
    headingCont.current += ((raw - headingCont.current + 540) % 360) - 180;
    heading.set(headingCont.current);
  });

  // track the cursor so the bug can trot over to greet it
  useEffect(() => {
    if (!walk) return;
    const onMove = (e: MouseEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [walk]);

  // a click lands nearby → startled hop, then a quick dash away from it
  useEffect(() => {
    if (!walk) return;
    const onClick = (e: MouseEvent) => {
      const bx = x.get() + HALF;
      const by = y.get() + HALF;
      const d = Math.hypot(e.clientX - bx, e.clientY - by);
      if (d > 180) return;
      const now = Date.now();
      startledUntil.current = now + 650;
      visiting.current = false;
      pauseUntil.current = 0;
      const ux = (bx - e.clientX) / (d || 1);
      const uy = (by - e.clientY) / (d || 1);
      const m = 24;
      target.current = {
        x: Math.min(window.innerWidth - SIZE - m, Math.max(m, bx + ux * 150 - HALF)),
        y: Math.min(window.innerHeight - SIZE - m, Math.max(m, by + uy * 150 - HALF)),
      };
      animate(scale, [1, 1.32, 1], { duration: 0.34, ease: "easeOut" });
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [walk, x, y, scale]);

  // …and every so often it spins just for fun
  useEffect(() => {
    if (!walk) return;
    const id = setInterval(() => {
      if (Math.random() < 0.4) doSpin();
    }, 6500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walk]);

  // drift between crawling OVER the text and UNDER it (but stay on top while
  // visiting the droid so the meetup is actually visible)
  useEffect(() => {
    if (!walk) return;
    const id = setInterval(() => {
      const el = containerRef.current;
      if (!el) return;
      el.style.zIndex =
        visiting.current || Math.random() < 0.5 ? String(overZ) : String(underZ);
    }, 3200);
    return () => clearInterval(id);
  }, [walk, overZ, underZ]);

  return (
    <div ref={containerRef} aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: overZ }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: SIZE,
          height: SIZE,
          x,
          y,
          rotate: spriteRotate,
          scale,
          transformOrigin: "center",
          // Own compositor layer: the sprite moves every frame — without it
          // each step repaints whatever page area it crawls across.
          willChange: "transform",
        }}
      >
        <BugSprite walk={walk} />
      </motion.div>
    </div>
  );
}
