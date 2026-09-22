"use client";

import { useEffect, useRef, useState } from "react";
import Ambience from "./Ambience";

/* The "Morph Gallery" (21st.dev/@kedhareswer/components/morph-gallery)
   turned into a page backdrop: the same WebGL noise burn-through between
   photos, the same easing, aspect-cover and edge mirroring, with no arrows,
   thumbnails, autoplay or swipe. Which photo shows is decided by one
   IntersectionObserver per section (the section owning the middle of the
   viewport wins); scrolling into the next section runs the morph.

   The canvas only draws DURING a morph (1.5 s per section change) and then
   stops: at rest it is a still, so the glass panels above it are not
   re-blurred every frame. (An earlier cut drifted the photo at 30 fps; over
   a dozen backdrop-filter surfaces that meant a full-screen blur pass 30
   times a second, the exact cost 21st.dev's own "what the effect costs"
   note warns about.) Each photo keeps a fixed per-slide framing (a slight
   zoom and offset) so two adjacent slides never sit identically. Never
   draws while the hero covers the viewport or the tab is hidden. Without
   WebGL it falls back to cross-fading <img>s, which are only mounted once
   WebGL has actually failed so they never preload on the happy path. Under
   reduced motion the swap is a cut.

   The scenes are AI-generated voxel landscapes, credited in page.tsx and
   the footer. Phones get the 1200 px cut so the five textures stay small. */

export type MorphSlide = { src: string; small: string; sectionId: string };

const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() { v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D u_from; uniform sampler2D u_to;
uniform float u_progress; uniform vec2 u_resolution;
uniform float u_fromAspect; uniform float u_toAspect;
uniform vec3 u_fromDrift; uniform vec3 u_toDrift;
uniform float u_scale; uniform float u_direction; uniform float u_edge; uniform float u_drift;
varying vec2 v_uv;
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 v) { float value = 0.0; float amplitude = 0.5;
  for (int i = 0; i < 5; i++) { value += amplitude * snoise(v); v *= 2.0; amplitude *= 0.5; } return value; }
