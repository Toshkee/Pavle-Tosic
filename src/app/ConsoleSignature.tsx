"use client";

import { useEffect } from "react";

/* A small on-brand easter egg: anyone who opens DevTools on this site (exactly
   the audience for a developer portfolio) gets a styled phosphor-green greeting
   with the real contact line. Fires once, client-only, never touches the DOM. */
export default function ConsoleSignature() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const banner =
      "color:#5cf08a;font-family:ui-monospace,monospace;font-size:13px;font-weight:700";
    const dim =
      "color:#8aa08c;font-family:ui-monospace,monospace;font-size:12px";
    const link =
      "color:#34e070;font-family:ui-monospace,monospace;font-size:12px";
    // eslint-disable-next-line no-console
    console.log(
      "%c// you opened the console. respect.\n%cPavle Tošić — Software Developer · Montenegro\n%cgithub.com/Toshkee   ·   tosiicp@gmail.com   ·   open to roles",
      banner,
      dim,
      link
    );
  }, []);

  return null;
}
