// Procedural vehicle generator for MOTION X illustrative studio renders.
// Produces generic body-style forms (never a replica of a specific model)
// so demonstration listings can be illustrated honestly.
import * as THREE from "three";

// ── Interpolation helpers ────────────────────────────────────────────────
function curve(keys) {
  // Monotone cubic (Fritsch–Carlson) interpolation over [[u, v], ...]
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const n = xs.length;
  const d = [];
  const m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (u) => {
    if (u <= xs[0]) return ys[0];
    if (u >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (u > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (u - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}


// ── Body-style presets (metres). u = 0 rear … 1 front ────────────────────
export const PRESETS = {
  supercar: {
    L: 4.55, R: 0.37, tireW: 0.3, axles: [0.19, 0.795], gc: 0.11, n: 3.2, nb: 7,
    top: [[0, 0.66], [0.03, 0.93], [0.12, 0.99], [0.3, 0.97], [0.5, 0.9], [0.66, 0.84], [0.8, 0.76], [0.93, 0.62], [1, 0.44]],
    bottom: [[0, 0.32], [0.07, 0.17], [0.18, 0.12], [0.85, 0.12], [0.96, 0.15], [1, 0.24]],
    width: [[0, 0.86], [0.06, 0.97], [0.2, 1.0], [0.42, 0.93], [0.62, 0.94], [0.8, 0.98], [0.94, 0.92], [1, 0.8]],
    gh: { from: 0.3, to: 0.735, roof: [[0.3, 0.96], [0.39, 1.1], [0.5, 1.155], [0.6, 1.12], [0.68, 1.0], [0.735, 0.86]],
          width: [[0.3, 0.46], [0.42, 0.66], [0.6, 0.67], [0.735, 0.54]], roofBand: [0.38, 0.6], n: 2.6 },
    lights: { front: [0.6, 0.7], rear: [0.82, 0.9] }, intake: true, rimSpokes: 10,
  },
  sportscoupe: {
    L: 4.52, R: 0.35, tireW: 0.28, axles: [0.2, 0.74], gc: 0.12, n: 2.8, nb: 6,
    top: [[0, 0.68], [0.04, 0.93], [0.14, 0.96], [0.28, 0.93], [0.6, 0.86], [0.8, 0.8], [0.94, 0.66], [1, 0.48]],
    bottom: [[0, 0.3], [0.08, 0.17], [0.2, 0.13], [0.85, 0.13], [0.97, 0.16], [1, 0.26]],
    width: [[0, 0.82], [0.08, 0.93], [0.2, 0.95], [0.45, 0.9], [0.75, 0.92], [0.92, 0.86], [1, 0.72]],
    gh: { from: 0.12, to: 0.66, roof: [[0.12, 0.95], [0.25, 1.12], [0.42, 1.29], [0.55, 1.29], [0.62, 1.12], [0.66, 0.9]],
          width: [[0.12, 0.56], [0.3, 0.72], [0.55, 0.74], [0.66, 0.64]], roofBand: [0.32, 0.6], n: 3 },
    lights: { front: [0.62, 0.74], rear: [0.8, 0.88] }, intake: false, rimSpokes: 5,
  },
  gt: {
    L: 4.75, R: 0.375, tireW: 0.28, axles: [0.2, 0.77], gc: 0.12, n: 2.9, nb: 6,
    top: [[0, 0.7], [0.04, 0.93], [0.12, 0.96], [0.3, 0.92], [0.55, 0.9], [0.8, 0.86], [0.95, 0.72], [1, 0.52]],
    bottom: [[0, 0.3], [0.07, 0.17], [0.18, 0.13], [0.87, 0.13], [0.97, 0.16], [1, 0.27]],
    width: [[0, 0.84], [0.07, 0.95], [0.2, 0.98], [0.45, 0.93], [0.78, 0.96], [0.93, 0.9], [1, 0.74]],
    gh: { from: 0.1, to: 0.6, roof: [[0.1, 0.94], [0.22, 1.12], [0.38, 1.3], [0.48, 1.31], [0.56, 1.14], [0.6, 0.9]],
          width: [[0.1, 0.54], [0.28, 0.72], [0.48, 0.74], [0.6, 0.64]], roofBand: [0.27, 0.53], n: 3 },
    lights: { front: [0.62, 0.74], rear: [0.82, 0.9] }, intake: false, rimSpokes: 10,
  },
  sedan: {
    L: 4.95, R: 0.375, tireW: 0.26, axles: [0.2, 0.78], gc: 0.14, n: 3.4, nb: 6,
    top: [[0, 0.82], [0.04, 0.99], [0.15, 1.01], [0.3, 0.98], [0.65, 0.95], [0.85, 0.92], [0.96, 0.8], [1, 0.6]],
    bottom: [[0, 0.36], [0.06, 0.2], [0.16, 0.15], [0.88, 0.15], [0.97, 0.19], [1, 0.3]],
    width: [[0, 0.82], [0.07, 0.92], [0.2, 0.94], [0.5, 0.93], [0.8, 0.93], [0.94, 0.88], [1, 0.74]],
    gh: { from: 0.14, to: 0.66, roof: [[0.14, 0.98], [0.24, 1.25], [0.36, 1.43], [0.52, 1.44], [0.6, 1.25], [0.66, 0.97]],
          width: [[0.14, 0.6], [0.3, 0.72], [0.55, 0.73], [0.66, 0.66]], roofBand: [0.27, 0.57], n: 3.2 },
    lights: { front: [0.66, 0.78], rear: [0.84, 0.92] }, intake: false, rimSpokes: 10,
  },
  hatch: {
    L: 4.28, R: 0.33, tireW: 0.23, axles: [0.15, 0.78], gc: 0.14, n: 3.2, nb: 6,
    top: [[0, 0.94], [0.03, 1.0], [0.2, 0.99], [0.6, 0.94], [0.85, 0.9], [0.96, 0.78], [1, 0.6]],
    bottom: [[0, 0.38], [0.05, 0.22], [0.13, 0.16], [0.88, 0.16], [0.97, 0.2], [1, 0.3]],
    width: [[0, 0.84], [0.06, 0.9], [0.2, 0.91], [0.5, 0.9], [0.82, 0.9], [0.94, 0.85], [1, 0.72]],
    gh: { from: 0.015, to: 0.66, roof: [[0.015, 0.99], [0.04, 1.3], [0.12, 1.43], [0.42, 1.46], [0.58, 1.27], [0.66, 0.96]],
          width: [[0.015, 0.62], [0.12, 0.72], [0.5, 0.73], [0.66, 0.66]], roofBand: [0.08, 0.53], n: 3.4 },
    lights: { front: [0.68, 0.8], rear: [0.84, 0.94] }, intake: false, rimSpokes: 5,
  },
  estate: {
    L: 4.99, R: 0.375, tireW: 0.28, axles: [0.18, 0.78], gc: 0.13, n: 3.4, nb: 6,
    top: [[0, 0.9], [0.03, 0.99], [0.2, 0.99], [0.6, 0.94], [0.85, 0.9], [0.96, 0.76], [1, 0.58]],
    bottom: [[0, 0.36], [0.05, 0.2], [0.15, 0.14], [0.88, 0.14], [0.97, 0.18], [1, 0.28]],
    width: [[0, 0.86], [0.06, 0.95], [0.2, 0.98], [0.5, 0.94], [0.8, 0.97], [0.94, 0.9], [1, 0.74]],
    gh: { from: 0.02, to: 0.64, roof: [[0.02, 0.98], [0.06, 1.3], [0.14, 1.43], [0.42, 1.46], [0.56, 1.28], [0.64, 0.95]],
          width: [[0.02, 0.6], [0.12, 0.7], [0.5, 0.72], [0.64, 0.64]], roofBand: [0.1, 0.52], n: 3.2 },
    lights: { front: [0.64, 0.76], rear: [0.84, 0.92] }, intake: true, rimSpokes: 10,
  },
  suv: {
    L: 4.85, R: 0.425, tireW: 0.28, axles: [0.18, 0.79], gc: 0.2, n: 4.4, nb: 8,
    top: [[0, 1.1], [0.03, 1.16], [0.2, 1.17], [0.6, 1.14], [0.85, 1.1], [0.96, 1.0], [1, 0.82]],
    bottom: [[0, 0.46], [0.05, 0.3], [0.14, 0.22], [0.88, 0.22], [0.97, 0.3], [1, 0.4]],
    width: [[0, 0.9], [0.06, 0.97], [0.2, 0.99], [0.5, 0.97], [0.8, 0.99], [0.94, 0.95], [1, 0.84]],
    gh: { from: 0.02, to: 0.67, roof: [[0.02, 1.15], [0.05, 1.6], [0.14, 1.72], [0.48, 1.73], [0.6, 1.55], [0.67, 1.13]],
          width: [[0.02, 0.76], [0.12, 0.82], [0.5, 0.83], [0.67, 0.78]], roofBand: [0.1, 0.55], n: 4.5 },
    lights: { front: [0.86, 0.96], rear: [1.02, 1.1] }, intake: true, rimSpokes: 6,
  },
  offroader: {
    L: 4.7, R: 0.42, tireW: 0.32, axles: [0.17, 0.8], gc: 0.25, n: 9, nb: 10,
    top: [[0, 1.12], [0.02, 1.2], [0.2, 1.21], [0.7, 1.2], [0.93, 1.17], [0.985, 1.1], [1, 0.95]],
    bottom: [[0, 0.5], [0.03, 0.35], [0.12, 0.27], [0.9, 0.27], [0.98, 0.34], [1, 0.45]],
    width: [[0, 0.94], [0.04, 0.98], [0.5, 0.97], [0.96, 0.97], [1, 0.9]],
    gh: { from: 0.03, to: 0.66, roof: [[0.03, 1.2], [0.04, 1.84], [0.1, 1.9], [0.58, 1.9], [0.63, 1.8], [0.66, 1.19]],
          width: [[0.03, 0.86], [0.1, 0.88], [0.58, 0.88], [0.66, 0.85]], roofBand: [0.07, 0.6], n: 8 },
    lights: { front: [0.9, 1.02], rear: [1.0, 1.1] }, intake: false, rimSpokes: 6,
  },
  pickup: {
    L: 5.3, R: 0.4, tireW: 0.28, axles: [0.2, 0.82], gc: 0.24, n: 6, nb: 9,
    top: [[0, 1.12], [0.02, 1.18], [0.4, 1.18], [0.45, 1.16], [0.8, 1.13], [0.95, 1.08], [1, 0.9]],
    bottom: [[0, 0.5], [0.03, 0.36], [0.12, 0.27], [0.9, 0.27], [0.98, 0.34], [1, 0.45]],
    width: [[0, 0.92], [0.04, 0.95], [0.5, 0.95], [0.9, 0.95], [1, 0.86]],
    gh: { from: 0.38, to: 0.72, roof: [[0.38, 1.17], [0.39, 1.72], [0.44, 1.8], [0.6, 1.8], [0.66, 1.6], [0.72, 1.14]],
          width: [[0.38, 0.8], [0.45, 0.82], [0.6, 0.82], [0.72, 0.78]], roofBand: [0.42, 0.63], n: 6 },
    lights: { front: [0.86, 0.98], rear: [0.9, 1.06] }, intake: false, rimSpokes: 6,
  },
  classic: {
    L: 4.4, R: 0.33, tireW: 0.2, axles: [0.2, 0.77], gc: 0.14, n: 2.3, nb: 3,
    top: [[0, 0.62], [0.05, 0.86], [0.14, 0.92], [0.3, 0.88], [0.5, 0.86], [0.7, 0.86], [0.82, 0.88], [0.94, 0.72], [1, 0.5]],
    bottom: [[0, 0.32], [0.07, 0.2], [0.18, 0.17], [0.86, 0.17], [0.96, 0.2], [1, 0.3]],
    width: [[0, 0.7], [0.08, 0.84], [0.2, 0.86], [0.45, 0.8], [0.75, 0.84], [0.92, 0.78], [1, 0.6]],
    gh: { from: 0.18, to: 0.6, roof: [[0.18, 0.87], [0.28, 1.06], [0.4, 1.26], [0.5, 1.27], [0.56, 1.12], [0.6, 0.85]],
          width: [[0.18, 0.46], [0.35, 0.6], [0.5, 0.6], [0.6, 0.54]], roofBand: [0.32, 0.53], n: 2.2 },
    lights: { front: [0.62, 0.72], rear: [0.7, 0.78] }, intake: false, rimSpokes: 0, roundLights: true,
  },
};

// ── Lofted surface ───────────────────────────────────────────────────────
function loft({ stations, ring, sample, classify }) {
  // sample(i, j) → { p: Vector3 } ; returns geometry + per-quad class
  const positions = new Float32Array((stations + 1) * ring * 3);
  for (let i = 0; i <= stations; i++) {
    for (let j = 0; j < ring; j++) {
      const p = sample(i, j);
      const k = (i * ring + j) * 3;
      positions[k] = p.x; positions[k + 1] = p.y; positions[k + 2] = p.z;
    }
  }
  const groups = {};
  const v = (i, j) => i * ring + (j % ring);
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3();
  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < ring; j++) {
      const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
      tmpA.fromArray(positions, a * 3); tmpB.fromArray(positions, c * 3);
      const center = tmpC.copy(tmpA).add(tmpB).multiplyScalar(0.5);
      const cls = classify(i, j, center);
      (groups[cls] ||= []).push(a, b, d, b, c, d);
    }
  }
  const out = {};
  const base = new THREE.BufferGeometry();
  base.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  // Smooth normals across all classes.
  const all = Object.values(groups).flat();
  base.setIndex(all);
  base.computeVertexNormals();
  const normals = base.getAttribute("normal");
  for (const [cls, idx] of Object.entries(groups)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", base.getAttribute("position"));
    g.setAttribute("normal", normals);
    g.setIndex(idx);
    out[cls] = g;
  }
  return out;
}

function superellipsePoint(theta, n, nb) {
  // theta: 0 = +z side, π/2 = top, π = -z side, 3π/2 = bottom
  const c = Math.cos(theta), s = Math.sin(theta);
  const e = s >= 0 ? 2 / n : 2 / nb;
  return { z: Math.sign(c) * Math.pow(Math.abs(c), e), y: Math.sign(s) * Math.pow(Math.abs(s), e) };
}

// ── Wheels ───────────────────────────────────────────────────────────────
function buildWheel(preset, materials, spokes) {
  const group = new THREE.Group();
  const R = preset.R, w = preset.tireW;
  const rimR = R * 0.68;
  // Tyre: lathe profile around the axle (x axis after rotation)
  const pts = [];
  const segs = 24;
  for (let k = 0; k <= segs; k++) {
    const t = (k / segs) * Math.PI;
    const r = rimR + (R - rimR) * Math.pow(Math.sin(t), 0.35);
    const y = -w / 2 + (w * k) / segs;
    pts.push(new THREE.Vector2(r, y));
  }
  const tyre = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), materials.tyre);
  tyre.rotation.x = Math.PI / 2;
  group.add(tyre);

  // Rim face with spoke cut-outs
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rimR, 0, Math.PI * 2, false);
  const n = spokes || 0;
  if (n > 0) {
    for (let s = 0; s < n; s++) {
      const a0 = (s / n) * Math.PI * 2 + 0.08 * (10 / n);
      const a1 = ((s + 1) / n) * Math.PI * 2 - 0.08 * (10 / n);
      const hole = new THREE.Path();
      const rIn = rimR * 0.3, rOut = rimR * 0.9;
      hole.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      hole.lineTo(Math.cos(a0 + 0.02) * rOut, Math.sin(a0 + 0.02) * rOut);
      hole.absarc(0, 0, rOut, a0 + 0.02, a1 - 0.02, false);
      hole.lineTo(Math.cos(a1) * rIn, Math.sin(a1) * rIn);
      hole.absarc(0, 0, rIn, a1, a0, true);
      shape.holes.push(hole);
    }
  } else {
    // Classic: smooth dished hubcap with small vents
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 2;
      const hole = new THREE.Path();
      hole.absarc(Math.cos(a) * rimR * 0.62, Math.sin(a) * rimR * 0.62, rimR * 0.09, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }
  const face = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2, curveSegments: 48 }),
    materials.rim,
  );
  face.position.z = w / 2 - 0.06;
  group.add(face);
  // Barrel & hub
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.98, rimR * 0.98, w * 0.9, 48, 1, true), materials.trim);
  barrel.rotation.x = Math.PI / 2;
  group.add(barrel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.18, rimR * 0.2, 0.04, 32), materials.rim);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = w / 2 - 0.02;
  group.add(hub);
  // Brake disc + caliper
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.82, rimR * 0.82, 0.03, 48), materials.disc);
  disc.rotation.x = Math.PI / 2;
  disc.position.z = w / 2 - 0.13;
  group.add(disc);
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(rimR * 0.5, rimR * 0.28, 0.07), materials.caliper);
  caliper.position.set(-rimR * 0.55, rimR * 0.35, w / 2 - 0.1);
  caliper.rotation.z = 0.6;
  group.add(caliper);
  return group;
}

