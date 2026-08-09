import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import plan from "./hero-generation-plan.json" with { type: "json" };

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const hashes = new Map();
const results = [];

for (const hero of plan.heroes) {
  const absolutePath = resolve(projectRoot, `public${hero.src}`);
  const issues = [];
  let metadata = null;
  try {
    const bytes = await readFile(absolutePath);
    metadata = await sharp(bytes).metadata();
    if (metadata.format !== "webp") {
      issues.push(`invalid-format:${metadata.format ?? "unknown"}`);
    }
    if (Math.max(metadata.width ?? 0, metadata.height ?? 0) < plan.minimumLongEdge) {
      issues.push(`long-edge-below-${plan.minimumLongEdge}`);
    }
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hashes.has(hash)) {
      issues.push(`exact-duplicate:${hashes.get(hash)}`);
    } else {
      hashes.set(hash, hero.id);
    }
  } catch (error) {
    issues.push(
      `unreadable:${error instanceof Error ? error.message : String(error)}`,
    );
  }
  results.push({
    id: hero.id,
    src: hero.src,
    kind: hero.kind,
    category: hero.category,
    width: metadata?.width ?? null,
    height: metadata?.height ?? null,
    status: issues.length === 0 ? "accepted" : "failed",
    issues,
  });
}

await writeFile(
  resolve(scriptDirectory, "hero-generation-results.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      total: results.length,
      acceptedCount: results.filter((result) => result.status === "accepted")
        .length,
      failedCount: results.filter((result) => result.status === "failed")
        .length,
      results,
    },
    null,
    2,
  )}\n`,
);

const failed = results.filter((result) => result.status === "failed");
console.log(
  `Hero QA: ${results.length - failed.length}/${results.length} accepted, ${failed.length} failed.`,
);
if (failed.length > 0) process.exitCode = 1;
