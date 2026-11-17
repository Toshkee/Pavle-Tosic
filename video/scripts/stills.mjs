/* Renders single frames of the film to out/stills, bundling once:
     node scripts/stills.mjs 120 300 560        (frames)
     SCALE=1 node scripts/stills.mjs 300         (full size; default 0.5) */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const frames = process.argv.slice(2).map(Number);
const scale = Number(process.env.SCALE ?? 0.5);
mkdirSync(path.join(root, "out/stills"), { recursive: true });

const serveUrl = await bundle({
  entryPoint: path.join(root, "src/index.ts"),
  publicDir: path.resolve(root, "../public"),
});
const composition = await selectComposition({ serveUrl, id: "Launch" });
for (const frame of frames) {
  const output = path.join(root, `out/stills/f${String(frame).padStart(4, "0")}.jpg`);
  await renderStill({ composition, serveUrl, frame, output, scale, imageFormat: "jpeg", jpegQuality: 90 });
  console.log(output);
}
