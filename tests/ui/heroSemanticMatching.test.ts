import assert from "node:assert/strict";
import test from "node:test";
import type { SerializableRecipe } from "../../src/types";

const baseRecipe = {
  id: "hero-semantic-test",
  slug: "hero-semantic-test",
  titleZh: "宫保鸡丁",
  titleEn: "Kung Pao Chicken",
  stationId: "station-chicken",
  coverType: "photo",
  timeMinutes: 25,
  difficulty: "中等",
  flavor: "酸甜微辣",
  mainIngredient: "鸡腿肉",
  primaryCategory: "chicken",
  primaryIngredient: "鸡腿肉",
  primaryIngredientTags: ["diced-chicken"],
  ingredientImageTags: ["dried-chili-peppercorn", "peanuts-nuts"],
  seasoningImageTags: ["kung-pao-sauce"],
  stepActionTags: ["marinating-chicken", "stir-frying-chicken"],
  tags: ["酸甜", "微辣", "川菜"],
  description: "鸡丁与花生、干辣椒和花椒快速炒制。",
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
      note: "",
    },
  ],
  seasonings: [
    {
      id: "chili",
      name: "干辣椒",
      amount: "8个",
      group: "seasoning",
      note: "",
    },
    {
      id: "peppercorn",
      name: "花椒",
      amount: "1勺",
      group: "seasoning",
      note: "",
    },
  ],
  steps: [
    {
      id: "stir-fry",
      title: "翻炒鸡丁",
      description: "鸡丁与料头快速翻炒。",
      duration: "5分钟",
      tips: "",
    },
  ],
  savedCount: 0,
} as SerializableRecipe;

test("every production Hero exposes complete semantic metadata", async () => {
  const { heroAssetManifest } = await import(
    "../../src/lib/recipe-visual/heroManifest"
  );

  assert.equal(heroAssetManifest.length, 24);
  assert.equal(
    new Set(heroAssetManifest.map((asset) => asset.id)).size,
    heroAssetManifest.length,
  );

  for (const asset of heroAssetManifest) {
    assert.match(asset.src, /\.(?:png|webp)$/, asset.id);
    assert.ok(Array.isArray(asset.dishNames), asset.id);
    assert.ok(Array.isArray(asset.aliases), asset.id);
    assert.ok(asset.primaryCategory, asset.id);
    assert.ok(Array.isArray(asset.ingredientForms), asset.id);
    assert.ok(Array.isArray(asset.cookingMethods), asset.id);
    assert.ok(Array.isArray(asset.keyIngredients), asset.id);
    assert.ok(Array.isArray(asset.flavorTags), asset.id);
    assert.ok(asset.dishForm, asset.id);
    assert.match(asset.objectPosition, /^\d+% \d+%$/, asset.id);
  }
});

test("exact dish names and aliases beat similar and category fallback Heroes", async () => {
  const { deriveHeroVisualTags } = await import(
    "../../src/lib/recipe-visual/deriveHeroVisualTags"
  );
  const { selectHeroAsset } = await import(
    "../../src/lib/recipe-visual/heroMatcher"
  );
  const exact = selectHeroAsset({
    recipeId: baseRecipe.id,
    tags: deriveHeroVisualTags(baseRecipe),
  });
  const alias = selectHeroAsset({
    recipeId: "alias-kung-pao",
    tags: deriveHeroVisualTags({
      ...baseRecipe,
      titleZh: "宫爆鸡丁",
      titleEn: "",
    }),
  });

  assert.equal(exact.asset.id, "hero-kung-pao-chicken-01");
  assert.equal(exact.level, "exact");
  assert.equal(alias.asset.id, "hero-kung-pao-chicken-01");
  assert.equal(alias.level, "alias");
});

test("legacy other category is re-derived when the recipe has a clear protein identity", async () => {
  const { deriveHeroVisualTags } = await import(
    "../../src/lib/recipe-visual/deriveHeroVisualTags"
  );
  const { selectHeroAsset } = await import(
    "../../src/lib/recipe-visual/heroMatcher"
  );
  const legacyRecipe = {
    ...baseRecipe,
    id: "legacy-kung-pao-other",
    primaryCategory: "other",
  } as SerializableRecipe;
  const tags = deriveHeroVisualTags(legacyRecipe);
  const result = selectHeroAsset({
    recipeId: legacyRecipe.id,
    tags,
  });

  assert.equal(tags.primaryCategory, "chicken");
  assert.equal(result.asset.id, "hero-kung-pao-chicken-01");
  assert.equal(result.level, "exact");
});

test("a user-corrected other category remains a hard visual boundary", async () => {
  const { deriveHeroVisualTags } = await import(
    "../../src/lib/recipe-visual/deriveHeroVisualTags"
  );
  const tags = deriveHeroVisualTags({
    ...baseRecipe,
    id: "user-corrected-other",
    primaryCategory: "other",
    classificationSource: "user",
  } as SerializableRecipe);

  assert.equal(tags.primaryCategory, "other");
});

