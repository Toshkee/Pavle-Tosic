"use client";

import { LuMoon, LuSun } from "react-icons/lu";

/* Flips light/dark and remembers the choice; layout.tsx reads it back before
   first paint. No React state: the `dark:` variant in globals.css already
   knows the effective theme, so CSS picks the icon and server and client
   markup always match. */
export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked (private mode): the choice lasts for this page view.
    }
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
