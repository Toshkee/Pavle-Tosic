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
  "content-security-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "origin-agent-cluster",
  "x-content-type-options",
  "x-permitted-cross-domain-policies",
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
  const csp = res.headers.get("content-security-policy") ?? "";
  for (const directive of [
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "script-src-attr 'none'",
  ]) {
    if (!csp.includes(directive)) fail(`${path} CSP is missing ${directive}`);
  }
  if (res.headers.get("content-security-policy-report-only")) {
    fail(`${path} still uses a report-only CSP`);
  }
  if (res.headers.get("x-powered-by")) fail(`${path} still sends x-powered-by`);
  ok(path);
}

console.log("\nAPI request boundaries");
const API = `${BASE}/api/ask`;
const ALLOWED_ORIGIN = "https://pavletosic.com";

async function expectApi(label, init, expectedStatus, expectedError) {
  const res = await fetch(API, { method: "POST", ...init });
  let body = {};
  try {
    body = await res.json();
  } catch {
    /* the assertions below will report the invalid error response */
  }
  if (res.status !== expectedStatus) {
    fail(`${label} returned ${res.status}, expected ${expectedStatus}`);
  }
  if (body?.error !== expectedError) {
    fail(`${label} returned error ${JSON.stringify(body?.error)}, expected ${expectedError}`);
  }
  if (!/no-store/i.test(res.headers.get("cache-control") ?? "")) {
    fail(`${label} response is missing Cache-Control: no-store`);
  }
  if (res.headers.get("access-control-allow-origin")) {
    fail(`${label} unexpectedly enables CORS`);
  }
  ok(label);
}

const validBody = JSON.stringify({
  messages: [{ role: "user", content: "security smoke test" }],
});
await expectApi(
  "missing Origin is rejected",
  { headers: { "Content-Type": "application/json" }, body: validBody },
  403,
  "forbidden",
);
await expectApi(
  "foreign Origin is rejected",
  {
    headers: {
      Origin: "https://attacker.invalid",
      "Content-Type": "application/json",
    },
    body: validBody,
  },
  403,
  "forbidden",
);
await expectApi(
  "non-JSON content is rejected",
  {
    headers: { Origin: ALLOWED_ORIGIN, "Content-Type": "text/plain" },
    body: "hello",
  },
  415,
  "unsupported_media_type",
);
await expectApi(
  "malformed JSON is rejected",
  {
    headers: { Origin: ALLOWED_ORIGIN, "Content-Type": "application/json" },
    body: "{",
  },
  400,
  "bad_request",
);

// A stream body has no Content-Length. This proves the route enforces its
// byte limit while reading, rather than trusting a header an attacker can omit.
const oversizedBody = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("x".repeat(64_001)));
    controller.close();
  },
});
await expectApi(
  "chunked oversized body is rejected",
  {
    headers: { Origin: ALLOWED_ORIGIN, "Content-Type": "application/json" },
    body: oversizedBody,
    duplex: "half",
  },
  413,
  "too_large",
);

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

  const security = await fetch(`${BASE}/.well-known/security.txt`);
  const policy = security.ok ? await security.text() : "";
  if (!security.ok) fail(`security.txt returned ${security.status}`);
  else if (!/^Contact:\s*mailto:/im.test(policy))
    fail("security.txt has no email contact");
  else if (!/^Canonical:\s*https:\/\/pavletosic\.com\/\.well-known\/security\.txt/im.test(policy))
    fail("security.txt has no canonical URL");
  else ok("security.txt publishes a private reporting contact");
}

console.log("\nsensitive-file exposure");
for (const path of ["/.env", "/.git/config", "/package.json", "/next.config.ts"]) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  if (res.status !== 404) fail(`${path} returned ${res.status}, expected 404`);
  else ok(`${path} is not exposed`);
}

console.log("\nproduction source maps");
const scriptPaths = new Set();
for (const html of pages.values()) {
  for (const match of html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)) {
    scriptPaths.add(match[1]);
  }
}
for (const script of scriptPaths) {
  const res = await fetch(`${BASE}${script}.map`, { method: "HEAD" });
  if (res.status === 200) fail(`${script}.map is publicly exposed`);
}
ok(`${scriptPaths.size} JavaScript bundles have no public source maps`);

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
