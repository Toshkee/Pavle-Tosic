"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LuPlay, LuX } from "react-icons/lu";
import type { Media } from "./content";

/* A picture or clip that opens full size when clicked, in a native
   <dialog>: focus trap, Escape and the top layer come from the browser, and
   a click beside the media closes it. The dialog only exists while open,
   so a clip stops the moment it closes and nothing of it loads before. */
export default function Zoomable({
  media,
  width,
  height,
  className = "",
  frameClassName = "",
}: {
  media: Media;
  /** Intrinsic size of the preview file. */
  width: number;
  height: number;
  /** Classes for the preview image. */
  className?: string;
  /** Classes for the button around it. */
  frameClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  const close = () => dialogRef.current?.close();
  const preview = media.kind === "image" ? media.src : media.preview;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${media.kind === "video" ? "Play" : "Open"}: ${media.alt}`}
        className={`group relative block cursor-zoom-in overflow-hidden ${frameClassName}`}
      >
        <Image
          src={preview}
          alt={media.alt}
          width={width}
          height={height}
          className={`transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none ${className}`}
        />
        {media.kind === "video" && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm">
              <LuPlay aria-hidden className="size-5 translate-x-px fill-current" />
            </span>
          </span>
        )}
      </button>

      {open && (
        <dialog
          ref={dialogRef}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          aria-label={media.alt}
          className="sheet m-auto max-h-none max-w-none overflow-visible border-0 bg-transparent p-0"
        >
          <div className="relative">
            {media.kind === "image" ? (
              // The full file's size differs per item and there is no image
              // optimizer on Workers, so a plain <img> at its natural size.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.full}
                alt={media.alt}
                className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] rounded-2xl object-contain"
              />
            ) : (
              <video
                src={media.src}
                poster={media.poster}
                controls
                autoPlay
                playsInline
                className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] rounded-2xl bg-black"
              />
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <LuX aria-hidden className="size-5" />
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
