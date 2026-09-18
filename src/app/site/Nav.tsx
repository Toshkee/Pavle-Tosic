"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const LINKS = [
  { href: "#features", label: "Work" },
  { href: "#spec", label: "About" },
  { href: "#log", label: "Log" },
  { href: "#order", label: "Contact" },
];

/* A floating glass bar, iOS style, dark-tinted so it reads the same over
   every photo. On phones the links live in a glass sheet under the bar,
   opened by the Menu button. Enters by sliding in; nothing starts at
   opacity 0. */
export default function Nav() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  return (
    <motion.header
      initial={reduced ? false : { y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="fixed inset-x-0 top-4 z-50 flex flex-col items-center px-4"
    >
      <nav
        aria-label="Primary"
        className="glass glass-pill glass-dark flex h-12 w-full max-w-[880px] items-center justify-between pl-5 pr-2"
      >
        <a href="#reveal" className="font-display text-[15px] font-medium tracking-[0.02em] text-ink" onClick={() => setOpen(false)}>
          Pavle Tošić
        </a>
        <ul className="flex items-center gap-1 text-[13px] text-body">
          {LINKS.map((l) => (
            <li key={l.href} className="hidden sm:block">
              <a href={l.href} className="glass-btn block px-3 py-1.5 text-ink/80 transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="/pavle-tosic-cv.pdf" className="glass glass-btn glass-strong ml-1 block px-4 py-1.5 text-ink">
              CV
            </a>
          </li>
          <li className="sm:hidden">
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
            className="glass glass-panel glass-dark mt-2 w-full max-w-[880px] p-2 sm:hidden"
          >
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="glass-btn block px-4 py-3 text-[15px] text-ink"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
