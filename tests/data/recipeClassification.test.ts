import assert from "node:assert/strict";
import test from "node:test";
import {
  applyUserCategoryCorrection,
  buildCategoryStats,
  classifyRecipeContent,
  filterRecipesByCategory,
} from "../../src/lib/classification/recipeCategories";
import { validateParsedRecipeDraft } from "../../src/lib/ai/validateParsedRecipe";
import { buildRecipeInsertPayload } from "../../src/lib/data/supabase/recipes";
import { buildChefCategoryViewModels } from "../../src/lib/data/recipeClassification";
import { RECIPE_CATEGORY_IDS } from "../../src/types/classification";
import type { Recipe } from "../../src/types";

function recipe(
  slug: string,
  primaryCategory: Recipe["primaryCategory"],
): Recipe {
  return {
    id: slug,
    slug,
    titleZh: slug,
    titleEn: slug,
    stationId: "station-chicken",
    coverType: "ticket",
    timeMinutes: 30,
    difficulty: "简单",
    flavor: "家常",
    mainIngredient: "主食材",
    primaryCategory,
    primaryIngredient: "主食材",
    classificationConfidence: 0.9,
    classificationReason: "测试数据",
    classificationSource: "ai",
    tags: [],
    description: "",
    ingredients: [],
    seasonings: [],
    steps: [],
    savedCount: 0,
  };
}

test("AI classification fields are normalized and preserved", () => {
  const draft = validateParsedRecipeDraft({
    titleZh: "宫保鸡丁",
    titleEn: "Kung Pao Chicken",
    description: "鸡丁为主体",
    timeMinutes: 30,
    difficulty: "中等",
    flavor: "酸甜微辣",
    mainIngredient: "鸡腿肉",
    primaryCategory: "chicken",
    primaryIngredient: "鸡腿肉",
    classificationConfidence: 0.96,
    classificationReason: "菜名、主要食材和步骤都以鸡肉为主体",
    ingredients: [
      { name: "鸡腿肉", amount: "300 克", group: "main", note: "" },
      { name: "花生", amount: "50 克", group: "side", note: "" },
    ],
    seasonings: [
      { name: "生抽", amount: "2 勺", group: "seasoning", note: "" },
    ],
    steps: [
      {
        title: "炒鸡丁",
        description: "鸡丁炒至变色后收汁",
        duration: "5 分钟",
        heat: "大火",
        tips: "",
      },
    ],
    confidence: 0.9,
    warnings: [],
  });

  assert.ok(draft);
  assert.equal(draft.primaryCategory, "chicken");
  assert.equal(draft.primaryIngredient, "鸡腿肉");
  assert.equal(draft.classificationConfidence, 0.96);
  assert.equal(draft.classificationSource, "ai");
});

test("rule fallback uses ingredients and repeated cooking steps, not title alone", () => {
  const result = classifyRecipeContent({
    titleZh: "家常小炒",
    titleEn: "Home-style Stir Fry",
    mainIngredient: "牛腩",
    ingredients: [
      { name: "牛腩", amount: "500 克", group: "main", note: "" },
      { name: "番茄", amount: "2 个", group: "side", note: "" },
    ],
    steps: [
      { title: "处理牛肉", description: "牛腩切块", duration: "", heat: "", tips: "" },
      { title: "炖牛腩", description: "牛腩炖至软烂", duration: "", heat: "", tips: "" },
    ],
  });

  assert.equal(result.primaryCategory, "beef");
  assert.equal(result.primaryIngredient, "牛腩");
  assert.equal(result.classificationSource, "rule");
});

test("ambiguous recipes safely enter other", () => {
  const result = classifyRecipeContent({
    titleZh: "时蔬小炒",
    titleEn: "Vegetable Stir Fry",
    mainIngredient: "时令蔬菜",
    ingredients: [
      { name: "西兰花", amount: "150 克", group: "main", note: "" },
      { name: "胡萝卜", amount: "100 克", group: "side", note: "" },
    ],
    steps: [
      { title: "炒蔬菜", description: "蔬菜炒熟", duration: "", heat: "", tips: "" },
    ],
  });

  assert.equal(result.primaryCategory, "other");
  assert.ok(result.classificationConfidence < 0.7);
});

