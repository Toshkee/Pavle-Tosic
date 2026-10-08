"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import { PROJECTS, type Project } from "../../projects";
import { IN_PROGRESS } from "../content";
import ProjectDetail from "./ProjectDetail";

/* "What have you built?": every project as a tall photo card in a snapping
   rail, after Aceternity's Apple Cards Carousel
   (https://21st.dev/aceternity/apple-cards-carousel), the component the
   reference uses. Opening a card shows ProjectDetail in a native <dialog>. */
export default function ProjectsCard() {
  const railRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Project | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  const scroll = (direction: 1 | -1) =>
    railRef.current?.scrollBy({
      left: direction * railRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });

  return (
    <div>
      <ul
        ref={railRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-1"
      >
        {PROJECTS.map((project) => (
          <li key={project.slug} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpen(project)}
              className="group relative flex h-80 w-56 flex-col overflow-hidden rounded-3xl bg-plate text-left sm:h-96 sm:w-72"
            >
              <Image
                src={project.shot}
                alt=""
                width={1600}
                height={1000}
                className="absolute inset-0 size-full object-cover object-top transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
              />
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/75 via-black/35 to-transparent"
              />
              <span className="relative p-5">
                <span className="block text-xs font-medium text-white/80">
                  {project.context}
                </span>
                <span className="mt-1 block text-xl font-bold text-white sm:text-2xl">
                  {project.title}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs text-faint">
          In progress:{" "}
          {IN_PROGRESS.map((game, index) => (
            <span key={game.title}>
              {index > 0 && " · "}
              <span className="font-medium text-body">{game.title}</span> (
              {game.genre}, {game.stack[0]})
            </span>
          ))}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous projects"
            className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-plate"
          >
            <LuChevronLeft aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="More projects"
            className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-plate"
          >
            <LuChevronRight aria-hidden className="size-5" />
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(null)}
        // A click on the backdrop lands on the <dialog> itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        aria-label={open ? open.title : "Project"}
        className="sheet m-auto max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-bg p-0 text-body"
      >
        {open && (
          <>
            <div className="sticky top-0 z-10 flex justify-end p-3">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="grid size-10 place-items-center rounded-full bg-surface text-ink transition-colors hover:bg-plate"
              >
                <LuX aria-hidden className="size-5" />
              </button>
            </div>
            <div className="-mt-16">
              <ProjectDetail project={open} />
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
