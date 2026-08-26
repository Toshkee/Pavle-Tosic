/* Detect privacy-bearing metadata in public raster images. `--strip` removes
   JPEG EXIF/XMP, IPTC/Photoshop, and comment segments losslessly: compressed
   pixels are copied byte-for-byte instead of being decoded and recompressed. */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../public/images/", import.meta.url);
const strip = process.argv.includes("--strip");
const findings = [];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
      return entry.isDirectory() ? filesUnder(target) : [target];
    }),
  );
  return nested.flat();
}

function jpegMetadataRanges(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return [];
  const ranges = [];
  let offset = 2;

  while (offset + 1 < bytes.length) {
    const start = offset;
    if (bytes[offset] !== 0xff) throw new Error("invalid JPEG marker");
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break; // scan data / end of image
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) throw new Error("truncated JPEG segment");
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) {
      throw new Error("invalid JPEG segment length");
    }
    const end = offset + length;
    // APP1 = EXIF/XMP, APP13 = IPTC/Photoshop, COM = free-form comment.
    if (marker === 0xe1 || marker === 0xed || marker === 0xfe) {
      ranges.push({ start, end, kind: `JPEG marker 0x${marker.toString(16)}` });
    }
    offset = end;
  }
  return ranges;
}

function pngMetadata(bytes) {
  const signature = "89504e470d0a1a0a";
  if (bytes.subarray(0, 8).toString("hex") !== signature) return [];
  const kinds = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const kind = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (["eXIf", "iTXt", "tEXt", "zTXt"].includes(kind)) kinds.push(kind);
    offset += 12 + length;
  }
  return kinds;
}

function webpMetadataRanges(bytes) {
  if (
    bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
    bytes.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return [];
  }
  const ranges = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const kind = bytes.subarray(offset, offset + 4).toString("ascii");
    const length = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + length + (length % 2);
    if (end > bytes.length) throw new Error("invalid WebP chunk length");
    if (kind === "EXIF" || kind === "XMP ") {
      ranges.push({ start: offset, end, kind: kind.trim() });
    }
    offset = end;
  }
  return ranges;
}

function stripWebpMetadata(bytes, metadataRanges) {
  const chunks = [Buffer.from(bytes.subarray(0, 12))];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const kind = bytes.subarray(offset, offset + 4).toString("ascii");
    const length = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + length + (length % 2);
    const isMetadata = metadataRanges.some(
      (range) => range.start === offset && range.end === end,
    );
    if (!isMetadata) {
      const chunk = Buffer.from(bytes.subarray(offset, end));
      // Clear the EXIF and XMP presence flags in an extended WebP header.
      if (kind === "VP8X" && length >= 1) chunk[8] &= ~0x0c;
      chunks.push(chunk);
    }
    offset = end;
  }
  const cleaned = Buffer.concat(chunks);
  cleaned.writeUInt32LE(cleaned.length - 8, 4);
  return cleaned;
}

for (const file of await filesUnder(ROOT)) {
  if (!/\.(?:jpe?g|png|webp)$/i.test(file.pathname)) continue;
  const bytes = await readFile(file);
  const jpegRanges = jpegMetadataRanges(bytes);
  const pngKinds = pngMetadata(bytes);
  const webpRanges = webpMetadataRanges(bytes);
  const relative = path.relative(process.cwd(), fileURLToPath(file));

  if (strip && jpegRanges.length) {
    const chunks = [];
    let cursor = 0;
    for (const range of jpegRanges) {
      chunks.push(bytes.subarray(cursor, range.start));
      cursor = range.end;
    }
    chunks.push(bytes.subarray(cursor));
    await writeFile(file, Buffer.concat(chunks));
    console.log(`stripped ${relative}`);
  } else if (jpegRanges.length) {
    findings.push(`${relative}: ${jpegRanges.map((item) => item.kind).join(", ")}`);
  }

  if (strip && webpRanges.length) {
    await writeFile(file, stripWebpMetadata(bytes, webpRanges));
    console.log(`stripped ${relative}`);
  } else if (webpRanges.length) {
    findings.push(`${relative}: ${webpRanges.map((item) => item.kind).join(", ")}`);
  }

  // PNG text metadata can be legitimate, so fail loudly for manual review
  // instead of blindly discarding a future asset's attribution or license.
  if (pngKinds.length) findings.push(`${relative}: ${pngKinds.join(", ")}`);
}

if (findings.length) {
  for (const finding of findings) console.error(`metadata: ${finding}`);
  console.error("Run `npm run strip:metadata` for JPEGs; clean other formats before publishing.");
  process.exit(1);
}

console.log(strip ? "public image metadata stripped" : "public images contain no privacy metadata");
