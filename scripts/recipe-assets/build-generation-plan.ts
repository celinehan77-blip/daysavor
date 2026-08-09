import { existsSync } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { recipeVisualManifest } from "../../src/lib/recipe-visual/manifest";
import { productionAssetSpecs } from "../../src/lib/recipe-visual/productionManifest";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const productionById = new Map(
  productionAssetSpecs.map((asset) => [asset.id, asset]),
);

const sharedCardStyle = [
  "high-end Chinese cookbook editorial photography",
  "natural soft morning light",
  "warm cream-white seamless background matching an ivory recipe card",
  "low saturation and restrained contrast",
  "realistic clean food texture",
  "soft shadow",
  "no text, no logo, no brand, no packaging, no face",
  "subject concentrated in the lower half with generous clean space above",
  "4:3 landscape composition",
].join(", ");

const sharedStepStyle = [
  "high-end Chinese cookbook editorial process photography",
  "natural soft morning light",
  "warm cream-white kitchen surface and pale cookware",
  "low saturation and restrained contrast",
  "one clear cooking action only",
  "tight overhead or slight overhead crop",
  "no face, no text, no logo, no brand",
  "square composition readable at thumbnail size",
].join(", ");

const generationPlan = {
  schemaVersion: 1,
  targetGenericAssetCount: 165,
  targetAllocation: {
    protein: 42,
    ingredient: 38,
    seasoning: 24,
    step: 53,
    fallback: 8,
  },
  batches: {
    pilot: 24,
    batch1: 50,
    batch2: 50,
    batch3: 41,
  },
  assets: recipeVisualManifest.map((asset) => {
    const production = productionById.get(asset.id);
    return {
      ...asset,
      batch: production?.batch ?? 0,
      status: existsSync(resolve(projectRoot, `public${asset.src}`))
        ? "accepted"
        : "pending",
      prompt: production
        ? `${production.promptSubject}, ${
            asset.type === "step" ? sharedStepStyle : sharedCardStyle
          }`
        : null,
      source: production ? "phase-2-generation" : "phase-1-pilot",
    };
  }),
};

async function main() {
  await mkdir(scriptDirectory, { recursive: true });
  await writeFile(
    resolve(scriptDirectory, "generation-plan.json"),
    `${JSON.stringify(generationPlan, null, 2)}\n`,
  );
  const resultsPath = resolve(scriptDirectory, "generation-results.json");
  try {
    await access(resultsPath);
  } catch {
    const accepted = generationPlan.assets.filter(
      (asset) => asset.status === "accepted",
    );
    await writeFile(
      resultsPath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          generatedCount: accepted.length,
          pendingCount: generationPlan.assets.length - accepted.length,
          accepted: accepted.map((asset) => ({
            id: asset.id,
            src: asset.src,
            source: asset.source,
          })),
          failed: [],
        },
        null,
        2,
      )}\n`,
    );
  }
  const rejectedPath = resolve(scriptDirectory, "rejected-assets.json");
  try {
    await access(rejectedPath);
  } catch {
    await writeFile(
      rejectedPath,
      `${JSON.stringify({ schemaVersion: 1, rejected: [] }, null, 2)}\n`,
    );
  }
  const coveragePath = resolve(scriptDirectory, "coverage-report.json");
  try {
    await access(coveragePath);
  } catch {
    const accepted = generationPlan.assets.filter(
      (asset) => asset.status === "accepted",
    );
    await writeFile(
      coveragePath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          status: "plan-created",
          totalPlannedAssets: generationPlan.assets.length,
          existingAssets: accepted.length,
          pendingAssets: generationPlan.assets.length - accepted.length,
          targetAllocation: generationPlan.targetAllocation,
          missingFiles: generationPlan.assets
            .filter((asset) => asset.status === "pending")
            .map((asset) => asset.src),
          lowCoverageTags: [],
          missingTags: [],
          rejectedCount: 0,
        },
        null,
        2,
      )}\n`,
    );
  }

  console.log(
    `Created production plan: ${generationPlan.assets.length} generic assets (${productionAssetSpecs.length} new).`,
  );
}

void main();
