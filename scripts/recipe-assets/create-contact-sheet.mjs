import { access, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import plan from "./generation-plan.json" with { type: "json" };

const batch = Number(
  process.argv.find((argument) => argument.startsWith("--batch="))?.split("=")[1],
);
if (![0, 1, 2, 3].includes(batch)) {
  throw new Error("Usage: node create-contact-sheet.mjs --batch=0|1|2|3");
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const outputDirectory = resolve(scriptDirectory, "qa");
const assets = plan.assets.filter((asset) => asset.batch === batch);
const cellWidth = 220;
const cellHeight = 190;
const imageWidth = 200;
const imageHeight = 150;
const columns = 5;
const rows = Math.ceil(assets.length / columns);
const composites = [];

for (const [index, asset] of assets.entries()) {
  const absolutePath = resolve(projectRoot, `public${asset.src}`);
  await access(absolutePath);
  const image = await sharp(absolutePath)
    .resize(imageWidth, imageHeight, { fit: "cover" })
    .toBuffer();
  const label = Buffer.from(
    `<svg width="${imageWidth}" height="30">
      <rect width="100%" height="100%" fill="#f7f2e9"/>
      <text x="4" y="19" font-family="Arial" font-size="11" fill="#49392d">${asset.id}</text>
    </svg>`,
  );
  const left = (index % columns) * cellWidth + 10;
  const top = Math.floor(index / columns) * cellHeight + 6;
  composites.push({ input: image, left, top });
  composites.push({ input: label, left, top: top + imageHeight });
}

await mkdir(outputDirectory, { recursive: true });
const outputPath = resolve(outputDirectory, `batch-${batch}.png`);
await sharp({
  create: {
    width: columns * cellWidth,
    height: rows * cellHeight,
    channels: 3,
    background: "#eee7dc",
  },
})
  .composite(composites)
  .png()
  .toFile(outputPath);

console.log(outputPath);