test("similar matching keeps category and cooking method before category fallback", async () => {
  const { deriveHeroVisualTags } = await import(
    "../../src/lib/recipe-visual/deriveHeroVisualTags"
  );
  const { selectHeroAsset } = await import(
    "../../src/lib/recipe-visual/heroMatcher"
  );
  const colaWings = {
    ...baseRecipe,
    id: "cola-wings",
    slug: "cola-wings",
    titleZh: "可乐鸡翅",
    titleEn: "Cola Chicken Wings",
    flavor: "甜咸浓郁",
    mainIngredient: "鸡翅",
    primaryIngredient: "鸡翅",
    primaryIngredientTags: ["chicken-wings"],
    ingredientImageTags: [],
    seasoningImageTags: ["soy-sauce", "sugar"],
    stepActionTags: ["braising-chicken"],
    tags: ["甜咸", "浓郁"],
    description: "鸡翅用可乐和酱油焖烧收汁。",
    ingredients: [
      {
        id: "wings",
        name: "鸡翅",
        amount: "8只",
        group: "main",
        note: "",
      },
    ],
    steps: [
      {
        id: "braise",
        title: "焖烧鸡翅",
        description: "鸡翅加入可乐焖烧至收汁。",
        duration: "20分钟",
        tips: "",
      },
    ],
  } as SerializableRecipe;
  const result = selectHeroAsset({
    recipeId: colaWings.id,
    tags: deriveHeroVisualTags(colaWings),
  });

  assert.equal(result.level, "similar");
  assert.equal(result.asset.primaryCategory, "chicken");
  assert.ok(result.asset.cookingMethods.includes("braise"));
  assert.notEqual(result.asset.id, "hero-fallback-chicken");
});

test("Hero matching never crosses an identifiable primary ingredient category", async () => {
  const { deriveHeroVisualTags } = await import(
    "../../src/lib/recipe-visual/deriveHeroVisualTags"
  );
  const { selectHeroAsset } = await import(
    "../../src/lib/recipe-visual/heroMatcher"
  );
  const cases = [
    [baseRecipe, "chicken"],
    [
      {
        ...baseRecipe,
        id: "steamed-fish",
        slug: "steamed-fish",
        titleZh: "清蒸鲈鱼",
        titleEn: "Steamed Sea Bass",
        primaryCategory: "fish",
        primaryIngredient: "鲈鱼",
        mainIngredient: "鲈鱼",
        primaryIngredientTags: ["whole-fish"],
        stepActionTags: ["steaming-fish"],
      },
      "fish",
    ],
    [
      {
        ...baseRecipe,
        id: "beef-stew",
        slug: "beef-stew",
        titleZh: "土豆炖牛肉",
        titleEn: "Beef Stew with Potato",
        primaryCategory: "beef",
        primaryIngredient: "牛肉",
        mainIngredient: "牛肉 · 土豆",
        primaryIngredientTags: ["beef-brisket"],
        stepActionTags: ["simmering-beef"],
      },
      "beef",
    ],
  ] as const;

  for (const [recipe, expectedCategory] of cases) {
    const result = selectHeroAsset({
      recipeId: recipe.id,
      tags: deriveHeroVisualTags(recipe as SerializableRecipe),
    });

    assert.equal(result.asset.primaryCategory, expectedCategory);
  }
});

test("same recipe id and semantic tags always select the same Hero", async () => {
  const { deriveHeroVisualTags } = await import(
    "../../src/lib/recipe-visual/deriveHeroVisualTags"
  );
  const { selectHeroAsset } = await import(
    "../../src/lib/recipe-visual/heroMatcher"
  );
  const tags = deriveHeroVisualTags({
    ...baseRecipe,
    titleZh: "青椒鸡丁",
    titleEn: "Diced Chicken with Peppers",
  });
  const first = selectHeroAsset({ recipeId: "stable-chicken", tags });
  const second = selectHeroAsset({ recipeId: "stable-chicken", tags });

  assert.equal(first.asset.id, second.asset.id);
  assert.equal(first.score, second.score);
});

