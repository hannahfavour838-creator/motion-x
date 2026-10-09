"use client";

import { OrbitControls, useProgress } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { forwardRef, Suspense, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { PaintOption } from "@/lib/types";
import { ConceptCar } from "./concept-car";
import { SceneErrorBoundary } from "./error-boundary";
import { StudioEnvironment, StudioFloor } from "./studio";

import { VIEWS, type ShowroomHandle, type ViewName } from "./showroom-views";
export { VIEWS, type ShowroomHandle, type ViewName };

const TARGET = new THREE.Vector3(0, 0.6, 0);


const Rig = forwardRef<ShowroomHandle, { reducedMotion: boolean; autoRotate: boolean; onInteract: () => void }>(function Rig({ reducedMotion, autoRotate, onInteract }, ref) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const animateTo = (pos: THREE.Vector3) => {
    const c = controls.current;
    if (!c) return;
    if (reducedMotion) {
      camera.position.copy(pos);
      c.target.copy(TARGET);
      c.update();
      return;
    }
    gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: 1.2, ease: "power3.inOut", onUpdate: () => c.update() });
    gsap.to(c.target, { x: TARGET.x, y: TARGET.y, z: TARGET.z, duration: 1.2, ease: "power3.inOut" });
  };

  useImperativeHandle(ref, () => ({
    setView: (v) => animateTo(new THREE.Vector3(...VIEWS[v].position)),
    reset: () => animateTo(new THREE.Vector3(...VIEWS.front34.position)),
    zoom: (factor) => {
      const c = controls.current;
      if (!c) return;
      const dir = camera.position.clone().sub(c.target);
      const len = THREE.MathUtils.clamp(dir.length() * factor, c.minDistance, c.maxDistance);
      animateTo(c.target.clone().add(dir.setLength(len)));
    },
    orbit: (dA, dP) => {
      const c = controls.current;
      if (!c) return;
      const offset = camera.position.clone().sub(c.target);
      const s = new THREE.Spherical().setFromVector3(offset);
      s.theta += dA;
      s.phi = THREE.MathUtils.clamp(s.phi + dP, 0.15, Math.PI / 2 - 0.04);
      camera.position.copy(c.target.clone().add(new THREE.Vector3().setFromSpherical(s)));
      c.update();
    },
  }));

  return (
    <OrbitControls
      ref={controls}
      target={TARGET}
      enableDamping
      dampingFactor={0.08}
      minDistance={4.2}
      maxDistance={16}
      maxPolarAngle={Math.PI / 2 - 0.04}
      enablePan={false}
      autoRotate={autoRotate && !reducedMotion}
      autoRotateSpeed={0.6}
      onStart={onInteract}
    />
  );
});

function Progress({ onProgress }: { onProgress: (p: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => onProgress(progress), [progress, onProgress]);
  return null;
}

function Loaded({ onLoaded }: { onLoaded: () => void }) {
  useEffect(() => {
    onLoaded();
  }, [onLoaded]);
  return null;
}

export interface ShowroomCanvasProps {
  url: string;
  paint: PaintOption | null;
  quality: "high" | "low";
  reducedMotion: boolean;
  autoRotate: boolean;
  onProgress: (p: number) => void;
  onLoaded: () => void;
  onError: () => void;
  onInteract: () => void;
  handleRef: React.RefObject<ShowroomHandle | null>;
}

export default function ShowroomCanvas(props: ShowroomCanvasProps) {
  const { url, paint, quality, reducedMotion, autoRotate, onProgress, onLoaded, onError, onInteract, handleRef } = props;
  const [dpr] = useState(quality === "high" ? 1.75 : 1.2);
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: VIEWS.front34.position, fov: 32, near: 0.1, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onError(); })}
    >
      <color attach="background" args={["#050607"]} />
      <fog attach="fog" args={["#050607", 14, 32]} />
      <Progress onProgress={onProgress} />
      <SceneErrorBoundary onError={onError}>
        <Suspense fallback={null}>
          <StudioEnvironment frames={1} />
          <ConceptCar url={url} paint={paint ?? undefined} />
          <StudioFloor quality={quality} />
          <spotLight position={[1.5, 9, 2.5]} angle={0.45} penumbra={1} intensity={60} decay={1.6} />
          <Loaded onLoaded={onLoaded} />
        </Suspense>
      </SceneErrorBoundary>
      <Rig ref={handleRef} reducedMotion={reducedMotion} autoRotate={autoRotate} onInteract={onInteract} />
    </Canvas>
  );
}
