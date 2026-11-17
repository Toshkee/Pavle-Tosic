import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { type Pt } from "./motion";

/* The landing page's Memoji, eyes and head after the pointer, with the
   numbers of src/app/site/MemojiGaze.tsx: the eyes close 20% of the gap a
   frame, the head 8%, both saturate REACH px from the face. The site eases
   a state frame by frame; a film frame is rendered on its own, so the same
   easing is replayed from the scene's first frame up to this one. */
const SIZE = 448;
const EYES = [
  { x: 124, y: 242, w: 76, h: 44, mask: "images/memoji-eye-left-mask.webp", iris: "images/memoji-iris-left.webp" },
  { x: 244, y: 240, w: 76, h: 44, mask: "images/memoji-eye-right-mask.webp", iris: "images/memoji-iris-right.webp" },
];
const TRAVEL = { x: 8, y: 3 };
const TURN = { y: 5, x: 3 };
const LEAN = { x: 7, y: 4 };
const EYE_EASE = 0.2;
const HEAD_EASE = 0.08;

const toward = (from: Pt, cursor: Pt | null, reach: number): Pt => {
  if (!cursor) return { x: 0, y: 0 };
  const x = (cursor.x - from.x) / reach;
  const y = (cursor.y - from.y) / reach;
  const length = Math.hypot(x, y);
  const k = length > 1 ? 1 / length : 1;
  return { x: x * k, y: y * k };
};

export const Memoji: React.FC<{
  /** Top-left corner and width on the stage, in the pointer's own px. */
  x: number;
  y: number;
  size: number;
  cursor: (f: number) => Pt | null;
  style?: React.CSSProperties;
}> = ({ x, y, size, cursor, style }) => {
  const frame = useCurrentFrame();
  const scale = size / SIZE;
  // 220 px on the site, where the face is 224 px wide.
  const reach = size * (220 / 224);
  const centre = { x: x + size / 2, y: y + size / 2 };
  const head = { x: 0, y: 0 };
  const eyes = EYES.map(() => ({ x: 0, y: 0 }));
  for (let f = 0; f <= frame; f++) {
    const at = cursor(f);
    const h = toward(centre, at, reach);
    head.x += (h.x - head.x) * HEAD_EASE;
    head.y += (h.y - head.y) * HEAD_EASE;
    EYES.forEach((eye, i) => {
      const e = toward(
        { x: x + (eye.x + eye.w / 2) * scale, y: y + (eye.y + eye.h / 2) * scale },
        at,
        reach,
      );
      eyes[i].x += (e.x - eyes[i].x) * EYE_EASE;
      eyes[i].y += (e.y - eyes[i].y) * EYE_EASE;
    });
  }
  const pct = (v: number) => `${(v / SIZE) * 100}%`;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, ...style }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transform: `perspective(800px) translate(${head.x * LEAN.x * scale}px, ${head.y * LEAN.y * scale}px) rotateY(${head.x * TURN.y}deg) rotateX(${-head.y * TURN.x}deg)`,
        }}
      >
        <Img
          src={staticFile("images/memoji-still.webp")}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
        {EYES.map((eye, i) => (
          <div
            key={eye.iris}
            style={{
              position: "absolute",
              left: pct(eye.x),
              top: pct(eye.y),
              width: pct(eye.w),
              height: pct(eye.h),
              WebkitMaskImage: `url(${staticFile(eye.mask)})`,
              maskImage: `url(${staticFile(eye.mask)})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
          >
            {/* The mask is a CSS image, which a render does not wait for:
                the same file as an <Img> holds the frame until it is in. */}
            <Img src={staticFile(eye.mask)} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
            <Img
              src={staticFile(eye.iris)}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                transform: `translate(${eyes[i].x * TRAVEL.x * scale}px, ${eyes[i].y * TRAVEL.y * scale}px)`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
