import type { Ingredient } from "@/types";

export const RECIPE_ASSET_FALLBACK =
  "/images/recipe-assets/fallback/neutral-food.png";

const proteinAssets = [
  {
    keywords: ["鸡腿", "鸡胸", "鸡翅", "鸡肉", "鸡"],
    path: "/images/recipe-assets/proteins/chicken.png",
  },
  {
    keywords: ["五花肉", "排骨", "里脊", "猪肉", "猪"],
    path: "/images/recipe-assets/proteins/pork.png",
  },
  {
    keywords: ["牛腩", "牛排", "牛肉", "牛"],
    path: "/images/recipe-assets/proteins/beef.png",
  },
  {
    keywords: ["鱼片", "鱼肉", "鱼"],
    path: "/images/recipe-assets/proteins/fish.png",
  },
] as const;

const ingredientAssets = [
  {
    keywords: ["辣椒", "小米辣", "干辣椒", "花椒"],
    path: "/images/recipe-assets/ingredients/chili-peppercorn.png",
  },
  {
    keywords: ["葱", "姜", "蒜"],
    path: "/images/recipe-assets/ingredients/scallion-ginger-garlic.png",
  },
  {
    keywords: ["蘑菇", "香菇", "菌", "蔬菜", "青菜"],
    path: "/images/recipe-assets/ingredients/mushroom-vegetables.png",
  },
  {
    keywords: ["花生", "芝麻", "坚果", "种子"],
    path: "/images/recipe-assets/ingredients/nuts-seeds.png",
  },
  {
    keywords: ["豆腐", "豆干", "豆类", "豆"],
    path: "/images/recipe-assets/ingredients/tofu-beans.png",
  },
] as const;

const seasoningAssets = [
  {
    keywords: ["酱油", "生抽", "老抽", "醋", "料酒", "黄酒"],
    path: "/images/recipe-assets/seasonings/soy-vinegar-wine.png",
  },
  {
    keywords: ["盐", "糖", "淀粉"],
    path: "/images/recipe-assets/seasonings/salt-sugar-starch.png",
  },
  {
    keywords: ["辣椒油", "香油", "芝麻油"],
    path: "/images/recipe-assets/seasonings/chili-oil-sesame-oil.png",
  },
] as const;

const stepAssets = [
  {
    keywords: ["切", "改刀", "处理"],
    path: "/images/recipe-assets/steps/cutting.png",
  },
  {
    keywords: ["腌", "腌制"],
    path: "/images/recipe-assets/steps/marinating.png",
  },
  {
    keywords: ["准备", "备料", "配菜"],
    path: "/images/recipe-assets/steps/preparing.png",
  },
  {
    keywords: ["爆香", "炒香"],
    path: "/images/recipe-assets/steps/frying-aromatics.png",
  },
  {
    keywords: ["收汁", "勾芡"],
    path: "/images/recipe-assets/steps/thickening-sauce.png",
  },
  {
    keywords: ["装盘", "出锅", "盛出"],
    path: "/images/recipe-assets/steps/plating.png",
  },
  {
    keywords: ["炖", "焖", "煮"],
    path: "/images/recipe-assets/steps/simmering.png",
  },
  {
    keywords: ["翻炒", "合炒", "炒"],
    path: "/images/recipe-assets/steps/stir-frying.png",
  },
] as const;

function ingredientText(ingredients: Ingredient[]) {
  return ingredients
    .map((ingredient) => `${ingredient.name} ${ingredient.note}`)
    .join(" ");
}

function matchAsset(
  text: string,
  assets: ReadonlyArray<{
    keywords: readonly string[];
    path: string;
  }>,
) {
  return (
    assets.find((asset) =>
      asset.keywords.some((keyword) => text.includes(keyword)),
    )?.path ?? RECIPE_ASSET_FALLBACK
  );
}

export function getProteinImage(ingredients: Ingredient[]) {
  return matchAsset(ingredientText(ingredients), proteinAssets);
}

export function getIngredientGroupImage(ingredients: Ingredient[]) {
  return matchAsset(ingredientText(ingredients), ingredientAssets);
}

export function getSeasoningImage(seasonings: Ingredient[]) {
  return matchAsset(ingredientText(seasonings), seasoningAssets);
}

export function getStepImage(stepText: string) {
  return matchAsset(stepText, stepAssets);
}
