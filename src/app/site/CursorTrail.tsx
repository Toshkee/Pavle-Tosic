"use client";

import { useEffect, useRef } from "react";
import { startTrail } from "./trail";

/* The dot grid under every page and the trail the mouse leaves in it
   (trail.ts), fixed over the whole viewport (layout.tsx mounts it; z-index
   -1 keeps it below the content, and <body> has no background of its own
   for that reason). The grid is CSS and shows everywhere. The trail is
   only for a real mouse, and never when the visitor asked for reduced
   motion: on touch screens nobody can steer it. */
export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canvas || !mouse.matches || reduced.matches) return;
    return startTrail(canvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="dot-grid pointer-events-none fixed inset-0 -z-10 size-full"
    />
  );
}
