"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import type { Look } from "./critterSprites";
import { pageCtx } from "./characterBus";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/* Text avoid-zones — rects of readable copy (headings, paragraphs, list rows,
   links) in the rail and the deck. All critters share one TTL-cached scan so
   nobody reads layout per frame; a critter dims while crossing a zone and
   prefers wander targets on open ground. */
const ZONE_PAD = 10;
const ZONE_TTL = 1200;
const ZONE_SELECTOR = [
  "#content",
  "#home",
]
  .flatMap((root) =>
    ["h1", "h2", "h3", "p", "li", "a", "button"].map((t) => `${root} ${t}`)
  )
  .join(", ");
let zoneCache: { rects: DOMRect[]; at: number } = { rects: [], at: 0 };
function textZones(): DOMRect[] {
  const now = performance.now();
  if (now - zoneCache.at > ZONE_TTL) {
    const rects: DOMRect[] = [];
    document.querySelectorAll(ZONE_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight)
        rects.push(r);
    });
    zoneCache = { rects, at: now };
  }
  return zoneCache.rects;
}
const inZone = (px: number, py: number) =>
  textZones().some(
    (r) =>
      px > r.left - ZONE_PAD &&
      px < r.right + ZONE_PAD &&
      py > r.top - ZONE_PAD &&
      py < r.bottom + ZONE_PAD
  );

// What a critter does while it's on duty at its home section.
export type Task = "bounce" | "spin" | "haunt" | "sit";

/* Generic ambient wanderer for a FRONT-FACING pixel sprite (cat, daemon,
   ghost, slime). Off duty it roams the viewport, mirrors to face its travel
   direction, tracks the cursor with its pupils, greets a near cursor, and hops
   away startled from clicks.

   Each critter also OWNS a section (`homeSection`): while that section is
   active it posts up beside the content column and performs its `task` —
   bounce / spin / haunt (fade) / sit — so there's always one critter on duty.
   Everyone hops on a section change and reacts to the live market mood.

   Cheap: framer runs every useAnimationFrame in one shared loop, positions are
   compositor transforms, nothing reads layout per frame. Frozen under reduced
   motion. */
