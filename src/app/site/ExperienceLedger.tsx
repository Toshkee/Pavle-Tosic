"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { LogEntry } from "./content";
import {
  BLEED,
  clamp,
  hexToRgb,
  homeOf,
  newWash,
  paintWash,
  sizeWash,
  type Wash,
} from "./pigment";

/* Work history as a ledger: every employer is a big wordmark with its years,
   and a row opens in place to show what I did there. Point at a row and a
   wash of pigment blooms behind the wordmark where the pointer came in, then
   drifts after it; the open row keeps its wash. After Pigment Experience
   Ledger by kedhareswer
   (https://21st.dev/@kedhareswer/components/pigment-experience-ledger), the
   paint itself in pigment.ts. The pigment is Claude's coral, as the cursor
   trail. The text of a closed row stays in the page (collapsed and inert), so
   a crawler reads all of it. Without a mouse the rows just open and close. */

// Core, body, edge: dense at the middle of the wash, pale at its rim.
const PIGMENT = ["#b8512d", "#d97757", "#f2c3ad"].map(hexToRgb);
const STRENGTH = 0.82;

/** "December 2025 to present · Montenegro" -> "2025 to now". */
const yearsOf = (period: string) => {
  const years = period.match(/\d{4}/g) ?? [];
  const end = /present/i.test(period) ? "now" : years[1];
  return end && end !== years[0] ? `${years[0]} to ${end}` : (years[0] ?? period);
};

const textOf = (point: LogEntry["points"][number]) =>
  typeof point === "string" ? point : point.text;

const rest = (w: Wash) => {
  const [x, y] = homeOf(w);
  w.tx = x;
  w.ty = y;
};

