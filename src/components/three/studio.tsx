"use client";

import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Studio lighting built entirely from Lightformers (no external HDRIs):
 * a large overhead softbox, two crisp strip lights, tall side panels for body
 * gradients, a horizon bounce ring and a restrained electric-blue kicker.
 * `sweep` animates a narrow light travelling along the bodywork.
 */
export function StudioEnvironment({ sweep = false, frames = 1, blue = 1.1 }: { sweep?: boolean; frames?: number; blue?: number }) {
  const sweepRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!sweep || !sweepRef.current) return;
    const t = (clock.elapsedTime % 9) / 9;
    sweepRef.current.position.x = -12 + t * 24;
  });
  return (
    <Environment resolution={256} frames={sweep ? Infinity : frames} background={false}>
      <color attach="background" args={["#030304"]} />
      <Lightformer form="rect" intensity={2.2} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[10, 4.5, 1]} />
      <Lightformer form="rect" intensity={6} position={[0, 6.5, -3.4]} rotation-x={Math.PI / 2} scale={[16, 0.35, 1]} />
      <Lightformer form="rect" intensity={6} position={[0, 6.5, 3.4]} rotation-x={Math.PI / 2} scale={[16, 0.35, 1]} />
      <Lightformer form="rect" intensity={0.9} color="#e9eef8" position={[0, 3, -8]} scale={[18, 3.2, 1]} />
      <Lightformer form="rect" intensity={0.9} color="#e9eef8" position={[0, 3, 8]} rotation-y={Math.PI} scale={[18, 3.2, 1]} />
      <Lightformer form="rect" intensity={0.55} position={[11, 2.2, 0]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
      <Lightformer form="rect" intensity={blue} color="#5c8dff" position={[-11, 2, 0]} rotation-y={Math.PI / 2} scale={[4, 5, 1]} />
      <Lightformer form="ring" intensity={0.5} color="#b8c2d4" position={[0, 0.3, 0]} rotation-x={Math.PI / 2} scale={14} />
      {sweep && (
        <Lightformer ref={sweepRef} form="rect" intensity={7} position={[-12, 4.5, 2]} rotation-y={Math.PI / 2} rotation-x={-0.6} scale={[0.6, 9, 1]} />
      )}
    </Environment>
  );
}

export function StudioFloor({ quality }: { quality: "high" | "low" }) {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow>
        <circleGeometry args={[39.5, 96]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            blur={[420, 120]}
            resolution={1024}
            mixBlur={1}
            mixStrength={22}
            roughness={0.92}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#040506"
            metalness={0.55}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial color="#040506" roughness={0.6} metalness={0.2} />
        )}
      </mesh>
      <FloorPool />
      <GroundShadow />
      {/* The car is static (only the camera moves), so the contact shadow is baked once. */}
      <ContactShadows position={[0, 0.009, 0]} scale={[9, 9]} far={1.4} blur={1.6} opacity={0.92} resolution={quality === "high" ? 1024 : 512} frames={1} color="#000000" />
      <FloorVignette />
    </>
  );
}

/** Fades the floor into the background so no horizon edge is visible. */
function FloorVignette({ color = "#050607", inner = 0.16, outer = 0.5 }: { color?: string; inner?: number; outer?: number }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    // alphaMap samples the green channel: black = transparent, white = opaque.
    grad.addColorStop(0, "#000");
    grad.addColorStop(inner, "#000");
    grad.addColorStop(outer, "#fff");
    grad.addColorStop(1, "#fff");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, [inner, outer]);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.012} renderOrder={2}>
      <circleGeometry args={[40, 96]} />
      <meshBasicMaterial color={color} alphaMap={texture} transparent depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  );
}

/** A faint pool of light on the floor so the car's shadows read against it. */
function FloorPool() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "#fff");
    grad.addColorStop(0.35, "#8a8a8a");
    grad.addColorStop(1, "#000");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.003} renderOrder={-1}>
      <planeGeometry args={[15, 10]} />
      <meshBasicMaterial color="#1c2026" alphaMap={texture} transparent opacity={0.85} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Soft, edge-free grounding shadow beneath the car (cheaper than a shadow pass). */
function GroundShadow() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "#fff");
    grad.addColorStop(0.45, "#bbb");
    grad.addColorStop(1, "#000");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.006} renderOrder={1}>
      <planeGeometry args={[6.4, 3.1]} />
      <meshBasicMaterial color="#000000" alphaMap={texture} transparent opacity={0.75} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
