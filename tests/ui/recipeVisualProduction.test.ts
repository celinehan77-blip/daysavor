import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import type { SerializableRecipe } from "../../src/types";
import type { RecipeVisualAsset } from "../../src/types/recipeVisual";

const projectRoot = new URL("../../", import.meta.url);

function makeAsset(
  overrides: Partial<RecipeVisualAsset> & Pick<RecipeVisualAsset, "id">,
): RecipeVisualAsset {
  const { id, ...assetOverrides } = overrides;

  return {
    id,
    src: `/images/recipe-library/test/${id}.webp`,
    type: "step",
    category: "preparing",
    tags: [],
    compatibleActions: [],
    aspectRatio: "1:1",
    visualWeight: 0.8,
    ...assetOverrides,
  };
}

const baseRecipe = {
  id: "recipe-production-test",
  slug: "production-test",
  titleZh: "测试菜谱",
  titleEn: "Production Test",
  stationId: "station-test",
  coverType: "photo",
  timeMinutes: 30,
  difficulty: "中等",
  flavor: "咸鲜",
  mainIngredient: "鸡腿肉",
  primaryCategory: "chicken",
  primaryIngredient: "鸡腿肉",
  primaryIngredientTags: ["chicken-thigh"],
  ingredientImageTags: ["scallion-ginger-garlic"],
  seasoningImageTags: ["light-soy-dark-soy-cooking-wine"],
  stepActionTags: ["marinating-chicken"],
  tags: ["鸡肉"],
  description: "测试描述",
  ingredients: [],
  seasonings: [],
  steps: [],
  savedCount: 0,
} as unknown as SerializableRecipe;

test("production manifest reaches the approved 165 generic asset allocation", async () => {
  const { recipeVisualManifest } = await import(
    "../../src/lib/recipe-visual/manifest"
  );
  const counts = Object.groupBy(
    recipeVisualManifest,
    (asset) => asset.type,
  );

  assert.equal(recipeVisualManifest.length, 165);
  assert.equal(counts.protein?.length, 42);
  assert.equal(counts.ingredient?.length, 38);
  assert.equal(counts.seasoning?.length, 24);
  assert.equal(counts.step?.length, 53);
  assert.equal(counts.fallback?.length, 8);
  assert.equal(
    new Set(recipeVisualManifest.map((asset) => asset.id)).size,
    recipeVisualManifest.length,
  );
  assert.equal(
    new Set(recipeVisualManifest.map((asset) => asset.src)).size,
    recipeVisualManifest.length,
  );
});

test("explicit semantic scoring follows the approved priority table", async () => {
  const { scoreRecipeVisualAsset } = await import(
    "../../src/lib/recipe-visual/scoring"
  );
  const exactIngredientAndAction = makeAsset({
    id: "exact-both",
    category: "chicken",
    tags: ["chicken-thigh", "marinating-chicken"],
    compatibleActions: ["marinating"],
  });
  const exactIngredient = makeAsset({
    id: "exact-ingredient",
    category: "chicken",
    tags: ["chicken-thigh"],
  });
  const exactAction = makeAsset({
    id: "exact-action",
    category: "marinating",
    tags: ["marinating"],
    compatibleActions: ["marinating"],
  });
  const categoryOnly = makeAsset({
    id: "category-only",
    category: "chicken",
  });
  const fallback = makeAsset({
    id: "fallback",
    type: "fallback",
    category: "other",
  });
  const context = {
    action: "marinating",
    category: "chicken",
    ingredientTags: ["chicken-thigh"],
    text: "腌制鸡腿肉",
  };

  assert.equal(scoreRecipeVisualAsset(exactIngredientAndAction, context), 100);
  assert.equal(scoreRecipeVisualAsset(exactIngredient, context), 70);
  assert.equal(scoreRecipeVisualAsset(exactAction, context), 55);
  assert.equal(scoreRecipeVisualAsset(categoryOnly, context), 20);
  assert.equal(scoreRecipeVisualAsset(fallback, context), 0);
});

test("stable seeded selection is deterministic and can vary by recipe or step", async () => {
  const { selectAssetBySeed } = await import(
    "../../src/lib/recipe-visual/scoring"
  );
  const candidates = [
    makeAsset({ id: "variant-a" }),
    makeAsset({ id: "variant-b" }),
    makeAsset({ id: "variant-c" }),
    makeAsset({ id: "variant-d" }),
  ];
  const first = selectAssetBySeed(
    candidates,
    "recipe-a:step:0:marinating:chicken",
  );

  assert.equal(
    selectAssetBySeed(candidates, "recipe-a:step:0:marinating:chicken").id,
    first.id,
  );
  assert.ok(
    new Set([
      first.id,
      selectAssetBySeed(
        candidates,
        "recipe-b:step:0:marinating:chicken",
      ).id,
      selectAssetBySeed(
        candidates,
        "recipe-a:step:1:stir-frying:chicken",
      ).id,
    ]).size > 1,
  );
});