export default function ExperienceLedger({ entries }: { entries: LogEntry[] }) {
  const uid = useId();
  const [open, setOpen] = useState<number | null>(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const washes = useRef<Wash[]>([]);
  const heads = useRef<(HTMLDivElement | null)[]>([]);
  const names = useRef<(HTMLSpanElement | null)[]>([]);
  const loop = useRef({
    raf: 0,
    last: 0,
    frame: 0,
    clock: 0,
    visible: true,
    reduced: false,
    dark: false,
  });

  const washOf = useCallback((i: number) => {
    washes.current[i] ??= newWash(i * 7919 + 101);
    return washes.current[i];
  }, []);

  // One rAF loop for every row. It sleeps once every wash has settled and a
  // few seconds have passed since the last pointer or focus activity.
  const kick = useCallback(() => {
    const st = loop.current;
    if (st.raf) return;
    const tick = (now: number) => {
      st.raf = 0;
      const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 0.016;
      st.last = now;
      st.frame++;
      let alive = false;
      let moving = false;
      let breathing = false;
      for (const w of washes.current) {
        if (!w?.ctx) continue;
        const [level, x, y] = [w.level, w.cx, w.cy];
        if (st.reduced) {
          w.level = w.target;
          w.cx = w.tx;
          w.cy = w.ty;
        } else {
          w.level += (w.target - w.level) * (1 - Math.exp(-dt / (w.target > w.level ? 0.3 : 0.2)));
          if (Math.abs(w.target - w.level) < 0.002) w.level = w.target;
          const k = 1 - Math.exp(-dt / 0.26);
          w.cx += (w.tx - w.cx) * k;
          w.cy += (w.ty - w.cy) * k;
        }
        const changed =
          Math.abs(w.level - level) > 1e-4 ||
          Math.abs(w.cx - x) > 0.05 ||
          Math.abs(w.cy - y) > 0.05;
        if (changed) moving = true;
        const active = w.level > 0.002 || w.target > 0;
        const breathes = active && !st.reduced && now - w.lastActive < 3000;
        if (breathes) breathing = true;
        if (active) alive = true;
        if (
          (active || w.painted) &&
          (changed || !w.painted || (breathes && st.frame % 2 === 0) || !active)
        ) {
          paintWash(w, st.clock, st.dark ? Math.min(1, STRENGTH * 1.1) : STRENGTH, st.dark);
        }
      }
      if (breathing) st.clock += dt;
      if (st.visible && alive && (moving || breathing)) st.raf = requestAnimationFrame(tick);
      else st.last = 0;
    };
    st.raf = requestAnimationFrame(tick);
  }, []);

  // The pigment follows the theme: `data-theme` on <html>, as the toggle sets it.
  useEffect(() => {
    const st = loop.current;
    st.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => {
      st.dark = document.documentElement.dataset.theme === "dark";
      const [core, body, edge] = PIGMENT;
      // On a dark page the palest stop leans toward the body colour.
      const rim = st.dark ? edge.map((v, j) => v * 0.65 + body[j] * 0.35) : edge;
      entries.forEach((_, i) => {
        const w = washOf(i);
        w.ramp = [rim, body, core];
        w.painted = false;
      });
      kick();
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => mo.disconnect();
  }, [entries, washOf, kick]);

  // The hovered, focused and open rows hold pigment.
  useEffect(() => {
    entries.forEach((_, i) => {
      const w = washOf(i);
      const next = open === i || hovered === i || focused === i ? 1 : 0;
      if (next !== w.target) w.lastActive = performance.now();
      w.target = next;
      if (!w.pointer) rest(w);
    });
    kick();
  }, [open, hovered, focused, entries, washOf, kick]);

  // Header sizes feed the pigment buffers, and the wordmark's box says where
  // the wash rests.
  useEffect(() => {
    const size = (i: number) => {
      const head = heads.current[i];
      if (!head) return;
      const w = washOf(i);
      const first = !w.cssW;
      sizeWash(w, head.clientWidth, head.offsetHeight);
      const name = names.current[i];
      if (name) {
        const h = head.getBoundingClientRect();
        const n = name.getBoundingClientRect();
        w.homeX = n.left - h.left + n.width / 2;
        w.nameTop = n.top - h.top;
        w.nameH = n.height;
        w.nameW = n.width;
        w.homeY = w.nameTop + n.height / 2;
      }
      if (first || !w.pointer) rest(w);
      if (first) {
        w.cx = w.tx;
        w.cy = w.ty;
      }
    };
    const sizeAll = () => {
      entries.forEach((_, i) => size(i));
      kick();
    };
    const ro = new ResizeObserver(sizeAll);
    heads.current.forEach((h) => h && ro.observe(h));
    sizeAll();
    document.fonts?.ready.then(sizeAll);
    return () => ro.disconnect();
  }, [entries, washOf, kick]);

  // Rest off screen and in a background tab.
  useEffect(() => {
    const el = root.current;
    const st = loop.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        st.visible = e.isIntersecting;
        if (e.isIntersecting) kick();
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    const vis = () => {
      st.visible = document.visibilityState === "visible";
      if (st.visible) kick();
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [kick]);

  useEffect(() => {
    const st = loop.current;
    return () => {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
    };
  }, []);

  const toggle = (i: number) => {
    // A click hands the wash back to its wordmark.
    const w = washOf(i);
    w.pointer = false;
    rest(w);
    setOpen((o) => (o === i ? null : i));
  };

  const onMove = (i: number, e: React.PointerEvent) => {
    const head = heads.current[i];
    if (!head || e.pointerType === "touch") return;
    const w = washOf(i);
    const r = head.getBoundingClientRect();
    const [hx] = homeOf(w);
    const half = w.nameW || w.cssW * 0.3;
    // The wash leans toward the pointer rather than jumping onto it, and
    // stays on the wordmark.
    w.tx = clamp(hx + (e.clientX - r.left - hx) * 0.35, hx - half * 0.18, hx + half * 0.12);
    const y0 = w.nameH ? w.nameTop + w.nameH * 0.3 : w.headH * 0.35;
    const y1 = w.nameH ? w.nameTop + w.nameH * 0.7 : w.headH * 0.7;
    w.ty = BLEED + clamp(e.clientY - r.top, y0, y1);
    w.lastActive = e.timeStamp;
    // A fresh bloom starts where the pointer came in.
    if (w.level < 0.05) {
      w.cx = w.tx;
      w.cy = w.ty;
    }
    w.pointer = true;
    kick();
  };

  const onLeave = (i: number) => {
    const w = washOf(i);
    w.pointer = false;
    rest(w);
    setHovered((h) => (h === i ? null : h));
    kick();
  };

  return (
    <div ref={root} className="@container">
      <ol className="border-t border-line">
        {entries.map((entry, i) => {
          const isOpen = open === i;
          const btnId = `${uid}-b${i}`;
          const panelId = `${uid}-p${i}`;
          return (
            <li key={entry.org} className="border-b border-line">
              <div
                ref={(el) => {
                  heads.current[i] = el;
                }}
                className="relative"
                onPointerEnter={(e) => {
                  if (e.pointerType !== "touch") setHovered(i);
                  onMove(i, e);
                }}
                onPointerMove={(e) => onMove(i, e)}
                onPointerLeave={() => onLeave(i)}
              >
                <canvas
                  aria-hidden
                  className="pointer-events-none absolute -top-16 left-0 h-[calc(100%+8rem)] w-full"
                  ref={(el) => {
                    const w = washOf(i);
                    if (!el || w.canvas === el) return;
                    w.canvas = el;
                    w.ctx = null;
                    w.img = null;
                    w.bw = 0;
                    w.bh = 0;
                    if (w.cssW) sizeWash(w, w.cssW, w.headH);
                  }}
                />
                <h3 className="relative">
                  <button
                    type="button"
                    id={btnId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(i)}
                    onFocus={(e) => {
                      if (!e.currentTarget.matches(":focus-visible")) return;
                      washOf(i).lastActive = performance.now();
                      setFocused(i);
                    }}
                    onBlur={() => setFocused((f) => (f === i ? null : f))}
                    className="grid w-full cursor-pointer gap-y-3 py-6 text-left @lg:grid-cols-[9rem_minmax(0,1fr)] @lg:items-center @lg:gap-x-6 @lg:py-8"
                  >
                    <span className="flex items-center justify-between gap-3 text-sm text-muted italic tabular-nums @lg:justify-start">
                      <span>({yearsOf(entry.period)})</span>
                      <LuPlus
                        aria-hidden
                        className={`size-4 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      />
                    </span>
                    <span className="flex min-w-0 flex-col @lg:items-end">
                      <span
                        ref={(el) => {
                          names.current[i] = el;
                        }}
                        className="block w-fit font-display text-[length:clamp(2.1rem,11.5cqi,3.5rem)] leading-[0.9] font-semibold tracking-[-0.045em] whitespace-nowrap text-ink uppercase @lg:text-[length:clamp(2rem,9cqi,4rem)]"
                      >
                        {entry.org}
                      </span>
                      <span className="mt-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                        {entry.role}
                      </span>
                    </span>
                  </button>
                </h3>
              </div>

              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                inert={!isOpen}
                className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={`grid gap-x-6 gap-y-4 pb-8 transition-opacity duration-300 motion-reduce:transition-none @lg:grid-cols-[9rem_minmax(0,1fr)] ${
                      isOpen ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-faint">Period</dt>
                        <dd className="text-ink">{entry.period}</dd>
                      </div>
                      {entry.link && (
                        <div>
                          <dt className="text-faint">Website</dt>
                          <dd>
                            <a
                              href={entry.link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-underline text-ink"
                            >
                              {entry.link.label}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                    <div className="text-sm leading-relaxed text-body">
                      {entry.scope && <p>{entry.scope}</p>}
                      {entry.points.length > 0 && (
                        <ul
                          className={`list-disc space-y-1.5 pl-5 ${entry.scope ? "mt-2" : ""}`}
                        >
                          {entry.points.map((point) => (
                            <li key={textOf(point)}>
                              {textOf(point)}
                              {typeof point !== "string" && (
                                <>
                                  {" "}
                                  <a
                                    href={point.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-underline text-ink"
                                  >
                                    {point.label}
                                  </a>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
