"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { PaintOption } from "@/lib/types";

export const CONCEPT_CAR_URL = "/models/concept-car.glb";

export const DEFAULT_PAINT: PaintOption = { id: "liquid-silver", name: "Liquid Silver", color: "#c9ced6", metalness: 1, roughness: 0.18, clearcoat: 1 };

export interface CarMaterials {
  paint: THREE.MeshPhysicalMaterial;
  accent: THREE.MeshPhysicalMaterial;
  headlight: THREE.MeshStandardMaterial;
  taillight: THREE.MeshStandardMaterial;
}

/**
 * The licensed concept-car GLB ("Car Concept", CC BY 4.0) with MOTION X studio
 * materials applied. Paint is a physically-based car-paint approximation:
 * a metallic base with a glossy clear coat.
 */
export function ConceptCar({
  url = CONCEPT_CAR_URL,
  paint = DEFAULT_PAINT,
  onMaterials,
  ...props
}: { url?: string; paint?: PaintOption; onMaterials?: (m: CarMaterials) => void } & React.ComponentProps<"group">) {
  const { scene } = useGLTF(url, false, true);

  const { root, materials } = useMemo(() => {
    const root = scene.clone(true);
    const materials: CarMaterials = {
      paint: new THREE.MeshPhysicalMaterial({ name: "mx-paint", color: DEFAULT_PAINT.color, metalness: 0.62, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.15 }),
      accent: new THREE.MeshPhysicalMaterial({ name: "mx-accent", color: "#0b0d11", metalness: 0.8, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.05 }),
      headlight: new THREE.MeshStandardMaterial({ name: "mx-headlight", color: "#000000", emissive: new THREE.Color("#e4edff"), emissiveIntensity: 5, toneMapped: false }),
      taillight: new THREE.MeshStandardMaterial({ name: "mx-taillight", color: "#000000", emissive: new THREE.Color("#ff1f35"), emissiveIntensity: 3, toneMapped: false }),
    };
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const name = mat?.name ?? "";
      if (name.startsWith("Paint 1")) mesh.material = materials.paint;
      else if (name.startsWith("Paint 2")) mesh.material = materials.accent;
      else if (name === "Headlight") mesh.material = materials.headlight;
      else if (name === "Brakelight") mesh.material = materials.taillight;
      else if (name === "Brake") {
        const m = mat.clone();
        m.color.set("#5c8dff");
        m.emissive?.set("#000000");
        mesh.material = m;
      } else if (name.startsWith("Interior 3")) {
        const m = mat.clone();
        m.color.set("#1a1d22");
        mesh.material = m;
      } else if (name === "Glass") {
        const m = (mat as THREE.MeshPhysicalMaterial).clone();
        m.envMapIntensity = 1.4;
        mesh.material = m;
      }
    });
    // Normalise: centred on the origin, wheels on the floor, ~4.6 m long along X.
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const scale = 4.6 / Math.max(size.x, size.z);
    root.scale.setScalar(scale);
    if (size.z > size.x) root.rotation.y = Math.PI / 2;
    const box2 = new THREE.Box3().setFromObject(root);
    const c = box2.getCenter(new THREE.Vector3());
    root.position.set(-c.x, -box2.min.y, -c.z);
    return { root, materials };
  }, [scene]);

  /* eslint-disable react-hooks/immutability -- three.js materials are mutable GPU resources owned by this component */
  useEffect(() => {
    materials.paint.color.set(paint.color);
    materials.paint.metalness = Math.min(paint.metalness, 0.75);
    materials.paint.roughness = Math.max(paint.roughness, 0.22);
    materials.paint.clearcoat = paint.clearcoat ?? 1;
    materials.paint.needsUpdate = true;
  }, [paint, materials]);
  /* eslint-enable react-hooks/immutability */

  useEffect(() => {
    onMaterials?.(materials);
  }, [materials, onMaterials]);

  useEffect(() => () => {
    for (const m of Object.values(materials)) m.dispose();
  }, [materials]);

  return (
    <group {...props}>
      <primitive object={root} />
    </group>
  );
}
