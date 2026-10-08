import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/db/schema/enums";

/** The word(s) that mark a mesh as one of our muscle groups. Order matters: specific names before general ones. */
const ALIASES: readonly (readonly [MuscleGroup, readonly string[]])[] = [
  ["hamstrings", ["biceps_femoris", "semitendinosus", "semimembranosus", "hamstring", "hamstrings"]],
  ["calves", ["triceps_surae", "gastrocnemius", "soleus", "calf", "calves"]],
  ["glutes", ["gluteus", "glute", "glutes", "gluteal"]],
  ["quads", ["quadriceps", "rectus_femoris", "vastus", "quad", "quads"]],
  ["adductors", ["adductor", "adductors", "gracilis", "pectineus"]],
  ["biceps", ["biceps_brachii", "brachialis", "biceps"]],
  ["triceps", ["triceps_brachii", "triceps"]],
  ["shoulders", ["deltoid", "deltoids", "delt", "delts", "shoulder", "shoulders"]],
  ["chest", ["pectoralis", "chest", "pec", "pecs"]],
  ["forearms", ["brachioradialis", "flexor_carpi", "extensor_carpi", "pronator", "supinator", "forearm", "forearms"]],
  ["back", ["latissimus", "trapezius", "rhomboid", "rhomboids", "erector_spinae", "teres", "infraspinatus", "back", "lats", "traps"]],
  ["core", ["rectus_abdominis", "abdominis", "oblique", "obliques", "serratus", "abs", "core"]],
];

const normalise = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const hasToken = (normalised: string, token: string): boolean => new RegExp(`(?:^|_)${token}(?:_|$)`).test(normalised);

/**
 * Which muscle group a mesh or node name belongs to, or null.
 * Our own convention wins ("muscle_chest_L", "Muscle_Quads.003"); otherwise common anatomical names are
 * recognised ("Pectoralis major muscle.l", "Rectus femoris"), so many anatomy models work without renaming.
 */
export function muscleFromMeshName(name: string): MuscleGroup | null {
  const normalised = normalise(name);
  for (const muscle of MUSCLE_GROUPS) if (hasToken(normalised, `muscle_${muscle}`)) return muscle;
  for (const [muscle, tokens] of ALIASES) if (tokens.some((token) => hasToken(normalised, token))) return muscle;
  return null;
}

/** The first match walking from a mesh up through its parents (names ordered from the mesh to the root). */
export function muscleFromNameChain(names: readonly string[]): MuscleGroup | null {
  for (const name of names) {
    const muscle = muscleFromMeshName(name);
    if (muscle) return muscle;
  }
  return null;
}

interface GlbJson {
  nodes?: { name?: string }[];
  meshes?: { name?: string }[];
}

const GLB_MAGIC = 0x46546c67; // "glTF"
const JSON_CHUNK = 0x4e4f534a; // "JSON"

/** Reads the JSON part of a binary glTF (.glb) without loading the geometry. Throws when it is not a GLB 2.0 file. */
export function parseGlbJson(data: Uint8Array): GlbJson {
  if (data.byteLength < 20) throw new Error("The file is too small to be a GLB.");
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (view.getUint32(0, true) !== GLB_MAGIC) throw new Error("Not a GLB file (missing the glTF header).");
  if (view.getUint32(4, true) !== 2) throw new Error("Only glTF 2.0 files are supported.");
  const length = view.getUint32(12, true);
  if (view.getUint32(16, true) !== JSON_CHUNK) throw new Error("The first chunk of the GLB is not JSON.");
  if (20 + length > data.byteLength) throw new Error("The GLB is truncated.");
  return JSON.parse(new TextDecoder().decode(data.subarray(20, 20 + length))) as GlbJson;
}

/** Names of the nodes and meshes of a model, without empties or repeats. */
export function glbObjectNames(json: GlbJson): string[] {
  const names = [...(json.nodes ?? []), ...(json.meshes ?? [])].map((entry) => entry.name?.trim() ?? "").filter((name) => name !== "");
  return [...new Set(names)];
}

export interface ModelCoverage {
  /** Names that map to each muscle group. */
  mapped: Map<MuscleGroup, string[]>;
  /** Names that map to none (they stay a neutral colour). */
  unmapped: string[];
  /** Muscle groups no mesh maps to: they would never light up. */
  missing: MuscleGroup[];
}

export function modelCoverage(names: readonly string[]): ModelCoverage {
  const mapped = new Map<MuscleGroup, string[]>();
  const unmapped: string[] = [];
  for (const name of names) {
    const muscle = muscleFromMeshName(name);
    if (muscle) mapped.set(muscle, [...(mapped.get(muscle) ?? []), name]);
    else unmapped.push(name);
  }
  return { mapped, unmapped, missing: MUSCLE_GROUPS.filter((muscle) => !mapped.has(muscle)) };
}