test("hero resolution prefers persisted URL, then semantic dish match, then category fallback", async () => {
  const { getHeroImage } = await import(
    "../../src/lib/recipe-visual/matcher"
  );
  const persisted = {
    ...baseRecipe,
    heroImageUrl: "/uploads/recipe-production-test-hero.webp",
  } as SerializableRecipe & { heroImageUrl: string };

  assert.equal(
    getHeroImage(persisted),
    "/uploads/recipe-production-test-hero.webp",
  );
  assert.match(
    getHeroImage({
      ...baseRecipe,
      id: "recipe-kung-pao-chicken",
      slug: "kung-pao-chicken",
      titleZh: "宫保鸡丁",
      titleEn: "Kung Pao Chicken",
    }),
    /hero\/kung-pao-chicken\.png$/,
  );
  assert.match(getHeroImage(baseRecipe), /hero\/fallback\/chicken\.webp$/);
});

test("batch-one meat recipes resolve to the correct protein family and stay stable", async () => {
  const { getProteinImage } = await import(
    "../../src/lib/recipe-visual/matcher"
  );
  const recipes = [
    ["黄焖鸡", "chicken", "chicken-pieces"],
    ["辣子鸡", "chicken", "diced-chicken"],
    ["啤酒鸭", "duck", "duck-pieces"],
    ["姜母鸭", "duck", "duck-leg"],
    ["红烧肉", "pork", "pork-belly"],
    ["鱼香肉丝", "pork", "pork-tenderloin"],
    ["糖醋排骨", "pork", "pork-ribs"],
    ["土豆炖牛肉", "beef", "beef-brisket"],
    ["黑椒牛柳", "beef", "beef-slices"],
    ["番茄牛腩", "beef", "beef-brisket"],
  ] as const;

  for (const [titleZh, category, ingredientTag] of recipes) {
    const recipe = {
      ...baseRecipe,
      id: `recipe-${titleZh}`,
      slug: `fixture-${category}-${ingredientTag}`,
      titleZh,
      primaryCategory: category,
      primaryIngredientTags: [ingredientTag],
      mainIngredient: titleZh,
    } as SerializableRecipe;
    const first = getProteinImage(recipe);
    const second = getProteinImage(recipe);

    assert.equal(first, second, `${titleZh} should be stable`);
    assert.match(
      first,
      category === "chicken"
        ? /\/(?:proteins\/chicken|cutouts\/proteins)\//
        : new RegExp(`/proteins/${category}/`),
      titleZh,
    );
  }
});

test("all acceptance recipes resolve coherent protein, step, and cached Hero assets", async () => {
  const {
    getHeroImage,
    getIngredientImage,
    getProteinImage,
    getSeasoningImage,
    getStepImage,
  } = await import("../../src/lib/recipe-visual/matcher");
  const cases = [
    ["宫保鸡丁", "chicken", "diced-chicken", "kung-pao-chicken", "stir-frying-chicken"],
    ["黄焖鸡", "chicken", "chicken-pieces", "yellow-braised-chicken", "braising-chicken"],
    ["辣子鸡", "chicken", "diced-chicken", "laziji-chicken", "deep-frying-meat"],
    ["啤酒鸭", "duck", "duck-pieces", "beer-duck", "braising-duck"],
    ["姜母鸭", "duck", "duck-leg", "ginger-duck", "simmering-duck"],
    ["红烧肉", "pork", "pork-belly", "red-braised-pork", "braising-pork"],
    ["鱼香肉丝", "pork", "pork-tenderloin", "fish-fragrant-pork", "stir-frying-pork"],
    ["糖醋排骨", "pork", "pork-ribs", "sweet-sour-ribs", "braising-pork"],
    ["土豆炖牛肉", "beef", "beef-brisket", "beef-stew", "simmering-beef"],
    ["黑椒牛柳", "beef", "beef-slices", "black-pepper-beef", "stir-frying-beef"],
    ["番茄牛腩", "beef", "beef-brisket", "tomato-beef-brisket", "simmering-beef"],
    ["清蒸鱼", "fish", "whole-fish", "steamed-fish", "steaming-fish"],
    ["水煮鱼", "fish", "fish-slices", "boiled-fish", "boiling-fish"],
    ["香煎鱼", "fish", "fish-steak", "pan-fried-fish", "pan-frying-fish"],
    ["蒜蓉粉丝虾", "shrimp", "shrimp", "garlic-vermicelli-shrimp", "steaming-seafood"],
    ["辣炒鱿鱼", "shrimp", "squid", "spicy-squid", "stir-frying-seafood"],
    ["清蒸螃蟹", "crab", "crab", "steamed-crab", "steaming-seafood"],
  ] as const;
  const step = {
    id: "cook",
    title: "烹调主食材",
    description: "按主要动作烹调至熟。",
    duration: "5 分钟",
    tips: "",
  };

  for (const [
    titleZh,
    category,
    ingredientTag,
    heroSlug,
    stepActionTag,
  ] of cases) {
    const recipe = {
      ...baseRecipe,
      id: `acceptance-${heroSlug}`,
      slug: heroSlug,
      titleZh,
      primaryCategory: category,
      primaryIngredientTags: [ingredientTag],
      ingredientImageTags: ["scallion-ginger-garlic"],
      seasoningImageTags: ["light-soy-dark-soy-cooking-wine"],
      stepActionTags: [stepActionTag],
      steps: [step],
    } as SerializableRecipe;
    const protein = getProteinImage(recipe);

    assert.equal(protein, getProteinImage(recipe), `${titleZh} should be stable`);
    assert.match(
      protein,
      category === "fish"
        ? /\/proteins\/fish\//
        : category === "shrimp" || category === "crab"
          ? /\/proteins\/seafood\//
          : category === "chicken"
            ? /\/(?:proteins\/chicken|cutouts\/proteins)\//
          : new RegExp(`/proteins/${category}/`),
      `${titleZh} protein`,
    );
    assert.doesNotMatch(getIngredientImage(recipe), /fallback/);
    assert.doesNotMatch(getSeasoningImage(recipe), /fallback/);
    assert.doesNotMatch(getStepImage(recipe, step, 0), /fallback/);
    assert.equal(
      getHeroImage(recipe),
      `/images/recipe-library/hero/${heroSlug}.${
        heroSlug === "kung-pao-chicken" ? "png" : "webp"
      }`,
      `${titleZh} Hero`,
    );
  }
});

