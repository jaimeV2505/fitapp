import { describe, expect, it } from "vitest";
import { MUSCLE_GROUPS } from "@/lib/db/schema/enums";
import { BODY_PARTS, expandParts } from "./body-parts";
import { glbObjectNames, modelCoverage, muscleFromMeshName, muscleFromNameChain, parseGlbJson } from "./glb";

function makeGlb(json: object): Uint8Array {
  const encoded = new TextEncoder().encode(JSON.stringify(json));
  const padded = new Uint8Array(Math.ceil(encoded.length / 4) * 4).fill(0x20);
  padded.set(encoded);
  const total = 12 + 8 + padded.length;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, padded.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  out.set(padded, 20);
  return out;
}

describe("muscleFromMeshName", () => {
  it("recognises our own convention, with sides and numeric suffixes", () => {
    expect(muscleFromMeshName("muscle_chest_L")).toBe("chest");
    expect(muscleFromMeshName("Muscle_Quads.003")).toBe("quads");
    expect(muscleFromMeshName("muscle-hamstrings")).toBe("hamstrings");
  });

  it("recognises common anatomical names", () => {
    expect(muscleFromMeshName("Pectoralis major muscle.l")).toBe("chest");
    expect(muscleFromMeshName("Rectus femoris")).toBe("quads");
    expect(muscleFromMeshName("Gluteus maximus.r")).toBe("glutes");
    expect(muscleFromMeshName("Gastrocnemius")).toBe("calves");
    expect(muscleFromMeshName("Latissimus dorsi")).toBe("back");
    expect(muscleFromMeshName("Deltoid")).toBe("shoulders");
    expect(muscleFromMeshName("Rectus abdominis")).toBe("core");
  });

  it("does not mix up look-alike names", () => {
    expect(muscleFromMeshName("Biceps femoris")).toBe("hamstrings");
    expect(muscleFromMeshName("Biceps brachii")).toBe("biceps");
    expect(muscleFromMeshName("Triceps surae")).toBe("calves");
    expect(muscleFromMeshName("Triceps brachii")).toBe("triceps");
  });

  it("returns null for things that are not muscles", () => {
    expect(muscleFromMeshName("Skull")).toBeNull();
    expect(muscleFromMeshName("Cube.001")).toBeNull();
    expect(muscleFromMeshName("Absorption_helper")).toBeNull();
  });

  it("looks up the chain of parents", () => {
    expect(muscleFromNameChain(["Mesh_023", "Group", "muscle_triceps_R"])).toBe("triceps");
    expect(muscleFromNameChain(["Mesh_023", "Group"])).toBeNull();
  });
});

describe("GLB reading", () => {
  const glb = makeGlb({ asset: { version: "2.0" }, nodes: [{ name: "muscle_chest_L" }, { name: "Skull" }, { name: "muscle_chest_L" }], meshes: [{ name: "Quadriceps" }] });

  it("reads node and mesh names without the geometry", () => {
    expect(glbObjectNames(parseGlbJson(glb))).toEqual(["muscle_chest_L", "Skull", "Quadriceps"]);
  });

  it("rejects files that are not GLB 2.0", () => {
    expect(() => parseGlbJson(new Uint8Array(64))).toThrow();
    expect(() => parseGlbJson(new Uint8Array(4))).toThrow();
  });

  it("reports which muscle groups a model covers", () => {
    const coverage = modelCoverage(glbObjectNames(parseGlbJson(glb)));
    expect([...coverage.mapped.keys()].sort()).toEqual(["chest", "quads"]);
    expect(coverage.unmapped).toEqual(["Skull"]);
    expect(coverage.missing).toHaveLength(MUSCLE_GROUPS.length - 2);
  });
});

describe("the stylised body", () => {
  const parts = expandParts(BODY_PARTS);

  it("covers every muscle group", () => {
    const muscles = new Set(parts.map((p) => p.muscle));
    for (const group of MUSCLE_GROUPS) expect(muscles.has(group)).toBe(true);
  });

  it("is symmetric: every mirrored part has its twin on the other side", () => {
    const mirrored = BODY_PARTS.filter((p) => p.mirror);
    expect(parts).toHaveLength(BODY_PARTS.length + mirrored.length);
    for (const part of mirrored) {
      const [x, y, z] = part.position;
      expect(parts.some((p) => p.position[0] === x && p.position[1] === y && p.position[2] === z)).toBe(true);
      expect(parts.some((p) => p.position[0] === -x && p.position[1] === y && p.position[2] === z)).toBe(true);
    }
  });

  it("fits a person-sized box", () => {
    for (const p of parts) {
      expect(Math.abs(p.position[0])).toBeLessThan(0.45);
      expect(p.position[1]).toBeGreaterThan(-1);
      expect(p.position[1]).toBeLessThan(1);
      expect(Math.abs(p.position[2])).toBeLessThan(0.2);
    }
  });
});
