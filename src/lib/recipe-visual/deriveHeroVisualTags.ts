import type { RecipeCategoryId } from "@/types/classification";
import type { HeroVisualTags } from "@/types/recipeVisual";

type HeroVisualIngredientSource = {
  name?: string;
  note?: string;
};

type HeroVisualStepSource = {
  description?: string;
  heat?: string;
  title?: string;
  tips?: string;
};

export type HeroVisualRecipeSource = {
  classificationSource?: "ai" | "rule" | "user";
  description?: string;
  flavor?: string;
  ingredientImageTags?: string[];
  ingredients?: HeroVisualIngredientSource[];
  mainIngredient?: string;
  primaryCategory?: RecipeCategoryId;
  primaryIngredient?: string;
  primaryIngredientTags?: string[];
  seasoningImageTags?: string[];
  seasonings?: HeroVisualIngredientSource[];
  stepActionTags?: string[];
  steps?: HeroVisualStepSource[];
  tags?: string[];
  titleEn?: string;
  titleZh: string;
};

const categoryRules: Array<{
  category: RecipeCategoryId;
  pattern: RegExp;
}> = [
  { category: "chicken", pattern: /鸡(?!蛋)|chicken/ },
  { category: "duck", pattern: /鸭|duck/ },
  { category: "pork", pattern: /猪|排骨|肉丝|pork/ },
  { category: "beef", pattern: /牛|beef/ },
  { category: "lamb", pattern: /羊|lamb|mutton/ },
  { category: "shrimp", pattern: /虾|鱿鱼|章鱼|贝|seafood|shrimp|prawn|squid/ },
  { category: "crab", pattern: /蟹|螃蟹|crab/ },
  { category: "fish", pattern: /鱼|fish/ },
];

const keyIngredientRules: Array<{ key: string; pattern: RegExp }> = [
  { key: "chicken", pattern: /鸡(?!蛋)|chicken/ },
  { key: "duck", pattern: /鸭|duck/ },
  { key: "pork", pattern: /猪|排骨|肉丝|pork/ },
  { key: "beef", pattern: /牛|beef/ },
  { key: "lamb", pattern: /羊|lamb|mutton/ },
  { key: "fish", pattern: /鱼|fish/ },
  { key: "shrimp", pattern: /虾|shrimp|prawn/ },
  { key: "crab", pattern: /蟹|crab/ },
  { key: "squid", pattern: /鱿鱼|squid/ },
  { key: "potato", pattern: /土豆|马铃薯|potato/ },
  { key: "carrot", pattern: /胡萝卜|carrot/ },
  { key: "tomato", pattern: /番茄|西红柿|tomato/ },
  { key: "dried-chili", pattern: /干辣椒|dried.?chili/ },
  { key: "chili", pattern: /辣椒|小米辣|chili/ },
  { key: "peppercorn", pattern: /花椒|peppercorn/ },
  { key: "black-pepper", pattern: /黑胡椒|黑椒|black.?pepper/ },
  { key: "bell-pepper", pattern: /彩椒|甜椒|青椒|bell.?pepper/ },
  { key: "peanut", pattern: /花生|peanut/ },
  { key: "ginger", pattern: /姜|ginger/ },
  { key: "scallion", pattern: /葱|scallion|spring.?onion/ },
  { key: "garlic", pattern: /蒜|garlic/ },
  { key: "vermicelli", pattern: /粉丝|vermicelli/ },
  { key: "beer", pattern: /啤酒|beer/ },
  { key: "cola", pattern: /可乐|cola/ },
  { key: "soy-sauce", pattern: /生抽|老抽|酱油|soy.?sauce/ },
  { key: "vinegar", pattern: /醋|vinegar/ },
  { key: "sugar", pattern: /糖|sugar/ },
  { key: "mushroom", pattern: /香菇|蘑菇|mushroom/ },
  { key: "wood-ear", pattern: /木耳|wood.?ear/ },
  { key: "bamboo-shoot", pattern: /笋|bamboo.?shoot/ },
  { key: "sesame-oil", pattern: /麻油|香油|sesame.?oil/ },
];

