"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { MEMOJI, NAME } from "./content";

/* My Memoji on the landing page, following the cursor: the eyes dart
   toward it and the head turns and leans after them, a little later and a
   little less, the way a head follows a glance. The still is a frame of my
   Messages recording with both irises painted out; each iris is its own
   cutout, clipped by a mask of the eye opening so it slides under the lids
   instead of over them (layers cut by scripts/memoji-gaze.py). Mouse only,
   nothing under reduced motion, and everything is written straight to the
   elements by one rAF loop that stops once the face has settled. Before
   hydration, and without a mouse, the face looks straight ahead. */
const { still, size, eyes } = MEMOJI.gaze;
// Full deflection: how far an iris travels and how far the head turns and
// leans (base-image px and degrees), reached when the cursor is REACH px
// from the face. The eyes close 20% of the gap per frame, the head 8%.
const TRAVEL = { x: 8, y: 3 };
const TURN = { y: 5, x: 3 };
const LEAN = { x: 7, y: 4 };
const REACH = 220;
const EYE_EASE = 0.2;
const HEAD_EASE = 0.08;

type Point = { x: number; y: number };

const pct = (value: number) => `${(value / size) * 100}%`;

// Direction from a point to the cursor, saturating at REACH.
const toward = (from: Point, cursor: Point | null): Point => {
  if (!cursor) return { x: 0, y: 0 };
  const x = (cursor.x - from.x) / REACH;
  const y = (cursor.y - from.y) / REACH;
  const length = Math.hypot(x, y);
  const clamp = length > 1 ? 1 / length : 1;
  return { x: x * clamp, y: y * clamp };
};

const ease = (state: Point, target: Point, rate: number) => {
  state.x += (target.x - state.x) * rate;
  state.y += (target.y - state.y) * rate;
  return Math.abs(target.x - state.x) + Math.abs(target.y - state.y);
};

export default function MemojiGaze({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !mouse.matches || reduced.matches) return;
    const head = root.firstElementChild as HTMLElement;
    const irises = Array.from(root.querySelectorAll<HTMLElement>("[data-iris]"));

    let cursor: Point | null = null;
    let frame = 0;
    const headState: Point = { x: 0, y: 0 };
    const eyeStates: Point[] = eyes.map(() => ({ x: 0, y: 0 }));

    const tick = () => {
      const box = root.getBoundingClientRect();
      const scale = box.width / size;
      const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      let left = ease(headState, toward(centre, cursor), HEAD_EASE);
      head.style.transform = `perspective(800px) translate(${headState.x * LEAN.x * scale}px, ${headState.y * LEAN.y * scale}px) rotateY(${headState.x * TURN.y}deg) rotateX(${-headState.y * TURN.x}deg)`;
      irises.forEach((iris, index) => {
        const eye = eyes[index];
        const eyeCentre = {
          x: box.left + (eye.x + eye.w / 2) * scale,
          y: box.top + (eye.y + eye.h / 2) * scale,
        };
        left = Math.max(left, ease(eyeStates[index], toward(eyeCentre, cursor), EYE_EASE));
        iris.style.transform = `translate(${eyeStates[index].x * TRAVEL.x * scale}px, ${eyeStates[index].y * TRAVEL.y * scale}px)`;
      });
      frame = left > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onMove = (event: MouseEvent) => {
      cursor = { x: event.clientX, y: event.clientY };
      wake();
    };
    const onLeave = () => {
      cursor = null;
      wake();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      head.style.transform = "";
      irises.forEach((iris) => (iris.style.transform = ""));
    };
  }, []);

  return (
    <div ref={ref} role="img" aria-label={NAME} className={className}>
      <div className="relative size-full will-change-transform">
        <Image
          src={still}
          alt=""
          width={size}
          height={size}
          priority
          className="size-full object-contain"
        />
        {eyes.map((eye) => (
          <div
            key={eye.iris}
            aria-hidden
            className="absolute"
            style={
              {
                left: pct(eye.x),
                top: pct(eye.y),
                width: pct(eye.w),
                height: pct(eye.h),
                WebkitMaskImage: `url(${eye.mask})`,
                maskImage: `url(${eye.mask})`,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
              } as CSSProperties
            }
          >
            <Image
              data-iris
              src={eye.iris}
              alt=""
              width={eye.w}
              height={eye.h}
              priority
              draggable={false}
              className="size-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
