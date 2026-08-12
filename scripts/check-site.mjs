/* Post-build smoke check. Runs against a server already listening on BASE
   (CI starts `next start`, or point it at the live site with
   `BASE=https://pavletosic.com node scripts/check-site.mjs`).

   It asserts the things that broke silently before: a route 404ing after a
   refactor, a page losing its canonical, JSON-LD becoming invalid JSON, a
   security header dropping off, or an internal link pointing at nothing.
   Anything it can't check without a browser (layout, motion) is out of scope. */

const BASE = (process.env.BASE ?? "http://localhost:3000").replace(/\/$/, "");
const LIVE = process.env.CHECK_EXTERNAL === "1";

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => console.log(`  ok  ${msg}`);

// Slugs are read out of the data module's source rather than imported: this
// script runs on plain node, which can't load a .ts file, and adding a build
// step to a smoke check would be its own thing to maintain.
import { readFile } from "node:fs/promises";

const PROJECTS_SRC = await readFile(
  new URL("../src/app/projects.ts", import.meta.url),
  "utf8",
);
const PROJECT_SLUGS = [...PROJECTS_SRC.matchAll(/^\s{4}slug: "([^"]+)"/gm)].map(
  (m) => m[1],
);
if (PROJECT_SLUGS.length === 0) fail("could not resolve any project slugs");

const PAGES = [
  "/",
  "/work",
  ...PROJECT_SLUGS.map((s) => `/work/${s}`),
  "/privacy",
];

const REQUIRED_HEADERS = [
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "x-frame-options",
];

const pages = new Map();

console.log(`\nchecking ${BASE}\n`);

console.log("routes");
for (const path of PAGES) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  if (res.status !== 200) {
    fail(`${path} returned ${res.status}, expected 200`);
    continue;
  }
  pages.set(path, await res.text());
  for (const h of REQUIRED_HEADERS) {
    if (!res.headers.get(h)) fail(`${path} is missing the ${h} header`);
  }
  if (res.headers.get("x-powered-by")) fail(`${path} still sends x-powered-by`);
  ok(path);
}

console.log("\ncanonical + title");
for (const [path, html] of pages) {
  const canonical = html.match(
    /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/,
  )?.[1];
  if (!canonical) fail(`${path} has no canonical link`);
  else if (!canonical.startsWith("https://pavletosic.com"))
    fail(`${path} canonical points off-domain: ${canonical}`);

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title || title.trim().length < 10)
    fail(`${path} has a missing or too-short <title>`);

  const desc = html.match(
    /<meta[^>]+name="description"[^>]+content="([^"]*)"/,
  )?.[1];
  if (!desc || desc.trim().length < 40)
    fail(`${path} has a missing or too-short meta description`);
  ok(`${path} → ${title}`);
}

console.log("\nstructured data");
for (const [path, html] of pages) {
  const blocks = [
    ...html.matchAll(
      /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => m[1]);
  // Only the home page and the case studies claim structured data.
  const needsJsonLd = path === "/" || path.startsWith("/work/");
  if (needsJsonLd && blocks.length === 0) {
    fail(`${path} has no JSON-LD block`);
    continue;
  }
  for (const raw of blocks) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed["@context"] || !parsed["@type"])
        fail(`${path} JSON-LD is missing @context or @type`);
    } catch {
      fail(`${path} has JSON-LD that is not valid JSON`);
    }
  }
  if (blocks.length) ok(`${path} (${blocks.length} block(s))`);
}

console.log("\nsitemap + robots");
{
  const sm = await fetch(`${BASE}/sitemap.xml`);
  const xml = sm.ok ? await sm.text() : "";
  if (!sm.ok) fail(`/sitemap.xml returned ${sm.status}`);
  for (const path of PAGES) {
    const url = `https://pavletosic.com${path === "/" ? "" : path}`;
    if (!xml.includes(`<loc>${url}</loc>`))
      fail(`sitemap is missing ${url}`);
  }
  if (sm.ok) ok(`sitemap lists ${PAGES.length} pages`);

  const rb = await fetch(`${BASE}/robots.txt`);
  const txt = rb.ok ? await rb.text() : "";
  if (!rb.ok) fail(`/robots.txt returned ${rb.status}`);
  else if (!/Sitemap:\s*https:\/\/pavletosic\.com\/sitemap\.xml/i.test(txt))
    fail("robots.txt does not declare the sitemap");
  else ok("robots.txt declares the sitemap");
}

console.log("\ninternal links");
{
  const seen = new Set();
  for (const [path, html] of pages) {
    for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
      const href = m[1].replace(/\/$/, "") || "/";
      if (href.startsWith("/_next") || seen.has(href)) continue;
      seen.add(href);
      const res = await fetch(`${BASE}${href}`, { method: "HEAD" });
      if (res.status >= 400) fail(`${path} links to ${href} (${res.status})`);
    }
  }
  ok(`${seen.size} distinct internal targets resolve`);
}

// Off by default: the demos live on other people's free tiers, so a cold
// Render dyno or a rate limit would fail CI for something that isn't ours.
// Run nightly instead, where a failure is a report and not a blocked merge.
if (LIVE) {
  console.log("\nexternal project links");
  const urls = [
    ...new Set(
      [
        ...PROJECTS_SRC.matchAll(/^\s{4}(?:live|code): "(https:\/\/[^"]+)"/gm),
      ].map((m) => m[1]),
    ),
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.status >= 400) fail(`${url} returned ${res.status}`);
      else ok(url);
    } catch (err) {
      fail(`${url} is unreachable: ${err.message}`);
    }
  }
}

console.log("");
if (failures.length) {
  for (const f of failures) console.error(`FAIL  ${f}`);
  console.error(`\n${failures.length} check(s) failed\n`);
  process.exit(1);
}
console.log("all checks passed\n");
