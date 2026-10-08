/* The coloured smoke that follows the cursor on the landing page, as on
   aaabadcode.com. A TypeScript port of Pavel Dobryakov's WebGL Fluid
   Simulation (https://github.com/PavelDoGreat/WebGL-Fluid-Simulation),
   trimmed to what the reference runs: no bloom, sunrays, GUI or screenshots,
   drawn transparent over the page, with the reference's settings.

   MIT License

   Copyright (c) 2017 Pavel Dobryakov

   Permission is hereby granted, free of charge, to any person obtaining a
   copy of this software and associated documentation files (the
   "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to permit
   persons to whom the Software is furnished to do so, subject to the
   following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
   NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
   DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
   OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
   USE OR OTHER DEALINGS IN THE SOFTWARE. */

const CONFIG = {
  SIM_RESOLUTION: 128,
  // The reference uses 1440. Soft smoke looks the same at 1024 for about
  // half the fill cost.
  DYE_RESOLUTION: 1024,
  DENSITY_DISSIPATION: 0.5,
  VELOCITY_DISSIPATION: 3,
  PRESSURE: 0.1,
  PRESSURE_ITERATIONS: 20,
  CURL: 3,
  SPLAT_RADIUS: 0.2,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLOR_UPDATE_SPEED: 10,
};

// Dye starts at 0.15 of full colour and decays as e^(-0.5 t), so 8 s after
// the last move it is under one 8-bit step: the loop sleeps from then on
// instead of simulating an empty screen at 60 fps.
const IDLE_MS = 8000;

type Color = { r: number; g: number; b: number };
type Format = { internalFormat: number; format: number };
type Program = {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};
type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
};
type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
};

const BASE_VERTEX = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }`;

const COPY = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  void main () { gl_FragColor = texture2D(uTexture, vUv); }`;

const CLEAR = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;

const DISPLAY = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uTexture;
  uniform vec2 texelSize;
  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
  #ifdef SHADING
    vec3 lc = texture2D(uTexture, vL).rgb;
    vec3 rc = texture2D(uTexture, vR).rgb;
    vec3 tc = texture2D(uTexture, vT).rgb;
    vec3 bc = texture2D(uTexture, vB).rgb;
    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);
    vec3 n = normalize(vec3(dx, dy, length(texelSize)));
    vec3 l = vec3(0.0, 0.0, 1.0);
    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;
  #endif
    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
  }`;

const SPLAT = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }`;

const ADVECTION = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;
  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }
  void main () {
  #ifdef MANUAL_FILTERING
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    vec4 result = bilerp(uSource, coord, dyeTexelSize);
  #else
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
  #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }`;

const DIVERGENCE = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }`;

const CURL = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }`;

const VORTICITY = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }`;

const PRESSURE = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }`;

