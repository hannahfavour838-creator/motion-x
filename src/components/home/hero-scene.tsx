"use client";

import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { Suspense, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { ConceptCar, type CarMaterials } from "@/components/three/concept-car";
import { SceneErrorBoundary } from "@/components/three/error-boundary";
import { StudioEnvironment, StudioFloor } from "@/components/three/studio";

export interface HeroSceneProps {
  tier: 0 | 1 | 2;
  reducedMotion: boolean;
  compact: boolean; // narrow / portrait viewport
  active: boolean; // hero is on screen
  skipSignal: number; // increments when the visitor skips the intro
  scrollRef: RefObject<number>; // 0 → 1 as the hero scrolls away
  onProgress: (p: number) => void;
  onReady: () => void;
  onIntroDone: () => void;
  onError: () => void;
}

const CAR_CENTER = new THREE.Vector3(0, 0.55, 0);

function framing(compact: boolean) {
  return compact
    ? { end: new THREE.Vector3(7.9, 1.45, 9.1), start: new THREE.Vector3(1.5, 0.7, 18), lateral: 0, lift: 0.35, fov: 38 }
    : { end: new THREE.Vector3(7.9, 1.3, 9.1), start: new THREE.Vector3(1.2, 0.5, 15.5), lateral: 1.7, lift: 0.12, fov: 25 };
}

function CameraRig({ compact, reducedMotion, intro, scrollRef, pointer }: {
  compact: boolean; reducedMotion: boolean; intro: RefObject<{ v: number }>; scrollRef: RefObject<number>; pointer: RefObject<THREE.Vector2>;
}) {
  const f = framing(compact);
  const invalidate = useThree((st) => st.invalidate);
  const width = useThree((st) => st.size.width);
  const height = useThree((st) => st.size.height);
  // With reduced motion the canvas renders on demand: request enough frames for
  // the camera, reflections and shadows to settle whenever the layout changes.
  useEffect(() => {
    let n = 0;
    let raf = 0;
    const tick = () => {
      invalidate();
      if (++n < 45) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [invalidate, compact, width, height]);
  const sph = new THREE.Spherical().setFromVector3(f.end.clone().sub(CAR_CENTER));
  const tmp = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  // three.js objects are mutated through the frame-loop state (the R3F idiom).
  useFrame(({ clock, camera, scene, size }, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.fov !== f.fov) {
      cam.fov = f.fov;
      cam.updateProjectionMatrix();
    }
    const t = clock.elapsedTime;
    const p = intro.current?.v ?? 1;
    const s = reducedMotion ? 0 : Math.min(1, Math.max(0, scrollRef.current ?? 0));
    const idle = reducedMotion ? 0 : Math.sin(t * 0.13) * 0.05 * p;
    const px = reducedMotion ? 0 : (pointer.current?.x ?? 0) * 0.035;
    const py = reducedMotion ? 0 : (pointer.current?.y ?? 0) * 0.02;

    // Keep the whole car in frame on narrow/portrait screens.
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * (size.width / Math.max(1, size.height)));
    const fitRadius = 2.9 / Math.tan(hfov / 2);
    const s2 = sph.clone();
    s2.radius = Math.max(s2.radius, fitRadius);
    // Fog follows the camera distance so the car never greys out on small screens.
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = s2.radius + 1.5;
      scene.fog.far = s2.radius + 15;
    }
    s2.theta += idle + px + s * 0.6;
    s2.phi = Math.max(0.35, s2.phi - s * 0.32 - py);
    s2.radius *= 1 - s * 0.1;
    const orbitPos = tmp.current.setFromSpherical(s2).add(CAR_CENTER);

    // Entrance: travel from a low, distant start into the orbit position.
    const pos = f.start.clone().lerp(orbitPos, p);
    camera.position.lerp(pos, reducedMotion ? 1 : Math.min(1, delta * 6));

    // Shift the look-at point to screen-left so the car sits right of the headline.
    const forward = CAR_CENTER.clone().sub(camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const look = CAR_CENTER.clone().addScaledVector(right, -f.lateral * (1 - s * 0.6)).add(new THREE.Vector3(0, f.lift, 0));
    target.current.lerp(look, reducedMotion ? 1 : Math.min(1, delta * 6));
    camera.lookAt(target.current);
  });
  return null;
}

function ProgressReporter({ onProgress }: { onProgress: (p: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => onProgress(progress), [progress, onProgress]);
  return null;
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    // Rendered only after Suspense resolved → model & environment are ready.
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}

export default function HeroScene(props: HeroSceneProps) {
  const { tier, reducedMotion, compact, active, skipSignal, scrollRef, onProgress, onReady, onIntroDone, onError } = props;
  const intro = useRef({ v: reducedMotion ? 1 : 0 });
  const pointer = useRef(new THREE.Vector2());
  const materials = useRef<CarMaterials | null>(null);
  const [dpr, setDpr] = useState<number>(tier === 2 ? 1.6 : 1.15);
  const [ready, setReady] = useState(false);
  const tween = useRef<gsap.core.Tween | null>(null);
  const highQuality = tier === 2 && !compact;

  const handleMaterials = useCallback((m: CarMaterials) => {
    materials.current = m;
    m.headlight.emissiveIntensity = reducedMotion ? 5 : 0;
    m.taillight.emissiveIntensity = reducedMotion ? 3 : 0;
  }, [reducedMotion]);

  const handleReady = useCallback(() => {
    setReady(true);
    onReady();
    if (reducedMotion) {
      onIntroDone();
      return;
    }
    tween.current = gsap.to(intro.current, {
      v: 1,
      duration: 3.2,
      ease: "power3.inOut",
      onUpdate: () => {
        const m = materials.current;
        if (!m) return;
        const lights = gsap.utils.clamp(0, 1, (intro.current.v - 0.55) / 0.3);
        m.headlight.emissiveIntensity = lights * 5;
        m.taillight.emissiveIntensity = lights * 3;
      },
      onComplete: onIntroDone,
    });
  }, [onReady, onIntroDone, reducedMotion]);

  useEffect(() => {
    if (skipSignal > 0 && tween.current) tween.current.progress(1);
  }, [skipSignal]);

  useEffect(() => () => {
    tween.current?.kill();
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  return (
    <Canvas
      dpr={dpr}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      camera={{ position: [1.2, 0.5, 13.5], fov: 26, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onError();
        });
      }}
      aria-hidden="true"
    >
      <color attach="background" args={["#050607"]} />
      <fog attach="fog" args={["#050607", 11, 24]} />
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.9, d - 0.3))} />
      <ProgressReporter onProgress={onProgress} />
      <SceneErrorBoundary onError={onError}>
        <Suspense fallback={null}>
          <StudioEnvironment sweep={highQuality && !reducedMotion} />
          <ConceptCar onMaterials={handleMaterials} />
          <StudioFloor quality={highQuality ? "high" : "low"} />
          <spotLight position={[1.5, 9, 2.5]} angle={0.42} penumbra={1} intensity={70} decay={1.6} color="#ffffff" />
          <hemisphereLight args={["#9fb0c8", "#050505", 0.08]} />
          <Ready onReady={handleReady} />
        </Suspense>
      </SceneErrorBoundary>
      {ready && <CameraRig compact={compact} reducedMotion={reducedMotion} intro={intro} scrollRef={scrollRef} pointer={pointer} />}
    </Canvas>
  );
}
