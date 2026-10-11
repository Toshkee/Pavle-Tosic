"use client";

import { useEffect, useRef } from "react";
import { startTrail } from "./trail";

/* The canvas for the cursor trail (trail.ts), fixed over the whole
   viewport and under every page (layout.tsx mounts it; z-index -1 keeps it
   below the content, and <body> has no background of its own for that
   reason). Only for a real mouse, and never when the visitor asked for
   reduced motion: on touch screens nobody can steer it. */
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
      className="pointer-events-none fixed inset-0 -z-10 size-full"
    />
  );
}
