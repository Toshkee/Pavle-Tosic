/* `npm audit --audit-level=high`, with named exceptions. npm can't ignore a
   single advisory, so one with no fixed release would otherwise keep CI red
   until upstream ships. Every exception below says why it can't reach the
   deployed worker, and the script flags it the moment npm stops reporting it,
   so a stale entry gets deleted instead of silently hiding a future match. */

import { execFileSync } from "node:child_process";

// Empty since 2026-11-03: the braces advisory it held left the tree with
// eslint-config-next 16.4. Shape: "GHSA-id": "what it is, why it can't ship".
const ACCEPTED = {};
const BLOCKING = new Set(["high", "critical"]);

let raw;
try {
  raw = execFileSync("npm", ["audit", "--json"], { encoding: "utf8", maxBuffer: 64 << 20 });
} catch (err) {
  // npm audit exits non-zero whenever it finds anything; the report is still on stdout.
  raw = err.stdout;
}
const report = JSON.parse(raw);
if (report.error) {
  console.error(`FAIL  npm audit could not run: ${report.error.summary ?? report.error.code}\n`);
  process.exit(1);
}

// One advisory can show up under several version ranges; key by GHSA id.
const advisories = new Map();
for (const [pkg, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via !== "object") continue;
    advisories.set(via.url.split("/").pop(), { pkg, severity: via.severity, title: via.title });
  }
}

const blocking = [...advisories].filter(([id, a]) => BLOCKING.has(a.severity) && !(id in ACCEPTED));
for (const [id, a] of advisories) {
  if (id in ACCEPTED) console.log(`  ok  ${id} ${a.pkg} accepted: ${ACCEPTED[id]}`);
}
for (const id of Object.keys(ACCEPTED)) {
  if (!advisories.has(id)) console.log(`note  ${id} is no longer reported, remove it from ACCEPTED`);
}

console.log("");
if (blocking.length) {
  for (const [id, a] of blocking) console.error(`FAIL  ${a.severity} ${a.pkg}: ${a.title} (${id})`);
  console.error(`\n${blocking.length} high/critical advisory(ies)\n`);
  process.exit(1);
}
console.log("no unaccepted high or critical advisories\n");
