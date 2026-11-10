"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

/* The site's background film, fixed behind every page but the game (/play
   has its own screen and loads none of this), one per theme: a statue of
   a kickboxer wrapping his hands, the wraps streaming across the frame
   with a coral (#d97757) edge and a low bank of mist drifting in at the
   bottom left, in white marble for light and black obsidian for dark
   (2026-11-10; it replaced the red monoliths, a free MotionSites
   background). The stills are GPT Image 2.6 on Higgsfield, the dark one
   re-rendered from the light so both themes show the same sculpture;
   each was filmed by Seedance 2.0 (8 s, 1080p, the still as first and
   last frame; the 720p Mini was tried first and was too soft). The model
   does not hold the last frame, so the light clip is cut where it comes
   back closest to its first (frame 116), the dark one runs whole, and the
   last half second of each is cross-faded into its first: the seam is
   within 2 to 3 dB of two neighbouring frames. Both encoded to H.264 at
   1920px (hqdn3d, crf 25, BT.709) with no audio or metadata, 0.7 MB and
   1.1 MB. The first frame of
   each is a CSS background on the wrapper (.film in globals.css, which
   also lays a light wash of the page colour over it, the same on every
   page), so the page has its picture before
   hydration and only the current theme's poster is fetched. Once hydrated,
   the current theme's clip plays over its own poster; a theme switch swaps
   the clip. Under reduced motion the poster stays and no clip loads. */

// A phone held upright gets the 9:16 film, ribbons and mist without the
// statue (the same query as .film's poster in globals.css): the same
// recipe at 720p, the dark clip cut at frame 177, the light one run whole
// with a one-second cross-fade as it never quite comes back, 0.5 and 0.6 MB.
const CLIPS = {
  wide: { light: "/video/film-light-wide.mp4", dark: "/video/film-dark-wide.mp4" },
  tall: { light: "/video/film-light-tall.mp4", dark: "/video/film-dark-tall.mp4" },
};

// The theme lives on <html data-theme>, written by ThemeToggle.
const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};
const themeNow = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

const REDUCED = "(prefers-reduced-motion: reduce)";
const TALL = "(max-width: 767px) and (orientation: portrait)";
const subscribeMedia = (media: string) => (onChange: () => void) => {
  const query = window.matchMedia(media);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const subscribeMotion = subscribeMedia(REDUCED);
const subscribeTall = subscribeMedia(TALL);
const reducedNow = () => window.matchMedia(REDUCED).matches;
const tallNow = () => window.matchMedia(TALL).matches;

export default function FilmBackdrop() {
  const pathname = usePathname();
  const theme = useSyncExternalStore(subscribeTheme, themeNow, () => null);
  const reduced = useSyncExternalStore(subscribeMotion, reducedNow, () => true);
  const tall = useSyncExternalStore(subscribeTall, tallNow, () => false);

  if (pathname.startsWith("/play")) return null;
  const clip = theme && !reduced ? CLIPS[tall ? "tall" : "wide"][theme] : null;
  return (
    <div aria-hidden className="film">
      {clip && (
        <video
          key={clip}
          src={clip}
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
