import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "assets/branding/daysavor-chef-cat-icon.png");
const res = path.join(root, "android/app/src/main/res");
const canvasSize = 1536;
const background = { r: 252, g: 234, b: 205, alpha: 1 };

const densities = [
  { name: "mdpi", launcher: 48, foreground: 108 },
  { name: "hdpi", launcher: 72, foreground: 162 },
  { name: "xhdpi", launcher: 96, foreground: 216 },
  { name: "xxhdpi", launcher: 144, foreground: 324 },
  { name: "xxxhdpi", launcher: 192, foreground: 432 },
];

async function paddedMaster(subjectSize) {
  const subject = await sharp(source)
    .resize(subjectSize, subjectSize, { fit: "contain" })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: subject,
        left: Math.round((canvasSize - subjectSize) / 2),
        top: Math.round((canvasSize - subjectSize) / 2),
      },
    ])
    .png()
    .toBuffer();
}

const legacyMaster = await sharp(source)
  .resize(canvasSize, canvasSize, { fit: "fill" })
  .png()
  .toBuffer();
const adaptiveMaster = await paddedMaster(1080);
const roundSource = await paddedMaster(1320);
const roundMask = Buffer.from(
  `<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${canvasSize / 2}" cy="${canvasSize / 2}" r="${canvasSize / 2}" fill="white"/></svg>`,
);
const roundMaster = await sharp(roundSource)
  .composite([{ input: roundMask, blend: "dest-in" }])
  .png()
  .toBuffer();

for (const density of densities) {
  const directory = path.join(res, `mipmap-${density.name}`);

  await sharp(legacyMaster)
    .resize(density.launcher, density.launcher)
    .png()
    .toFile(path.join(directory, "ic_launcher.png"));

  await sharp(roundMaster)
    .resize(density.launcher, density.launcher)
    .png()
    .toFile(path.join(directory, "ic_launcher_round.png"));

  await sharp(adaptiveMaster)
    .resize(density.foreground, density.foreground)
    .png()
    .toFile(path.join(directory, "ic_launcher_foreground.png"));
}

console.log("Generated Daysavor Android launcher icons for mdpi through xxxhdpi.");
