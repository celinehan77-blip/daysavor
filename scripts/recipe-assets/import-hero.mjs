import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import plan from "./hero-generation-plan.json" with { type: "json" };

const [, , heroId, generatedPath] = process.argv;
if (!heroId || !generatedPath) {
  throw new Error(
    "Usage: node scripts/recipe-assets/import-hero.mjs <hero-id> <generated-png>",
  );
}

const hero = plan.heroes.find((candidate) => candidate.id === heroId);
if (!hero) {
  throw new Error(`Unknown Hero id: ${heroId}`);
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const destination = resolve(projectRoot, `public${hero.src}`);
await mkdir(dirname(destination), { recursive: true });
await sharp(generatedPath)
  .resize(1536, 1024, { fit: "cover", position: "centre" })
  .webp({ quality: 84, effort: 5 })
  .toFile(destination);

console.log(`${hero.id} -> ${hero.src} (1536x1024)`);
