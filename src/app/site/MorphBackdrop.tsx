"use client";

import { useEffect, useRef } from "react";

/* The "Morph Gallery" (21st.dev/@kedhareswer/components/morph-gallery)
   turned into a page backdrop: the same WebGL noise burn-through between
   photos, the same easing, aspect-cover and edge mirroring, but with no
   arrows, thumbnails, autoplay or swipe. Which photo shows is decided by
   which section is under the middle of the viewport, so scrolling from one
   section into the next runs the morph. It draws only while a transition is
   in flight, never while the hero covers the screen or the tab is hidden,
   and falls back to plain cross-fading <img>s without WebGL. */

export type MorphSlide = { src: string; sectionId: string };

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
vec2 coverUV(vec2 uv, float imgAspect) {
  float canvasAspect = u_resolution.x / u_resolution.y;
  vec2 scale = (canvasAspect > imgAspect) ? vec2(1.0, imgAspect / canvasAspect) : vec2(canvasAspect / imgAspect, 1.0);
  return mirror((uv - 0.5) * scale + 0.5);
}
void main() {
  float adjusted = u_progress * (1.0 + 2.0 * u_edge) - u_edge;
  float noise = fbm(v_uv * u_scale + vec2(0.0, u_progress * u_direction)) * 0.5 + 0.5;
  noise = smoothstep(0.0, 2.0, length(texture2D(u_to, coverUV(v_uv, u_toAspect)).rgb) + noise);
  float mixFactor = 1.0 - smoothstep(adjusted - u_edge, adjusted + u_edge, noise);
  vec2 fromUV = coverUV(v_uv + vec2(0.0, noise * u_progress * u_drift * u_direction), u_fromAspect);
  vec2 toUV = coverUV(v_uv + vec2(0.0, noise * (1.0 - u_progress) * -0.5 * u_drift * u_direction), u_toAspect);
  gl_FragColor = mix(texture2D(u_from, fromUV), texture2D(u_to, toUV), mixFactor);
}
`;

const DURATION = 1500, NOISE_SCALE = 3.5, EDGE = 0.15, DRIFT = 0.5;
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

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
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current, fallback = fallbackRef.current;
    if (!canvas || !fallback || slides.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = slides.map((s) => document.getElementById(s.sectionId));
    const hero = document.getElementById("reveal");

    // ---- which slide is wanted: the last section whose top is above mid-screen
    let wanted = 0;
    const pick = () => {
      const mid = window.innerHeight * 0.5;
      let idx = 0;
      sections.forEach((el, i) => { if (el && el.getBoundingClientRect().top < mid) idx = i; });
      return idx;
    };

    // ---- WebGL
    const gl = (canvas.getContext("webgl", { alpha: false, antialias: false }) ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    let useGL = Boolean(gl);
    let program: WebGLProgram | null = null;
    const tex: (WebGLTexture | null)[] = slides.map(() => null);
    const aspect = slides.map(() => 1);
    const u: Record<string, WebGLUniformLocation | null> = {};
    let from = 0, to = 0, progress = 1, startedAt = 0, dir = 1, raf = 0, dead = false;
    let covered = true; // hero over the viewport

    const showFallback = (i: number) => {
      Array.from(fallback.children).forEach((c, k) => ((c as HTMLElement).style.opacity = k === i ? "1" : "0"));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      gl.uniform1f(u.scale, NOISE_SCALE); gl.uniform1f(u.direction, dir); gl.uniform1f(u.edge, EDGE); gl.uniform1f(u.drift, DRIFT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = () => {
      raf = 0;
      if (dead) return;
      if (progress < 1) {
        const t = (performance.now() - startedAt) / DURATION;
        progress = ease(Math.min(t, 1));
        if (t >= 1) { progress = 1; from = to; }
        raf = requestAnimationFrame(frame);
      }
      draw();
    };
    const kick = () => { if (!raf && !document.hidden && !covered) raf = requestAnimationFrame(frame); };

    const go = (i: number) => {
      if (i === wanted) return;
      dir = i > wanted ? 1 : -1;
      wanted = i;
      if (!useGL) { showFallback(i); return; }
      if (reduced || covered) { from = to = i; progress = 1; kick(); return; }
      from = progress < 1 ? from : to; // mid-flight: restart from the current source
      to = i; progress = 0; startedAt = performance.now();
      kick();
    };

    const onScroll = () => go(pick());

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
          for (const k of ["from", "to", "progress", "resolution", "fromAspect", "toAspect", "scale", "direction", "edge", "drift"]) u[k] = gl.getUniformLocation(program, "u_" + k);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          await Promise.all(slides.map((s, i) => load(s.src).then((img) => {
            if (dead) return;
            const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            tex[i] = t; aspect[i] = img.naturalWidth / Math.max(img.naturalHeight, 1);
          })));
          if (dead) return;
          resize(); canvas.style.opacity = "1";
          wanted = from = to = pick(); progress = 1; kick();
        } catch { useGL = false; }
      }
      if (!useGL) { fallback.style.opacity = "1"; wanted = pick(); showFallback(wanted); }
    })();

    const ro = new ResizeObserver(() => { resize(); kick(); });
    ro.observe(canvas);
    const io = hero
      ? new IntersectionObserver(([e]) => { covered = e.intersectionRatio > 0.98; if (!covered) { onScroll(); kick(); } }, { threshold: [0.98, 1] })
      : null;
    io?.observe(hero!);
    if (!hero) covered = false;
    const onVis = () => { if (!document.hidden) kick(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); io?.disconnect();
      window.removeEventListener("scroll", onScroll); document.removeEventListener("visibilitychange", onVis);
      if (gl) { tex.forEach((t) => t && gl.deleteTexture(t)); if (program) gl.deleteProgram(program); }
    };
  }, [slides]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-bg">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ opacity: 0, transition: "opacity 400ms ease" }} />
      <div ref={fallbackRef} className="absolute inset-0" style={{ opacity: 0 }}>
        {slides.map((s) => (
          <img key={s.src} src={s.src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0, transition: "opacity 700ms ease", maxWidth: "none" }} />
        ))}
      </div>
      {/* legibility: the photos sit under a dark scrim, the panels do the rest */}
      <div className="absolute inset-0 bg-black/35" />
    </div>
  );
}
