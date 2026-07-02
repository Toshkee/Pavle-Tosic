"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useMotionValue, useReducedMotion } from "framer-motion";
import {
  CritterKeyframes,
  DroidMk2,
  BeetleMk2,
  TerminalCat,
  Daemon,
  Ghost,
  Blob,
  type Look,
} from "../critterSprites";

/* ─────────────────────────────────────────────────────────────
   CHARACTER LAB — a gallery of ambient-character concepts.

   A spread of REFINED takes on the two live characters plus a fresh
   dev-culture cast, each idling in its own framed cell. The sprites live in
   critterSprites.tsx (shared with the roaming characters on the real page);
   here their eyes track your cursor via shared motion values.
───────────────────────────────────────────────────────────── */

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

type Critter = {
  key: string;
  name: string;
  tag: "refined" | "new";
  note: string;
  Comp: (p: { look: Look }) => React.ReactElement;
};

const CRITTERS: Critter[] = [
  { key: "droid", name: "droid.mk2", tag: "refined", note: "The rappel droid, cleaned up: screen-face, rounded shell, thruster glow. Same soul, sharper body.", Comp: DroidMk2 },
  { key: "beetle", name: "beetle.mk2", tag: "refined", note: "The bug, refined: rounded carapace, iridescent stripes, a real tripod leg cycle instead of ticking sticks.", Comp: () => <BeetleMk2 /> },
  { key: "cat", name: "cat.sh", tag: "new", note: "A terminal cat — prowls, blinks, twitches an ear. The dev-desk classic.", Comp: TerminalCat },
  { key: "daemon", name: "daemon", tag: "new", note: "A literal background daemon: horns, trident, fangs. Nods to the unix mascot and the process pun.", Comp: Daemon },
  { key: "ghost", name: "ghost.exe", tag: "new", note: "A pixel spectre that bobs and glitches — RGB-split flicker kept inside the green. Haunts the margins.", Comp: Ghost },
  { key: "blob", name: "slime{}", tag: "new", note: "A squash-and-stretch slime. Cheapest to rig, hardest not to smile at.", Comp: Blob },
];

export default function CritterGallery() {
  const reduce = useReducedMotion();
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);
  const look = { x: lookX, y: lookY };

  // Shared cursor tracking: pupils across every cell glance toward the cursor.
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      lookX.set(clamp(nx * 5.2, -2.6, 2.6));
      lookY.set(clamp(ny * 4, -2, 2));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce, lookX, lookY]);

  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <CritterKeyframes />
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-line/70 bg-bg/80 px-6 py-4 backdrop-blur-md">
        <span className="font-mono text-sm text-accent-ink">~/lab/critters</span>
        <Link href="/" className="font-mono text-[13px] text-faint transition-colors hover:text-accent-ink">
          ← back to portfolio
        </Link>
      </nav>

      <header className="mx-auto max-w-5xl px-6 pt-14 pb-8">
        <p className="font-mono text-xs text-faint">
          <span className="text-accent">$</span> ls ./critters
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
          Character lab
        </h1>
        <p className="mt-4 max-w-[62ch] leading-relaxed text-body">
          A spread of concepts —{" "}
          <span className="text-accent-ink">refined</span> takes on the two
          characters already roaming the site, plus a fresh cast. Each one idles
          here and its eyes follow your cursor. Point at the one you like and I&apos;ll give it
          the full roaming + page-aware rig.
        </p>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {CRITTERS.map(({ key, name, tag, note, Comp }) => (
          <div key={key} className="overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-accent/50">
            <div className="flex items-center gap-2 border-b border-line/70 bg-bg/40 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-faint/70" />
              <span className="h-2 w-2 rounded-full bg-accent/70" />
              <span className="h-2 w-2 rounded-full bg-accent-2/70" />
              <span className="ml-1 truncate font-mono text-[11px] text-muted">{name}</span>
              <span className={`ml-auto rounded border px-1.5 py-px font-mono text-[9px] uppercase tracking-wide ${tag === "new" ? "border-accent/40 text-accent-ink" : "border-line text-faint"}`}>
                {tag}
              </span>
            </div>
            <div
              className="flex h-[168px] items-center justify-center"
              style={{
                backgroundImage: "radial-gradient(var(--color-line) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              <Comp look={look} />
            </div>
            <p className="border-t border-line/60 px-3 py-3 text-[13px] leading-snug text-body">
              {note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