test("category fallback beats global fallback when no similar Hero exists", async () => {
  const { deriveHeroVisualTags } = await import(
    "../../src/lib/recipe-visual/deriveHeroVisualTags"
  );
  const { selectHeroAsset } = await import(
    "../../src/lib/recipe-visual/heroMatcher"
  );
  const categoryResult = selectHeroAsset({
    recipeId: "unknown-chicken",
    tags: deriveHeroVisualTags({
      ...baseRecipe,
      titleZh: "白切鸡",
      titleEn: "White Cut Chicken",
      primaryIngredientTags: ["whole-chicken"],
      stepActionTags: ["boiling-chicken"],
      flavor: "清淡",
      tags: ["清淡"],
    }),
  });
  const globalResult = selectHeroAsset({
    recipeId: "unknown-category",
    tags: deriveHeroVisualTags({
      ...baseRecipe,
      titleZh: "番茄炒蛋",
      titleEn: "Tomato Eggs",
      primaryCategory: "other",
      primaryIngredient: "番茄和鸡蛋",
      mainIngredient: "番茄 · 鸡蛋",
      primaryIngredientTags: [],
      ingredientImageTags: [],
      seasoningImageTags: [],
      stepActionTags: ["stir-frying"],
      flavor: "家常",
      tags: ["家常"],
      description: "番茄和鸡蛋炒制。",
      ingredients: [
        {
          name: "番茄",
          note: "",
        },
        {
          name: "鸡蛋",
          note: "",
        },
      ],
      seasonings: [],
      steps: [
        {
          title: "翻炒",
          description: "番茄和鸡蛋翻炒均匀。",
          tips: "",
        },
      ],
    }),
  });

  assert.equal(categoryResult.level, "category");
  assert.equal(categoryResult.asset.id, "hero-fallback-chicken");
  assert.equal(globalResult.level, "global");
  assert.equal(globalResult.asset.id, "hero-fallback-other");
});

test("the 18 MVP acceptance dishes resolve exact or safe similar Heroes", async () => {
  const { deriveHeroVisualTags } = await import(
    "../../src/lib/recipe-visual/deriveHeroVisualTags"
  );
  const { selectHeroAsset } = await import(
    "../../src/lib/recipe-visual/heroMatcher"
  );
  const cases = [
    ["宫保鸡丁", "chicken", "stir-frying-chicken", "hero-kung-pao-chicken-01"],
    ["辣子鸡", "chicken", "deep-frying-chicken", "hero-laziji-chicken-01"],
    ["黄焖鸡", "chicken", "braising-chicken", "hero-yellow-braised-chicken-01"],
    ["可乐鸡翅", "chicken", "braising-chicken", "hero-yellow-braised-chicken-01"],
    ["啤酒鸭", "duck", "braising-duck", "hero-beer-duck-01"],
    ["姜母鸭", "duck", "simmering-duck", "hero-ginger-duck-01"],
    ["红烧肉", "pork", "braising-pork", "hero-red-braised-pork-01"],
    ["糖醋排骨", "pork", "braising-pork", "hero-sweet-sour-ribs-01"],
    ["鱼香肉丝", "pork", "stir-frying-pork", "hero-fish-fragrant-pork-01"],
    ["土豆炖牛肉", "beef", "simmering-beef", "hero-beef-stew-01"],
    ["番茄牛腩", "beef", "simmering-beef", "hero-tomato-beef-brisket-01"],
    ["黑椒牛柳", "beef", "stir-frying-beef", "hero-black-pepper-beef-01"],
    ["清蒸鱼", "fish", "steaming-fish", "hero-steamed-fish-01"],
    ["水煮鱼", "fish", "boiling-fish", "hero-boiled-fish-01"],
    ["香煎鱼", "fish", "pan-frying-fish", "hero-pan-fried-fish-01"],
    ["蒜蓉粉丝虾", "shrimp", "steaming-seafood", "hero-garlic-vermicelli-shrimp-01"],
    ["辣炒鱿鱼", "shrimp", "stir-frying-seafood", "hero-spicy-squid-01"],
    ["清蒸螃蟹", "crab", "steaming-seafood", "hero-steamed-crab-01"],
  ] as const;

  for (const [titleZh, primaryCategory, actionTag, expectedAssetId] of cases) {
    const recipe = {
      ...baseRecipe,
      id: `acceptance-${titleZh}`,
      slug: `acceptance-${titleZh}`,
      titleZh,
      titleEn: "",
      primaryCategory,
      primaryIngredient: titleZh,
      mainIngredient: titleZh,
      primaryIngredientTags:
        titleZh === "可乐鸡翅" ? ["chicken-wings"] : [],
      stepActionTags: [actionTag],
      ingredients: [
        {
          id: "main",
          name: titleZh,
          amount: "适量",
          group: "main",
          note: "",
        },
      ],
      seasonings: [],
      steps: [
        {
          id: "cook",
          title: actionTag,
          description: actionTag,
          duration: "未说明",
          tips: "",
        },
      ],
    } as SerializableRecipe;
    const result = selectHeroAsset({
      recipeId: recipe.id,
      tags: deriveHeroVisualTags(recipe),
    });

    assert.equal(result.asset.id, expectedAssetId, titleZh);
    assert.ok(
      result.level === "exact" ||
        result.level === "alias" ||
        result.level === "similar",
      `${titleZh}: ${result.level}`,
    );
  }
});
