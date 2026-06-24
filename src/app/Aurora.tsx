"use client";

/* Animated background — three large, soft, blurred brand-colour blobs that
   slowly drift behind all content. Pure CSS (GPU-composited transforms), no
   JS loop, SSR/Workers-safe. Freezes to its resting position under
   prefers-reduced-motion (base position is set outside the keyframes). */
export default function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
    >
      <div className="aurora-blob blob-amber" />
      <div className="aurora-blob blob-teal" />
      <div className="aurora-blob blob-amber2" />
    </div>
  );
}
