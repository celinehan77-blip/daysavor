import { readFile, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import plan from "./generation-plan.json" with { type: "json" };

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const throughBatchArgument = process.argv.find((argument) =>
  argument.startsWith("--through-batch="),
);
const throughBatch = throughBatchArgument
  ? Number(throughBatchArgument.split("=")[1])
  : Number.POSITIVE_INFINITY;
let normalizedCount = 0;

for (const asset of plan.assets.filter((candidate) => candidate.batch <= throughBatch)) {
  const absolutePath = resolve(projectRoot, `public${asset.src}`);
  let source;
  try {
    source = await readFile(absolutePath);
  } catch {
    continue;
  }
  const size = asset.type === "step"
    ? { width: 512, height: 512 }
    : { width: 800, height: 600 };
  const temporaryPath = `${absolutePath}.normalizing.webp`;
  await sharp(source)
    .resize(size.width, size.height, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 5 })
    .toFile(temporaryPath);
  await rename(temporaryPath, absolutePath);
  normalizedCount += 1;
}

console.log(`Normalized ${normalizedCount} existing assets.`);
