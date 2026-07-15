"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cyberStore } from "./cyber-provider";

// ── Vertex Shader ──
const vertexShader = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// ── Fragment Shader ──
const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;
uniform vec2  uMouseVelocity;
uniform float uScroll;
uniform float uSeed;
uniform float uHover;
uniform float uPageTransition;
uniform float uTransitionProgress;

varying vec2 vUv;

// ─── Hash & Noise ───
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p + vec2(0.17, 0.31);
    a *= 0.5;
  }
  return v;
}

float fbm4(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.3, 1.1, -1.1, 1.3);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p + vec2(0.21, 0.43);
    a *= 0.45;
  }
  return v;
}

// ─── Color Palettes ───
// 6 distinct cyber scenes with premium colors
const vec3 paletteA[6] = vec3[](
  vec3(0.01, 0.03, 0.08), // Deep Black
  vec3(0.03, 0.01, 0.08), // Deep Black + Purple
  vec3(0.01, 0.05, 0.06), // Dark Teal
  vec3(0.01, 0.03, 0.10), // Midnight Blue
  vec3(0.02, 0.01, 0.05), // Deep Black
  vec3(0.01, 0.06, 0.04)  // Emerald Black
);

const vec3 paletteB[6] = vec3[](
  vec3(0.05, 0.15, 0.35), // Midnight Blue
  vec3(0.12, 0.05, 0.28), // Dark Purple
  vec3(0.03, 0.18, 0.20), // Teal
  vec3(0.04, 0.18, 0.32), // Blue
  vec3(0.08, 0.04, 0.18), // Deep Violet
  vec3(0.03, 0.20, 0.14)  // Emerald
);

const vec3 paletteC[6] = vec3[](
  vec3(0.10, 0.42, 0.85), // Electric Blue
  vec3(0.45, 0.15, 0.65), // Neon Violet
  vec3(0.08, 0.45, 0.40), // Cyan-Teal
  vec3(0.10, 0.50, 0.70), // Cyan
  vec3(0.30, 0.10, 0.50), // Purple
  vec3(0.10, 0.55, 0.35)  // Emerald
);

const vec3 paletteD[6] = vec3[](
  vec3(0.25, 0.55, 0.90), // Bright Blue
  vec3(0.70, 0.25, 0.90), // Bright Violet
  vec3(0.15, 0.75, 0.55), // Bright Teal
  vec3(0.20, 0.80, 0.85), // Bright Cyan
  vec3(0.55, 0.20, 0.75), // Bright Purple
  vec3(0.20, 0.85, 0.55)  // Bright Emerald
);

// ─── Neural Network ───
float neuralNetwork(vec2 uv, float time, float sceneIdx) {
  float lines = 0.0;
  int numNodes = 10;
  float nn = sceneIdx * 1.7;
  float t = time * 0.15;

  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    vec2 nodeA = vec2(
      hash(vec2(fi * 1.37 + nn + 0.5, fi * 3.11 + 1.0)),
      hash(vec2(fi * 2.83 + nn + 2.0, fi * 1.07 + 3.0))
    );
    nodeA += vec2(
      sin(t * 0.4 + fi * 2.1 + nn) * 0.06,
      cos(t * 0.35 + fi * 1.7 + nn * 1.3) * 0.06
    );

    // Inner loop: j > i — j always starts at i+1, no need to check j <= i
    for (int j = i + 1; j < 10; j++) {
      float fj = float(j);
      vec2 nodeB = vec2(
        hash(vec2(fj * 1.37 + nn + 0.5, fj * 3.11 + 1.0)),
        hash(vec2(fj * 2.83 + nn + 2.0, fj * 1.07 + 3.0))
      );
      nodeB += vec2(
        sin(t * 0.4 + fj * 2.1 + nn) * 0.06,
        cos(t * 0.35 + fj * 1.7 + nn * 1.3) * 0.06
      );

      float d = distance(nodeA, nodeB);
      if (d < 0.32) {
        vec2 pa = uv - nodeA;
        vec2 ba = nodeB - nodeA;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float dist = length(pa - ba * h);
        float glow = 0.002 / (0.002 + dist * dist);
        glow *= smoothstep(0.32, 0.12, d);
        float pulse = 0.5 + 0.5 * sin(time * 0.5 + fi * 2.0 + fj * 3.0);
        lines += glow * 0.12 * (0.3 + 0.7 * pulse);
      }
    }
  }
  return lines;
}