test("a dish name alone cannot force a meat category", () => {
  const result = classifyRecipeContent({
    titleZh: "鱼香茄子",
    titleEn: "Yu Xiang Eggplant",
    mainIngredient: "茄子",
    ingredients: [
      { name: "茄子", amount: "400 克", group: "main", note: "" },
    ],
    steps: [
      { title: "炒茄子", description: "茄子炒软后调味", duration: "", heat: "", tips: "" },
    ],
  });

  assert.equal(result.primaryCategory, "other");
});

test("personal category lists remain separated and counts use real recipes", () => {
  const recipes = [
    recipe("宫保鸡丁", "chicken"),
    recipe("番茄炖牛腩", "beef"),
    recipe("时蔬小炒", "other"),
  ];

  assert.deepEqual(
    filterRecipesByCategory(recipes, "chicken").map((item) => item.slug),
    ["宫保鸡丁"],
  );
  assert.deepEqual(
    filterRecipesByCategory(recipes, "beef").map((item) => item.slug),
    ["番茄炖牛腩"],
  );

  const stats = buildCategoryStats(recipes);
  assert.equal(stats.chicken, 1);
  assert.equal(stats.beef, 1);
  assert.equal(stats.other, 1);
});

test("chef category view models keep the fixed order and include empty categories", () => {
  const views = buildChefCategoryViewModels([
    {
      ...recipe("kung-pao-chicken", "chicken"),
      titleZh: "宫保鸡丁",
    },
    {
      ...recipe("tomato-beef-stew", "beef"),
      titleZh: "番茄炖牛腩",
    },
  ]);

  assert.deepEqual(
    views.map((view) => view.id),
    [...RECIPE_CATEGORY_IDS],
  );
  assert.deepEqual(views[0], {
    id: "chicken",
    displayName: "鸡师傅",
    englishName: "Chicken Chef",
    description: "收藏与生成的鸡肉菜谱",
    recipeCount: 1,
    latestRecipeName: "宫保鸡丁",
    href: "/chef/chicken",
    isEmpty: false,
  });

  const duck = views.find((view) => view.id === "duck");
  assert.deepEqual(duck, {
    id: "duck",
    displayName: "鸭师傅",
    englishName: "Duck Chef",
    description: "收藏与生成的鸭肉菜谱",
    recipeCount: 0,
    latestRecipeName: null,
    href: "/chef/duck",
    isEmpty: true,
  });
});

test("user correction moves a recipe and records user as the source", () => {
  const chickenRecipe = recipe("宫保鸡丁", "chicken");
  const corrected = applyUserCategoryCorrection(chickenRecipe, "beef");

  assert.equal(corrected.primaryCategory, "beef");
  assert.equal(corrected.classificationSource, "user");
  assert.equal(corrected.classificationConfidence, 1);
  assert.equal(filterRecipesByCategory([corrected], "chicken").length, 0);
  assert.equal(filterRecipesByCategory([corrected], "beef").length, 1);
});

test("recipe save payload persists every classification field with the owner", () => {
  const draft = validateParsedRecipeDraft({
    titleZh: "番茄炖牛腩",
    titleEn: "Tomato Beef Stew",
    mainIngredient: "牛腩",
    ingredients: [
      { name: "牛腩", amount: "500 克", group: "main", note: "" },
      { name: "番茄", amount: "300 克", group: "side", note: "" },
    ],
    seasonings: [
      { name: "盐", amount: "3 克", group: "seasoning", note: "" },
    ],
    steps: [
      {
        title: "炖牛腩",
        description: "牛腩与番茄炖至软烂",
        duration: "60 分钟",
        heat: "小火",
        tips: "",
      },
    ],
    timeMinutes: 70,
    difficulty: "中等",
    flavor: "浓郁",
    tags: [],
    confidence: 0.9,
    warnings: [],
  });

  assert.ok(draft);
  const payload = buildRecipeInsertPayload({
    draft,
    slug: "tomato-beef-stew",
    sourcePlatform: "manual",
    stationId: null,
    userId: "current-user",
  });

  assert.equal(payload.primary_category, "beef");
  assert.equal(payload.primary_ingredient, "牛腩");
  assert.equal(payload.classification_source, "rule");
  assert.equal(payload.user_id, "current-user");
});
