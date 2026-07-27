import type { ParsedIngredient, ParsedStep } from "@/types/ai";
import type { Recipe } from "@/types";
import type {
  SerializableStation,
  StationAccentColor,
  StationCategoryType,
} from "@/types";
import {
  RECIPE_CATEGORY_IDS,
  type ClassificationSource,
  type RecipeCategoryId,
} from "@/types/classification";

export type RecipeClassification = {
  primaryCategory: RecipeCategoryId;
  primaryIngredient: string;
  classificationConfidence: number;
  classificationReason: string;
  classificationSource: ClassificationSource;
};

export const recipeCategoryLabels: Record<RecipeCategoryId, string> = {
  chicken: "鸡师傅",
  duck: "鸭师傅",
  pork: "猪师傅",
  beef: "牛师傅",
  lamb: "羊师傅",
  fish: "鱼师傅",
  shrimp: "虾师傅",
  crab: "蟹师傅",
  other: "待整理",
};

export const FLAVOR_MAP_CATEGORY_IDS = [
  "chicken",
  "beef",
  "fish",
] as const satisfies readonly RecipeCategoryId[];

const categoryPresentation: Record<
  RecipeCategoryId,
  {
    accentColor: StationAccentColor;
    categoryType: StationCategoryType;
    description: string;
    nameEn: string;
  }
> = {
  chicken: {
    accentColor: "sage",
    categoryType: "poultry",
    description: "收藏与生成的鸡肉菜谱",
    nameEn: "Chicken Chef",
  },
  duck: {
    accentColor: "sage",
    categoryType: "poultry",
    description: "收藏与生成的鸭肉菜谱",
    nameEn: "Duck Chef",
  },
  pork: {
    accentColor: "caramel",
    categoryType: "pasture",
    description: "收藏与生成的猪肉菜谱",
    nameEn: "Pork Chef",
  },
  beef: {
    accentColor: "caramel",
    categoryType: "pasture",
    description: "收藏与生成的牛肉菜谱",
    nameEn: "Beef Chef",
  },
  lamb: {
    accentColor: "caramel",
    categoryType: "pasture",
    description: "收藏与生成的羊肉菜谱",
    nameEn: "Lamb Chef",
  },
  fish: {
    accentColor: "blue",
    categoryType: "seafood",
    description: "收藏与生成的鱼类菜谱",
    nameEn: "Fish Chef",
  },
  shrimp: {
    accentColor: "blue",
    categoryType: "seafood",
    description: "收藏与生成的虾类菜谱",
    nameEn: "Shrimp Chef",
  },
  crab: {
    accentColor: "blue",
    categoryType: "seafood",
    description: "收藏与生成的蟹类菜谱",
    nameEn: "Crab Chef",
  },
  other: {
    accentColor: "sage",
    categoryType: "poultry",
    description: "尚未确认主要分类的菜谱",
    nameEn: "To Be Sorted",
  },
};

export function getChefCategoryDisplayContent(category: RecipeCategoryId) {
  const presentation = categoryPresentation[category];

  return {
    description: presentation.description,
    displayName: recipeCategoryLabels[category],
    englishName: presentation.nameEn,
  };
}

const categoryKeywords: Record<
  Exclude<RecipeCategoryId, "other">,
  RegExp
> = {
  chicken: /鸡(?!蛋)|chicken|poulet/,
  duck: /鸭(?!蛋)|duck/,
  pork: /猪|五花肉|猪排|猪肋排|猪里脊|梅花肉|pork/,
  beef: /牛(?!奶|油果)|beef|steak/,
  lamb: /羊(?!奶)|lamb|mutton/,
  fish: /鱼|鲈鱼|鳕鱼|鲫鱼|草鱼|三文鱼|fish|salmon|cod/,
  shrimp: /虾|shrimp|prawn/,
  crab: /蟹|螃蟹|crab/,
};

type ClassifiableRecipeContent = {
  titleZh: string;
  titleEn: string;
  mainIngredient: string;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
};

export function isRecipeCategoryId(value: unknown): value is RecipeCategoryId {
  return (
    typeof value === "string" &&
    (RECIPE_CATEGORY_IDS as readonly string[]).includes(value)
  );
}

export function normalizeRecipeCategory(value: unknown): RecipeCategoryId {
  return isRecipeCategoryId(value) ? value : "other";
}

function matchingCategories(value: string) {
  return Object.entries(categoryKeywords)
    .filter(([, pattern]) => pattern.test(value.toLowerCase()))
    .map(([category]) => category as Exclude<RecipeCategoryId, "other">);
}

function addMatches(
  scores: Record<RecipeCategoryId, number>,
  value: string,
  weight: number,
) {
  for (const category of matchingCategories(value)) {
    scores[category] += weight;
  }
}

function getAmountWeight(amount: string) {
  const grams = amount.match(/(\d+(?:\.\d+)?)\s*(?:克|g\b)/i);

  if (!grams) {
    return 0;
  }

  const value = Number(grams[1]);
  return value >= 300 ? 2 : value >= 100 ? 1 : 0;
}

