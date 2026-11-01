"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

/* The site's background film, fixed behind every page but the game (/play
   has its own screen and loads none of this), one per theme: the red monoliths in
   the forest, a free background from MotionSites
   (motionsites.ai/backgrounds), by night in dark and graded to ink on
   white paper in light, so both themes show the same place. The light
   clip is the dark one through ffmpeg's
     hqdn3d=2:2:4:4, hue=s=0,
     curves=all='0/0.2 0.05/0.28 0.1/0.4 0.14/0.64 0.22/0.76 0.3/0.84 0.45/0.95 0.6/1 1/1',
     colorbalance=rs=0.04:bs=-0.03:rm=0.02:bm=-0.02
   in grey, a steep curve between 0.10 and 0.14: the monoliths (about
   0.10 in the dark frame) and the mist round them (0.13) are nearly the
   same, and an even lift had blurred them into one. The sky (0.30) stops
   at a pale grey (0.84) so the clouds (0.50) still show white against it,
   and a touch of warmth keeps the night's red in it. The denoise is what
   keeps that contrast from tripling the file. Both re-encoded to H.264 at
   1600px with no audio or metadata, 675 KB and 536 KB. The first frame of
   each is a CSS background on the wrapper (.film in globals.css, which
   also lays a light wash of the page colour over it, the same on every
   page), so the page has its picture before
   hydration and only the current theme's poster is fetched. Once hydrated,
   the current theme's clip plays over its own poster; a theme switch swaps
   the clip. Under reduced motion the poster stays and no clip loads. */

const CLIPS = { light: "/video/film-light.mp4", dark: "/video/film-dark.mp4" };

// The theme lives on <html data-theme>, written by ThemeToggle.
const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};
const themeNow = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const reducedNow = () => window.matchMedia(REDUCED).matches;

export default function FilmBackdrop() {
  const pathname = usePathname();
  const theme = useSyncExternalStore(subscribeTheme, themeNow, () => null);
  const reduced = useSyncExternalStore(subscribeMotion, reducedNow, () => true);

  if (pathname.startsWith("/play")) return null;
  return (
    <div aria-hidden className="film">
      {theme && !reduced && (
        <video
          key={theme}
          src={CLIPS[theme]}
          autoPlay
          muted
          loop
          playsInline
          className="size-full object-cover"
        />
      )}
    </div>
  );
}
