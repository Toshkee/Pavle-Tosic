import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Memoji } from "../lib/Memoji";
import { inOut, mix, outExpo, p, rise, track } from "../lib/motion";
import { Pointer, Stage, ThemeProvider, Wake, type Camera } from "../lib/stage";
import { LIGHT, MONO, SANS } from "../lib/theme";
import { AskBar, Film, glass, Glyph, pill, ThemeToggle, Thinking } from "../lib/ui";

/* Job fit, the site's one card the model writes: drop a job ad on the chat
   and it answers requirement by requirement, from the CV and the case
   studies, and says "Not yet" where that is the answer (FitCard.tsx; the
   rules are the "Job ads" section of api/chat/prompt.ts). The ad here is
   made up; every line of evidence is on the site. */
const ROWS = [
  {
    match: "yes",
    requirement: "TypeScript and React",
    evidence: "Where I'm strongest. Reform Fitness is a React 19 + TypeScript PWA.",
    link: null,
  },
  {
    match: "yes",
    requirement: "Automated testing",
    evidence: "919 tests in 98 files, at three levels.",
    link: "Reform Fitness case study",
  },
  {
    match: "partly",
    requirement: "Python and Django",
    evidence: "CryptoFlow's API is Django: 24 REST endpoints across 3 apps. Not my daily stack.",
    link: null,
  },
  { match: "no", requirement: "Kubernetes", evidence: "Not on my CV.", link: null },
] as const;

const MATCH = {
  yes: { label: "Yes", icon: "Check", style: { background: LIGHT.ink, color: "#fff" } },
  partly: { label: "Partly", icon: "Minus", style: { border: `1px solid ${LIGHT.lineStrong}` } },
  no: { label: "Not yet", icon: "X", style: { border: `1px solid ${LIGHT.line}` } },
} as const;

const DROP = 92;
const SEND_CLICK = 150;
const CARD = 226;
const ROW_AT = [240, 276, 312, 348];
const PUSH = 378;

const pointer = track([
  { f: 8, x: 1340, y: 250 },
  { f: 84, x: 664, y: 372, bend: 0.14 },
  { f: 100, x: 664, y: 372 },
  { f: 140, x: 983, y: 643, bend: -0.12 },
  { f: 172, x: 983, y: 643 },
  { f: 214, x: 1110, y: 470, bend: 0.1 },
]);

const AD = ["TypeScript and React", "Automated testing", "Python and Django", "Kubernetes"];

