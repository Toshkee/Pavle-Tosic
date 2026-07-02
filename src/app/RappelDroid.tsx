"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTime,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { bugPos, droidPos } from "./characterBus";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/* Height of the nav the droid hangs beneath — the swing pivots from here. */
const NAV_H = 56;

/* ───────────────────────── The character ─────────────────────────
   A boxy phosphor-green droid. Pupils, blink, glow and both arms are
   driven by MotionValues from the parent so everything animates on the
   compositor without React re-renders. */
function MiniDroid({
  pupilX,
  pupilY,
  eyeSX,
  eyeSY,
  led,
  leftArm,
  rightArm,
}: {
  pupilX: MotionValue<number>;
  pupilY: MotionValue<number>;
  eyeSX: MotionValue<number>;
  eyeSY: MotionValue<number>;
  led: MotionValue<number>;
  leftArm: MotionValue<number>;
  rightArm: MotionValue<number>;
}) {
  return (
    <svg
      width={72}
      height={104}
      viewBox="0 0 64 92"
      fill="none"
      shapeRendering="crispEdges"
      style={{ display: "block", filter: "drop-shadow(0 0 4px rgba(34,197,94,0.55))" }}
    >
      {/* antenna + blinking tip (the thread attaches here) */}
      <rect x={31} y={5} width={2} height={9} fill="#22c55e" />
      <motion.rect x={29} y={1} width={5} height={5} fill="#5cf08a" style={{ opacity: led }} />

      {/* arms — pixel blocks that pivot at the shoulder (fill-box origin corner) */}
      <motion.g style={{ rotate: leftArm, transformBox: "fill-box", originX: 1, originY: 0 }}>
        <rect x={16} y={50} width={3} height={8} fill="#22c55e" />
        <rect x={14} y={57} width={5} height={4} fill="#22c55e" />
      </motion.g>
      <motion.g style={{ rotate: rightArm, transformBox: "fill-box", originX: 0, originY: 0 }}>
        <rect x={45} y={50} width={3} height={8} fill="#22c55e" />
        <rect x={45} y={57} width={5} height={4} fill="#22c55e" />
      </motion.g>

      {/* head — green shell + dark face, hard pixel edges */}
      <rect x={14} y={12} width={36} height={32} fill="#22c55e" />
      <rect x={16} y={14} width={32} height={28} fill="#0e150e" />

      {/* eyes — square sockets + square pupils that track the cursor */}
      <motion.g style={{ scaleX: eyeSX, scaleY: eyeSY, transformBox: "fill-box", transformOrigin: "center" }}>
        <rect x={21} y={24} width={9} height={9} fill="#06110a" stroke="#22c55e" strokeWidth={1} />
        <rect x={34} y={24} width={9} height={9} fill="#06110a" stroke="#22c55e" strokeWidth={1} />
        <motion.g style={{ x: pupilX, y: pupilY }}>
          <rect x={24} y={27} width={3} height={3} fill="#5cf08a" />
          <rect x={37} y={27} width={3} height={3} fill="#5cf08a" />
        </motion.g>
      </motion.g>

      {/* mouth grille (pixel teeth) */}
      <g fill="rgba(92,240,138,0.6)">
        <rect x={23} y={38} width={2} height={3} />
        <rect x={27} y={38} width={2} height={3} />
        <rect x={31} y={38} width={2} height={3} />
        <rect x={35} y={38} width={2} height={3} />
        <rect x={39} y={38} width={2} height={3} />
      </g>

      {/* body */}
      <rect x={18} y={45} width={28} height={22} fill="#22c55e" />
      <rect x={20} y={47} width={24} height={18} fill="#0e150e" />
      <rect x={23} y={51} width={18} height={2} fill="rgba(34,197,94,0.35)" />
      <rect x={23} y={55} width={18} height={2} fill="rgba(34,197,94,0.35)" />
      <motion.rect x={30} y={59} width={4} height={4} fill="#5cf08a" style={{ opacity: led }} />

      {/* legs */}
      <rect x={24} y={67} width={3} height={9} fill="#22c55e" />
      <rect x={22} y={75} width={5} height={4} fill="#22c55e" />
      <rect x={37} y={67} width={3} height={9} fill="#22c55e" />
      <rect x={37} y={75} width={5} height={4} fill="#22c55e" />
    </svg>
  );
}