const GRADIENT_SUBTRACT = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }`;

function hsvToRgb(h: number): Color {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const q = 1 - f;
  const t = f;
  switch (i % 6) {
    case 0:
      return { r: 1, g: t, b: 0 };
    case 1:
      return { r: q, g: 1, b: 0 };
    case 2:
      return { r: 0, g: 1, b: t };
    case 3:
      return { r: 0, g: q, b: 1 };
    case 4:
      return { r: t, g: 0, b: 1 };
    default:
      return { r: 1, g: 0, b: q };
  }
}

// A random fully saturated hue at 15% strength: pastel on white, a soft
// glow on black.
function randomColor(): Color {
  const { r, g, b } = hsvToRgb(Math.random());
  return { r: r * 0.15, g: g * 0.15, b: b * 0.15 };
}

/* Starts the simulation on `canvas` (which should cover the viewport) and
   returns a function that stops it and frees its textures, or null when
   the browser cannot run it (no WebGL, no renderable half-float texture). */
export function startFluid(canvas: HTMLCanvasElement): (() => void) | null {
  const attributes: WebGLContextAttributes = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };
  const gl2 = canvas.getContext("webgl2", attributes);
  const gl: WebGLRenderingContext | WebGL2RenderingContext | null =
    gl2 ?? canvas.getContext("webgl", attributes);
  if (!gl) return null;

  let halfFloat: number;
  let linearFiltering: boolean;
  if (gl2) {
    gl2.getExtension("EXT_color_buffer_float");
    linearFiltering = !!gl2.getExtension("OES_texture_float_linear");
    halfFloat = gl2.HALF_FLOAT;
  } else {
    const extension = gl.getExtension("OES_texture_half_float");
    if (!extension) return null;
    linearFiltering = !!gl.getExtension("OES_texture_half_float_linear");
    halfFloat = extension.HALF_FLOAT_OES;
  }

  const canRender = (internalFormat: number, format: number) => {
    const texture = gl.createTexture();
    const fbo = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, halfFloat, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    return ok;
  };

  // WebGL 2 falls back from R to RG to RGBA when a narrow format cannot be
  // rendered to; WebGL 1 only has RGBA.
  const pickFormat = (internalFormat: number, format: number): Format | null => {
    if (canRender(internalFormat, format)) return { internalFormat, format };
    if (!gl2) return null;
    if (internalFormat === gl2.R16F) return pickFormat(gl2.RG16F, gl2.RG);
    if (internalFormat === gl2.RG16F) return pickFormat(gl2.RGBA16F, gl2.RGBA);
    return null;
  };
  const rgba = gl2 ? pickFormat(gl2.RGBA16F, gl2.RGBA) : pickFormat(gl.RGBA, gl.RGBA);
  const rg = gl2 ? pickFormat(gl2.RG16F, gl2.RG) : pickFormat(gl.RGBA, gl.RGBA);
  const red = gl2 ? pickFormat(gl2.R16F, gl2.RED) : pickFormat(gl.RGBA, gl.RGBA);
  if (!rgba || !rg || !red) return null;

  const dyeResolution = linearFiltering ? CONFIG.DYE_RESOLUTION : 512;
  const filtering = linearFiltering ? gl.LINEAR : gl.NEAREST;

  const compile = (type: number, source: string, keywords: string[] = []) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, keywords.map((k) => `#define ${k}\n`).join("") + source);
    gl.compileShader(shader);
    return shader;
  };
  const baseVertex = compile(gl.VERTEX_SHADER, BASE_VERTEX);
  const program = (fragment: string, keywords?: string[]): Program => {
    const linked = gl.createProgram()!;
    gl.attachShader(linked, baseVertex);
    gl.attachShader(linked, compile(gl.FRAGMENT_SHADER, fragment, keywords));
    gl.linkProgram(linked);
    const uniforms: Program["uniforms"] = {};
    const count: number = gl.getProgramParameter(linked, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(linked, i)!.name;
      uniforms[name] = gl.getUniformLocation(linked, name);
    }
    return { program: linked, uniforms };
  };

  const copyProgram = program(COPY);
  const clearProgram = program(CLEAR);
  const displayProgram = program(DISPLAY, CONFIG.SHADING && linearFiltering ? ["SHADING"] : []);
  const splatProgram = program(SPLAT);
  const advectionProgram = program(ADVECTION, linearFiltering ? [] : ["MANUAL_FILTERING"]);
  const divergenceProgram = program(DIVERGENCE);
  const curlProgram = program(CURL);
  const vorticityProgram = program(VORTICITY);
  const pressureProgram = program(PRESSURE);
  const gradientProgram = program(GRADIENT_SUBTRACT);
  const programs = [
    copyProgram, clearProgram, displayProgram, splatProgram, advectionProgram,
    divergenceProgram, curlProgram, vorticityProgram, pressureProgram, gradientProgram,
  ];

  // One full-screen quad, drawn into whichever framebuffer is the target.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const blit = (target: FBO | null) => {
    if (target) {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };
  const bind = ({ program: linked }: Program) => gl.useProgram(linked);

  const textures: WebGLTexture[] = [];
  const framebuffers: WebGLFramebuffer[] = [];

  const createFBO = (w: number, h: number, { internalFormat, format }: Format, param: number): FBO => {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, halfFloat, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    textures.push(texture);
    framebuffers.push(fbo);
    return {
      texture,
      fbo,
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      },
    };
  };

  const createDoubleFBO = (w: number, h: number, format: Format, param: number): DoubleFBO => {
    let first = createFBO(w, h, format, param);
    let second = createFBO(w, h, format, param);
    return {
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      get read() {
        return first;
      },
      set read(value) {
        first = value;
      },
      get write() {
        return second;
      },
      set write(value) {
        second = value;
      },
      swap() {
        [first, second] = [second, first];
      },
    };
  };

  // Keeps what is already on screen when the window is resized.
  const resizeDoubleFBO = (target: DoubleFBO, w: number, h: number, format: Format, param: number) => {
    if (target.width === w && target.height === h) return target;
    const resized = createFBO(w, h, format, param);
    bind(copyProgram);
    gl.uniform1i(copyProgram.uniforms.uTexture, target.read.attach(0));
    blit(resized);
    target.read = resized;
    target.write = createFBO(w, h, format, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1 / w;
    target.texelSizeY = 1 / h;
    return target;
  };

  const resolution = (size: number) => {
    const wide = gl.drawingBufferWidth > gl.drawingBufferHeight;
    let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspect < 1) aspect = 1 / aspect;
    const min = Math.round(size);
    const max = Math.round(size * aspect);
    return wide ? { width: max, height: min } : { width: min, height: max };
  };

  const scale = (value: number) => Math.floor(value * (window.devicePixelRatio || 1));

  const resizeCanvas = () => {
    const width = scale(canvas.clientWidth);
    const height = scale(canvas.clientHeight);
    if (canvas.width === width && canvas.height === height) return false;
    canvas.width = width;
    canvas.height = height;
    return true;
  };

  let dye: DoubleFBO | null = null;
  let velocity: DoubleFBO | null = null;
  let divergence: FBO;
  let curl: FBO;
  let pressure: DoubleFBO;

  const initFramebuffers = () => {
    const sim = resolution(CONFIG.SIM_RESOLUTION);
    const dyeSize = resolution(dyeResolution);
    gl.disable(gl.BLEND);
    dye = dye
      ? resizeDoubleFBO(dye, dyeSize.width, dyeSize.height, rgba, filtering)
      : createDoubleFBO(dyeSize.width, dyeSize.height, rgba, filtering);
    velocity = velocity
      ? resizeDoubleFBO(velocity, sim.width, sim.height, rg, filtering)
      : createDoubleFBO(sim.width, sim.height, rg, filtering);
    divergence = createFBO(sim.width, sim.height, red, gl.NEAREST);
    curl = createFBO(sim.width, sim.height, red, gl.NEAREST);
    pressure = createDoubleFBO(sim.width, sim.height, red, gl.NEAREST);
  };

  const aspectRatio = () => canvas.width / canvas.height;

  const splat = (x: number, y: number, dx: number, dy: number, color: Color) => {
    if (!dye || !velocity) return;
    bind(splatProgram);
    const u = splatProgram.uniforms;
    gl.uniform1i(u.uTarget, velocity.read.attach(0));
    gl.uniform1f(u.aspectRatio, aspectRatio());
    gl.uniform2f(u.point, x, y);
    gl.uniform3f(u.color, dx, dy, 0);
    const radius = CONFIG.SPLAT_RADIUS / 100;
    gl.uniform1f(u.radius, aspectRatio() > 1 ? radius * aspectRatio() : radius);
    blit(velocity.write);
    velocity.swap();
    gl.uniform1i(u.uTarget, dye.read.attach(0));
    gl.uniform3f(u.color, color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
  };

  const step = (dt: number) => {
    if (!dye || !velocity) return;
    gl.disable(gl.BLEND);

    bind(curlProgram);
    gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    bind(vorticityProgram);
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, CONFIG.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    bind(divergenceProgram);
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    bind(clearProgram);
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, CONFIG.PRESSURE);
    blit(pressure.write);
    pressure.swap();

    bind(pressureProgram);
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    bind(gradientProgram);
    gl.uniform2f(gradientProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradientProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradientProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    bind(advectionProgram);
    const u = advectionProgram.uniforms;
    gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!linearFiltering) gl.uniform2f(u.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    const velocityId = velocity.read.attach(0);
    gl.uniform1i(u.uVelocity, velocityId);
    gl.uniform1i(u.uSource, velocityId);
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, CONFIG.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    if (!linearFiltering) gl.uniform2f(u.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(u.uSource, dye.read.attach(1));
    gl.uniform1f(u.dissipation, CONFIG.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
  };

  const render = () => {
    if (!dye) return;
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    bind(displayProgram);
    gl.uniform2f(displayProgram.uniforms.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    gl.uniform1i(displayProgram.uniforms.uTexture, dye.read.attach(0));
    blit(null);
  };

  const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false, color: randomColor() };

  const movePointer = (clientX: number, clientY: number) => {
    const x = scale(clientX) / canvas.width;
    const y = 1 - scale(clientY) / canvas.height;
    const aspect = aspectRatio();
    pointer.dx = (x - pointer.x) * (aspect < 1 ? aspect : 1);
    pointer.dy = (y - pointer.y) / (aspect > 1 ? aspect : 1);
    pointer.x = x;
    pointer.y = y;
    pointer.moved = pointer.dx !== 0 || pointer.dy !== 0;
  };

  let frame = 0;
  let lastFrame = 0;
  let lastInput = 0;
  let colorTimer = 0;
  let started = false;

  const tick = (now: number) => {
    const dt = Math.min((now - lastFrame) / 1000, 0.016666);
    lastFrame = now;
    if (resizeCanvas()) initFramebuffers();
    colorTimer += dt * CONFIG.COLOR_UPDATE_SPEED;
    if (colorTimer >= 1) {
      colorTimer %= 1;
      pointer.color = randomColor();
    }
    if (pointer.moved) {
      pointer.moved = false;
      splat(pointer.x, pointer.y, pointer.dx * CONFIG.SPLAT_FORCE, pointer.dy * CONFIG.SPLAT_FORCE, pointer.color);
    }
    step(dt);
    render();
    if (now - lastInput < IDLE_MS) {
      frame = requestAnimationFrame(tick);
    } else {
      // Asleep: leave a clear canvas rather than the last faint frame.
      frame = 0;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  };

  const wake = () => {
    lastInput = performance.now();
    if (frame) return;
    lastFrame = lastInput;
    frame = requestAnimationFrame(tick);
  };

  const onMove = (event: MouseEvent) => {
    if (!started) {
      // The first move only places the pointer, so the smoke does not
      // streak in from the corner.
      started = true;
      resizeCanvas();
      initFramebuffers();
      movePointer(event.clientX, event.clientY);
      pointer.moved = false;
      return;
    }
    movePointer(event.clientX, event.clientY);
    wake();
  };

  // A click drops a brighter burst of the current colour.
  const onDown = (event: MouseEvent) => {
    if (!started) return;
    movePointer(event.clientX, event.clientY);
    const { r, g, b } = randomColor();
    splat(pointer.x, pointer.y, 10 * (Math.random() - 0.5), 30 * (Math.random() - 0.5), {
      r: r * 10,
      g: g * 10,
      b: b * 10,
    });
    wake();
  };

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("mousedown", onDown, { passive: true });

  return () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mousedown", onDown);
    if (frame) cancelAnimationFrame(frame);
    framebuffers.forEach((fbo) => gl.deleteFramebuffer(fbo));
    textures.forEach((texture) => gl.deleteTexture(texture));
    programs.forEach(({ program: linked }) => gl.deleteProgram(linked));
    // No loseContext() here: a canvas keeps handing back the same context,
    // so a remount (React StrictMode runs every effect twice in dev) would
    // get a lost one and silently draw nothing. The context goes with the
    // canvas.
  };
}
