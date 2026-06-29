"use client";

import { memo, useEffect } from "react";
import Lenis from "@studio-freight/lenis";

declare global {
  interface Window {
    // Exposed so the Terminal can drive smooth in-page navigation through the
    // same scroller instead of fighting it with native scrollIntoView.
    __lenis?: {
      scrollTo: (
        target: string | HTMLElement,
        opts?: { offset?: number }
      ) => void;
    };
  }
}

/* Lenis smooth scroll. Side-effect only (renders nothing). Disabled for users
   who prefer reduced motion, and intercepts in-page anchor links so nav jumps
   glide instead of snapping. */
function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      const href = anchor?.getAttribute("href");
      if (!href || href === "#") return;
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -80 });
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}

export default memo(SmoothScroll);
