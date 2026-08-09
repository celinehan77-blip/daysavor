import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const plan = JSON.parse(
  await readFile(resolve(scriptDirectory, "generation-plan.json"), "utf8"),
);
const throughBatchArgument = process.argv.find((argument) =>
  argument.startsWith("--through-batch="),
);
const throughBatch = throughBatchArgument
  ? Number(throughBatchArgument.split("=")[1])
  : Number.POSITIVE_INFINITY;
const assetsToValidate = plan.assets.filter(
  (asset) => asset.batch <= throughBatch,
);
const rejectedFile = resolve(scriptDirectory, "rejected-assets.json");
const priorRejected = JSON.parse(await readFile(rejectedFile, "utf8"));
const hashes = new Map();
const results = [];

for (const asset of assetsToValidate) {
  const absolutePath = resolve(projectRoot, `public${asset.src}`);
  const issues = [];
  let metadata = null;
  let bytes = null;

  try {
    bytes = await readFile(absolutePath);
    if (bytes.length === 0) {
      issues.push("zero-byte-file");
    }
    metadata = await sharp(bytes).metadata();
    if (metadata.format !== "webp") {
      issues.push(`invalid-format:${metadata.format ?? "unknown"}`);
    }
    const expected =
      asset.type === "step"
        ? { width: 512, height: 512 }
        : { width: 800, height: 600 };
    if (
      metadata.width !== expected.width ||
      metadata.height !== expected.height
    ) {
      issues.push(
        `invalid-dimensions:${metadata.width ?? 0}x${metadata.height ?? 0}`,
      );
    }
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hashes.has(hash)) {
      issues.push(`exact-duplicate:${hashes.get(hash)}`);
    } else {
      hashes.set(hash, asset.id);
    }
  } catch (error) {
    issues.push(
      `unreadable:${error instanceof Error ? error.message : String(error)}`,
    );
  }

  results.push({
    id: asset.id,
    src: asset.src,
    batch: asset.batch,
    type: asset.type,
    category: asset.category,
    status: issues.length === 0 ? "accepted" : "failed",
    width: metadata?.width ?? null,
    height: metadata?.height ?? null,
    bytes: bytes?.length ?? 0,
    issues,
  });
}

const accepted = results.filter((result) => result.status === "accepted");
const failed = results.filter((result) => result.status === "failed");
const countBy = (items, key) =>
  Object.fromEntries(
    Object.entries(Object.groupBy(items, (item) => item[key]))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([value, group]) => [value, group.length]),
  );
const tagCounts = new Map();
for (const asset of plan.assets) {
  for (const tag of asset.tags) {
    if (tag.startsWith("type:") || /[\u3400-\u9fff]/.test(tag)) continue;
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
}

const coverageReport = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: failed.length === 0 ? "passed" : "incomplete",
  totalAssets: plan.assets.length,
  validatedAssets: assetsToValidate.length,
  acceptedCount: accepted.length,
  failedCount: failed.length,
  countsByType: countBy(plan.assets, "type"),
  countsByCategory: countBy(plan.assets, "category"),
  countsByAction: countBy(
    plan.assets.flatMap((asset) =>
      asset.compatibleActions.map((action) => ({ action })),
    ),
    "action",
  ),
  lowCoverageTags: [...tagCounts.entries()]
    .filter(([, count]) => count === 1)
    .map(([tag]) => tag)
    .sort(),
  missingTags: [],
  missingFiles: failed
    .filter((result) =>
      result.issues.some((issue) => issue.startsWith("unreadable:")),
    )
    .map((result) => result.src),
  rejectedCount: priorRejected.rejected.length,
  rejectedAssets: priorRejected.rejected,
};

await writeFile(
  resolve(scriptDirectory, "generation-results.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      generatedCount: accepted.length,
      pendingCount: plan.assets.length - accepted.length,
      accepted,
      failed,
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  resolve(scriptDirectory, "coverage-report.json"),
  `${JSON.stringify(coverageReport, null, 2)}\n`,
);

console.log(
  `Asset QA: ${accepted.length}/${assetsToValidate.length} validated assets accepted, ${failed.length} failed; ${plan.assets.length - accepted.length} still pending.`,
);
if (failed.length > 0) {
  process.exitCode = 1;
}