// ─── Digital Rain ───
float digitalRain(vec2 uv, float time, float scroll) {
  float columns = 40.0 + 20.0 * sin(time * 0.02);
  vec2 cell = floor(uv * vec2(columns, 30.0));
  vec2 pos = fract(uv * vec2(columns, 30.0));
  float colHash = hash(cell + floor(time * 0.15));
  if (colHash > 0.92) {
    float speed = 0.3 + hash(cell + 5.0) * 0.5;
    float fall = fract(time * speed + hash(cell + 10.0) * 3.0);
    float head = smoothstep(0.0, 0.02, pos.y - fall);
    float trail = smoothstep(0.12, 0.02, pos.y - fall);
    float brightness = colHash * 0.06;
    float glow = 0.003 / (0.003 + abs(pos.x - 0.5));
    return (head + trail * 0.4 + glow * 0.3) * brightness;
  }
  return 0.0;
}

// ─── Holographic Glow ───
float holographicGlow(vec2 uv, float time, float mouseDist) {
  vec2 center = uv - 0.5;
  float d = length(center);
  float ring = sin((d * 20.0 - time * 0.5)) * 0.5 + 0.5;
  ring *= exp(-d * 3.0);
  ring *= 0.08 + 0.04 * sin(time * 0.2);
  // Extra glow near mouse
  float mouseGlow = 0.05 / (0.05 + mouseDist * mouseDist * 5.0);
  return ring + mouseGlow * 0.15;
}

// ─── Volumetric Light Rays ───
float lightRays(vec2 uv, float time, float scroll) {
  float rays = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float angle = fi * 1.047 + time * 0.015 + scroll * 0.001;
    vec2 dir = vec2(cos(angle), sin(angle));
    float proj = dot(uv - 0.5, dir);
    float ray = exp(-abs(proj) * 8.0);
    ray *= 0.5 + 0.5 * sin(fi * 2.0 + time * 0.1);
    ray *= smoothstep(0.0, 0.08, proj + 0.8) * smoothstep(0.0, 0.08, 0.8 - proj);
    rays += ray * 0.015;
  }
  return rays;
}

// ─── Pulsing Energy Orbs ───
float energyOrbs(vec2 uv, float time, float sceneIdx) {
  float orbs = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 pos = vec2(
      0.3 + 0.4 * sin(fi * 2.5 + time * 0.08 + sceneIdx),
      0.3 + 0.4 * cos(fi * 3.1 + time * 0.06 + sceneIdx * 1.3)
    );
    float d = distance(uv, pos);
    float pulse = 0.5 + 0.5 * sin(time * (0.2 + fi * 0.1) + fi * 3.0);
    float orb = 0.01 / (0.01 + d * d * 3.0);
    orbs += orb * (0.3 + 0.7 * pulse) * 0.25;
  }
  return orbs;
}

