"use client";

/**
 * PhoenixPet — High-performance real-time 3D phoenix rendered with three.js.
 *
 * Anatomy:
 *  - Lathe-modelled body, neck, head, hooked beak, glowing eyes, crest plumes
 *  - Articulated wings: shoulder -> elbow -> wrist joints with cambered 3D feather vanes
 *  - Five flowing tail plumes with dynamic physics
 *  - Shader fire particles shed from wingtips and tail
 *
 * Flight model:
 *  - Follows cursor gracefully with agile spring-damped tracking
 *  - High-frequency energetic flapping animations
 *  - Sleek, compact pet scale
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

// Fire colour ramp, base of feather -> tip
const RAMP = [
  [0.0, "#4a0504"],
  [0.28, "#a3110b"],
  [0.55, "#ff4a0a"],
  [0.8, "#ffa01e"],
  [1.0, "#ffe7a3"],
].map(([t, c]) => [t, new THREE.Color(c)]);

function ramp(t, out) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [ta, ca] = RAMP[i - 1];
      const [tb, cb] = RAMP[i];
      return out.lerpColors(ca, cb, (t - ta) / (tb - ta));
    }
  }
  return out.copy(RAMP[RAMP.length - 1][1]);
}

// Paint a vertex-colour attribute onto any geometry
function paint(geo, fn) {
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    fn(p.getX(i), p.getY(i), p.getZ(i), c);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

function makeVane({ length, width, segs = 10, camber = 0.06, widthFn, colorFn }) {
  const rows = segs + 1;
  const pos = new Float32Array(rows * 3 * 3);
  const col = new Float32Array(rows * 3 * 3);
  const idx = [];
  const c = new THREE.Color();
  for (let r = 0; r < rows; r++) {
    const u = r / segs;
    const x = u * length;
    const w = width * widthFn(u);
    const yC = camber * length * Math.sin(Math.PI * u);
    const verts = [
      [x, yC - 0.25 * w, -w],
      [x, yC + 0.35 * width * (1 - 0.6 * u), 0],
      [x, yC - 0.25 * w, w],
    ];
    for (let k = 0; k < 3; k++) {
      const o = (r * 3 + k) * 3;
      pos[o] = verts[k][0];
      pos[o + 1] = verts[k][1];
      pos[o + 2] = verts[k][2];
      colorFn(u, k - 1, c);
      col[o] = c.r;
      col[o + 1] = c.g;
      col[o + 2] = c.b;
    }
    if (r < segs) {
      const a = r * 3;
      for (let k = 0; k < 2; k++) {
        const tl = a + k, tr = a + k + 1, bl = a + 3 + k, br = a + 4 + k;
        idx.push(tl, bl, tr, tr, bl, br);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.userData.base = pos.slice();
  geo.userData.length = length;
  return geo;
}

const featherWidth = (u) =>
  Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.04)), 0.55) * (1 - 0.3 * u) + 0.06 * (1 - u);

function makeGlowTexture() {
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const g = cv.getContext("2d");
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, "rgba(255,170,70,0.85)");
  grd.addColorStop(0.3, "rgba(255,80,10,0.35)");
  grd.addColorStop(0.65, "rgba(160,20,0,0.08)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const FIRE_VERT = /* glsl */ `
  attribute float aLife;
  attribute float aSize;
  varying float vLife;
  uniform float uScale;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aLife <= 0.0 ? 0.0 : aSize * uScale * (0.35 + 0.9 * aLife) / -mv.z;
  }
`;

const FIRE_FRAG = /* glsl */ `
  varying float vLife;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float soft = pow(1.0 - r * 2.0, 2.2);
    vec3 hot  = vec3(1.0, 0.93, 0.72);
    vec3 mid  = vec3(1.0, 0.48, 0.08);
    vec3 cool = vec3(0.75, 0.09, 0.02);
    vec3 ash  = vec3(0.18, 0.04, 0.02);
    vec3 c = vLife > 0.72 ? mix(mid, hot, (vLife - 0.72) / 0.28)
           : vLife > 0.38 ? mix(cool, mid, (vLife - 0.38) / 0.34)
           : mix(ash, cool, vLife / 0.38);
    float a = soft * smoothstep(0.0, 0.3, vLife) * 0.85;
    gl_FragColor = vec4(c, a);
  }
`;

