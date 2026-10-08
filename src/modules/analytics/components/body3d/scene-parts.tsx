"use client";

import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Box3, Color, MeshStandardMaterial, Vector3, type Mesh, type Object3D } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/db/schema/enums";
import { BODY_PARTS, expandParts } from "../../domain/body-parts";
import { muscleFromNameChain } from "../../domain/glb";
import { heatColor, type HeatCell } from "../../domain/heat";
import { BODY_HEIGHT, MODEL_URL } from "./config";

export interface Materials {
  byMuscle: Record<MuscleGroup, MeshStandardMaterial>;
  neutral: MeshStandardMaterial;
}

/** One material per muscle group, shared by every mesh of that muscle, so colouring a muscle is a single change. */
export function useMaterials(baseColor: string, neutralColor: string): Materials {
  const materials = useMemo<Materials>(() => {
    const create = (color: string) =>
      new MeshStandardMaterial({ color: new Color(color), roughness: 0.6, metalness: 0.05, emissive: new Color("#ffffff"), emissiveIntensity: 0 });
    const byMuscle = Object.fromEntries(MUSCLE_GROUPS.map((muscle) => [muscle, create(baseColor)])) as Record<MuscleGroup, MeshStandardMaterial>;
    return { byMuscle, neutral: new MeshStandardMaterial({ color: new Color(neutralColor), roughness: 0.8, metalness: 0 }) };
  }, [baseColor, neutralColor]);

  useEffect(
    () => () => {
      Object.values(materials.byMuscle).forEach((material) => material.dispose());
      materials.neutral.dispose();
    },
    [materials],
  );
  return materials;
}

/**
 * Moves one muscle's material a step towards its heat colour and glow. Returns true while it is still moving.
 * A plain function (not inline in the render callback) because it changes the material in place, which is what
 * the scene needs and what the React lint rule only allows outside the component.
 */
function stepMaterial(material: MeshStandardMaterial, target: Color, glow: number, ease: number): boolean {
  let moving = false;
  const distance = Math.abs(material.color.r - target.r) + Math.abs(material.color.g - target.g) + Math.abs(material.color.b - target.b);
  if (distance > 0.004) {
    material.color.lerp(target, ease);
    moving = true;
  } else {
    material.color.copy(target);
  }
  if (Math.abs(material.emissiveIntensity - glow) > 0.01) {
    material.emissiveIntensity += (glow - material.emissiveIntensity) * ease;
    moving = true;
  } else {
    material.emissiveIntensity = glow;
  }
  return moving;
}

/**
 * Eases each muscle from the neutral tone to its heat colour (the muscles "warm up" when the view opens) and
 * lights the selected one. The scene only redraws while something is still moving.
 */
export function HeatDriver({ cells, selected, materials, baseColor }: { cells: readonly HeatCell[]; selected: MuscleGroup | null; materials: Materials; baseColor: string }) {
  const invalidate = useThree((state) => state.invalidate);
  const targets = useMemo(() => new Map(cells.map((cell) => [cell.muscle, new Color(heatColor(cell.level) ?? baseColor)])), [cells, baseColor]);

  useEffect(() => {
    invalidate();
  }, [targets, selected, materials, invalidate]);

  useFrame((_, delta) => {
    let moving = false;
    const ease = 1 - Math.pow(0.0008, delta);
    for (const muscle of MUSCLE_GROUPS) {
      const material = materials.byMuscle[muscle];
      const target = targets.get(muscle);
      if (!target) continue;
      if (stepMaterial(material, target, selected === muscle ? 0.45 : 0, ease)) moving = true;
    }
    if (moving) invalidate();
  });
  return null;
}

export interface Rig {
  side: "front" | "back";
  /** Changes on every press, so choosing the same side again re-centres the camera. */
  n: number;
}

/** Orbit controls: one finger rotates, two fingers zoom, no panning. Also puts the camera in front of or behind the body. */
export function Controls({ rig }: { rig: Rig }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 4.5;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.7;
    const onChange = () => invalidate();
    controls.addEventListener("change", onChange);
    controlsRef.current = controls;
    return () => {
      controls.removeEventListener("change", onChange);
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl, invalidate]);

  useEffect(() => {
    camera.position.set(0, 0.05, rig.side === "front" ? 3 : -3);
    camera.lookAt(0, 0, 0);
    controlsRef.current?.update();
    invalidate();
  }, [rig, camera, invalidate]);

  return null;
}

type SelectHandler = (muscle: MuscleGroup | null) => void;

/** A tap (not the end of a drag) on a muscle selects it. */
const isTap = (event: ThreeEvent<MouseEvent>): boolean => event.delta < 6;

/** The stylised body: ellipsoids for each muscle, front and back. Works with no model file. */
export function ProceduralBody({ materials, onSelect }: { materials: Materials; onSelect: SelectHandler }) {
  const parts = useMemo(() => expandParts(BODY_PARTS), []);
  return (
    <group>
      {parts.map((part, index) => {
        const muscle = part.muscle;
        return (
          <mesh
            key={index}
            position={[...part.position]}
            rotation={part.rotation ? [...part.rotation] : [0, 0, 0]}
            scale={[...part.radii]}
            material={muscle ? materials.byMuscle[muscle] : materials.neutral}
            onClick={
              muscle
                ? (event) => {
                    if (!isTap(event)) return;
                    event.stopPropagation();
                    onSelect(muscle);
                  }
                : undefined
            }
          >
            <sphereGeometry args={[1, 28, 18]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** A real anatomy model from public/models/anatomy.glb: meshes are matched to our muscle groups by name. */
export function GlbBody({ materials, onSelect }: { materials: Materials; onSelect: SelectHandler }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);

  // A copy of the model, scaled to the body height and centred, so the original stays untouched.
  const root = useMemo(() => {
    const copy = gltf.scene.clone(true);
    const box = new Box3().setFromObject(copy);
    const size = box.getSize(new Vector3());
    const scale = size.y > 0 ? BODY_HEIGHT / size.y : 1;
    copy.scale.multiplyScalar(scale);
    const centred = new Box3().setFromObject(copy).getCenter(new Vector3());
    copy.position.sub(centred);
    return copy;
  }, [gltf]);

  useEffect(() => {
    root.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      const chain: string[] = [];
      for (let node: Object3D | null = mesh; node; node = node.parent) chain.push(node.name);
      const muscle = muscleFromNameChain(chain);
      mesh.material = muscle ? materials.byMuscle[muscle] : materials.neutral;
      mesh.userData.muscle = muscle;
    });
  }, [root, materials]);

  return (
    <primitive
      object={root}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        const muscle = event.object.userData.muscle as MuscleGroup | null | undefined;
        if (!muscle || !isTap(event)) return;
        event.stopPropagation();
        onSelect(muscle);
      }}
    />
  );
}