// ── Vehicle ──────────────────────────────────────────────────────────────
export function buildVehicle(opts) {
  const preset = PRESETS[opts.preset];
  if (!preset) throw new Error("Unknown preset " + opts.preset);
  const W = opts.width ?? 2.0;
  const L = preset.L;
  const HW = W / 2;
  const top = curve(preset.top);
  const bottomBase = curve(preset.bottom);
  const width = curve(preset.width);
  const ghRoof = curve(preset.gh.roof);
  const ghWidth = curve(preset.gh.width);

  const paint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(opts.color || "#c6cbd3"),
    metalness: opts.metalness ?? 0.55,
    roughness: opts.roughness ?? 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.1,
  });
  const materials = {
    paint,
    glass: new THREE.MeshPhysicalMaterial({ color: "#07090c", metalness: 0.2, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4 }),
    trim: new THREE.MeshStandardMaterial({ color: "#0b0c0e", metalness: 0.3, roughness: 0.55 }),
    gloss: new THREE.MeshPhysicalMaterial({ color: "#050506", metalness: 0.5, roughness: 0.15, clearcoat: 1 }),
    tyre: new THREE.MeshStandardMaterial({ color: "#111214", metalness: 0, roughness: 0.88 }),
    rim: new THREE.MeshStandardMaterial({ color: opts.rimColor || "#9aa0a8", metalness: 1, roughness: 0.22 }),
    disc: new THREE.MeshStandardMaterial({ color: "#3a3d42", metalness: 1, roughness: 0.5 }),
    caliper: new THREE.MeshStandardMaterial({ color: opts.caliper || "#2b2f36", metalness: 0.4, roughness: 0.4 }),
    headlight: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: new THREE.Color("#eaf2ff"), emissiveIntensity: 4, toneMapped: false }),
    taillight: new THREE.MeshStandardMaterial({ color: "#300", emissive: new THREE.Color("#ff2236"), emissiveIntensity: 3, toneMapped: false }),
  };

  const group = new THREE.Group();
  const stations = 220;
  const ring = 128;
  const xr = preset.axles[0], xf = preset.axles[1];
  const archR = preset.R * 1.14;

  const bottomAt = (u) => {
    let b = bottomBase(u);
    for (const ax of [xr, xf]) {
      const dx = (u - ax) * L;
      if (Math.abs(dx) < archR) {
        const archY = preset.R + Math.sqrt(archR * archR - dx * dx) * 0.98;
        b = Math.max(b, archY);
      }
    }
    return b;
  };

  // Body
  const bodyEnd = 0.035;
  const sectionAt = (u) => {
    let w = width(u) * HW;
    let yT = top(u);
    let yB = bottomAt(u);
    // Round off the nose & tail in plan and elevation.
    const tEnd = Math.min(u, 1 - u) / bodyEnd;
    if (tEnd < 1) {
      const k = Math.sqrt(Math.max(0, 1 - Math.pow(1 - tEnd, 2)));
      w *= Math.max(0.0, k);
      const mid = (yT + yB) / 2;
      yT = mid + (yT - mid) * (0.35 + 0.65 * k);
      yB = mid + (yB - mid) * (0.35 + 0.65 * k);
    }
    return { w, yT, yB };
  };

  const body = loft({
    stations,
    ring,
    sample: (i, j) => {
      const u = i / stations;
      const { w, yT, yB } = sectionAt(u);
      const theta = (j / ring) * Math.PI * 2;
      const sp = superellipsePoint(theta, preset.n, preset.nb);
      const yc = (yT + yB) / 2, hh = (yT - yB) / 2;
      // Tumblehome: narrow the upper body slightly.
      const tumble = sp.y > 0 ? 1 - 0.07 * sp.y * sp.y : 1;
      return new THREE.Vector3((u - 0.5) * L, yc + sp.y * hh, sp.z * w * tumble);
    },
    classify: (i, j, c) => {
      const u = i / stations;
      const { yT, yB } = sectionAt(u);
      const rel = (c.y - yB) / Math.max(0.01, yT - yB);
      const side = Math.abs(c.z) / HW;
      if (rel < 0.1 && side > 0.3) return "trim"; // sills / lower cladding
      if (u > 0.982 && rel > 0.08 && rel < 0.3 && side < 0.62) return preset.intake ? "trim" : "gloss"; // front intake/grille
      if (u < 0.02 && rel < 0.35 && side < 0.85) return "trim"; // diffuser
      if (preset === PRESETS.offroader || preset === PRESETS.pickup) {
        if (rel < 0.28 && side > 0.85) return "trim";
      }
      return "paint";
    },
  });
  for (const [cls, geo] of Object.entries(body)) {
    const m = new THREE.Mesh(geo, materials[cls]);
    m.castShadow = true;
    group.add(m);
  }

  // Light signatures: thin emissive tubes that hug the nose and tail.
  const surfacePoint = (u, rel, zSign) => {
    const { w, yT, yB } = sectionAt(u);
    const yc = (yT + yB) / 2, hh = (yT - yB) / 2;
    const y = yB + rel * (yT - yB);
    const sy = Math.max(-0.999, Math.min(0.999, (y - yc) / hh));
    const e = sy >= 0 ? 2 / preset.n : 2 / preset.nb;
    const sinT = Math.sign(sy) * Math.pow(Math.abs(sy), 1 / e);
    const cosT = Math.sqrt(Math.max(0, 1 - sinT * sinT));
    const tumble = sy > 0 ? 1 - 0.07 * sy * sy : 1;
    return new THREE.Vector3((u - 0.5) * L, y, zSign * Math.pow(cosT, e) * w * tumble);
  };
  const strip = (end, rel, spanFrom, spanTo, material, radius) => {
    // Walk along the body edge near the nose/tail at constant relative height.
    const pts = [];
    const steps = 40;
    for (let k = 0; k <= steps; k++) {
      const s = -1 + (2 * k) / steps;
      const target = Math.abs(s);
      if (target < spanFrom || target > spanTo) continue;
      let found = null;
      for (let t = 0; t <= 0.2; t += 0.0015) {
        const u = end === "front" ? 1 - t : t;
        const p = surfacePoint(u, rel, Math.sign(s) || 1);
        if (Math.abs(p.z) >= target * HW * 0.9) { found = p; break; }
      }
      if (found) {
        found.x += end === "front" ? 0.004 : -0.004;
        pts.push(found);
      }
    }
    if (pts.length < 2) return;
    // Split into contiguous runs (left/right) when there is a gap in the middle.
    const runs = [[pts[0]]];
    for (let k = 1; k < pts.length; k++) {
      if (pts[k].distanceTo(pts[k - 1]) > 0.2) runs.push([]);
      runs[runs.length - 1].push(pts[k]);
    }
    for (const run of runs) {
      if (run.length < 2) continue;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(run), run.length * 4, radius, 8, false), material);
      group.add(tube);
    }
  };
  if (preset.roundLights) {
    for (const side of [-1, 1]) {
      const p = surfacePoint(0.985, (preset.lights.front[0] + preset.lights.front[1]) / 2, side);
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.075, 32), materials.headlight);
      lamp.position.set(p.x + 0.02, p.y, p.z * 0.7);
      lamp.rotation.y = Math.PI / 2 + side * 0.35;
      group.add(lamp);
      const tp = surfacePoint(0.012, preset.lights.rear[0], side);
      const tl = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), materials.taillight);
      tl.position.set(tp.x - 0.02, tp.y, tp.z * 0.72);
      tl.rotation.y = -Math.PI / 2 - side * 0.35;
      group.add(tl);
    }
  } else {
    const fl = preset.lights.front, rl = preset.lights.rear;
    const fullWidth = opts.lightBar ?? (preset === PRESETS.supercar || preset === PRESETS.sportscoupe);
    strip("front", fl[0] + 0.02, fullWidth ? 0.0 : 0.45, 0.93, materials.headlight, 0.011);
    strip("rear", Math.min(0.97, rl[0]), opts.rearBar === false ? 0.5 : 0.0, 0.95, materials.taillight, 0.01);
  }

  // Greenhouse (glass with body-coloured roof band)
  const gh = preset.gh;
  const ghStations = 120;
  const ghn = gh.n;
  const ghSection = (u) => {
    const span = gh.to - gh.from;
    const t = (u - gh.from) / span;
    const endT = Math.min(t, 1 - t) / 0.03;
    let w = ghWidth(u) * HW;
    let yT = ghRoof(u);
    const yB = top(u) - 0.08;
    if (endT < 1) {
      const k = Math.sqrt(Math.max(0, 1 - Math.pow(1 - endT, 2)));
      w *= 0.4 + 0.6 * k;
    }
    yT = Math.max(yT, yB + 0.02);
    return { w, yT, yB };
  };
  const ghGeo = loft({
    stations: ghStations,
    ring: 96,
    sample: (i, j) => {
      const u = gh.from + (gh.to - gh.from) * (i / ghStations);
      const { w, yT, yB } = ghSection(u);
      const theta = (j / 96) * Math.PI * 2;
      const sp = superellipsePoint(theta, ghn, 6);
      const yc = yB, hh = yT - yB;
      const y = sp.y >= 0 ? yc + sp.y * hh : yc + sp.y * 0.05;
      // glass tumblehome
      const z = sp.z * w * (1 - 0.18 * Math.max(0, sp.y) * Math.max(0, sp.y));
      return new THREE.Vector3((u - 0.5) * L, y, z);
    },
    classify: (i, j) => {
      const u = gh.from + (gh.to - gh.from) * (i / ghStations);
      const theta = (j / 96) * Math.PI * 2;
      const sp = superellipsePoint(theta, ghn, 6);
      if (u > gh.roofBand[0] && u < gh.roofBand[1] && sp.y > 0.86) return opts.blackRoof ? "gloss" : "paint";
      // B-pillar for longer glasshouses
      const mid = (gh.roofBand[0] + gh.roofBand[1]) / 2;
      if (preset !== PRESETS.supercar && Math.abs(u - mid) < 0.012 && sp.y > 0.2) return "gloss";
      return "glass";
    },
  });
  for (const [cls, geo] of Object.entries(ghGeo)) {
    const m = new THREE.Mesh(geo, materials[cls]);
    m.castShadow = true;
    group.add(m);
  }

  // Under-structure to hide see-through gaps
  let minTop = Infinity;
  for (let u = 0.08; u <= 0.92; u += 0.01) minTop = Math.min(minTop, top(u), bottomAt(u) + 0.25);
  const chH = Math.max(0.12, minTop - 0.08 - (preset.gc + 0.04));
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(L * 0.8, chH, W * 0.6), materials.trim);
  chassis.position.set(0, preset.gc + 0.04 + chH / 2, 0);
  group.add(chassis);
  for (const ax of [xr, xf]) {
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(archR * 0.99, archR * 0.99, W * 0.86, 40, 1, true, 0, Math.PI), materials.trim);
    liner.material = materials.trim.clone();
    liner.material.side = THREE.BackSide;
    liner.rotation.x = Math.PI / 2;
    liner.rotation.y = 0;
    liner.position.set((ax - 0.5) * L, preset.R, 0);
    group.add(liner);
  }

  // Wheels
  const trackInset = 0.005;
  for (const ax of [xr, xf]) {
    for (const side of [-1, 1]) {
      const wheel = buildWheel(preset, materials, opts.spokes ?? preset.rimSpokes);
      wheel.position.set((ax - 0.5) * L, preset.R, side * (HW - preset.tireW / 2 - trackInset));
      if (side < 0) wheel.rotation.y = Math.PI;
      wheel.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      group.add(wheel);
    }
  }

  // Mirrors (not on classic)
  if (!preset.roundLights) {
    for (const side of [-1, 1]) {
      const u = gh.to - 0.04;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), materials.paint);
      m.scale.set(1.5, 0.65, 0.8);
      m.position.set((u - 0.5) * L, top(u) + 0.1, side * (width(u) * HW * 0.86 + 0.02));
      group.add(m);
    }
  }

  group.userData = { length: L, width: W, height: Math.max(...preset.gh.roof.map((k) => k[1])) };
  return group;
}