test("adjacent steps use action-aware seeds and avoid one repeated generic thumbnail", async () => {
  const { getStepImage } = await import(
    "../../src/lib/recipe-visual/matcher"
  );
  const recipe = {
    ...baseRecipe,
    stepActionTags: [
      "marinating-chicken",
      "frying-scallion-ginger-garlic",
      "stir-frying-chicken",
    ],
  } as SerializableRecipe;
  const steps = recipe.stepActionTags!.map((tag, index) => ({
    id: `step-${index}`,
    title: tag,
    description: tag,
    duration: "未说明",
    tips: "",
  }));
  const images = steps.map((step, index) =>
    getStepImage(recipe, step, index),
  );

  assert.equal(new Set(images).size, images.length);
});

test("legacy recipes without visual metadata still keep meat-specific step images coherent", async () => {
  const { getStepImage } = await import(
    "../../src/lib/recipe-visual/matcher"
  );
  const legacyRecipe = {
    ...baseRecipe,
    id: "legacy-kung-pao-chicken",
    slug: "kung-pao-chicken",
    titleZh: "宫保鸡丁",
    mainIngredient: "鸡肉 · 花生 · 干辣椒",
    primaryCategory: undefined,
    stepActionTags: undefined,
  } as SerializableRecipe;
  const steps = [
    {
      id: "legacy-sauce",
      title: "调制宫保汁",
      description: "生抽、醋、糖和淀粉调匀。",
      duration: "2 分钟",
      tips: "",
    },
    {
      id: "legacy-aromatics",
      title: "爆香干辣椒和花椒",
      description: "热油下花椒与干辣椒炒出香味。",
      duration: "1 分钟",
      tips: "",
    },
    {
      id: "legacy-stir-fry",
      title: "下鸡丁翻炒",
      description: "倒入鸡丁快速翻炒至变色。",
      duration: "5 分钟",
      tips: "",
    },
    {
      id: "legacy-reduce",
      title: "加入花生收汁出锅",
      description: "倒入宫保汁和花生，翻炒均匀后收汁。",
      duration: "2 分钟",
      tips: "",
    },
  ];
  const images = steps.map((step, index) =>
    getStepImage(legacyRecipe, step, index),
  );

  assert.match(images[0]!, /mixing-sauce/);
  assert.match(images[1]!, /frying-aromatics/);
  assert.match(images[2]!, /stir-frying-chicken/);
  assert.match(images[3]!, /reducing-sauce/);
  assert.doesNotMatch(images.join(" "), /beef|pork|duck/);
});

test("production asset reports exist and every manifest path resolves", async () => {
  const { recipeVisualManifest } = await import(
    "../../src/lib/recipe-visual/manifest"
  );
  const reportFiles = [
    "generation-plan.json",
    "generation-results.json",
    "rejected-assets.json",
    "coverage-report.json",
  ];

  for (const filename of reportFiles) {
    const url = new URL(`scripts/recipe-assets/${filename}`, projectRoot);
    assert.equal(existsSync(url), true, `${filename} should exist`);
    assert.doesNotThrow(() => JSON.parse(readFileSync(url, "utf8")));
  }

  for (const asset of recipeVisualManifest) {
    assert.equal(
      existsSync(new URL(`public${asset.src}`, projectRoot)),
      true,
      asset.src,
    );
  }
});
