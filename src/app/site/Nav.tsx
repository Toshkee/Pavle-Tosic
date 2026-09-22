"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RESUME } from "./content";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#clients", label: "Client work" },
  { href: "#stack", label: "Stack" },
  { href: "#log", label: "Log" },
  { href: "#contact", label: "Contact" },
];

const SECTION_IDS = LINKS.map((l) => l.href.slice(1));

/* Which section id currently owns the horizontal centre line of the
   viewport. One IntersectionObserver, shared by the desktop pill and the
   mobile menu's highlight; no scroll listener. */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return active;
}

/* A floating glass bar, iOS style, dark-tinted so it reads the same over
   every photo. On phones the links live in a glass sheet under the bar,
   opened by the Menu button. Enters by sliding in; nothing starts at
   opacity 0. */
export default function Nav() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  return (
    <motion.header
      initial={reduced ? false : { y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="fixed inset-x-0 top-4 z-50 flex flex-col items-center px-4"
    >
      <nav
        aria-label="Primary"
        className="glass glass-blur glass-pill glass-dark flex h-12 w-full max-w-[880px] items-center justify-between pl-5 pr-2"
      >
        <a href="#top" className="font-display text-[15px] font-medium tracking-[0.02em] text-ink" onClick={() => setOpen(false)}>
          Pavle Tošić
        </a>
        <ul className="flex items-center gap-1 text-[13px] text-body">
          {LINKS.map((l) => {
            const id = l.href.slice(1);
            const isActive = active === id;
            return (
              <li key={l.href} className="relative hidden md:block">
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-ember-soft"
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34 }
                    }
                  />
                )}
                <a
                  href={l.href}
                  aria-current={isActive ? "location" : undefined}
                  className={`glass-btn relative block px-2 py-1.5 whitespace-nowrap transition-colors ${
                    isActive ? "text-ember" : "text-ink/80 hover:text-ink"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            );
          })}
          <li>
            <a href={RESUME} target="_blank" rel="noreferrer" className="glass glass-btn glass-strong ml-1 block px-4 py-1.5 text-ink">
              CV
            </a>
          </li>
          <li className="md:hidden">
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="glass-btn ml-1 px-3 py-1.5 text-ink"
            >
              {open ? "Close" : "Menu"}
            </button>
          </li>
        </ul>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.ul
            id="mobile-menu"
            initial={reduced ? false : { y: -8, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -8, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-blur glass-panel glass-dark mt-2 w-full max-w-[880px] p-2 md:hidden"
          >
            {LINKS.map((l) => {
              const isActive = active === l.href.slice(1);
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "location" : undefined}
                    className={`glass-btn block px-4 py-3 text-[15px] ${
                      isActive ? "text-ember" : "text-ink"
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
