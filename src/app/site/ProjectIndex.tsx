"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

/* The /work index: bare rows, and the project's cover floats beside the
   cursor only while a row is hovered. After ssych ui's Project Index
   (https://21st.dev/@ssychui/components/project-index), with its framer-motion
   spring swapped for a CSS transition (this site ships no animation
   library). A touch screen has no hover, so there the rows are plain links;
   the cover follows the mouse only, and a focused row shows it at the right
   edge. */

export type IndexRow = {
  slug: string;
  title: string;
  tag: string;
  thumb: string;
};

const COVER_W = 220;
const COVER_H = 140;

export default function ProjectIndex({ rows }: { rows: IndexRow[] }) {
  const list = useRef<HTMLUListElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const follow = (e: React.PointerEvent) => {
    const r = list.current?.getBoundingClientRect();
    if (!r || e.pointerType === "touch") return;
    setPos({
      x: Math.min(e.clientX - r.left + 24, r.width - COVER_W),
      y: e.clientY - r.top - COVER_H / 2,
    });
  };

  const onFocus = (i: number, row: HTMLElement) => {
    const r = list.current?.getBoundingClientRect();
    if (!r) return;
    const b = row.getBoundingClientRect();
    setPos({
      x: r.width - COVER_W,
      y: b.top - r.top + b.height / 2 - COVER_H / 2,
    });
    setHover(i);
  };

  return (
    // Rule on top only: the page's footer draws the line under the last
    // row, and a bottom border here doubled it 48px above that one. The
    // tag wraps on a phone, where its own line has room, and truncates
    // only beside the title from sm.
    <ul
      ref={list}
      onPointerMove={follow}
      className="relative mt-10 divide-y divide-line border-t border-line"
    >
      {rows.map((row, i) => (
        <li key={row.slug}>
          <Link
            href={`/work/${row.slug}`}
            onPointerEnter={(e) => e.pointerType !== "touch" && setHover(i)}
            onPointerLeave={() => setHover(null)}
            onFocus={(e) => onFocus(i, e.currentTarget)}
            onBlur={() => setHover(null)}
            className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-5"
          >
            <h2
              className={`font-display text-xl font-medium tracking-tight text-ink transition-opacity duration-200 ${
                hover !== null && hover !== i ? "opacity-30" : ""
              }`}
            >
              {row.title}
            </h2>
            <span className="order-3 w-full text-[13px] text-faint sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:truncate">
              {row.tag}
            </span>
            <span
              aria-hidden
              className="ml-auto text-sm text-ink transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none sm:ml-0"
            >
              →
            </span>
          </Link>
        </li>
      ))}

      <li
        aria-hidden
        style={{
          width: COVER_W,
          height: COVER_H,
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${hover === null ? 0.96 : 1})`,
        }}
        className={`plate pointer-events-none absolute top-0 left-0 z-10 overflow-hidden rounded-lg shadow-2xl transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
          hover === null ? "opacity-0" : "opacity-100"
        }`}
      >
        {rows.map((row, i) => (
          <Image
            key={row.slug}
            src={row.thumb}
            alt=""
            width={320}
            height={180}
            className={`h-full w-full object-cover object-top ${hover === i ? "block" : "hidden"}`}
          />
        ))}
      </li>
    </ul>
  );
}
