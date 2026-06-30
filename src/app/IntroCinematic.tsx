"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* One-shot cinematic that plays right after the boot screen (once the visitor
   presses Enter / clicks "continue"). A cloud of phosphor-green particles
   swirls in from all directions and assembles into "Pavle Tošić", holds a
   beat, then scatters as the site reveals.

   The letterforms are sampled at runtime: the name is drawn to an offscreen
   2D canvas, and every lit pixel becomes a particle's target position — so it's
   bespoke, not a prebaked asset.

   Mounted ONLY during the boot overlay's "cinematic" phase (lazy three.js), so
   a normal page load never pays for it and it never persists over content.
   Any failure (no WebGL / no 2D ctx / reduced motion) or a stall calls onDone()
   so the visitor is never trapped behind the overlay. */
export default function IntroCinematic({ onDone }: { onDone: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    };

    const mount = mountRef.current;
    if (!mount) return finish();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return finish();
    }

    const safety = setTimeout(finish, 4500);
    const bail = () => {
      clearTimeout(safety);
      finish();
    };

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      bail();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const canvas = renderer.domElement;
    canvas.style.cssText = "width:100%;height:100%;display:block";
    mount.appendChild(canvas);

    const removeCanvas = () => {
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };

    const CAM_Z = 16;
    const FOV = 45;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, CAM_Z);
    const group = new THREE.Group();
    scene.add(group);

    // ---- sample the name into target points ----
    const off = document.createElement("canvas");
    const ctx = off.getContext("2d");
    if (!ctx) {
      removeCanvas();
      bail();
      return;
    }
    const FS = 180;
    const FONT = `700 ${FS}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
    ctx.font = FONT;
    const tw = Math.ceil(ctx.measureText("Pavle Tošić").width);
    off.width = tw + 48;
    off.height = Math.ceil(FS * 1.5);
    ctx.font = FONT; // resizing the canvas resets the context
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText("Pavle Tošić", 24, off.height / 2);
    const data = ctx.getImageData(0, 0, off.width, off.height).data;

    const WORLD_W = 14;
    const sc = WORLD_W / off.width;
    const STEP = 3;
    const sampled: number[] = [];
    for (let y = 0; y < off.height; y += STEP) {
      for (let x = 0; x < off.width; x += STEP) {
        if (data[(y * off.width + x) * 4 + 3] > 128) {
          sampled.push((x - off.width / 2) * sc, -(y - off.height / 2) * sc);
        }
      }
    }
    const N = sampled.length / 2;
    if (N === 0) {
      removeCanvas();
      bail();
      return;
    }

    const target = new Float32Array(N * 3);
    const startPos = new Float32Array(N * 3);
    const delay = new Float32Array(N);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < N; i++) {
      const tx = sampled[i * 2];
      if (tx < minX) minX = tx;
      if (tx > maxX) maxX = tx;
    }
    const spanX = Math.max(0.001, maxX - minX);
    for (let i = 0; i < N; i++) {
      const tx = sampled[i * 2];
      const ty = sampled[i * 2 + 1];
      target[i * 3] = tx;
      target[i * 3 + 1] = ty;
      target[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      // scatter origin: a random point on a large sphere around the name
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const r = 11 + Math.random() * 13;
      startPos[i * 3] = Math.sin(b) * Math.cos(a) * r;
      startPos[i * 3 + 1] = Math.sin(b) * Math.sin(a) * r;
      startPos[i * 3 + 2] = Math.cos(b) * r;
      delay[i] = ((tx - minX) / spanX) * 0.45; // assemble left → right
    }

    const positions = new Float32Array(startPos);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color("#5cf08a"),
      size: 0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    group.add(points);

    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const visH = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
      const visW = visH * (w / h);
      group.scale.setScalar(Math.min(1, (visW * 0.86) / WORLD_W));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    const easeIn = (x: number) => x * x;
    const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

    const ASSEMBLE = 1.35;
    const DISPERSE_START = 2.2;
    const DISPERSE = 0.6;

    let startT = -1;
    let raf = 0;
    const arr = geo.attributes.position.array as Float32Array;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (startT < 0) startT = now;
      const t = (now - startT) / 1000;
      const dispersing = t >= DISPERSE_START;
      const dp = dispersing ? easeIn(clamp01((t - DISPERSE_START) / DISPERSE)) : 0;
      for (let i = 0; i < N; i++) {
        const ix = i * 3;
        if (!dispersing) {
          const ap = easeOut(clamp01((t - delay[i]) / ASSEMBLE));
          arr[ix] = startPos[ix] + (target[ix] - startPos[ix]) * ap;
          arr[ix + 1] = startPos[ix + 1] + (target[ix + 1] - startPos[ix + 1]) * ap;
          arr[ix + 2] = startPos[ix + 2] + (target[ix + 2] - startPos[ix + 2]) * ap;
        } else {
          arr[ix] = target[ix] + (startPos[ix] - target[ix]) * dp;
          arr[ix + 1] = target[ix + 1] + (startPos[ix + 1] - target[ix + 1]) * dp;
          arr[ix + 2] = target[ix + 2] + (startPos[ix + 2] - target[ix + 2]) * dp;
        }
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = dispersing
        ? 1 - clamp01((t - DISPERSE_START) / DISPERSE)
        : clamp01(t / 0.35);
      // a gentle settle push-in
      camera.position.z = CAM_Z + (1 - easeOut(clamp01(t / 1.6))) * 3;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);

      if (t >= DISPERSE_START + 0.12) {
        clearTimeout(safety);
        finish(); // hand off to the site as the particles scatter
      }
    };
    raf = requestAnimationFrame(frame);

    const onSkip = () => {
      clearTimeout(safety);
      finish();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    mount.addEventListener("click", onSkip);

    return () => {
      clearTimeout(safety);
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      mount.removeEventListener("click", onSkip);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      removeCanvas();
    };
  }, [onDone]);

  return <div ref={mountRef} className="absolute inset-0 cursor-pointer" aria-hidden />;
}
