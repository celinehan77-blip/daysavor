import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import plan from "./generation-plan.json" with { type: "json" };

const [, , assetId, generatedPath] = process.argv;
if (!assetId || !generatedPath) {
  throw new Error(
    "Usage: node scripts/recipe-assets/import-generated.mjs <asset-id> <generated-png>",
  );
}

const asset = plan.assets.find((candidate) => candidate.id === assetId);
if (!asset) {
  throw new Error(`Unknown asset id: ${assetId}`);
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const destination = resolve(projectRoot, `public${asset.src}`);
const size = asset.type === "step"
  ? { width: 512, height: 512 }
  : { width: 800, height: 600 };

await mkdir(dirname(destination), { recursive: true });
await sharp(generatedPath)
  .resize(size.width, size.height, {
    fit: "cover",
    position: "centre",
  })
  .webp({ quality: 82, effort: 5 })
  .toFile(destination);

console.log(`${asset.id} -> ${asset.src} (${size.width}x${size.height})`);