export function classifyRecipeContent(
  content: ClassifiableRecipeContent,
): RecipeClassification {
  const scores = Object.fromEntries(
    RECIPE_CATEGORY_IDS.map((category) => [category, 0]),
  ) as Record<RecipeCategoryId, number>;
  const bodyScores = Object.fromEntries(
    RECIPE_CATEGORY_IDS.map((category) => [category, 0]),
  ) as Record<RecipeCategoryId, number>;

  addMatches(scores, content.titleZh, 5);
  addMatches(scores, content.titleEn, 4);
  addMatches(scores, content.mainIngredient, 6);
  addMatches(bodyScores, content.mainIngredient, 6);

  content.ingredients.forEach((ingredient, index) => {
    const groupWeight = ingredient.group === "main" ? 5 : 2;
    const firstIngredientWeight = index === 0 ? 2 : 0;
    addMatches(
      scores,
      `${ingredient.name} ${ingredient.note}`,
      groupWeight + firstIngredientWeight + getAmountWeight(ingredient.amount),
    );
    addMatches(
      bodyScores,
      `${ingredient.name} ${ingredient.note}`,
      groupWeight + firstIngredientWeight + getAmountWeight(ingredient.amount),
    );
  });

  for (const step of content.steps) {
    addMatches(
      scores,
      `${step.title} ${step.description} ${step.tips}`,
      1,
    );
    addMatches(
      bodyScores,
      `${step.title} ${step.description} ${step.tips}`,
      1,
    );
  }

  const ranked = RECIPE_CATEGORY_IDS.filter(
    (category) => category !== "other",
  )
    .map((category) => ({ category, score: scores[category] }))
    .sort((left, right) => right.score - left.score);
  const winner = ranked[0];
  const runnerUp = ranked[1];

  if (
    !winner ||
    winner.score < 5 ||
    bodyScores[winner.category] < 4 ||
    winner.score - (runnerUp?.score ?? 0) < 2
  ) {
    return {
      primaryCategory: "other",
      primaryIngredient: content.mainIngredient || content.ingredients[0]?.name || "待确认",
      classificationConfidence: 0.45,
      classificationReason: "未找到足够可靠的单一主体食材，已归入待整理",
      classificationSource: "rule",
    };
  }

  const matchedIngredient =
    content.ingredients.find((ingredient) =>
      matchingCategories(ingredient.name).includes(winner.category),
    )?.name || content.mainIngredient;
  const confidence = Math.min(
    0.95,
    0.62 + winner.score * 0.015 + Math.max(0, winner.score - (runnerUp?.score ?? 0)) * 0.01,
  );

  return {
    primaryCategory: winner.category,
    primaryIngredient: matchedIngredient || content.mainIngredient,
    classificationConfidence: Number(confidence.toFixed(2)),
    classificationReason: `菜名、主食材、用量和烹饪步骤综合指向${recipeCategoryLabels[winner.category].replace("师傅", "")}类主体`,
    classificationSource: "rule",
  };
}

export function filterRecipesByCategory(
  recipes: Recipe[],
  category: RecipeCategoryId,
) {
  return recipes.filter(
    (recipe) => normalizeRecipeCategory(recipe.primaryCategory) === category,
  );
}

export function buildCategoryStats(recipes: Recipe[]) {
  const stats = Object.fromEntries(
    RECIPE_CATEGORY_IDS.map((category) => [category, 0]),
  ) as Record<RecipeCategoryId, number>;

  for (const recipe of recipes) {
    stats[normalizeRecipeCategory(recipe.primaryCategory)] += 1;
  }

  return stats;
}

export function applyUserCategoryCorrection(
  recipe: Recipe,
  category: RecipeCategoryId,
): Recipe {
  return {
    ...recipe,
    primaryCategory: category,
    classificationConfidence: 1,
    classificationReason: "用户手动修正主要分类",
    classificationSource: "user",
  };
}

export function buildCategoryStation(
  category: RecipeCategoryId,
  recipes: Recipe[],
): SerializableStation {
  const presentation = categoryPresentation[category];
  const averageMinutes =
    recipes.length > 0
      ? Math.round(
          recipes.reduce((total, recipe) => total + recipe.timeMinutes, 0) /
            recipes.length,
        )
      : 0;
  const difficulty =
    recipes.find((recipe) => recipe.difficulty)?.difficulty ?? "暂无";

  return {
    id: `chef-${category}`,
    slug: category,
    nameZh: recipeCategoryLabels[category],
    nameEn: presentation.nameEn,
    description: presentation.description,
    recipeCount: recipes.length,
    averageTime: averageMinutes > 0 ? `${averageMinutes} 分钟` : "暂无",
    difficulty,
    categoryType: presentation.categoryType,
    accentColor: presentation.accentColor,
    route: `/chef/${category}`,
  };
}