// ─── Main ───
void main() {
  vec2 uv = vUv;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 mouse = uMouse * 2.0 - 1.0;

  float t = uTime * 0.08;
  float scroll = uScroll * 0.0012;
  float hover = uHover;

  // ── Scene Evolution ──
  // Scenes transition every 6-8 seconds, seeded by uSeed for variety
  float sceneDuration = 7.0 + uSeed * 2.0;
  float rawScene = (t + uSeed * 2.0) / sceneDuration;
  float sceneIdx = mod(floor(rawScene), 6.0);
  float nextIdx = mod(sceneIdx + 1.0, 6.0);
  float sceneBlend = smoothstep(0.0, 1.0, fract(rawScene));

  int si = int(sceneIdx);
  int ni = int(nextIdx);

  // Blended palette
  vec3 aCol = mix(paletteA[si], paletteA[ni], sceneBlend);
  vec3 bCol = mix(paletteB[si], paletteB[ni], sceneBlend);
  vec3 cCol = mix(paletteC[si], paletteC[ni], sceneBlend);
  vec3 dCol = mix(paletteD[si], paletteD[ni], sceneBlend);

  // ── Effects ──
  // Mouse influence on distortion
  vec2 drift = vec2(
    sin(t * 0.6 + sceneIdx * 1.5 + uSeed),
    cos(t * 0.5 + sceneIdx * 1.2 + uSeed * 1.9)
  ) * 0.3;

  vec2 mouseDrift = mouse * (0.08 + 0.04 * sin(t * 0.15));
  vec2 q = p * (1.05 + 0.1 * sin(t * 0.02 + uSeed)) + drift + mouseDrift;

  // Core FBM fields
  float field = fbm4(q * 1.5 + vec2(0.0, t * 0.04));
  float field2 = fbm(q * 2.0 - vec2(t * 0.03, t * 0.02));
  float veins = fbm(q * 3.0 - vec2(t * 0.05, t * 0.03));

  // Aurora
  float aurora = sin((uv.y + field * 0.4 + t * 0.05 + scroll) * 12.0 + sin(uv.x * 5.0 + t * 0.2)) * 0.5 + 0.5;
  aurora *= smoothstep(0.0, 0.5, uv.y) * smoothstep(1.0, 0.4, abs(uv.x - 0.5));
  aurora *= 0.5 + 0.5 * sin(t * 0.12 + sceneIdx);

  // Plasma
  float plasma = fbm4(vec2(uv.x * 3.0 + t * 0.03, uv.y * 2.0 - t * 0.02) + field);

  // Galaxy
  float galaxy = fbm(vec2(length(p) * 1.6 - t * 0.02, atan(p.y, p.x) * 0.8));

  // Energy rings
  float ring = 1.0 - smoothstep(0.03, 0.08, abs(length(p + mouse * 0.2 + drift * 0.3) -
    (0.45 + 0.05 * sin(t * 0.18 + sceneIdx * 1.5))));
  float ring2 = 1.0 - smoothstep(0.02, 0.05, abs(length(p * vec2(1.1, 0.9) - mouse * 0.15) -
    (0.9 + 0.07 * cos(t * 0.14 + sceneIdx * 1.2))));

  // Animated grid
  vec2 gridUv = uv * vec2(24.0, 16.0) + vec2(0.0, t * 0.03 + scroll);
  vec2 grid = abs(fract(gridUv) - 0.5);
  float gridLines = 1.0 - smoothstep(0.46, 0.5, min(grid.x, grid.y));
  gridLines *= 0.18 + 0.12 * sin(t * 0.3 + uSeed) + 0.06 * hover;

  // Scanline streaks
  float streaks = smoothstep(0.88, 1.0, fract(uv.x * 32.0 + t * 0.15 + sceneIdx * 0.2));
  streaks *= smoothstep(0.1, 0.9, uv.y) * 0.08;

  // Stars
  float stars = 0.0;
  vec2 starCell = floor(uv * vec2(180.0, 120.0));
  float starRnd = hash(starCell + sceneIdx);
  float twinkle = 0.5 + 0.5 * sin(t * (2.0 + starRnd * 4.0) + starRnd * 6.2831);
  stars += smoothstep(0.995, 1.0, starRnd + twinkle * 0.003);
  stars *= smoothstep(0.0, 0.6, uv.y);

  // Neural network
  float neural = neuralNetwork(uv, t, sceneIdx);

  // Digital rain
  float rain = digitalRain(uv, t * 0.5, scroll);

  // Holographic glow
  float holo = holographicGlow(uv, t, distance(uv, uMouse));

  // Light rays
  float rays = lightRays(uv, t, scroll);

  // Energy orbs
  float orbs = energyOrbs(uv, t, sceneIdx);

  // ── Compose ──
  vec3 col = aCol;

  // Base atmosphere
  col += bCol * (0.35 + 0.65 * field);
  col += dCol * (0.15 + 0.85 * aurora);
  col += cCol * (0.15 + 0.85 * plasma);
  col += bCol * (0.15 + 0.85 * veins * 0.3);
  col += cCol * (0.25 + 0.75 * galaxy * 0.2);

  // Energy rings
  vec3 ringColor = mix(
    vec3(0.2, 0.8, 0.9),
    vec3(0.8, 0.3, 0.95),
    sin(t * 0.1 + sceneIdx) * 0.5 + 0.5
  );
  col += ringColor * ring * 0.45;
  col += vec3(0.7, 0.9, 1.0) * ring2 * 0.25;

  // Neural network (cyan-purple glow)
  vec3 neuralColor = mix(vec3(0.3, 0.8, 1.0), vec3(0.8, 0.3, 1.0), sin(t * 0.08 + sceneIdx) * 0.5 + 0.5);
  col += neuralColor * neural;

  // Digital rain
  col += vec3(0.2, 0.9, 0.7) * rain;

  // Grid lines
  col += vec3(0.2, 0.5, 0.95) * gridLines;

  // Scanlines
  col += vec3(0.25, 0.85, 0.6) * streaks;

  // Stars
  col += vec3(1.0) * stars * 0.6;

  // Holographic glow
  col += vec3(0.3, 0.7, 1.0) * holo * 0.5;
  col += vec3(0.9, 0.5, 1.0) * holo * 0.3;

  // Light rays
  col += vec3(0.6, 0.8, 1.0) * rays;

  // Energy orbs
  col += vec3(0.4, 0.9, 1.0) * orbs * 0.4;

  // Hover glow effect
  float hoverGlow = 0.02 + 0.03 * hover;
  vec2 hoverCenter = uMouse;
  float hDist = distance(uv, hoverCenter);
  float hoverBloom = 0.01 / (0.01 + hDist * hDist * 2.0);
  col += vec3(0.5, 0.8, 1.0) * hoverBloom * hoverGlow;

  // Page transition flash
  float ptFlash = uPageTransition * 0.15;
  col += vec3(0.8, 0.95, 1.0) * ptFlash;

  // Volumetric fog
  float fog = fbm4(uv * vec2(3.0, 2.0) + vec2(t * 0.02, -t * 0.025) + field2);
  col += bCol * fog * 0.15;

  // Bloom from center
  float centerBloom = 0.08 / (0.02 + dot(p, p));
  col += cCol * centerBloom * 0.18;
  col += dCol * centerBloom * 0.1;

  // Vignette
  float vignette = smoothstep(1.4, 0.1, length(p));
  col *= vignette;

  // Tone mapping
  col = col / (col + 1.0);

  // Slight color grading shift based on scene
  float warmShift = 0.03 * sin(sceneIdx * 1.5 + t * 0.05);
  col = pow(col, vec3(0.92 + warmShift));

  gl_FragColor = vec4(col, 1.0);
}
`;

// ─── Utility: hash string for seed ───
function hashPath(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++)
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000;
}

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();

  // Track page transition
  const prevPathname = useRef(pathname);
  const pageTransitionRef = useRef(0);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      pageTransitionRef.current = 1.0;
      prevPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try WebGL2 first; fall back to WebGL1
    const ctxOpts: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    };
    let gl: WebGL2RenderingContext | WebGLRenderingContext | null =
      canvas.getContext("webgl2", ctxOpts);
    if (!gl) {
      gl = canvas.getContext("webgl", ctxOpts);
    }
    if (!gl) return;

    // ── Compile shaders ──
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const program = gl.createProgram();
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
    if (!program || !vertex || !fragment) return;

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // ── Geometry ──
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // ── Uniforms ──
    const uniforms = {
      time: gl.getUniformLocation(program, "uTime"),
      resolution: gl.getUniformLocation(program, "uResolution"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      // mouseVelocity: gl.getUniformLocation(program, "uMouseVelocity"),
      scroll: gl.getUniformLocation(program, "uScroll"),
      seed: gl.getUniformLocation(program, "uSeed"),
      hover: gl.getUniformLocation(program, "uHover"),
      pageTransition: gl.getUniformLocation(program, "uPageTransition"),
      // transitionProgress: gl.getUniformLocation(program, "uTransitionProgress"),
    };

    let raf = 0;
    let startTime = performance.now();
    const seed = hashPath(pathname ?? "/");

    // ── Resize ──
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        gl.viewport(0, 0, width, height);
      }
      if (uniforms.resolution) gl.uniform2f(uniforms.resolution, width, height);
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();

    // ── Render loop ──
    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;

      // Decay page transition
      const pt = pageTransitionRef.current;
      if (pt > 0.001) {
        pageTransitionRef.current *= 0.97;
      } else {
        pageTransitionRef.current = 0;
      }

      let hoverIntensity = 0;
      if (cyberStore.hoveredElement) {
        hoverIntensity = 0.6 + 0.4 * Math.sin(elapsed * 0.5 + hashPath(cyberStore.hoveredElement) * 6.28);
      }

      if (uniforms.time) gl.uniform1f(uniforms.time, elapsed);
      if (uniforms.mouse)
        gl.uniform2f(uniforms.mouse, cyberStore.smoothMouse.x, cyberStore.smoothMouse.y);
      if (uniforms.scroll) gl.uniform1f(uniforms.scroll, cyberStore.scroll);
      if (uniforms.seed) gl.uniform1f(uniforms.seed, seed);
      if (uniforms.hover) gl.uniform1f(uniforms.hover, hoverIntensity);
      if (uniforms.pageTransition) gl.uniform1f(uniforms.pageTransition, pt);
      // if (uniforms.transitionProgress) gl.uniform1f(uniforms.transitionProgress, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [pathname]);

  return (
    <canvas
      ref={canvasRef}
      className="cyber-background"
      aria-hidden="true"
    />
  );
}
