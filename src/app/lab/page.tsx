import type { Metadata } from "next";
import Link from "next/link";
import RappelDroid from "../RappelDroid";
import WalkingBug from "../WalkingBug";

export const metadata: Metadata = {
  title: "Lab — roaming droid",
  description: "Isolated prototype: a phosphor mini-droid that rappels on scroll.",
};

const SECTIONS = [
  { k: "$ scroll", t: "Rappel on scroll", d: "The droid descends its thread as you scroll — tied to page progress, springed so it never snaps." },
  { k: "~ idle", t: "Dangles + swings", d: "It hangs from the nav and sways on a gentle pendulum, with an extra kick when you scroll fast." },
  { k: "> cursor", t: "Reacts to you", d: "Its eyes follow your cursor; get close and it waves hello with both hands." },
  { k: "// perf", t: "Cheap + polite", d: "All GPU transforms, no React re-renders per frame, and it goes still for prefers-reduced-motion." },
  { k: "?? next", t: "Then the real page", d: "Once this feels right we wire it into the actual section-deck scroll model — this page is throwaway." },
];

export default function LabPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-ink)",
        backgroundImage: "radial-gradient(var(--color-line) 1px, transparent 1px)",
        backgroundSize: "38px 38px",
      }}
    >
      {/* nav the droid hangs beneath */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          height: 56,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid var(--color-line)",
          background: "rgba(10,15,10,0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span style={{ color: "var(--color-accent-ink)", fontSize: 14 }}>
          ~/lab/droid
        </span>
        <Link href="/" style={{ color: "var(--color-faint)", fontSize: 13 }}>
          ← back to portfolio
        </Link>
      </nav>

      <RappelDroid />
      <WalkingBug />

      {/* Content sits in its own layer so the bug can crawl UNDER the text
          (z-index 0) as well as over it (z-index 45). */}
      <div style={{ position: "relative", zIndex: 1 }}>
      <header style={{ maxWidth: 720, padding: "72px 24px 24px", margin: "0 auto" }}>
        <div style={{ color: "var(--color-accent-ink)", fontSize: 14, marginBottom: 12 }}>
          $ ./characters --isolated
        </div>
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, margin: 0, lineHeight: 1.05 }}>
          Pixel characters — prototype
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: 17, lineHeight: 1.6, marginTop: 14 }}>
          The droid rappels as you scroll, waves when your cursor comes near, and backflips
          now and then (flick-scroll to trigger one). A pixel bug crawls all over the page —
          over the words and behind them — and trots over to spin hello when your cursor comes
          near. Nothing here touches your real page.
        </p>
      </header>

      {SECTIONS.map((s) => (
        <section
          key={s.t}
          style={{
            minHeight: "82vh",
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "var(--color-accent-ink)", fontSize: 14, marginBottom: 10 }}>
            {s.k}
          </div>
          <h2 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 700, margin: 0 }}>
            {s.t}
          </h2>
          <p style={{ color: "var(--color-muted)", fontSize: 17, lineHeight: 1.6, marginTop: 12, maxWidth: 560 }}>
            {s.d}
          </p>
        </section>
      ))}

      <footer style={{ height: "40vh", display: "grid", placeItems: "center", color: "var(--color-faint)", fontSize: 13 }}>
        end of thread — scroll back up
      </footer>
      </div>
    </div>
  );
}
