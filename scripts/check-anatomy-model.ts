/**
 * pnpm model:check [path]
 * Checks an anatomy model (.glb) before you put it in public/models/: which of our 12 muscle groups its meshes map
 * to, which names are not recognised, and which muscles would never light up. Reads only the JSON header.
 */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { glbObjectNames, modelCoverage, parseGlbJson } from "../src/modules/analytics/domain/glb";

const path = resolve(process.argv[2] ?? "public/models/anatomy.glb");

try {
  const size = statSync(path).size;
  const names = glbObjectNames(parseGlbJson(new Uint8Array(readFileSync(path))));
  const coverage = modelCoverage(names);

  console.log(`${path}`);
  console.log(`  size: ${(size / 1024 / 1024).toFixed(1)} MB, ${names.length} named nodes/meshes`);
  console.log("  muscle groups found:");
  for (const [muscle, list] of coverage.mapped) console.log(`    ${muscle.padEnd(11)} ${list.length} (${list.slice(0, 3).join(", ")}${list.length > 3 ? ", ..." : ""})`);
  if (coverage.missing.length > 0) console.log(`  MISSING (these will never light up): ${coverage.missing.join(", ")}`);
  console.log(`  not recognised (kept as neutral body): ${coverage.unmapped.length}${coverage.unmapped.length > 0 ? ` e.g. ${coverage.unmapped.slice(0, 5).join(", ")}` : ""}`);
  if (size > 6 * 1024 * 1024) console.log("  WARNING: over 6 MB. Reduce the triangle count so it loads quickly on a phone.");
  process.exit(coverage.missing.length > 0 ? 1 : 0);
} catch (error) {
  console.error(`Could not read the model: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}