function compactText(source: HeroVisualRecipeSource) {
  return [
    source.titleZh,
    source.titleEn,
    source.description,
    source.flavor,
    source.mainIngredient,
    source.primaryIngredient,
    ...(source.tags ?? []),
    ...(source.primaryIngredientTags ?? []),
    ...(source.ingredientImageTags ?? []),
    ...(source.seasoningImageTags ?? []),
    ...(source.stepActionTags ?? []),
    ...(source.ingredients ?? []).flatMap((item) => [item.name, item.note]),
    ...(source.seasonings ?? []).flatMap((item) => [item.name, item.note]),
    ...(source.steps ?? []).flatMap((step) => [
      step.title,
      step.description,
      step.heat,
      step.tips,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

function inferCategory(
  source: HeroVisualRecipeSource,
  text: string,
): RecipeCategoryId {
  if (
    source.primaryCategory &&
    source.classificationSource === "user"
  ) {
    return source.primaryCategory;
  }

  if (source.primaryCategory && source.primaryCategory !== "other") {
    return source.primaryCategory;
  }

  return (
    categoryRules.find((rule) => rule.pattern.test(text))?.category ??
    "other"
  );
}

function inferIngredientForm(text: string) {
  const rules = [
    { form: "wings", pattern: /鸡翅|鸭翅|wings?/ },
    { form: "ribs", pattern: /排骨|ribs?/ },
    { form: "shredded", pattern: /肉丝|切丝|shredded/ },
    { form: "diced", pattern: /鸡丁|肉丁|切丁|diced/ },
    { form: "sliced", pattern: /鱼片|肉片|牛柳|切片|sliced|fillet/ },
    { form: "whole", pattern: /整鱼|整鸡|整鸭|全鸡|whole/ },
    { form: "chunks", pattern: /鸡块|鸭块|肉块|牛腩|切块|chunks?/ },
  ];

  return rules.find((rule) => rule.pattern.test(text))?.form ?? "mixed";
}

function inferCookingMethod(text: string) {
  const rules = [
    { method: "deep-fry", pattern: /deep-fry|deep.?frying|油炸|炸制|辣子鸡/ },
    { method: "pan-fry", pattern: /pan-fry|pan.?frying|香煎|煎制/ },
    { method: "steam", pattern: /steaming|蒸制|清蒸|蒸熟|蒸/ },
    { method: "braise", pattern: /braising|红烧|黄焖|焖烧|焖制|焖/ },
    { method: "stew", pattern: /simmering|stew|慢炖|炖煮|炖/ },
    { method: "boil", pattern: /boiling|水煮|煮制/ },
    { method: "stir-fry", pattern: /stir-fry|stir.?frying|爆炒|翻炒|炒制|炒/ },
    { method: "roast", pattern: /roasting|烤制|烘烤/ },
    { method: "cold-mix", pattern: /凉拌|cold.?mix/ },
  ];

  return rules.find((rule) => rule.pattern.test(text))?.method ?? "prepared";
}

function inferFlavorTags(text: string) {
  const rules = [
    { tag: "numbing-spicy", pattern: /麻辣|椒麻|numbing/ },
    { tag: "sweet-sour", pattern: /酸甜|糖醋|sweet.?sour/ },
    { tag: "sweet-savory", pattern: /甜咸|咸甜|sweet.?savory/ },
    { tag: "spicy", pattern: /辣|spicy|chili/ },
    { tag: "garlic", pattern: /蒜蓉|garlic/ },
    { tag: "peppery", pattern: /黑椒|黑胡椒|peppery/ },
    { tag: "light", pattern: /清淡|清鲜|清蒸|light/ },
    { tag: "rich", pattern: /浓郁|浓香|醇厚|红烧|焖|炖|rich/ },
    { tag: "savory", pattern: /咸鲜|鲜香|家常|savory/ },
  ];
  const tags = rules
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.tag);

  return Array.from(new Set(tags.length > 0 ? tags : ["savory"]));
}

function inferDishForm(
  category: RecipeCategoryId,
  cookingMethod: string,
  ingredientForm: string,
) {
  if (category === "fish" && cookingMethod === "steam" && ingredientForm === "whole") {
    return "whole-fish";
  }
  if (
    (category === "shrimp" || category === "crab") &&
    cookingMethod === "steam"
  ) {
    return "steamed-seafood";
  }
  if (cookingMethod === "stew") return "stew";
  if (cookingMethod === "boil") return "soup";
  if (cookingMethod === "braise") return "braised";
  if (cookingMethod === "deep-fry" || cookingMethod === "pan-fry") {
    return "fried";
  }
  if (cookingMethod === "stir-fry") return "dry-stir-fry";
  return "plated-dish";
}

export function deriveHeroVisualTags(
  source: HeroVisualRecipeSource,
): HeroVisualTags {
  const text = compactText(source);
  const primaryCategory = inferCategory(source, text);
  const ingredientForm = inferIngredientForm(text);
  const cookingMethod = inferCookingMethod(text);

  return {
    dishName: source.titleZh.trim(),
    aliases: source.titleEn?.trim() ? [source.titleEn.trim()] : [],
    primaryCategory,
    ingredientForm,
    cookingMethod,
    keyIngredients: keyIngredientRules
      .filter((rule) => rule.pattern.test(text))
      .map((rule) => rule.key),
    flavorTags: inferFlavorTags(text),
    dishForm: inferDishForm(
      primaryCategory,
      cookingMethod,
      ingredientForm,
    ),
  };
}
