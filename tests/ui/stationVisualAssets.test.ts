import assert from "node:assert/strict";
import { access, open } from "node:fs/promises";
import test from "node:test";
import type { StationVisualAsset } from "../../src/lib/station-visual/types";

const manifestPath = "../../src/lib/station-visual/manifest";

test("Station Pilot manifest contains the approved 24 category-safe assets", async () => {
  const manifestModule = (await import(manifestPath).catch(() => null)) as
    | {
        stationVisualManifest: Array<{
          id: string;
          primaryCategory: string;
          src: string;
        }>;
      }
    | null;

  assert.ok(manifestModule, "Station manifest module should exist");
  const manifest = manifestModule.stationVisualManifest;
  const expectedCounts = {
    beef: 4,
    chicken: 10,
    duck: 1,
    fish: 3,
    pork: 3,
    seafood: 3,
  };

  assert.equal(manifest.length, 24);
  assert.equal(new Set(manifest.map((asset) => asset.id)).size, 24);
  assert.equal(new Set(manifest.map((asset) => asset.src)).size, 24);

  for (const [category, count] of Object.entries(expectedCounts)) {
    assert.equal(
      manifest.filter((asset) => asset.primaryCategory === category).length,
      count,
      `${category} allocation`,
    );
  }
});

test("every Station visual path resolves to a real WebP or transparent PNG", async () => {
  const { stationVisualManifest } = await import(manifestPath);

  const finalChickenCovers = [
    "/images/recipe-library/station-covers/kung-pao-chicken-cover.png",
    "/images/recipe-library/station-covers/huang-men-chicken-cover.png",
    "/images/recipe-library/station-covers/spicy-chicken-cover.png",
  ];
  for (const src of finalChickenCovers) {
    assert.ok(
      stationVisualManifest.some(
        (asset: StationVisualAsset) => asset.src === src,
      ),
      src,
    );
  }

  for (const asset of stationVisualManifest) {
    const assetUrl = new URL(`../../public${asset.src}`, import.meta.url);
    await access(assetUrl);
    const handle = await open(assetUrl);
    const header = Buffer.alloc(12);
    await handle.read(header, 0, header.length, 0);
    await handle.close();

    if (asset.src.endsWith(".png")) {
      assert.equal(
        header.subarray(0, 8).toString("hex"),
        "89504e470d0a1a0a",
        asset.src,
      );
      continue;
    }

    assert.equal(header.toString("ascii", 0, 4), "RIFF", asset.src);
    assert.equal(header.toString("ascii", 8, 12), "WEBP", asset.src);
  }
});