vec2 mirror(vec2 uv) { return 1.0 - abs(1.0 - mod(uv, 2.0)); }
/* aspect-cover, then the drift: zoom about the centre plus a small pan */
vec2 coverUV(vec2 uv, float imgAspect, vec3 drift) {
  float canvasAspect = u_resolution.x / u_resolution.y;
  vec2 scale = (canvasAspect > imgAspect) ? vec2(1.0, imgAspect / canvasAspect) : vec2(canvasAspect / imgAspect, 1.0);
  vec2 c = (uv - 0.5) * scale / drift.x + drift.yz;
  return mirror(c + 0.5);
}
void main() {
  float adjusted = u_progress * (1.0 + 2.0 * u_edge) - u_edge;
  float noise = fbm(v_uv * u_scale + vec2(0.0, u_progress * u_direction)) * 0.5 + 0.5;
  noise = smoothstep(0.0, 2.0, length(texture2D(u_to, coverUV(v_uv, u_toAspect, u_toDrift)).rgb) + noise);
  float mixFactor = 1.0 - smoothstep(adjusted - u_edge, adjusted + u_edge, noise);
  vec2 fromUV = coverUV(v_uv + vec2(0.0, noise * u_progress * u_drift * u_direction), u_fromAspect, u_fromDrift);
  vec2 toUV = coverUV(v_uv + vec2(0.0, noise * (1.0 - u_progress) * -0.5 * u_drift * u_direction), u_toAspect, u_toDrift);
  gl_FragColor = mix(texture2D(u_from, fromUV), texture2D(u_to, toUV), mixFactor);
}
`;

const DURATION = 1500, NOISE_SCALE = 3.5, EDGE = 0.15, DRIFT = 0.5;
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

/* Fixed framing for slide i: zoom between 1.0 and 1.12 and an offset of a
   few percent, phased per slide so no two photos share a crop. Constant on
   purpose (no time term): the backdrop is a still between morphs. */
function framingOf(i: number): [number, number, number] {
  const p = i * 1.7;
  return [1.06 + 0.06 * Math.sin(p), 0.04 * Math.sin(p * 2.1), 0.04 * Math.cos(p * 0.7)];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src); gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}
const load = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image(); img.decoding = "async";
    img.onload = () => res(img); img.onerror = () => rej(new Error(src)); img.src = src;
  });

export default function MorphBackdrop({ slides }: { slides: MorphSlide[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambRef = useRef<HTMLDivElement>(null);
  // The <img> fallback exists only once WebGL has failed. Rendering it up
  // front (even at opacity 0) made React hoist a high-priority preload for
  // every slide into the document head: 2.5 MB of photos fetched before the
  // first scroll, under a hero that covers them completely.
  const [fallbackOn, setFallbackOn] = useState(false);
  const [fallbackIdx, setFallbackIdx] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || slides.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phone = window.matchMedia("(max-width: 767px)").matches;
    const hero = document.getElementById("top");

    // ---- WebGL
    const gl = (canvas.getContext("webgl", { alpha: false, antialias: false }) ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    let useGL = Boolean(gl);
    let program: WebGLProgram | null = null;
    const tex: (WebGLTexture | null)[] = slides.map(() => null);
    const aspect = slides.map(() => 1);
    const u: Record<string, WebGLUniformLocation | null> = {};
    let wanted = 0, from = 0, to = 0, progress = 1, startedAt = 0, dir = 1, raf = 0, dead = false;
    let covered = true; // hero over the viewport

    const resize = () => {
      // 1x is plenty for a blurred-by-scrim backdrop and halves the fill cost
      const dpr = Math.min(window.devicePixelRatio || 1, phone ? 1 : 1.5);
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; gl?.viewport(0, 0, w, h); }
    };

    const draw = () => {
      if (!gl || !program) return;
      const a = tex[from], b = tex[to];
      if (!a || !b) return;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a); gl.uniform1i(u.from, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b); gl.uniform1i(u.to, 1);
      gl.uniform1f(u.progress, progress); gl.uniform2f(u.resolution, canvas.width, canvas.height);
      gl.uniform1f(u.fromAspect, aspect[from]); gl.uniform1f(u.toAspect, aspect[to]);
      gl.uniform3fv(u.fromDrift, framingOf(from)); gl.uniform3fv(u.toDrift, framingOf(to));
      gl.uniform1f(u.scale, NOISE_SCALE); gl.uniform1f(u.direction, dir); gl.uniform1f(u.edge, EDGE); gl.uniform1f(u.drift, DRIFT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // One frame per call while a morph is in flight, then a final still and
    // silence: nothing re-arms until the next go() / resize / visibility change.
    const frame = (now: number) => {
      raf = 0;
      if (dead || document.hidden || covered) return;
      if (progress < 1) {
        const t = (now - startedAt) / DURATION;
        progress = ease(Math.min(t, 1));
        if (t >= 1) { progress = 1; from = to; }
      }
      draw();
      if (progress < 1) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && !document.hidden && !covered) raf = requestAnimationFrame(frame); };

    // Which textures have actually been uploaded. Only slide 0 loads up
    // front; the rest load lazily (see below), so go() has to fall back to
    // whichever ready slide is nearest the one actually wanted.
    const ready = new Set<number>();
    const nearestReady = (i: number) => {
      if (ready.has(i)) return i;
      let best = to, bestDist = Infinity;
      ready.forEach((j) => {
        const d = Math.abs(j - i);
        if (d < bestDist) { bestDist = d; best = j; }
      });
      return best;
    };

    // the weather layer (Ambience.tsx) follows the wanted scene and sleeps
    // while the hero covers the screen or the tab is hidden
    const amb = ambRef.current;
    const syncAmb = () => {
      if (!amb) return;
      amb.dataset.scene = slides[wanted]?.sectionId ?? "";
      if (covered || document.hidden) amb.dataset.paused = "true";
      else delete amb.dataset.paused;
    };

    const go = (i: number) => {
      if (i === wanted) return;
      dir = i > wanted ? 1 : -1;
      wanted = i;
      syncAmb();
      if (!useGL) { setFallbackIdx(i); return; }
      // the wanted slide and the one after it, so the next morph is ready
      ensure(i); ensure(i + 1);
      const target = nearestReady(i);
      if (reduced || covered) { from = to = target; progress = 1; kick(); return; }
      from = progress < 1 ? from : to; // mid-flight: restart from the current source
      to = target; progress = 0; startedAt = performance.now();
      kick();
    };

    // Once a lazily-loaded texture finishes and turns out to be the slide
    // still wanted (and we'd been showing a stand-in), pick up the morph to
    // the real one.
    const onReady = (i: number) => {
      ready.add(i);
      if (wanted !== i || to === i) return;
      if (reduced || covered) { from = to = i; progress = 1; kick(); return; }
      from = progress < 1 ? from : to;
      to = i; progress = 0; startedAt = performance.now();
      kick();
    };

    const uploadTexture = (i: number) =>
      load(phone ? slides[i].small : slides[i].src).then((img) => {
        if (dead || !gl) return;
        const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        tex[i] = t; aspect[i] = img.naturalWidth / Math.max(img.naturalHeight, 1);
      });

    // Textures load one section ahead of the visitor, not all at once: the
    // five desktop photos are 2.5 MB, and a visitor who leaves from the hero
    // should not have paid for the contact section's sunset.
    const requested = new Set<number>();
    const ensure = (i: number) => {
      if (i < 0 || i >= slides.length || requested.has(i)) return;
      requested.add(i);
      uploadTexture(i).then(() => { if (!dead) onReady(i); });
    };

    // requestIdleCallback isn't in Safari; setTimeout is an adequate "after
    // the important stuff" stand-in there.
    const whenIdle = (fn: () => void) =>
      typeof requestIdleCallback === "function" ? requestIdleCallback(fn) : setTimeout(fn, 200);

    (async () => {
      if (gl) {
        try {
          program = gl.createProgram()!;
          gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
          gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link");
          gl.useProgram(program);
          const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
          const pos = gl.getAttribLocation(program, "a_position");
          gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
          for (const k of ["from", "to", "progress", "resolution", "fromAspect", "toAspect", "fromDrift", "toDrift", "scale", "direction", "edge", "drift"]) u[k] = gl.getUniformLocation(program, "u_" + k);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

          // Only the first slide (what's on screen at load) blocks first
          // paint; the second follows once the browser is idle, and each
          // later one is requested as the visitor reaches the section before
          // it (see ensure()).
          requested.add(0);
          await uploadTexture(0);
          if (dead) return;
          ready.add(0);
          resize(); canvas.style.opacity = "1";
          from = to = wanted; progress = 1; kick();

          whenIdle(() => { if (!dead) { ensure(wanted); ensure(wanted + 1); } });
        } catch { useGL = false; }
      }
      if (!useGL) { setFallbackIdx(wanted); setFallbackOn(true); }
    })();

    // ---- which slide is wanted: the section that owns the middle of the viewport
    const sections = slides
      .map((s, i) => ({ i, el: document.getElementById(s.sectionId) }))
      .filter((t): t is { i: number; el: HTMLElement } => t.el !== null);
    const sectionIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const hit = sections.find((t) => t.el === entry.target);
          if (hit) go(hit.i);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((t) => sectionIO.observe(t.el));

    const ro = new ResizeObserver(() => { resize(); kick(); });
    ro.observe(canvas);
    const heroIO = hero
      ? new IntersectionObserver(([e]) => { covered = e.intersectionRatio > 0.98; syncAmb(); if (!covered) kick(); }, { threshold: [0.98, 1] })
      : null;
    heroIO?.observe(hero!);
    if (!hero) covered = false;
    syncAmb();
    const onVis = () => { syncAmb(); if (!document.hidden) kick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); heroIO?.disconnect(); sectionIO.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (gl) { tex.forEach((t) => t && gl.deleteTexture(t)); if (program) gl.deleteProgram(program); }
    };
  }, [slides]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-bg">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ opacity: 0, transition: "opacity 400ms ease" }} />
      {fallbackOn && (
        <div className="absolute inset-0">
          {slides.map((s, i) => (
            <img
              key={s.src}
              src={s.src}
              srcSet={`${s.small} 1200w, ${s.src} 2400w`}
              sizes="100vw"
              alt=""
              loading={i === fallbackIdx ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: i === fallbackIdx ? 1 : 0, transition: "opacity 700ms ease", maxWidth: "none" }}
            />
          ))}
        </div>
      )}
      {/* legibility: the photos sit under a dark scrim, the panels do the rest.
          Kept light (20%, was 35%) so the glass panels read as translucent
          over the photo instead of a flat grey wash; .glass-dark-deep
          (globals.css) makes up the difference on the panels carrying long
          runs of body copy. */}
      <div className="absolute inset-0 bg-black/20" />
      <div ref={ambRef} className="amb-layer" data-paused="true">
        <Ambience />
      </div>
    </div>
  );
}
