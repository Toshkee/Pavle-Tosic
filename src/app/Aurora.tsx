"use client";

import { memo } from "react";

/* Animated background — large, soft, blurred green/cyan blobs that slowly
   drift behind all content. Pure CSS (GPU-composited transforms), no JS loop,
   SSR/Workers-safe. Freezes to its resting position under prefers-reduced-motion
   (base position is set outside the keyframes).
   `contain: paint` + `isolation: isolate` confine these heavy blurred layers to
   their own compositing group so they cost the page nothing beyond their own
   blend. memo: this takes no props, so it never needs to re-render with the
   parent (active-section changes). */
function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden [contain:paint] [isolation:isolate]"
    >
      <div className="aurora-blob blob-amber" />
      <div className="aurora-blob blob-teal" />
      <div className="aurora-blob blob-amber2" />
      <div className="aurora-blob blob-amber3" />
    </div>
  );
}

export default memo(Aurora);