export const Fit: React.FC = () => {
  const frame = useCurrentFrame();
  const push = p(frame, PUSH, 70, inOut);
  const camera: Camera = { zoom: mix(1, 1.45, push), cx: mix(640, 610, push), cy: mix(360, 432, push) };
  const sent = frame >= SEND_CLICK;
  const busy = frame >= SEND_CLICK + 14 && frame < CARD;
  const laptop = p(frame, SEND_CLICK + 14, 10, outExpo) - p(frame, CARD - 4, 10);
  const at = pointer(frame) ?? { x: 1340, y: 250 };
  const drop = p(frame, DROP, 22, inOut);
  const press = p(frame, SEND_CLICK, 4) - p(frame, SEND_CLICK + 5, 9);
  // The card is as tall as the rows it has so far.
  const shown = ROW_AT.reduce((n, f) => n + p(frame, f, 26, outExpo), 0);
  const cardIn = p(frame, CARD, 30, outExpo);
  const caption = p(frame, PUSH + 30, 50, outExpo);

  return (
    <ThemeProvider value={LIGHT}>
      <AbsoluteFill style={{ fontFamily: SANS, color: LIGHT.ink }}>
        <Film theme={LIGHT} />
        <Wake cursor={pointer} camera={camera} />
        <Stage camera={camera}>
          <div style={{ position: "absolute", top: 16, right: 16 }}>
            <ThemeToggle />
          </div>
          <Memoji x={608} y={16} size={64} cursor={pointer} style={{ opacity: 1 - laptop }} />
          {laptop > 0 && (
            <Img
              src={staticFile("images/memoji-laptop.webp")}
              style={{ position: "absolute", left: 608, top: 16, width: 64, height: 64, opacity: laptop }}
            />
          )}

          {/* What the chat says while it waits for the ad. */}
          {!sent && (
            <div
              style={{
                ...glass(LIGHT),
                position: "absolute",
                left: 0,
                right: 0,
                margin: "0 auto",
                width: "fit-content",
                top: 168,
                borderRadius: 24,
                padding: "16px 24px",
                fontSize: 18,
                lineHeight: "28px",
                transform: `translateY(${(1 - p(frame, 0, 40, rise)) * 30}px)`,
              }}
            >
              Paste a job ad below or drop its PDF here, and I'll show how I match it.
            </div>
          )}

          {sent && (
            <div
              style={{
                position: "absolute",
                right: 272,
                top: 104,
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderRadius: "24px 24px 8px 24px",
                background: LIGHT.surface,
                padding: "10px 16px",
                fontSize: 15,
                lineHeight: "22px",
                transform: `translateY(${(1 - p(frame, SEND_CLICK, 18, outExpo)) * 12}px)`,
              }}
            >
              Do I fit this job?
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, opacity: 0.7 }}>
                <Glyph name="FileText" size={14} />
                job-ad.pdf
              </span>
            </div>
          )}
          {busy && (
            <div
              style={{
                ...glass(LIGHT),
                position: "absolute",
                left: 272,
                top: 166,
                borderRadius: 999,
                padding: "10px 16px",
                fontSize: 15,
                lineHeight: "22px",
                transform: `translateY(${(1 - p(frame, SEND_CLICK + 14, 18, outExpo)) * 12}px)`,
              }}
            >
              <Thinking />
            </div>
          )}

          {/* The fit card. */}
          {frame >= CARD && (
            <div
              style={{
                ...glass(LIGHT),
                position: "absolute",
                left: 272,
                top: 164,
                width: 736,
                boxSizing: "border-box",
                height: 28 + 16 + 12 + 82 * shown + 4 + 44 * p(frame, ROW_AT[3] + 6, 24, outExpo) + 24,
                overflow: "hidden",
                borderRadius: 24,
                padding: "28px 28px 0",
                transform: `translateY(${(1 - cardIn) * 12}px)`,
              }}
            >
              <div style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                How I match: Frontend Engineer
              </div>
              <div style={{ marginTop: 12 }}>
                {ROWS.map((row, i) => {
                  const m = MATCH[row.match];
                  return (
                    <div
                      key={row.requirement}
                      style={{
                        display: "flex",
                        gap: 16,
                        height: 82,
                        boxSizing: "border-box",
                        padding: "16px 0",
                        borderTop: i ? `1px solid ${LIGHT.line}` : undefined,
                        opacity: p(frame, ROW_AT[i], 8),
                        transform: `translateY(${(1 - p(frame, ROW_AT[i], 22, outExpo)) * 12}px)`,
                      }}
                    >
                      <span
                        style={{
                          marginTop: 2,
                          width: 76,
                          height: 24,
                          boxSizing: "border-box",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          ...m.style,
                        }}
                      >
                        <Glyph name={m.icon} size={14} />
                        {m.label}
                      </span>
                      <div>
                        <div style={{ fontSize: 16, lineHeight: "24px", fontWeight: 600 }}>{row.requirement}</div>
                        <div style={{ marginTop: 4, fontSize: 14, lineHeight: "22px", whiteSpace: "nowrap" }}>
                          {row.evidence}
                          {row.link && (
                            <>
                              {" "}
                              <span style={{ textDecoration: "underline", textDecorationColor: LIGHT.lineStrong, textUnderlineOffset: 3 }}>
                                {row.link}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, lineHeight: "16px" }}>
                Matched by the AI against my CV and projects. The case studies have the details.
              </div>
            </div>
          )}

          {/* The chat's question box, waiting for an ad, and the PDF's chip
              above it once it has been dropped. */}
          <div
            style={{
              position: "absolute",
              left: 272,
              top: 612,
              width: 736,
              transform: `translateY(${(1 - p(frame, 0, 44, rise)) * 160}px)`,
            }}
          >
            {frame >= DROP + 14 && !sent && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: -42,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    ...pill(LIGHT),
                    background: LIGHT.bg,
                    padding: "4px 6px 4px 12px",
                    fontWeight: 400,
                    transform: `scale(${0.8 + 0.2 * p(frame, DROP + 14, 16, outExpo)})`,
                  }}
                >
                  <Glyph name="FileText" size={16} />
                  job-ad.pdf
                  <span style={{ width: 24, height: 24, display: "grid", placeItems: "center" }}>
                    <Glyph name="X" size={14} />
                  </span>
                </div>
              </div>
            )}
            <AskBar
              chat
              attach={!sent}
              width={736}
              text=""
              press={press}
              placeholder={sent ? "Ask me anything…" : "Paste the job ad, or attach its PDF…"}
            />
            <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, lineHeight: "16px" }}>
              An AI answers for me, from what I wrote down. It can get things wrong: how this works.
            </div>
          </div>

          {/* The job ad, carried in under the pointer and dropped on the chat. */}
          {frame >= 8 && frame < DROP + 22 && (
            <div
              style={{
                position: "absolute",
                left: mix(at.x - 150, 640 - 130, drop),
                top: mix(at.y - 70, 430, drop),
                width: 260,
                height: 330,
                boxSizing: "border-box",
                padding: "22px 22px",
                borderRadius: 6,
                background: "#fff",
                border: `1px solid ${LIGHT.line}`,
                boxShadow: "0 30px 60px -20px rgba(0,0,0,.35)",
                transformOrigin: "50% 60%",
                transform: `rotate(${mix(mix(7, -3, p(frame, 8, 76, inOut)), 0, drop)}deg) scale(${mix(1, 0.1, drop)})`,
                opacity: 1 - p(frame, DROP + 14, 8),
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.2em" }}>JOB AD</div>
              <div style={{ marginTop: 10, fontSize: 21, lineHeight: "26px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                Frontend Engineer
              </div>
              <div style={{ fontSize: 12, lineHeight: "20px" }}>Remote · Full-time</div>
              <div style={{ marginTop: 16, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                What you'll need
              </div>
              {AD.map((line) => (
                <div key={line} style={{ marginTop: 8, display: "flex", gap: 8, fontSize: 13, lineHeight: "18px" }}>
                  <span>•</span>
                  {line}
                </div>
              ))}
              {[92, 100, 64].map((w, i) => (
                <div key={i} style={{ marginTop: i ? 8 : 20, height: 6, width: `${w}%`, borderRadius: 3, background: LIGHT.line }} />
              ))}
            </div>
          )}

          <Pointer cursor={pointer} clicks={[SEND_CLICK]} />
        </Stage>

        {/* What the scene is for, over the push in on the last row. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 380,
            background: "linear-gradient(to top, #fff 52%, rgba(255,255,255,0))",
            opacity: caption,
          }}
        />
        {/* In from the white of the benchmarks. */}
        <AbsoluteFill style={{ background: "#fff", opacity: 1 - p(frame, 0, 16) }} />
        <div style={{ position: "absolute", left: 120, bottom: 84, clipPath: "inset(0 -120px)", height: 110 }}>
          <div
            style={{
              fontSize: 84,
              lineHeight: "110px",
              fontWeight: 800,
              letterSpacing: "-0.045em",
              transform: `translateY(${(1 - caption) * 105}%)`,
            }}
          >
            It says “Not yet” when it's not yet.
          </div>
        </div>
      </AbsoluteFill>
    </ThemeProvider>
  );
};
