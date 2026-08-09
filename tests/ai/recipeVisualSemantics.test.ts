import assert from "node:assert/strict";
import test from "node:test";
import { validateParsedRecipeDraft } from "../../src/lib/ai/validateParsedRecipe";

const baseCandidate = {
  titleZh: "宫保鸡丁",
  titleEn: "Kung Pao Chicken",
  description: "鸡丁与花生、干辣椒合炒成酸甜微辣的川味菜。",
  timeMinutes: 25,
  difficulty: "中等",
  flavor: "酸甜微辣",
  mainIngredient: "鸡腿肉",
  primaryCategory: "chicken",
  primaryIngredient: "鸡腿肉",
  classificationConfidence: 0.96,
  classificationReason: "鸡腿肉是菜品主体",
  tags: ["川菜", "鸡肉"],
  ingredients: [
    { name: "鸡腿肉", amount: "300 克", group: "main", note: "切丁" },
    { name: "花生", amount: "50 克", group: "side", note: "" },
  ],
  seasonings: [
    { name: "生抽", amount: "2 勺", group: "seasoning", note: "" },
  ],
  steps: [
    {
      title: "腌制鸡丁",
      description: "鸡腿肉切丁后抓匀腌制。",
      duration: "未说明",
      heat: "未说明",
      tips: "",
    },
  ],
  confidence: 0.9,
  warnings: [],
};

test("visual semantics are normalized without changing recipe facts", () => {
  const result = validateParsedRecipeDraft({
    ...baseCandidate,
    primaryIngredientTags: [
      " chicken-thigh ",
      "diced-chicken",
      "chicken-thigh",
      123,
    ],
    ingredientImageTags: [
      "dried-chili-peppercorn",
      "peanuts-nuts",
      "scallion-ginger-garlic",
    ],
    seasoningImageTags: [
      "light-dark-soy-wine",
      "vinegar-sugar-salt",
      "starch-water",
    ],
    stepActionTags: [
      "cutting-chicken",
      "marinating-chicken",
      "stir-frying-chicken",
    ],
    heroImagePromptData: {
      dishName: "宫保鸡丁",
      englishName: "Kung Pao Chicken",
      primaryIngredient: "鸡腿肉",
      keyIngredients: ["花生", "干辣椒", "花椒", 7],
      flavor: "酸甜微辣",
      cuisine: "川菜",
      composition: "主体偏右，左侧保留文字安全区",
      textSafeArea: "left",
    },
  });

  assert.ok(result);
  assert.equal(result.titleZh, baseCandidate.titleZh);
  assert.equal(result.ingredients[0]?.amount, "300 克");
  assert.deepEqual(result.primaryIngredientTags, [
    "chicken-thigh",
    "diced-chicken",
  ]);
  assert.deepEqual(result.ingredientImageTags, [
    "dried-chili-peppercorn",
    "peanuts-nuts",
    "scallion-ginger-garlic",
  ]);
  assert.deepEqual(result.seasoningImageTags, [
    "light-dark-soy-wine",
    "vinegar-sugar-salt",
    "starch-water",
  ]);
  assert.deepEqual(result.stepActionTags, [
    "cutting-chicken",
    "marinating-chicken",
    "stir-frying-chicken",
  ]);
  assert.deepEqual(result.heroImagePromptData?.keyIngredients, [
    "花生",
    "干辣椒",
    "花椒",
  ]);
  assert.equal(result.heroImagePromptData?.textSafeArea, "left");
});

test("visual semantics safely fall back when AI omits them", () => {
  const result = validateParsedRecipeDraft(baseCandidate);

  assert.ok(result);
  assert.deepEqual(result.primaryIngredientTags, []);
  assert.deepEqual(result.ingredientImageTags, []);
  assert.deepEqual(result.seasoningImageTags, []);
  assert.deepEqual(result.stepActionTags, []);
  assert.equal(result.heroImagePromptData, null);
});
