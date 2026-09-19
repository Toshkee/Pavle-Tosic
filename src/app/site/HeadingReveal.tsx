"use client";

import { useLayoutEffect, useRef, useState } from "react";

/* Restrained mask reveal for section headings (21st.dev/@soralabs/
   components/text-reveal-mask, adapted): each word slides up out of an
   overflow-hidden clip once, when the heading first scrolls into view.
   Quieter than the hero's per-letter GSAP rise on purpose: word-level,
   one short transition, no rotate, no blur.

   Progressive enhancement, not a JS-gated entrance: the words start in
   their normal, fully visible position. Only a mounted client, with motion
   allowed, arms the clip (via useLayoutEffect, so it lands before the
   browser paints and there's no flash of visible-then-hidden text) and an
   IntersectionObserver then releases it. No JS, or prefers-reduced-motion,
   means the heading just sits there, readable, untouched. */
export function HeadingReveal({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false); // clip is on, waiting to release
  const [shown, setShown] = useState(false); // clip has released

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    setArmed(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = children.split(" ");

  return (
    <span ref={ref}>
      {words.map((word, i) => (
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom -mb-[0.12em]">
            <span
              className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: armed && !shown ? "translateY(100%)" : "translateY(0)",
                transitionDelay: shown ? `${i * 60}ms` : "0ms",
              }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
