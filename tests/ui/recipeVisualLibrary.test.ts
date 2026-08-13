import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import type { SerializableRecipe } from "../../src/types";

const projectRoot = new URL("../../", import.meta.url);

const chickenRecipe = {
  id: "recipe-kung-pao-chicken",
  slug: "kung-pao-chicken",
  titleZh: "宫保鸡丁",
  titleEn: "Kung Pao Chicken",
  mainIngredient: "鸡腿肉 · 花生 · 干辣椒 · 花椒",
  primaryCategory: "chicken",
  primaryIngredientTags: ["diced-chicken"],
  ingredientImageTags: ["dried-chili-peppercorn"],
  seasoningImageTags: ["salt-sugar-starch"],
  flavor: "酸甜微辣",
  tags: ["川菜", "鸡肉"],
  ingredients: [
    {
      id: "chicken",
      name: "鸡腿肉",
      amount: "300 克",
      group: "main",
      note: "切丁",
    },
    {
      id: "peanuts",
      name: "花生",
      amount: "50 克",
      group: "side",
      note: "",
    },
    {
      id: "dried-chili",
      name: "干辣椒",
      amount: "8 个",
      group: "side",
      note: "切段",
    },
    {
      id: "peppercorn",
      name: "花椒",
      amount: "1 小勺",
      group: "side",
      note: "",
    },
  ],
  seasonings: [
    {
      id: "soy",
      name: "生抽",
      amount: "2 勺",
      group: "seasoning",
      note: "",
    },
    {
      id: "dark-soy",
      name: "老抽",
      amount: "1 勺",
      group: "seasoning",
      note: "",
    },
    {
      id: "starch",
      name: "淀粉",
      amount: "1 勺",
      group: "seasoning",
      note: "",
    },
    {
      id: "sugar",
      name: "糖",
      amount: "1 勺",
      group: "seasoning",
      note: "",
    },
    {
      id: "salt",
      name: "盐",
      amount: "1 勺",
      group: "seasoning",
      note: "",
    },
    {
      id: "wine",
      name: "料酒",
      amount: "1 勺",
      group: "seasoning",
      note: "",
    },
  ],
  steps: [
    {
      id: "marinate",
      title: "腌制鸡丁",
      description: "鸡腿肉切丁后加入生抽和淀粉腌制。",
      duration: "3 分钟",
      tips: "",
    },
    {
      id: "stir-fry",
      title: "下鸡丁翻炒",
      description: "倒入鸡丁快速翻炒至变色。",
      duration: "5 分钟",
      tips: "",
    },
  ],
} as unknown as SerializableRecipe;

test("production manifest contains the requested 165 structured assets", async () => {
  const manifestPath = "../../src/lib/recipe-visual/manifest";
  const manifestModule = (await import(manifestPath).catch(() => null)) as {
    recipeVisualManifest?: Array<{
      id: string;
      presentation?: string;
      src: string;
      type: string;
      tags: string[];
      aspectRatio: string;
      visualWeight: number;
    }>;
  } | null;

  assert.ok(manifestModule, "recipe visual manifest module should exist");
  const manifest = manifestModule.recipeVisualManifest ?? [];

  assert.equal(manifest.length, 165);
  assert.equal(new Set(manifest.map((asset) => asset.id)).size, 165);
  assert.equal(new Set(manifest.map((asset) => asset.src)).size, 165);
  assert.equal(manifest.filter((asset) => asset.type === "protein").length, 42);
  assert.equal(
    manifest.filter((asset) => asset.type === "ingredient").length,
    38,
  );
  assert.equal(
    manifest.filter((asset) => asset.type === "seasoning").length,
    24,
  );
  assert.equal(manifest.filter((asset) => asset.type === "step").length, 53);
  assert.equal(manifest.filter((asset) => asset.type === "fallback").length, 8);

  for (const asset of manifest) {
    assert.ok(asset.src.startsWith("/images/recipe-library/"));
    assert.match(asset.src, /\.(?:png|webp)$/);
    assert.ok(asset.tags.length > 0);
    assert.match(asset.aspectRatio, /^\d+:\d+$/);
    assert.ok(asset.visualWeight > 0 && asset.visualWeight <= 1);
    assert.equal(
      existsSync(
        new URL(`public${asset.src}`, projectRoot),
      ),
      true,
      asset.src,
    );
  }
});