/* ───────────────────── Behaviours / rigging ───────────────────── */
export default function RappelDroid({
  progress,
  zIndex = 50,
  edge = "max(96px, 7vw)",
}: {
  // Descent driver (0→1). Defaults to window scroll; the section-deck passes
  // its active-section progress instead (the page has no window scroll).
  progress?: MotionValue<number>;
  zIndex?: number;
  edge?: string; // CSS `right` offset of the thread
} = {}) {
  const reduce = useReducedMotion() ?? false;
  const droidRef = useRef<HTMLDivElement>(null);
  const time = useTime();
  const { scrollYProgress } = useScroll();
  const prog = progress ?? scrollYProgress;

  // Rappel: descend from just under the nav to near the bottom on scroll.
  const descendRaw = useTransform(prog, [0, 1], reduce ? [16, 16] : [3, 80]);
  const descend = useSpring(descendRaw, { stiffness: 70, damping: 20, mass: 0.5 });
  const topPct = useMotionTemplate`${descend}%`;

  // Swing: gentle idle pendulum + a kick from scroll velocity, pivoting from
  // the nav anchor.
  const idle = useTransform(time, (t) => (reduce ? 0 : Math.sin(t / 1000) * 2.4));
  const rawVel = useVelocity(prog);
  const vel = useSpring(rawVel, { stiffness: 80, damping: 16 });
  const velRot = useTransform(vel, (v) => (reduce ? 0 : clamp(v * 7, -9, 9)));
  const swing = useTransform([idle, velRot], (v: number[]) => clamp(v[0] + v[1], -8, 8));

  // Backflip: `flip` runs 0→1 for one somersault. Derived: a full spin, an
  // up-and-down hop, and the thread letting go mid-air.
  const flip = useMotionValue(0);
  const flipping = useRef(false);
  const lastFlip = useRef(0);
  const flipRot = useTransform(flip, (p) => -360 * p);
  const hop = useTransform(flip, (p) => -58 * Math.sin(Math.PI * p));
  const threadOpacity = useTransform(flip, (p) => clamp((Math.abs(p - 0.5) - 0.3) / 0.16, 0, 1));

  // Sleep: after ~26s with no user activity the droid dozes off — lids droop,
  // arms sag, LED dims, little "z"s drift up. Any activity (or the bug coming
  // to visit) wakes it with a startled jolt.
  const sleepingRef = useRef(false);
  const lastActive = useRef(0);
  const sleepy = useMotionValue(0);
  const sleepySpring = useSpring(sleepy, { stiffness: 26, damping: 14 });
  const startle = useMotionValue(0); // wake jolt: brief eye-pop
  const jolt = useMotionValue(0); // wake jolt: brief vertical hop
  const lift = useTransform([hop, jolt], (v: number[]) => v[0] + v[1]);

  const doFlip = () => {
    if (reduce || flipping.current || sleepingRef.current) return;
    flipping.current = true;
    animate(flip, 1, {
      duration: 0.85,
      ease: [0.45, 0, 0.55, 1],
      onComplete: () => {
        flip.set(0);
        flipping.current = false;
      },
    });
  };

  // Trigger a flip on a fast scroll-flick (with a cooldown).
  useMotionValueEvent(rawVel, "change", (v) => {
    const now = Date.now();
    if (Math.abs(v) > 0.5 && now - lastFlip.current > 2500) {
      lastFlip.current = now;
      doFlip();
    }
  });

  // …and every so often on its own, just for joy.
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      if (Math.random() < 0.55) doFlip();
    }, 5600);
    return () => clearInterval(id);
    // doFlip is stable enough for a demo; reduce is the only real dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Eyes: springed pupil offset toward the cursor + a widen when greeting,
  // lids sliding shut while asleep, a pop when startled awake.
  const pupilTX = useMotionValue(0);
  const pupilTY = useMotionValue(0);
  const pupilX = useSpring(pupilTX, { stiffness: 220, damping: 20 });
  const pupilY = useSpring(pupilTY, { stiffness: 220, damping: 20 });
  const cheerTarget = useMotionValue(0);
  const cheer = useSpring(cheerTarget, { stiffness: 150, damping: 15 });
  const eyeSX = useTransform([cheer, sleepySpring, startle], (v: number[]) =>
    (1 + v[0] * 0.16) * (1 - v[1] * 0.18) * (1 + v[2] * 0.28)
  );
  const blink = useTransform(time, (t): number => (!reduce && t % 3800 < 130 ? 0.12 : 1));
  const eyeSY = useTransform([blink, cheer, sleepySpring, startle], (v: number[]) =>
    v[0] * (1 + v[1] * 0.16) * (1 - v[2] * 0.72) * (1 + v[3] * 0.35)
  );
  const led = useTransform(time, (t) => (reduce ? 0.85 : 0.45 + 0.55 * Math.abs(Math.sin(t / 480))));
  const ledOut = useTransform([led, sleepySpring], (v: number[]) => v[0] * (1 - v[1] * 0.55));

  // Arms: idle sway + tuck-in during a flip + a cheerful raised wave when the
  // cursor (or the bug) is near + a sag while asleep.
  const leftArm = useTransform([time, flip, cheer, sleepySpring], (v: number[]) => {
    const [t, f, c, s] = v;
    const swayL = reduce ? 0 : Math.sin(t / 700) * 5;
    const tuckL = Math.sin(Math.PI * f) * 42;
    const waveL = c * (90 + (reduce ? 0 : Math.sin(t / 110) * 16));
    return swayL + tuckL + waveL - s * 12;
  });
  const rightArm = useTransform([time, flip, cheer, sleepySpring], (v: number[]) => {
    const [t, f, c, s] = v;
    const swayR = reduce ? 0 : Math.sin(t / 700 + Math.PI) * 5;
    const tuckR = Math.sin(Math.PI * f) * -42;
    const waveR = c * (-90 + (reduce ? 0 : Math.sin(t / 110 + 0.6) * 16));
    return swayR + tuckR + waveR + s * 12;
  });

  // Floating "z z" while asleep — two glyphs cycling up-and-away, phase-offset.
  const zPhase = (t: number, off: number) => ((t / 1300 + off) % 1 + 1) % 1;
  const z1o = useTransform([time, sleepySpring], (v: number[]) => {
    const p = zPhase(v[0], 0);
    return v[1] * (p < 0.8 ? (1 - p) * 0.95 : 0);
  });
  const z1y = useTransform(time, (t) => -zPhase(t, 0) * 12);
  const z1x = useTransform(time, (t) => zPhase(t, 0) * 5);
  const z2o = useTransform([time, sleepySpring], (v: number[]) => {
    const p = zPhase(v[0], 0.5);
    return v[1] * (p < 0.8 ? (1 - p) * 0.8 : 0);
  });
  const z2y = useTransform(time, (t) => -zPhase(t, 0.5) * 12);
  const z2x = useTransform(time, (t) => zPhase(t, 0.5) * 5);

  // Wake with a startle (also called by the bug's visits). Refs/MotionValues
  // only, so the identity doesn't matter to the effects below.
  const nearCursor = useRef(false);
  const nearBug = useRef(false);
  const wake = () => {
    lastActive.current = Date.now();
    if (!sleepingRef.current) return;
    sleepingRef.current = false;
    sleepy.set(0);
    pupilTY.set(0);
    animate(jolt, [0, -9, 0], { duration: 0.45, ease: "easeOut" });
    animate(startle, [0, 1, 0], { duration: 0.55, ease: "easeOut" });
  };

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = droidRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.28; // eyes sit near the top
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy) || 1;
        pupilTX.set(clamp((dx / dist) * 2.6, -2.6, 2.6));
        pupilTY.set(clamp((dy / dist) * 2.6, -2.6, 2.6));
        nearCursor.current = dist < 150;
        cheerTarget.set(nearCursor.current || nearBug.current ? 1 : 0); // wave hello
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [pupilTX, pupilTY, cheerTarget]);

  // Doze off when the page goes quiet; wake on any real user activity.
  useEffect(() => {
    if (reduce) return;
    lastActive.current = Date.now();
    const activity = ["mousemove", "wheel", "keydown", "pointerdown"] as const;
    activity.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
    const id = setInterval(() => {
      if (sleepingRef.current) return;
      if (Date.now() - lastActive.current > 12000) {
        sleepingRef.current = true;
        sleepy.set(1);
        cheerTarget.set(0);
        pupilTX.set(0);
        pupilTY.set(2.2); // eyes settle downward as the lids close
      }
    }, 1000);
    return () => {
      activity.forEach((ev) => window.removeEventListener(ev, wake));
      clearInterval(id);
    };
    // wake only touches refs/MotionValues — stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Buddy watch: publish our position and keep an eye out for the bug — look
  // down at it and wave when it comes close (its visit also wakes us).
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      const el = droidRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      droidPos.x = r.left + r.width / 2;
      droidPos.y = r.top + r.height / 2;
      droidPos.active = true;
      if (!bugPos.active) return;
      const dx = bugPos.x - droidPos.x;
      const dy = bugPos.y - droidPos.y;
      const d = Math.hypot(dx, dy) || 1;
      const near = d < 130;
      if (near && sleepingRef.current) wake();
      nearBug.current = near;
      if (near && !nearCursor.current && !sleepingRef.current) {
        pupilTX.set(clamp((dx / d) * 2.6, -2.6, 2.6));
        pupilTY.set(clamp((dy / d) * 2.6, -2.6, 2.6));
      }
      cheerTarget.set(near || nearCursor.current ? 1 : 0);
    }, 200);
    return () => {
      clearInterval(id);
      droidPos.active = false;
    };
    // wake only touches refs/MotionValues — stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, pupilTX, pupilTY, cheerTarget]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: NAV_H,
        bottom: 0,
        right: edge,
        width: 96,
        pointerEvents: "none",
        zIndex,
      }}
    >
      <motion.div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformOrigin: "top center",
          rotate: swing,
        }}
      >
        {/* thread — lets go during a flip */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: "calc(50% - 1px)",
            width: 2,
            height: topPct,
            borderRadius: 2,
            opacity: threadOpacity,
            background: "linear-gradient(to bottom, rgba(34,197,94,0.12), rgba(34,197,94,0.55))",
          }}
        />
        {/* droid at the end of the thread (hops on `y`, somersaults inside) */}
        <motion.div
          ref={droidRef}
          style={{ position: "absolute", top: topPct, left: "50%", x: "-50%", y: lift }}
        >
          <motion.div style={{ rotate: flipRot }}>
            <MiniDroid
              pupilX={pupilX}
              pupilY={pupilY}
              eyeSX={eyeSX}
              eyeSY={eyeSY}
              led={ledOut}
              leftArm={leftArm}
              rightArm={rightArm}
            />
          </motion.div>
          {/* zzz — drifts up beside the head while asleep */}
          <svg
            width={24}
            height={28}
            viewBox="0 0 24 28"
            style={{ position: "absolute", top: -4, right: -14, overflow: "visible" }}
          >
            <motion.text
              x={4}
              y={22}
              fontSize={10}
              fill="#5cf08a"
              style={{ opacity: z1o, x: z1x, y: z1y }}
            >
              z
            </motion.text>
            <motion.text
              x={12}
              y={16}
              fontSize={7}
              fill="#5cf08a"
              style={{ opacity: z2o, x: z2x, y: z2y }}
            >
              z
            </motion.text>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
