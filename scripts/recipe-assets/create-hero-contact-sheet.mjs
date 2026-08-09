import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import plan from "./hero-generation-plan.json" with { type: "json" };

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const columns = 3;
const cellWidth = 390;
const cellHeight = 290;
const imageWidth = 370;
const imageHeight = 247;
const rows = Math.ceil(plan.heroes.length / columns);
const composites = [];

for (const [index, hero] of plan.heroes.entries()) {
  const image = await sharp(resolve(projectRoot, `public${hero.src}`))
    .resize(imageWidth, imageHeight, { fit: "cover" })
    .toBuffer();
  const label = Buffer.from(
    `<svg width="${imageWidth}" height="30">
      <rect width="100%" height="100%" fill="#f7f2e9"/>
      <text x="4" y="20" font-family="Arial" font-size="14" fill="#49392d">${hero.id}</text>
    </svg>`,
  );
  const left = (index % columns) * cellWidth + 10;
  const top = Math.floor(index / columns) * cellHeight + 8;
  composites.push({ input: image, left, top });
  composites.push({ input: label, left, top: top + imageHeight });
}

const outputDirectory = resolve(scriptDirectory, "qa");
await mkdir(outputDirectory, { recursive: true });
const outputPath = resolve(outputDirectory, "heroes.png");
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
