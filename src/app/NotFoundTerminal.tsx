"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ghost, CritterKeyframes } from "./critterSprites";

/* The 404 stage: a failed `cat` on the path the visitor actually asked for,
   haunted by the ghost from the ambient cast. Enter (or the `cd ~` line)
   goes home. Static and light on purpose — no rain, no deck, no boot. */

export default function NotFoundTerminal() {
  const pathname = usePathname();
  const router = useRouter();

  // ⏎ takes you home, like accepting the prompt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-6 font-mono">
      <CritterKeyframes />
      <div className="stage-pool" aria-hidden />

      <div className="w-full max-w-xl">
        {/* the command that got you here */}
        <p className="text-sm text-muted">
          <span className="text-accent">$</span> cat {pathname}
        </p>
        <p className="mt-1 text-sm text-faint">
          cat: {pathname}: no such file or directory
        </p>

        <div className="mt-8 flex items-end gap-6">
          <h1 className="font-display text-7xl font-bold leading-none tracking-tight text-ink sm:text-8xl">
            404
          </h1>
          <span aria-hidden className="mb-1">
            <Ghost />
          </span>
        </div>

        <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-body">
          nothing lives at this path. it either never compiled, or the ghost
          got to it first.
        </p>

        <p className="mt-8 text-sm">
          <span className="text-accent">$</span>{" "}
          <Link
            href="/"
            className="link-underline font-medium text-accent-ink"
          >
            cd ~
          </Link>
          <span aria-hidden className="guide-caret" />
        </p>
        <p className="mt-2 text-xs text-faint">press ⏎ to go home</p>
      </div>
    </main>
  );
}