test("matching is semantic, deterministic, and action aware", async () => {
  const matcherPath = "../../src/lib/recipe-visual/matcher";
  const matcher = (await import(matcherPath).catch(() => null)) as {
    getIngredientVisual?: (recipe: SerializableRecipe) => {
      presentation: string;
      src: string;
    };
    getHeroImage?: (recipe: SerializableRecipe) => string;
    getIngredientImage?: (recipe: SerializableRecipe) => string;
    getProteinImage?: (recipe: SerializableRecipe) => string;
    getProteinVisual?: (recipe: SerializableRecipe) => {
      presentation: string;
      src: string;
    };
    getSeasoningImage?: (recipe: SerializableRecipe) => string;
    getSeasoningVisual?: (recipe: SerializableRecipe) => {
      presentation: string;
      src: string;
    };
    getStepImage?: (
      recipe: SerializableRecipe,
      step: SerializableRecipe["steps"][number],
      stepIndex: number,
    ) => string;
  } | null;

  assert.ok(matcher, "recipe visual matcher module should exist");
  assert.equal(
    matcher.getProteinImage?.(chickenRecipe),
    matcher.getProteinImage?.(chickenRecipe),
  );
  assert.match(matcher.getProteinImage?.(chickenRecipe) ?? "", /chicken/);
  assert.match(
    matcher.getIngredientImage?.(chickenRecipe) ?? "",
    /cutouts|peanuts|chili-pepper/,
  );
  assert.match(
    matcher.getSeasoningImage?.(chickenRecipe) ?? "",
    /cutouts|soy|sauce|vinegar/,
  );

  const persistedTransparentRecipe = {
    ...chickenRecipe,
    visualAssets: {
      heroAssetId: "hero-kung-pao-chicken-01",
      heroImageUrl: "/images/recipe-library/hero/kung-pao-chicken.png",
      heroMatchLevel: "exact",
      heroObjectPosition: "70% 50%",
      ingredientImageUrl:
        "/images/recipe-library/cutouts/ingredients/kungpao-garnish-cutout.png",
      proteinImageUrl:
        "/images/recipe-library/cutouts/proteins/chicken-thigh-cutout.png",
      seasoningImageUrl:
        "/images/recipe-library/cutouts/seasonings/seasoning-cutout.png",
      stepImageUrls: [],
    },
  } as SerializableRecipe;
  const prepVisuals = [
    matcher.getProteinVisual?.(persistedTransparentRecipe),
    matcher.getIngredientVisual?.(persistedTransparentRecipe),
    matcher.getSeasoningVisual?.(persistedTransparentRecipe),
  ];
  assert.ok(prepVisuals.every(Boolean));
  for (const visual of prepVisuals) {
    assert.equal(visual?.presentation, "isolated", visual?.src);
    assert.match(visual?.src ?? "", /\/cutouts\/.+\.png$/);
  }
  assert.match(
    matcher.getStepImage?.(chickenRecipe, chickenRecipe.steps[0]!, 0) ?? "",
    /marinat/,
  );
  assert.match(
    matcher.getStepImage?.(chickenRecipe, chickenRecipe.steps[1]!, 1) ?? "",
    /stir-fry/,
  );
  assert.match(
    matcher.getHeroImage?.(chickenRecipe) ?? "",
    /hero\/kung-pao-chicken/,
  );

  const steamedFishRecipe = {
    ...chickenRecipe,
    id: "recipe-steamed-fish",
    slug: "steamed-fish",
    titleZh: "清蒸鱼",
    titleEn: "Steamed Fish",
    mainIngredient: "鲜鱼 · 葱姜 · 蒸鱼豉油",
    primaryCategory: "fish",
    seasoningImageTags: ["light-dark-soy-wine"],
    seasonings: [
      {
        id: "steamed-fish-soy",
        name: "蒸鱼豉油",
        amount: "2 勺",
        group: "seasoning",
        note: "提鲜",
      },
    ],
  } as unknown as SerializableRecipe;

  assert.match(
    matcher.getSeasoningImage?.(steamedFishRecipe) ?? "",
    /soy-sauce/,
  );
});

test("ingredient cards reserve separate text and image regions", () => {
  const styles = readFileSync(
    new URL("src/components/recipe/RecipeDetail.module.css", projectRoot),
    "utf8",
  );

  assert.match(
    styles,
    /\.ingredientCard\s*\{[\s\S]*overflow:\s*hidden/,
  );
  assert.match(
    styles,
    /\.ingredientCard\s*\{[\s\S]*grid-template-areas:\s*"text image"/,
  );
  assert.match(
    styles,
    /\.ingredientPhotoImage\s*\{[\s\S]*object-fit:\s*contain/,
  );
  assert.match(
    styles,
    /\.ingredientCard\[data-ingredient-type="main"\] \.ingredientArtworkSurface\s*\{[\s\S]*mask-image:\s*radial-gradient/,
  );
  assert.doesNotMatch(
    styles,
    /\.ingredientPhoto\s*\{[^}]*(?:mask-image|position:\s*absolute)/,
  );
});

test("recipe detail keeps ingredient amounts and step instructions fully readable", () => {
  const styles = readFileSync(
    new URL("src/components/recipe/RecipeDetail.module.css", projectRoot),
    "utf8",
  );
  const ingredientCard = readFileSync(
    new URL("src/components/recipe/IngredientPrepCard.tsx", projectRoot),
    "utf8",
  );
  const detailScreen = readFileSync(
    new URL("src/components/recipe/RecipeDetailScreen.tsx", projectRoot),
    "utf8",
  );

  assert.doesNotMatch(
    styles,
    /\.ingredientLine\s*\{[^}]*text-overflow:\s*ellipsis/,
  );
  assert.match(ingredientCard, /ingredientName/);
  assert.match(ingredientCard, /ingredientAmount/);
  assert.match(
    styles,
    /\.ingredientCard:has\([\s\S]*data-asset-presentation="isolated"[\s\S]*\)\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/,
  );
  assert.doesNotMatch(
    detailScreen,
    /className="[^"]*truncate[^"]*"[^>]*>[\s\S]*?\{step\.(?:title|description)\}/,
  );
  assert.match(detailScreen, /className=\{styles\.stepDescription\}/);
  assert.doesNotMatch(
    styles,
    /\.stepDescription\s*\{[^}]*-webkit-line-clamp/,
  );
});
