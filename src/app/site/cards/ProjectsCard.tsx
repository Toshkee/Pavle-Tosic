"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import { PROJECTS, type Project } from "../../projects";
import { IN_PROGRESS } from "../content";
import ProjectDetail from "./ProjectDetail";

/* "What have you built?": every project as a photo card in a snapping
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
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-1"
      >
        {PROJECTS.map((project) => (
          <li key={project.slug} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpen(project)}
              className="group flex w-72 flex-col overflow-hidden rounded-3xl bg-plate text-left sm:w-96"
            >
              {/* The title sits on the card, above the screen, not over it:
                  over a light screenshot even a 75% black scrim let the
                  site's own headings show through the white type. */}
              <span className="block p-5 pb-4">
                <span className="block text-xs font-medium text-faint">
                  {project.context}
                </span>
                <span className="mt-1 block text-xl font-bold text-ink sm:text-2xl">
                  {project.title}
                </span>
              </span>
              {/* The window has the screenshots' own shape (1600x1000), so a
                  site shows edge to edge. In the tall, near-square window
                  it had before, object-cover kept only the middle 60% and
                  cut every headline off at both sides. */}
              <span className="relative mx-3 mb-3 block aspect-[16/10] overflow-hidden rounded-2xl">
                <Image
                  src={project.shot}
                  alt=""
                  width={1600}
                  height={1000}
                  className="absolute inset-0 size-full object-cover object-top transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-4">
        {/* Glass like the answers: the line sits on the film, under the rail. */}
        <p className="glass rounded-2xl px-3.5 py-2 text-xs text-faint">
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
        // React hands this handler the close of a dialog nested inside it
        // too (a demo clip or a still opened full size), though the DOM
        // event does not bubble. Clearing the project then emptied this
        // dialog while it stayed open: an invisible sheet over a blurred
        // page until the next click. Only its own close counts.
        onClose={(event) => {
          if (event.target === event.currentTarget) setOpen(null);
        }}
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
              {/* Sticky, so it stays in reach on a long sheet; frosted with a
                  ring and shadow so it reads as a control floating over the
                  text rather than a grey disc stuck on it. */}
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="grid size-10 place-items-center rounded-full bg-bg/85 text-ink shadow-md ring-1 ring-line backdrop-blur transition-colors hover:bg-surface"
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
