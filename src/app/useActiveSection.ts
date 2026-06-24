"use client";

import { useEffect, useState } from "react";

// Tracks which section is currently crossing the viewport's centre band.
// Pass a module-level constant array so the effect doesn't re-run each render.
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const visible = new Set<string>();

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // First section (in document order) currently in the centre band.
        const next = ids.find((id) => visible.has(id));
        if (next) setActive(next);
      },
      // A thin band around the vertical centre — the section under it is "active".
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    els.forEach((el) => obs.observe(el));

    // At the very bottom the centre band can sit past the (short) last section,
    // so force the last id active when scrolled to the end.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
        if (atBottom) setActive(ids[ids.length - 1] ?? "");
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ids]);

  return active;
}
