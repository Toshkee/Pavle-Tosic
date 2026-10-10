import type { Metadata } from "next";
import Quest from "../site/quest/Quest";

export const metadata: Metadata = {
  title: "Toshkee's Quest | Pavle Tošić",
  description:
    "A tiny arcade quest starring a pixel Pavle: five missions through a developer's week, from a bad deploy to a full class at the gym.",
  alternates: { canonical: "https://pavletosic.com/play" },
};

/* The game is a client component (a canvas and the keyboard); this page
   only gives it a URL and its metadata. */
export default function PlayPage() {
  return <Quest />;
}
