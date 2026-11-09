"use client";

import type { MouseEvent } from "react";
import { LuMoon, LuSun } from "react-icons/lu";

/* Flips light/dark and remembers the choice; layout.tsx reads it back before
   first paint. No React state: the `dark:` variant in globals.css already
   knows the effective theme, so CSS picks the icon and server and client
   markup always match.

   The new theme opens as a circle from the button, after dyeansee's
   Circular Theme Reveal (https://21st.dev/@dyeansee/components/circular-theme-reveal),
   written from the effect, as on toobajatoi.com. The View Transitions API
   snapshots the page in the old theme, the theme flips under it, and the
   new page is clipped to a circle that grows from the button's centre to
   the farthest corner. globals.css turns off the default crossfade. Under
   reduced motion, or in a browser without the API, the theme flips at once
   as before. The new theme's film has no frame yet when the circle starts,
   so its poster (the CSS background under it) fills the circle until the
   clip plays. */
const REVEAL_MS = 600;

export default function ThemeToggle() {
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Storage blocked (private mode): the choice lasts for this page view.
      }
    };

    if (
      !("startViewTransition" in document) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply();
      return;
    }

    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    // .ready rejects when the transition is skipped (a second click before
    // the first ends): the theme has still flipped, there is just no circle.
    document.startViewTransition(apply).ready.then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: REVEAL_MS,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    }, () => {});
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark"
      className="grid size-10 place-items-center rounded-full border border-line bg-bg/70 text-ink backdrop-blur transition-colors hover:bg-surface"
    >
      <LuMoon aria-hidden className="size-[18px] dark:hidden" />
      <LuSun aria-hidden className="hidden size-[18px] dark:block" />
    </button>
  );
}
