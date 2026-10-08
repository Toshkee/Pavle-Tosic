import Landing from "./site/Landing";

/* Thin server shell: the front page is one screen, see site/Landing.tsx.
   The conversation lives at /chat. */
export default function Home() {
  return <Landing />;
}
