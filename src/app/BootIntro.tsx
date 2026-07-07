"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/* Cinematic "boot" overlay shown once per browser-tab session. It is rendered
   on the server too (so the first paint is the boot screen, never a flash of
   the site underneath), then the client either plays the sequence (first
   visit) or dismisses it instantly (already seen this session / reduced
   motion). A <noscript> rule in layout.tsx hides it when JS is off, so the
   site is never trapped behind it.

   Flow: boot log → (press Enter / click / 5s) → a one-shot WebGL CINEMATIC
   plays full-screen → the overlay fades out, revealing the site. The cinematic
   (canvas-2D) is lazy-loaded only when we actually enter it, and is prefetched
   during the "press Enter" hold so it's ready by the time the visitor acts. */

const IntroCinematic = dynamic(() => import("./IntroCinematic"), {
  ssr: false,
  loading: () => null,
});

const STEPS: { k: string; v: string }[] = [
  { k: "kernel", v: "mononoki · phosphor-green" },
  { k: "stack", v: "typescript · react · c# · .net" },
  { k: "projects", v: "4 loaded" },
  { k: "github", v: "@toshkee online" },
  { k: "contact", v: "channels up" },
];

export default function BootIntro() {
  // SSR + first client render are identical (phase "boot"), so no hydration
  // mismatch. The effect decides whether to actually run or skip.
  const [phase, setPhase] = useState<"boot" | "cinematic" | "leaving" | "done">(
    "boot"
  );
  const [step, setStep] = useState(0); // STEPS revealed so far
  const [ready, setReady] = useState(false); // sequence finished, awaiting enter
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterRef = useRef<(() => void) | null>(null); // "continue" → play cinematic
  const skipRef = useRef<(() => void) | null>(null); // "skip" → straight to site
  const leaveRef = useRef<() => void>(() => {}); // cinematic onDone → leave

  // Stable callback handed to the cinematic so its effect deps don't churn.
  const handleCinematicDone = useCallback(() => leaveRef.current(), []);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("pt_booted") === "1";
    } catch {
      /* storage blocked — treat as not-seen, just play once */
    }

    if (reduce || seen) {
      // Client-only decision (reduced-motion + sessionStorage), impossible to
      // make during SSR without a hydration mismatch — so we dismiss here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("done");
      return;
    }
    try {
      sessionStorage.setItem("pt_booted", "1");
    } catch {
      /* ignore */
    }

    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden"; // lock scroll while booting / playing

    const timers: ReturnType<typeof setTimeout>[] = [];
    let entered = false;
    let i = 0;

    // Function declarations (hoisted) so the handlers can reference each other.
    function enterCinematic() {
      if (entered) return; // idempotent: key + click + auto-advance may all fire
      entered = true;
      // Detach the boot key listener now; the cinematic owns input from here.
      window.removeEventListener("keydown", onKey);
      setPhase("cinematic");
    }

    function startLeave() {
      if (leaveTimer.current) return; // idempotent
      window.removeEventListener("keydown", onKey); // safe if already removed
      setPhase("leaving");
      leaveTimer.current = setTimeout(() => setPhase("done"), 520);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enterCinematic();
      } else if (e.key === "Escape") {
        e.preventDefault();
        startLeave(); // Esc bypasses the cinematic straight to the site
      }
    }

    function tick() {
      i += 1;
      setStep(i);
      if (i < STEPS.length) {
        timers.push(setTimeout(tick, 200));
      } else {
        // Boot log done — hold on the prompt, prefetch the cinematic chunk so
        // it's warm, and auto-enter after 5s if the visitor does nothing.
        setReady(true);
        import("./IntroCinematic").catch(() => {});
        timers.push(setTimeout(enterCinematic, 5000));
      }
    }

    timers.push(setTimeout(tick, 280));
    window.addEventListener("keydown", onKey);
    enterRef.current = enterCinematic;
    skipRef.current = startLeave;
    leaveRef.current = startLeave;

    return () => {
      timers.forEach(clearTimeout);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      window.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
    };
  }, []);

  // Restore scroll the moment we start leaving (so the reveal feels instant).
  useEffect(() => {
    if (phase === "leaving" || phase === "done") {
      document.documentElement.style.overflow = "";
    }
  }, [phase]);

  if (phase === "done") return null;

  const inCinematic = phase === "cinematic" || phase === "leaving";

  return (
    <div
      className="boot-overlay fixed inset-0 z-[100] flex items-center justify-center bg-bg px-6"
      data-leaving={phase === "leaving" ? "true" : undefined}
      role="status"
      aria-label="Loading portfolio"
    >
      {inCinematic ? (
        <IntroCinematic onDone={handleCinematicDone} />
      ) : (
        <div className="w-full max-w-md font-mono text-[13px] leading-relaxed">
          <div className="mb-4 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-faint/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent-2/70" />
            <span className="ml-2 text-[11px] text-muted">pavle.os - boot</span>
          </div>
          <p className="text-muted">
            <span className="text-accent">$</span> ./boot --portfolio
          </p>
          <div className="mt-1 space-y-0.5">
            {STEPS.slice(0, step).map((s) => (
              <p key={s.k} className="text-body">
                <span className="text-faint">[</span>
                <span className="text-accent">ok</span>
                <span className="text-faint">]</span>{" "}
                <span className="inline-block w-[4.5rem] text-muted">{s.k}</span>
                {s.v}
              </p>
            ))}
          </div>
          {ready ? (
            <div className="mt-4">
              {/* The prompt itself is the click target, so the keyboard and
                  mouse paths share one line of copy. */}
              <button
                type="button"
                onClick={() => enterRef.current?.()}
                className="text-left text-accent-ink transition-opacity hover:opacity-80"
              >
                ▸ system ready - press{" "}
                <kbd className="mx-0.5 rounded border border-accent/50 bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-ink">
                  ⏎ Enter
                </kbd>{" "}
                to enter
                <span className="hero-caret" />
              </button>
              {/* Drains over 5s; when it empties the cinematic auto-plays. */}
              <div className="mt-3 h-[3px] w-full max-w-[18rem] overflow-hidden rounded-full bg-line">
                <div className="boot-countdown h-full w-full rounded-full bg-accent" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => skipRef.current?.()}
              className="mt-5 text-[11px] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              skip ⏎
            </button>
          )}
        </div>
      )}
    </div>
  );
}
