/* Asserts the Lighthouse budget over several reports:
   `node scripts/lighthouse-budget.mjs lh-1.json lh-2.json lh-3.json`.

   One report is not a measurement. A run on 2026-08-12 failed at FCP 3710ms /
   TBT 2523ms twenty minutes after the same commit's code measured 771ms /
   348ms, on a runner whose benchmarkIndex had moved only 2472 -> 2068. A 16%
   slower CPU cannot produce a 5x slower paint, so the spike was transient
   contention, not a regression — exactly what a median over an odd number of
   runs is for. Pass an odd count; the middle sample is the verdict. */

import { readFile } from "node:fs/promises";

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("usage: node scripts/lighthouse-budget.mjs <report.json>...");
  process.exit(2);
}
if (paths.length % 2 === 0) {
  console.error(`FAIL  need an odd number of reports to take a median, got ${paths.length}`);
  process.exit(2);
}

const reports = await Promise.all(
  paths.map(async (p) => JSON.parse(await readFile(p, "utf8"))),
);

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const samples = (read) => reports.map(read);

let bad = false;
const fail = (s) => {
  console.error(`FAIL ${s}`);
  bad = true;
};

// How fast the runner actually was, so a future failure can be told apart from
// a slow machine without re-reading the raw reports.
console.log(
  `runner benchmarkIndex: ${samples((r) => Math.round(r.environment.benchmarkIndex)).join(", ")}\n`,
);

// Category floors. Performance is NOT gated: the boot overlay is an opaque
// full-screen intro rendered on the server, so LCP is pure "render delay"
// until it hands over — Lighthouse never presses Enter and sits through the
// whole sequence. That caps the score by design, and the score also swings
// with runner hardware (86 on a dev Mac, 39 in CI). It is printed below for
// visibility instead.
for (const [k, min] of Object.entries({
  accessibility: 0.95,
  "best-practices": 0.9,
  seo: 1,
})) {
  const got = median(samples((r) => r.categories[k].score));
  const line = `${k}: ${Math.round(got * 100)} (floor ${Math.round(min * 100)})`;
  if (got < min) fail(line);
  else console.log(`ok   ${line}`);
}

// Metric ceilings, which the intro does not distort. FCP and CLS held tight:
// both measured dead flat (760ms / 0.018) from 4x to 16x CPU throttling, so a
// breach of the median is a real regression. TBT is deliberately loose — it
// scales hard with the runner (100ms -> 617ms -> 881ms over that same range),
// so a tight ceiling here would only produce flakes.
for (const [id, max, unit] of [
  ["first-contentful-paint", 2500, "ms"],
  ["cumulative-layout-shift", 0.1, ""],
  ["total-blocking-time", 2000, "ms"],
]) {
  const all = samples((r) => r.audits[id].numericValue);
  const show = (v) => (unit ? Math.round(v) : v.toFixed(3)) + unit;
  const got = median(all);
  const line = `${id}: ${show(got)} (max ${max}${unit}) [${all.map(show).join(", ")}]`;
  if (got > max) fail(line);
  else console.log(`ok   ${line}`);
}

console.log(
  `note performance: ${Math.round(median(samples((r) => r.categories.performance.score)) * 100)}` +
    ` / LCP ${Math.round(median(samples((r) => r.audits["largest-contentful-paint"].numericValue)))}ms` +
    ` (informational — boot intro caps LCP)`,
);

process.exit(bad ? 1 : 0);
