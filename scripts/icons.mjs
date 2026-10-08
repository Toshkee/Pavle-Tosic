import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const LOGOS = ["typescript-icon","javascript","react","nextjs-icon","html-5","css-3","nodejs-icon","c-sharp","dotnet","websocket","vitejs","vitest","playwright","claude-icon","godot-icon","tailwindcss-icon","postgresql","django-icon","cloudflare-icon","firebase"];
const REMOTE = {
  "simple-icons": ["express","oracle","github","modelcontextprotocol","threedotjs","astro"],
  "vscode-icons": ["file-type-gdscript","file-type-sql"],
  "lucide": ["pen-tool"],
};

const logos = JSON.parse(fs.readFileSync(require.resolve("@iconify-json/logos/icons.json"), "utf8"));
const pick = (set, ids) => {
  const icons = {};
  for (const id of ids) {
    if (!set.icons[id]) throw new Error(`missing ${set.prefix}:${id}`);
    icons[id] = set.icons[id];
  }
  const out = { prefix: set.prefix, icons };
  if (set.width) out.width = set.width;
  if (set.height) out.height = set.height;
  return out;
};
const sets = [pick(logos, LOGOS)];
for (const [prefix, ids] of Object.entries(REMOTE)) {
  const res = await fetch(`https://api.iconify.design/${prefix}.json?icons=${ids.join(",")}`);
  const data = await res.json();
  if (data.not_found?.length) throw new Error(`not found: ${data.not_found}`);
  sets.push(pick(data, ids));
}

const header = `/* Bundled icon data for the marks the chat's SkillsCard shows, registered
   locally with @iconify/react's addCollection instead of resolved at runtime
   from api.iconify.design: the runtime API needs a connect-src CSP
   allowance this site does not grant (see next.config.ts), so without this
   every logo rendered as an empty grey circle in production.

   Four sets, each cut down to the ids MARKS in content.ts references, never
   a whole icon package (every mark has an icon, the type insists on it):
   - logos (from @iconify-json/logos, a devDependency, not imported at
     runtime): the full-colour marks, ${LOGOS.length} ids.
   - simple-icons (api.iconify.design/simple-icons.json): one-colour marks,
     drawn in currentColor, for the brands whose colour mark is black or a
     wordmark and so vanishes in the dark theme: Express, Oracle, GitHub,
     MCP, Three.js, Astro.
   - vscode-icons: GDScript and SQL, which have no brand of their own.
   - lucide: the pen for UI/UX.
   Regenerate with scripts/icons.mjs after changing a mark in content.ts. */
"use client";

import { addCollection } from "@iconify/react";

`;
fs.writeFileSync("src/app/site/icons.ts", header + sets.map((s) => `addCollection(${JSON.stringify(s)});`).join("\n") + "\n");
console.log("written", sets.map((s) => `${s.prefix}:${Object.keys(s.icons).length}`).join(" "));
