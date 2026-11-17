import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { linear, outExpo, p } from "../lib/motion";
import { BEAT, LIGHT, MONO, SANS } from "../lib/theme";

/* The benchmark slide every model launch has, with numbers anyone can
   check. Four projects, the ones the film leads with, and for each the
   three `kpis` of its case study (src/app/projects.ts), word for word; the
   line under the table is the CV and the GitHub card (github.ts, counted
   2 Nov 2026). A table, not a bar chart: the four share no one unit (only
   Reform's case study counts tests), and bars across units would lie. */
type Kpi = { value: number; label: string; note: string };
const ROWS: { name: string; context: string; kpis: [Kpi, Kpi, Kpi] }[] = [
  {
    name: "Reform Fitness",
    context: "Vaky, October 2026",
    kpis: [
      { value: 919, label: "tests", note: "in 98 files" },
      { value: 27, label: "Cloud Functions", note: "bookings, invites, reminders, push" },
      { value: 54, label: "commits", note: "since 1 October 2026" },
    ],
  },
  {
    name: "Infostream",
    context: "Infostream, May to October 2026",
    kpis: [
      { value: 119, label: "commits", note: "May to October 2026" },
      { value: 301, label: "translated strings", note: "per language, parity checked" },
      { value: 21, label: "client systems listed", note: "across three domains" },
    ],
  },
  {
    name: "Vaky.me",
    context: "Vaky, since August 2026",
    kpis: [
      { value: 24, label: "API endpoints", note: "Pages Functions" },
      // 15 and 50, as the case study counts them.
      { value: 65, label: "concept sites", note: "15 in Montenegro, 50 for the US" },
      { value: 9, label: "motion design videos", note: "on the site, Remotion" },
    ],
  },
  {
    name: "Distinct",
    context: "Vaky, October 2026",
    kpis: [
      { value: 23, label: "case study pages", note: "each in two languages" },
      { value: 7, label: "Remotion compositions", note: "showreels, loops, share image" },
      { value: 35, label: "commits", note: "since 23 October 2026" },
    ],
  },
];

const LEFT = 120;
const WIDTH = 1680;
const NAME = 440;
const CELL = (WIDTH - NAME) / 3;
const TOP = 356;
const ROW = 148;

export const Numbers: React.FC = () => {
  const frame = useCurrentFrame();
  const away = p(frame, 344, 16, linear);
  const head = p(frame, 4, 44, outExpo);
  return (
    <AbsoluteFill style={{ background: LIGHT.bg, color: LIGHT.ink, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${away * -60}px)`, opacity: 1 - away }}>
        <div
          style={{
            position: "absolute",
            left: LEFT,
            top: 84,
            fontFamily: MONO,
            fontSize: 21,
            letterSpacing: "0.3em",
            color: "#c2613f",
            fontWeight: 600,
            opacity: head,
          }}
        >
          BENCHMARKS
        </div>
        <div style={{ position: "absolute", left: LEFT - 4, top: 118, clipPath: "inset(0 -120px)", height: 124 }}>
          <div
            style={{
              fontSize: 100,
              lineHeight: "124px",
              fontWeight: 800,
              letterSpacing: "-0.045em",
              transform: `translateY(${(1 - head) * 105}%)`,
            }}
          >
            The kind you can check.
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: LEFT,
            top: TOP - 52,
            width: WIDTH,
            fontFamily: MONO,
            fontSize: 20,
            lineHeight: "28px",
            display: "flex",
            justifyContent: "space-between",
            opacity: p(frame, BEAT - 10, 20),
          }}
        >
          <span style={{ fontWeight: 600 }}>Four projects, three numbers each</span>
          <span style={{ opacity: 0.6 }}>from each case study at pavletosic.com/work</span>
        </div>

        {ROWS.map((row, i) => {
          const at = BEAT + i * BEAT;
          const show = p(frame, at - 4, 14);
          const rule = p(frame, at - 6, 50, outExpo);
          return (
            <div
              key={row.name}
              style={{ position: "absolute", left: LEFT, top: TOP + i * ROW, width: WIDTH, height: ROW }}
            >
              {/* The rule draws itself in, the row follows it. */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: 1,
                  width: `${rule * 100}%`,
                  background: i === 0 ? LIGHT.ink : LIGHT.lineStrong,
                }}
              />
              <div style={{ position: "absolute", left: 0, top: 30, opacity: show }}>
                <div style={{ fontFamily: MONO, fontSize: 18, lineHeight: "24px", color: "#c2613f", fontWeight: 600 }}>
                  0{i + 1}
                </div>
                <div style={{ marginTop: 2, fontSize: 40, lineHeight: "48px", fontWeight: 800, letterSpacing: "-0.03em" }}>
                  {row.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 17, lineHeight: "24px", opacity: 0.6 }}>{row.context}</div>
              </div>
              {row.kpis.map((kpi, k) => {
                const up = p(frame, at + k * 5, 46, outExpo);
                return (
                  <div
                    key={kpi.label}
                    style={{ position: "absolute", left: NAME + k * CELL, top: 22, width: CELL - 24, opacity: p(frame, at + k * 5 - 2, 10) }}
                  >
                    <div style={{ clipPath: "inset(0 -40px)", height: 70 }}>
                      <div
                        style={{
                          fontSize: 66,
                          lineHeight: "70px",
                          fontWeight: 800,
                          letterSpacing: "-0.045em",
                          fontVariantNumeric: "tabular-nums",
                          transform: `translateY(${(1 - up) * 105}%)`,
                        }}
                      >
                        {Math.round(kpi.value * up)}
                      </div>
                    </div>
                    <div style={{ marginTop: 2, fontSize: 22, lineHeight: "28px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                      {kpi.label}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 16, lineHeight: "22px", opacity: 0.6, whiteSpace: "nowrap" }}>
                      {kpi.note}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Under the table: the count, the course, the GitHub card. */}
        <div
          style={{
            position: "absolute",
            left: LEFT,
            top: TOP + ROWS.length * ROW,
            width: WIDTH,
            boxSizing: "border-box",
            paddingTop: 22,
            borderTop: `1px solid ${LIGHT.ink}`,
            display: "flex",
            gap: 56,
            fontFamily: MONO,
            fontSize: 20,
            lineHeight: "28px",
            opacity: p(frame, 5 * BEAT + 10, 24),
          }}
        >
          <span>
            <b>10</b> projects, each a case study
          </span>
          <span>
            <b>420+</b> hours at General Assembly
          </span>
          <span>
            <b>92</b> pushes in 22 days <span style={{ opacity: 0.6 }}>(GitHub, counted 2 Nov 2026)</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