function buildPhoenix(disposables) {
  const glow = { value: 0.32 };
  const rim = { value: 1.1 };

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGlow = glow;
    shader.uniforms.uRim = rim;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uGlow;\nuniform float uRim;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         float fres = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.5);
         totalEmissiveRadiance += vColor.rgb * (uGlow + fres * uRim);`
      );
  };
  disposables.push(mat);

  const beakMat = new THREE.MeshStandardMaterial({
    color: "#e8a93a", metalness: 0.7, roughness: 0.28, emissive: "#5a2a00", emissiveIntensity: 0.4,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: "#fff4c2" });
  disposables.push(beakMat, eyeMat);

  const track = (g) => { disposables.push(g); return g; };
  const model = new THREE.Group();

  // Body
  const profile = [
    [0.0, -0.52], [0.06, -0.47], [0.12, -0.34], [0.175, -0.14], [0.2, 0.03],
    [0.19, 0.19], [0.15, 0.34], [0.1, 0.46], [0.0, 0.52],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyGeo = track(new THREE.LatheGeometry(profile, 24));
  bodyGeo.rotateZ(-Math.PI / 2);
  bodyGeo.scale(1, 1, 0.85);
  paint(bodyGeo, (x, y, z, c) => ramp(0.42 + 0.22 * x - 0.9 * y, c));
  model.add(new THREE.Mesh(bodyGeo, mat));

  // Neck + Head
  const headG = new THREE.Group();
  headG.position.set(0.44, 0.06, 0);
  model.add(headG);

  const neckGeo = track(new THREE.SphereGeometry(0.11, 18, 14));
  neckGeo.scale(1.35, 1, 0.85);
  paint(neckGeo, (x, y, z, c) => ramp(0.62 - 1.2 * y, c));
  headG.add(new THREE.Mesh(neckGeo, mat));

  const headGeo = track(new THREE.SphereGeometry(0.105, 22, 16));
  headGeo.scale(1.2, 1, 0.88);
  paint(headGeo, (x, y, z, c) => ramp(0.7 + 0.6 * x - 0.6 * y, c));
  const head = new THREE.Mesh(headGeo, mat);
  head.position.set(0.13, 0.06, 0);
  headG.add(head);

  // Hooked Beak
  const beakGeo = track(new THREE.ConeGeometry(0.034, 0.15, 10));
  beakGeo.rotateZ(-Math.PI / 2);
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0.28, 0.045, 0);
  beak.rotation.z = -0.32;
  headG.add(beak);

  const jawGeo = track(new THREE.ConeGeometry(0.02, 0.09, 8));
  jawGeo.rotateZ(-Math.PI / 2);
  const jaw = new THREE.Mesh(jawGeo, beakMat);
  jaw.position.set(0.25, 0.02, 0);
  jaw.rotation.z = -0.1;
  headG.add(jaw);

  // Glowing Eyes
  const eyeGeo = track(new THREE.SphereGeometry(0.016, 10, 8));
  [-1, 1].forEach((s) => {
    const e = new THREE.Mesh(eyeGeo, eyeMat);
    e.position.set(0.19, 0.095, 0.072 * s);
    headG.add(e);
  });

  // Head Crest Plumes
  for (let i = 0; i < 6; i++) {
    const len = 0.26 + i * 0.045;
    const geo = track(makeVane({
      length: len, width: 0.022, segs: 8, camber: 0.12, widthFn: featherWidth,
      colorFn: (u, k, c) => ramp(0.45 + 0.55 * u, c),
    }));
    const g = new THREE.Group();
    g.position.set(0.1, 0.15, (i % 2 ? 1 : -1) * 0.012 * i);
    g.rotation.set(0, (i % 2 ? 1 : -1) * 0.08 * i, Math.PI - 0.35 - i * 0.11);
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = Math.PI / 2;
    g.add(m);
    headG.add(g);
  }

  // Wings
  const vaneCache = new Map();
  const vane = (len, wid, tone) => {
    const key = `${len.toFixed(3)}|${wid}|${tone}`;
    if (!vaneCache.has(key)) {
      vaneCache.set(key, track(makeVane({
        length: len, width: wid, segs: 6, camber: 0.05, widthFn: featherWidth,
        colorFn: (u, k, c) => {
          ramp(tone + (1 - tone) * u, c);
          if (k === 0) c.multiplyScalar(1.18);
        },
      })));
    }
    return vaneCache.get(key);
  };

  const bone = (parent, len, r0, r1, side) => {
    const geo = track(new THREE.CylinderGeometry(r1, r0, len, 10));
    geo.rotateX((side * Math.PI) / 2);
    paint(geo, (x, y, z, c) => ramp(0.5, c));
    const m = new THREE.Mesh(geo, mat);
    m.position.z = (side * len) / 2;
    parent.add(m);
  };

  const buildWing = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.1, 0.12, 0.13 * side);
    const fore = new THREE.Group();
    fore.position.z = 0.36 * side;
    shoulder.add(fore);
    const hand = new THREE.Group();
    hand.position.z = 0.42 * side;
    fore.add(hand);

    bone(shoulder, 0.36, 0.055, 0.042, side);
    bone(fore, 0.42, 0.042, 0.03, side);
    bone(hand, 0.36, 0.03, 0.012, side);

    const feather = (parent, z, len, wid, fan, y, tone, droop = -0.04) => {
      const g = new THREE.Group();
      g.position.set(-0.015, y, z * side);
      g.rotation.set(0, Math.PI + side * fan, droop);
      g.add(new THREE.Mesh(vane(len, wid, tone), mat));
      parent.add(g);
    };

    // Tertials
    for (let i = 0; i < 4; i++) feather(shoulder, 0.05 + i * 0.09, 0.5 + i * 0.03, 0.06, -0.06 + i * 0.02, -0.004 * i, 0.12);
    // Secondaries
    for (let i = 0; i < 6; i++) feather(fore, 0.02 + i * 0.075, 0.6 + i * 0.012, 0.06, 0.02 + i * 0.02, -0.004 * i, 0.1);
    // Primaries
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      feather(hand, 0.02 + i * 0.055, 0.7 + t * 0.26, 0.055, 0.16 + t * 0.95, -0.004 * i, 0.08, -0.04 - t * 0.04);
    }
    // Greater coverts
    for (let i = 0; i < 14; i++) {
      const z = 0.04 + i * 0.08;
      const parent = z < 0.36 ? shoulder : z < 0.78 ? fore : hand;
      const lz = z < 0.36 ? z : z < 0.78 ? z - 0.36 : z - 0.78;
      feather(parent, lz, 0.3, 0.055, 0.04 + (z > 0.78 ? 0.3 : 0), 0.014, 0.3);
    }
    // Lesser coverts
    for (let i = 0; i < 10; i++) {
      const z = 0.03 + i * 0.075;
      const parent = z < 0.36 ? shoulder : fore;
      const lz = z < 0.36 ? z : z - 0.36;
      feather(parent, lz, 0.16, 0.05, 0.02, 0.026, 0.4);
    }

    const tip = new THREE.Object3D();
    tip.position.set(-0.75, 0, 0.42 * side);
    hand.add(tip);

    model.add(shoulder);
    return { shoulder, fore, hand, tip, side };
  };

  const wings = [buildWing(1), buildWing(-1)];

  // Tail
  const tailG = new THREE.Group();
  tailG.position.set(-0.45, -0.02, 0);
  model.add(tailG);

  for (let i = 0; i < 7; i++) {
    const t = i / 6 - 0.5;
    const g = new THREE.Group();
    g.rotation.set(0, Math.PI + t * 1.0, -0.08);
    g.add(new THREE.Mesh(vane(0.48 + (0.5 - Math.abs(t)) * 0.12, 0.07, 0.15), mat));
    tailG.add(g);
  }

  const plumeWidth = (u) => {
    const shaft = 0.25 + 0.2 * u;
    const v = Math.min(1, Math.max(0, (u - 0.72) / 0.28));
    const eye = Math.sin(Math.PI * v) * 1.1;
    const taper = u > 0.96 ? (1 - u) / 0.04 : 1;
    return (shaft + eye) * taper;
  };
  const plumes = [];
  const spreads = [-0.24, -0.11, 0, 0.11, 0.24];
  const lens = [1.45, 1.75, 2.05, 1.75, 1.45];
  spreads.forEach((b, i) => {
    const geo = track(makeVane({
      length: lens[i], width: 0.07, segs: 12, camber: 0.0, widthFn: plumeWidth,
      colorFn: (u, k, c) => {
        const v = Math.min(1, Math.max(0, (u - 0.72) / 0.28));
        ramp(0.25 + 0.55 * u, c);
        if (v > 0) {
          const core = Math.max(0, 1 - Math.abs(v - 0.5) * 3.2) * (k === 0 ? 1 : 0.55);
          c.lerp(new THREE.Color("#ffe9a8"), core);
        }
      },
    }));
    geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
    const g = new THREE.Group();
    g.rotation.set(b * 1.4, Math.PI + b, -0.1 - Math.abs(b) * 0.25);
    const mesh = new THREE.Mesh(geo, mat);
    g.add(mesh);
    tailG.add(g);
    plumes.push({ mesh, geo, seed: i * 1.37 });
  });

  return { model, headG, wings, tailG, plumes, glow, rim, mat };
}

export default function PhoenixPet() {
  const pathname = usePathname();
  const isHiddenRoute =
    pathname?.startsWith("/payment") ||
    pathname === "/login" ||
    pathname?.startsWith("/admin");
  const mountRef = useRef(null);

  useEffect(() => {
    if (isHiddenRoute) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const mount = mountRef.current;
    if (!mount) return;

    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const disposables = [];

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: isTouch ? "low-power" : "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99990;";
    mount.appendChild(canvas);

    let contextLost = false;
    const onContextLost = (e) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
    };
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);

    const scene = new THREE.Scene();
    const FOV = 30;
    const CAM_Z = 12;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, CAM_Z);

    scene.add(new THREE.HemisphereLight("#ffd9b0", "#2a0600", 0.9));
    const key = new THREE.DirectionalLight("#fff1d6", 2.6);
    key.position.set(3, 6, 8);
    scene.add(key);
    const back = new THREE.DirectionalLight("#ff5a1a", 1.4);
    back.position.set(-4, -2, -5);
    scene.add(back);

    // Root Hierarchy
    const root = new THREE.Group();
    const yawG = new THREE.Group();
    const pitchG = new THREE.Group();
    const rollG = new THREE.Group();
    root.add(yawG);
    yawG.add(pitchG);
    pitchG.add(rollG);
    scene.add(root);

    const bird = buildPhoenix(disposables);
    rollG.add(bird.model);

    const inner = new THREE.PointLight("#ff7a1a", 1.3, 0, 0);
    inner.position.set(0.3, 0.4, 1.3);
    root.add(inner);

    const glowTex = makeGlowTexture();
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.35,
    });
    disposables.push(glowTex, glowMat);
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(1.5, 1.5, 1);
    glowSprite.position.z = -0.4;
    root.add(glowSprite);

    // Fire Particles — ultra-lightweight count to guarantee smooth 60fps
    const N = isTouch ? 24 : 45;
    const pPos = new Float32Array(N * 3);
    const pVel = new Float32Array(N * 3);
    const pLife = new Float32Array(N);
    const pMax = new Float32Array(N);
    const pSize = new Float32Array(N);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setAttribute("aLife", new THREE.BufferAttribute(pLife, 1).setUsage(THREE.DynamicDrawUsage));
    pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
    const fireUniforms = { uScale: { value: 1 } };
    const pMat = new THREE.ShaderMaterial({
      vertexShader: FIRE_VERT, fragmentShader: FIRE_FRAG, uniforms: fireUniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    disposables.push(pGeo, pMat);
    const points = new THREE.Points(pGeo, pMat);
    points.frustumCulled = false;
    scene.add(points);
    let pCursor = 0;

    // Sizing: More compact, nimble scale
    let W = 1, H = 1, visW = 1, visH = 1, S = 0.2;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      visH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      visW = visH * camera.aspect;
      const ppu = H / visH;
      // Compact size: ~78px max wingspan on desktop, ~46px on mobile
      const spanPx = isTouch ? 46 : Math.min(78, Math.max(52, W * 0.048));
      S = spanPx / (ppu * 4.0);
      root.scale.setScalar(S);
      fireUniforms.uScale.value = (H * renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    };
    resize();
    window.addEventListener("resize", resize);

    const toWorld = (px, py, out) => out.set((px / W - 0.5) * visW, (0.5 - py / H) * visH, 0);

    // Flight State
    const pos = new THREE.Vector3();
    const vel = new THREE.Vector3();
    const prevVel = new THREE.Vector3();
    const target = new THREE.Vector3();
    const mouse = { x: W + 100, y: H * 0.35, last: performance.now() };
    toWorld(W + 120, H * 0.3, pos);

    let yaw = -0.35;
    let facing = -1;
    let pitch = 0, roll = 0;
    let intensity = 0.7, phase = 0, tailPhase = 0, burst = 0, time = 0;

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.last = performance.now();
    };
    const onDown = () => {
      burst = 1.2;
      for (let i = 0; i < 20; i++) emit(pos, 1.4, 0.8 + Math.random() * 0.4);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    const tmp = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();

    function emit(at, spread, lifeSec, inherit = 0.12) {
      const i = pCursor;
      pCursor = (pCursor + 1) % N;
      pPos[i * 3] = at.x + (Math.random() - 0.5) * 0.1 * S;
      pPos[i * 3 + 1] = at.y + (Math.random() - 0.5) * 0.1 * S;
      pPos[i * 3 + 2] = at.z;
      pVel[i * 3] = -vel.x * inherit + (Math.random() - 0.5) * spread * S;
      pVel[i * 3 + 1] = -vel.y * inherit + (Math.random() - 0.2) * spread * S;
      pVel[i * 3 + 2] = (Math.random() - 0.5) * spread * S * 0.5;
      pMax[i] = lifeSec;
      pLife[i] = 1;
      pSize[i] = S * (0.08 + Math.random() * 0.14);
    }

    let raf = 0;
    let last = performance.now();
    let emitAcc = 0;
    let frameCount = 0;
    let isIntroCached = false;

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || contextLost) return;
      // Throttle continuous 3D simulation to ~30fps on touch phones to save battery & thermal headroom
      if (isTouch && now - last < 32) return;

      // Hide 3D phoenix pet while splash intro, menu, or profile filling is active (throttled DOM query)
      if ((frameCount++ & 7) === 0) {
        isIntroCached =
          Boolean(document.querySelector('[data-fest-intro="true"]')) ||
          document.body.getAttribute('data-menu-open') === 'true' ||
          document.body.getAttribute('data-profile-modal-open') === 'true' ||
          document.body.getAttribute('data-profile-editing') === 'true';
      }
      if (isIntroCached) {
        if (canvas.style.display !== "none") canvas.style.display = "none";
        return;
      } else {
        if (canvas.style.display !== "block") canvas.style.display = "block";
      }

      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      time += dt;

      // Always follow cursor gracefully
      const idle = now - mouse.last > 2200;
      const ox = idle ? Math.sin(time * 0.8) * 32 : 34;
      const oy = idle ? Math.sin(time * 1.5) * 12 + 16 : 22;
      toWorld(mouse.x + ox, mouse.y + oy, target);

      // Spring-damped flight
      prevVel.copy(vel);
      const k = 10, c = 5.6;
      tmp.subVectors(target, pos).multiplyScalar(k * dt);
      vel.add(tmp).addScaledVector(vel, -c * dt);
      pos.addScaledVector(vel, dt);
      root.position.copy(pos);
      root.position.y += Math.sin(phase) * -0.03 * S * intensity * 4;

      const speed = vel.length() / Math.max(S, 0.01);
      const accel = tmp2.subVectors(vel, prevVel).length() / Math.max(dt, 1e-3) / Math.max(S, 0.01);
      const vyN = vel.y / Math.max(S, 0.01);

      if (vel.x > 0.5 * S) facing = 1;
      else if (vel.x < -0.5 * S) facing = -1;
      const yawTarget = facing > 0 ? -0.38 : Math.PI + 0.38;
      yaw += (yawTarget - yaw) * Math.min(1, dt * 5);
      yawG.rotation.y = yaw;

      const pitchTarget = THREE.MathUtils.clamp(vyN * 0.038, -0.55, 0.6);
      pitch += (pitchTarget - pitch) * Math.min(1, dt * 5.5);
      pitchG.rotation.z = pitch;
      const turn = THREE.MathUtils.clamp((vel.x - prevVel.x) / Math.max(dt, 1e-3) / S * 0.004, -0.4, 0.4);
      roll += (turn - roll) * Math.min(1, dt * 4.5);
      rollG.rotation.x = 0.34 * Math.cos(yaw) + roll;

      // Energetic wing flap intensity
      const climb = THREE.MathUtils.clamp(vyN / 8, 0, 1);
      const acc = THREE.MathUtils.clamp(accel / 50, 0, 1);
      const cruise = THREE.MathUtils.clamp(speed / 10, 0, 1);
      const iTarget = THREE.MathUtils.clamp(0.6 + 0.5 * climb + 0.4 * acc + burst * 0.7, 0.3, 1.3);
      intensity += (iTarget - intensity) * Math.min(1, dt * 3.5);
      burst = Math.max(0, burst - dt * 1.6);

      // Higher Flap Rate: spirited, lively wing beats
      const freq = 3.6 + 5.5 * intensity;
      phase += Math.PI * 2 * freq * dt;
      const amp = 0.38 + 1.1 * intensity;
      const sN = Math.sin(phase);
      const upstroke = Math.max(0, Math.cos(phase));
      const dihedral = 0.12 - 0.05 * intensity;

      // Deep articulated wing flapping
      for (const w of bird.wings) {
        const sd = w.side;
        w.shoulder.rotation.x = -sd * (amp * sN + dihedral);
        w.fore.rotation.x = -sd * (amp * 0.6 * Math.sin(phase - 0.45));
        w.hand.rotation.x = -sd * (amp * 0.8 * Math.sin(phase - 0.9));
        w.shoulder.rotation.y = -sd * (0.08 + upstroke * 0.28 * intensity);
        w.fore.rotation.y = sd * upstroke * 0.42 * intensity;
        w.hand.rotation.y = -sd * upstroke * 0.58 * intensity;
        w.hand.rotation.z = 0.25 * Math.cos(phase) * intensity;
        w.fore.rotation.z = 0.12 * Math.cos(phase) * intensity;
      }

      bird.headG.rotation.z = -pitch * 0.6 + Math.sin(time * 1.2) * 0.05;
      bird.headG.rotation.y = Math.sin(time * 0.8) * 0.12;
      bird.tailG.rotation.z = -pitch * 0.4 + Math.sin(phase - 1.6) * 0.06 * intensity;

      // Tail plumes dynamic physics
      tailPhase += dt * (2.2 + intensity * 2.2 + cruise * 1.4);
      const tailAmp = 0.18 * (1.15 - cruise * 0.4);
      for (const p of bird.plumes) {
        const attr = p.geo.attributes.position;
        const base = p.geo.userData.base;
        const L = p.geo.userData.length;
        for (let v = 0; v < attr.count; v++) {
          const bx = base[v * 3];
          const u = bx / L;
          const f = Math.pow(u, 1.6);
          attr.array[v * 3 + 1] = base[v * 3 + 1] + tailAmp * f * Math.sin(tailPhase - u * 3.6 + p.seed) - pitch * 0.25 * f;
          attr.array[v * 3 + 2] = base[v * 3 + 2] + tailAmp * 0.6 * f * Math.sin(tailPhase * 0.8 - u * 2.8 + p.seed * 1.9);
        }
        attr.needsUpdate = true;
      }

      const flicker = 0.5 + 0.5 * Math.sin(time * 14.1) * Math.sin(time * 8.3);
      bird.glow.value = 0.28 + 0.1 * flicker + burst * 0.35;
      glowMat.opacity = 0.3 + 0.1 * flicker + burst * 0.25;
      inner.intensity = 1.1 + 0.4 * flicker + burst;

      scene.updateMatrixWorld();

      // Emit wing fire sparks
      emitAcc += dt * ((isTouch ? 25 : 55) + speed * 3.5 + burst * 100);
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const r = Math.random();
        if (r < 0.4) {
          const w = bird.wings[Math.random() < 0.5 ? 0 : 1];
          w.tip.getWorldPosition(tmp);
          emit(tmp, 0.8, 0.5 + Math.random() * 0.35);
        } else if (r < 0.8) {
          const p = bird.plumes[(Math.random() * bird.plumes.length) | 0];
          const attr = p.geo.attributes.position;
          const v = attr.count - 3 - 3 * ((Math.random() * 6) | 0);
          tmp.fromBufferAttribute(attr, Math.max(0, v));
          p.mesh.localToWorld(tmp);
          emit(tmp, 0.5, 0.6 + Math.random() * 0.5, 0.05);
        } else {
          tmp.set(-0.1 + Math.random() * 0.35, 0.12, 0);
          bird.model.localToWorld(tmp);
          emit(tmp, 0.6, 0.4 + Math.random() * 0.25);
        }
      }

      // Update particle physics
      const drag = Math.pow(0.12, dt);
      for (let i = 0; i < N; i++) {
        if (pLife[i] <= 0) continue;
        pLife[i] -= dt / pMax[i];
        if (pLife[i] <= 0) { pLife[i] = 0; continue; }
        const o = i * 3;
        pVel[o] = pVel[o] * drag + Math.sin(time * 3.1 + i * 0.7) * 0.8 * S * dt;
        pVel[o + 1] = pVel[o + 1] * drag + 2.0 * S * dt;
        pVel[o + 2] *= drag;
        pPos[o] += pVel[o] * dt;
        pPos[o + 1] += pVel[o + 1] * dt;
        pPos[o + 2] += pVel[o + 2] * dt;
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.aLife.needsUpdate = true;

      renderer.render(scene, camera);
    };

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      canvas.remove();
    };
  }, [isHiddenRoute]);

  if (isHiddenRoute) return null;

  return <div ref={mountRef} aria-hidden />;
}
