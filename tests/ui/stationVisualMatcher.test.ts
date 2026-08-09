import assert from "node:assert/strict";
import test from "node:test";

import type { SerializableRecipe } from "../../src/types";
import type { StationVisualAsset } from "../../src/lib/station-visual/types";

const stationMatcherPath = "../../src/lib/station-visual/matcher";

function recipe(
  overrides: Partial<SerializableRecipe> = {},
): SerializableRecipe {
  return {
    id: "recipe-kung-pao",
    slug: "kung-pao-chicken",
    titleZh: "宫保鸡丁",
    titleEn: "Kung Pao Chicken",
    stationId: "station-chicken",
    coverType: "ticket",
    timeMinutes: 25,
    difficulty: "简单",
    flavor: "香辣酸甜",
    mainIngredient: "鸡肉 · 花生 · 干辣椒 · 花椒",
    primaryCategory: "chicken",
    primaryIngredient: "鸡腿肉",
    primaryIngredientTags: ["chicken", "chicken-thigh", "diced"],
    ingredientImageTags: ["dried-chili", "peanut", "peppercorn", "scallion"],
    seasoningImageTags: ["soy-sauce", "vinegar", "sugar"],
    stepActionTags: ["stir-frying-chicken"],
    tags: ["川菜", "下饭菜", "鸡肉", "家常"],
    description: "",
    ingredients: [
      {
        id: "chicken",
        name: "鸡腿肉",
        amount: "300g",
        group: "main",
        note: "切丁",
      },
      {
        id: "peanut",
        name: "花生",
        amount: "50g",
        group: "side",
        note: "熟花生",
      },
    ],
    seasonings: [
      {
        id: "chili",
        name: "干辣椒",
        amount: "8个",
        group: "seasoning",
        note: "切段",
      },
      {
        id: "peppercorn",
        name: "花椒",
        amount: "1小勺",
        group: "seasoning",
        note: "",
      },
    ],
    steps: [],
    savedCount: 0,
    ...overrides,
  };
}

test("exact dish names beat generic chicken candidates", async () => {
  const matcher = (await import(stationMatcherPath).catch(() => null)) as
    | {
        getStationVisual: (
          value: SerializableRecipe,
        ) => { assetId: string; matchLevel: string; src: string };
      }
    | null;

  assert.ok(matcher, "Station matcher module should exist");
  const selection = matcher.getStationVisual(recipe());

  assert.match(selection.assetId, /^station-chicken-kung-pao-/);
  assert.equal(selection.matchLevel, "exact");
  assert.match(selection.src, /station-covers\//);
});

test("dish aliases use the alias tier", async () => {
  const { getStationVisual } = await import(stationMatcherPath);
  const selection = getStationVisual(
    recipe({
      id: "recipe-kung-bao",
      slug: "kung-bao-chicken",
      titleZh: "宫爆鸡丁",
      titleEn: "Kung Bao Chicken",
    }),
  );

  assert.match(selection.assetId, /^station-chicken-kung-pao-/);
  assert.equal(selection.matchLevel, "alias");
});

test("category, cooking method, form, and ingredients select a related composition", async () => {
  const { getStationVisual } = await import(stationMatcherPath);
  const selection = getStationVisual(
    recipe({
      id: "recipe-green-pepper-chicken",
      slug: "green-pepper-chicken",
      titleZh: "青椒炒鸡丁",
      titleEn: "Green Pepper Chicken",
      mainIngredient: "鸡丁 · 青椒 · 红椒 · 蒜片",
      primaryIngredientTags: ["chicken", "diced"],
      ingredientImageTags: ["green-pepper", "red-pepper", "garlic"],
      seasoningImageTags: [],
      stepActionTags: ["stir-frying-chicken"],
    }),
  );

  assert.equal(selection.primaryCategory, "chicken");
  assert.match(selection.assetId, /green-pepper|kung-pao/);
  assert.notEqual(selection.matchLevel, "category-fallback");
});

test("primary category is a hard boundary", async () => {
  const { getStationVisual, stationVisualManifest } = await import(
    stationMatcherPath
  );

  for (const [primaryCategory, expectedAssetCategory, titleZh] of [
    ["beef", "beef", "黑椒牛柳"],
    ["pork", "pork", "红烧肉"],
    ["fish", "fish", "清蒸鱼"],
    ["shrimp", "seafood", "蒜蓉粉丝虾"],
    ["duck", "duck", "姜母鸭"],
  ] as const) {
    const selection = getStationVisual(
      recipe({
        id: `recipe-${primaryCategory}`,
        slug: `recipe-${primaryCategory}`,
        titleZh,
        titleEn: titleZh,
        primaryCategory,
        primaryIngredientTags: [primaryCategory],
        ingredientImageTags: [],
        seasoningImageTags: [],
        stepActionTags: [],
      }),
    );
    const asset = stationVisualManifest.find(
      (candidate: StationVisualAsset) => candidate.id === selection.assetId,
    );

    assert.ok(asset);
    assert.equal(asset.primaryCategory, expectedAssetCategory);
  }
});

test("categories outside the Pilot never borrow another protein image", async () => {
  const { getStationVisual } = await import(stationMatcherPath);

  for (const primaryCategory of ["lamb", "other"] as const) {
    const selection = getStationVisual(
      recipe({
        id: `recipe-${primaryCategory}`,
        titleZh: primaryCategory === "lamb" ? "孜然羊肉" : "番茄炒蛋",
        primaryCategory,
        classificationSource:
          primaryCategory === "other" ? "user" : undefined,
        primaryIngredientTags: [primaryCategory],
      }),
    );

    assert.equal(selection.primaryCategory, primaryCategory);
    assert.equal(selection.src, "");
    assert.equal(selection.matchLevel, "category-fallback");
  }
});

test("legacy recipes reuse the unified visual semantics instead of falling into other", async () => {
  const { getStationVisual } = await import(stationMatcherPath);
  const selection = getStationVisual(
    recipe({
      primaryCategory: undefined,
      primaryIngredient: undefined,
      primaryIngredientTags: undefined,
      ingredientImageTags: undefined,
      seasoningImageTags: undefined,
      stepActionTags: undefined,
    }),
  );

  assert.equal(selection.primaryCategory, "chicken");
  assert.match(selection.assetId, /^station-chicken-kung-pao-/);
});

test("variant selection is stable for the same recipe and can vary by recipe id", async () => {
  const { getStationVisual } = await import(stationMatcherPath);
  const first = getStationVisual(recipe());
  const repeated = getStationVisual(recipe());
  const variants = new Set(
    Array.from({ length: 24 }, (_, index) =>
      getStationVisual(recipe({ id: `kung-pao-${index}` })).assetId,
    ),
  );

  assert.deepEqual(repeated, first);
  assert.ok(variants.size > 1, "stable seed should distribute exact variants");
});
