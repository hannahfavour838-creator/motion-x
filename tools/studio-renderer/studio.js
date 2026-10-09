// MOTION X studio renderer — renders illustrative vehicle images and the
// hero fallback still. Driven by URL parameters; used by render.mjs.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { buildVehicle } from "./generator.js";

const params = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get("p") || "{}"));
const W = params.w || 1600, H = params.h || 1000;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = params.exposure ?? 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(params.bg || "#060708");
scene.fog = new THREE.Fog(params.bg || "#060708", 14, 34);

// ── Studio environment: dark room with softboxes for crisp reflections ───
function studioEnvironment() {
  const env = new THREE.Scene();
  env.background = new THREE.Color("#030304");
  const box = (w, h, x, y, z, intensity, color = "#ffffff", rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m);
  };
  // Large overhead softbox + crisp strip lights
  box(10, 4.5, 0, 7, 0, 2.2, "#ffffff", Math.PI / 2);
  box(16, 0.35, 0, 6.5, -3.4, 6, "#ffffff", Math.PI / 2);
  box(16, 0.35, 0, 6.5, 3.4, 6, "#ffffff", Math.PI / 2);
  // Tall side panels so the body sides catch a gradient
  box(18, 3.2, 0, 3.0, -8, 0.9, "#e9eef8");
  box(18, 3.2, 0, 3.0, 8, 0.9, "#e9eef8");
  box(18, 1.0, 0, 0.9, -8, 0.25, "#c8d2e6");
  box(18, 1.0, 0, 0.9, 8, 0.25, "#c8d2e6");
  // Front & rear fills
  box(8, 4, 11, 2.2, 0, 0.55, "#ffffff", 0, -Math.PI / 2);
  box(4, 5, -11, 2.0, 0, params.blueKick ?? 1.2, "#5c8dff", 0, Math.PI / 2);
  // Horizon glow ring (floor bounce)
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.7, 64, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color("#b8c2d4").multiplyScalar(0.55), side: THREE.BackSide }));
  ring.position.y = 0.3; env.add(ring);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.02);
  return rt.texture;
}
scene.environment = studioEnvironment();
scene.environmentIntensity = params.envIntensity ?? 1.0;

// Key light for shadows
const key = new THREE.SpotLight("#ffffff", params.key ?? 70, 0, 0.42, 1, 1.6);
key.position.set(1.5, 9, 2.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.radius = 8;
key.shadow.bias = -0.0004;
scene.add(key);
scene.add(new THREE.HemisphereLight("#9fb0c8", "#050505", 0.08));

// Floor: dark glossy plane with a faded mirror reflection
const floorMat = new THREE.MeshStandardMaterial({ color: "#020203", roughness: 0.6, metalness: 0.0, transparent: true, opacity: params.floorOpacity ?? 0.9, envMapIntensity: 0.15 });
const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 96), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const shadowCatcher = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.ShadowMaterial({ opacity: 0.65 }));
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.y = 0.001;
shadowCatcher.receiveShadow = true;
scene.add(shadowCatcher);

// Soft floor pool of light
const pool = new THREE.Mesh(
  new THREE.CircleGeometry(7, 64),
  new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false,
    map: (() => {
      const c = document.createElement("canvas"); c.width = c.height = 256;
      const g = c.getContext("2d");
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, "rgba(160,175,200,0.16)"); gr.addColorStop(0.6, "rgba(90,110,150,0.05)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })(),
  }),
);
pool.rotation.x = -Math.PI / 2; pool.position.y = 0.002; pool.scale.set(1.5, 1, 1);
scene.add(pool);

async function loadSubject() {
  if (params.glb) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(params.glb);
    const root = gltf.scene;
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      const name = o.material?.name || "";
      if (name.startsWith("Paint 1")) {
        o.material = new THREE.MeshPhysicalMaterial({
          color: params.color || "#c9ced6", metalness: params.metalness ?? 0.6, roughness: params.roughness ?? 0.32,
          clearcoat: 1, clearcoatRoughness: 0.03,
        });
      } else if (name.startsWith("Paint 2")) {
        o.material = new THREE.MeshPhysicalMaterial({ color: "#0c0e12", metalness: 0.8, roughness: 0.25, clearcoat: 1 });
      } else if (name === "Brake") {
        o.material = o.material.clone(); o.material.color.set("#5c8dff");
      } else if (name === "Interior 3 Carmine") {
        o.material = o.material.clone(); o.material.color.set("#1a1d22");
      }
    });
    // Normalise: centre on floor, length ≈ 4.6 m along x
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const long = Math.max(size.x, size.z);
    const s = 4.6 / long;
    root.scale.setScalar(s);
    if (size.z > size.x) root.rotation.y = Math.PI / 2;
    const box2 = new THREE.Box3().setFromObject(root);
    const c = box2.getCenter(new THREE.Vector3());
    root.position.x -= c.x; root.position.z -= c.z; root.position.y -= box2.min.y;
    if (params.glbYaw) root.rotation.y += params.glbYaw;
    return root;
  }
  return buildVehicle(params.vehicle || { preset: "supercar" });
}

const subject = await loadSubject();
scene.add(subject);
// Mirror reflection beneath the translucent floor
const mirror = params.glb ? new THREE.Group() : subject.clone(true);
mirror.scale.y *= -1;
mirror.traverse((o) => {
  if (!o.isMesh) return;
  o.castShadow = false;
  if (/Underside|Engine|Axles|InteriorFloor/.test(o.name)) o.visible = false;
});
scene.add(mirror);

const cam = new THREE.PerspectiveCamera(params.fov ?? 21, W / H, 0.1, 100);
const view = params.view || "front34";
const views = {
  front34: [6.6, 1.15, 7.4, 0, 0.6, 0],
  rear34: [-5.8, 1.5, 6.2, 0, 0.6, 0],
  side: [0.2, 0.95, 9.4, 0, 0.62, 0],
  low: [6.4, 0.55, 5.2, 0, 0.55, 0],
  hero: [6.6, 1.1, 7.6, -0.2, 0.55, 0],
  top: [5.5, 4.5, 6.5, 0, 0.3, 0],
};
const v = params.camera || views[view];
cam.position.set(v[0], v[1], v[2]);
cam.lookAt(v[3], v[4], v[5]);
if (params.shiftX) cam.setViewOffset(W, H, params.shiftX, 0, W, H);

renderer.render(scene, cam);
// Render twice so shadow maps & PMREM settle.
requestAnimationFrame(() => {
  renderer.render(scene, cam);
  window.__done = true;
});