export default function Roamer({
  children,
  w,
  h,
  speed = 70,
  start,
  overZ = 30,
  underZ = -6,
  homeSection,
  task = "bounce",
}: {
  children: (look: Look) => ReactNode;
  w: number;
  h: number;
  speed?: number;
  start?: { x: number; y: number };
  overZ?: number;
  underZ?: number;
  homeSection?: string;
  task?: Task;
}) {
  const reduce = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const sx = start?.x ?? 200;
  const sy = start?.y ?? 200;
  const x = useMotionValue(sx);
  const y = useMotionValue(sy);
  const faceX = useMotionValue(1); // scaleX: 1 faces right, -1 faces left
  const opacity = useMotionValue(1); // dipped by the "haunt" fade
  const dim = useMotionValue(1); // dipped while crossing a text zone
  const dimmed = useRef(false);
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);
  const look = { x: lookX, y: lookY };

  const target = useRef({ x: sx, y: sy });
  const pauseUntil = useRef(0);
  const startledUntil = useRef(0);
  const cursor = useRef<{ x: number; y: number; t: number } | null>(null);
  const face = useRef(1);
  const lastSection = useRef("");

  // Reaction flourishes — a bounce, a spin, an eerie fade — layered on top of
  // position/facing so they never fight it.
  const hop = useMotionValue(0);
  const hopping = useRef(false);
  const hopY = useTransform(hop, (p) => -18 * Math.sin(Math.PI * p));
  const hopScaleY = useTransform(hop, (p) => 1 + 0.14 * Math.sin(Math.PI * p));
  const spin = useMotionValue(0);
  const spinning = useRef(false);
  const spinRot = useTransform(spin, (p) => p * 360);

  const doHop = () => {
    if (hopping.current) return;
    hopping.current = true;
    animate(hop, [0, 1, 0], {
      duration: 0.42,
      ease: "easeOut",
      onComplete: () => {
        hop.set(0);
        hopping.current = false;
      },
    });
  };
  const doSpin = () => {
    if (spinning.current) return;
    spinning.current = true;
    animate(spin, [0, 1], {
      duration: 0.6,
      ease: [0.4, 0, 0.5, 1],
      onComplete: () => {
        spin.set(0);
        spinning.current = false;
      },
    });
  };
  const doFade = () => {
    animate(opacity, [1, 0.3, 1], { duration: 1.6, ease: "easeInOut" });
  };

  const pick = () => {
    const m = 30;
    // Prefer open ground: retry a few times before settling on a spot that
    // sits over copy (the dim below covers the transit either way).
    for (let i = 0; i < 8; i++) {
      target.current = {
        x: m + Math.random() * (window.innerWidth - w - 2 * m),
        y: m + Math.random() * (window.innerHeight - h - 2 * m),
      };
      if (!inZone(target.current.x + w / 2, target.current.y + h / 2)) break;
    }
  };
  // Flip to face travel, with a deadzone so tiny wobble never flickers it.
  const setFace = (dx: number) => {
    if (dx > 6 && face.current !== 1) {
      face.current = 1;
      faceX.set(1);
    } else if (dx < -6 && face.current !== -1) {
      face.current = -1;
      faceX.set(-1);
    }
  };

  useEffect(() => {
    if (!reduce) pick();
    // pick only reads props/refs — safe to run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const dt = Math.min(delta, 60) / 1000;
    const now = Date.now();
    const cx = x.get();
    const cy = y.get();
    const ccx = cx + w / 2;
    const ccy = cy + h / 2;

    // Pupils track the cursor (screen space; negated when the sprite is
    // mirrored, so it keeps looking the right way after the scaleX flip).
    const cur = cursor.current;
    if (cur) {
      const dx = cur.x - ccx;
      const dy = cur.y - ccy;
      const d = Math.hypot(dx, dy) || 1;
      const lx = clamp((dx / d) * 2.6, -2.6, 2.6);
      lookX.set(face.current === -1 ? -lx : lx);
      lookY.set(clamp((dy / d) * 2.4, -2, 2));
    }

    // Go ghost-quiet over copy so the page stays readable (zones are TTL-cached
    // in textZones — no layout read per frame).
    const overText = inZone(ccx, ccy);
    if (overText !== dimmed.current) {
      dimmed.current = overText;
      animate(dim, overText ? 0.35 : 1, { duration: 0.3, ease: "easeOut" });
    }

    // Every section change gets a happy hop.
    if (pageCtx.section !== lastSection.current) {
      if (lastSection.current) doHop();
      lastSection.current = pageCtx.section;
    }

    const startled = now < startledUntil.current;

    // Trot over to greet a nearby cursor (curious), unless just spooked.
    let following = false;
    if (!startled && cur && now - cur.t < 2600) {
      const cd = Math.hypot(cur.x - ccx, cur.y - ccy);
      if (cd < 250) {
        following = true;
        target.current = { x: cur.x - w / 2, y: cur.y - h / 2 };
      }
    }

    const dx = target.current.x - cx;
    const dy = target.current.y - cy;
    const dist = Math.hypot(dx, dy);

    if (following && dist < 64) {
      // stand a polite distance from the cursor rather than on top of it
      setFace(dx);
      return;
    }
    if (!following && now < pauseUntil.current) return;
    if (!following && dist < 6) {
      // reached a wander spot — pause a beat, sometimes do its thing, move on
      if (Math.random() < 0.5)
        pauseUntil.current = now + 400 + Math.random() * 1500;
      pick();
      return;
    }

    // Red market → the crew loses pep and dawdles; green keeps their pace.
    const moodSlow = pageCtx.marketMood < -0.3 ? 0.62 : 1;
    const spd = startled ? 230 : following ? 128 : speed * moodSlow;
    x.set(cx + (dx / dist) * spd * dt);
    y.set(cy + (dy / dist) * spd * dt);
    setFace(dx);
  });

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      cursor.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const onClick = (e: MouseEvent) => {
      const bx = x.get() + w / 2;
      const by = y.get() + h / 2;
      const d = Math.hypot(e.clientX - bx, e.clientY - by);
      if (d > 170) return;
      const now = Date.now();
      startledUntil.current = now + 600;
      pauseUntil.current = 0;
      const ux = (bx - e.clientX) / (d || 1);
      const uy = (by - e.clientY) / (d || 1);
      const m = 30;
      target.current = {
        x: clamp(bx + ux * 160 - w / 2, m, window.innerWidth - w - m),
        y: clamp(by + uy * 160 - h / 2, m, window.innerHeight - h - m),
      };
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [reduce, x, y, w, h]);

  // On-duty flourish: repeat this critter's task while its home section is up.
  useEffect(() => {
    if (reduce || !homeSection) return;
    const period =
      task === "bounce" ? 680 : task === "spin" ? 1500 : task === "haunt" ? 1300 : 4000;
    const id = setInterval(() => {
      if (pageCtx.section !== homeSection) return;
      if (task === "bounce") doHop();
      else if (task === "spin") doSpin();
      else if (task === "haunt") doFade();
      // "sit": nothing — it just stays curled up
    }, period);
    return () => clearInterval(id);
    // do* only touch refs/MotionValues — stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, homeSection, task]);

  // Green market → the crew hops for joy (only while the live ticker feeds
  // pageCtx.marketMood; it's 0 otherwise, so this stays quiet).
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      if (pageCtx.marketMood > 0.35 && Math.random() < 0.5) doHop();
    }, 4200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Drift over/under the text like the bug — but stay on top while on duty so
  // the section's host is always visible.
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      const el = containerRef.current;
      if (!el) return;
      const onDuty = homeSection && pageCtx.section === homeSection;
      el.style.zIndex =
        onDuty || Math.random() < 0.5 ? String(overZ) : String(underZ);
    }, 3400);
    return () => clearInterval(id);
  }, [reduce, overZ, underZ, homeSection]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: overZ }}
    >
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          x,
          y,
          scaleX: faceX,
          opacity,
          transformOrigin: "center",
          willChange: "transform",
        }}
      >
        {/* spin layer (daemon's "background process" trick) — also carries the
            text-zone dim, multiplying with the outer haunt fade */}
        <motion.div
          style={{ rotate: spinRot, transformOrigin: "center", opacity: dim }}
        >
          {/* hop layer (bounce + squash), grounded at the feet */}
          <motion.div
            style={{ y: hopY, scaleY: hopScaleY, transformOrigin: "bottom center" }}
          >
            {children(look)}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
