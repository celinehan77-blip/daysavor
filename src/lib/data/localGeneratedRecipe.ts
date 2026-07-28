import { ChefHat, CookingPot, Flame, Soup, Star } from "lucide-react";
import { getLatestParsedDraft } from "@/lib/data/parsedDrafts";
import type { Recipe, StationCategoryType } from "@/types";
import type { ParsedRecipeDraft } from "@/types/ai";
import type { RecipeCategoryId } from "@/types/classification";
import {
  normalizeRecipeCategory,
  recipeCategoryLabels,
} from "@/lib/classification/recipeCategories";

export const LOCAL_GENERATED_RECIPE_SLUG = "my-generated-recipe";
const LOCAL_GENERATED_RECIPE_PREFIX = "local-recipe-";
const LOCAL_GENERATED_RECIPES_KEY = "recipe-ticket:local-generated-recipes";
const MAX_LOCAL_GENERATED_RECIPES = 50;

type StoredLocalRecipe = {
  createdAt: string;
  draft: ParsedRecipeDraft;
  slug: string;
};

const stepIcons = [ChefHat, Soup, Flame, CookingPot, Star];

function inferStationCategory(draft: ParsedRecipeDraft): StationCategoryType {
  const value = `${draft.mainIngredient} ${draft.titleZh} ${draft.titleEn}`.toLowerCase();

  if (/鱼|虾|蟹|seafood|fish|shrimp|crab/.test(value)) {
    return "seafood";
  }

  if (/牛|羊|猪|beef|lamb|pork/.test(value)) {
    return "pasture";
  }

  return "poultry";
}

export function mapParsedDraftToLocalRecipe(
  draft: ParsedRecipeDraft,
  slug = LOCAL_GENERATED_RECIPE_SLUG,
): Recipe {
  const foodIngredients = draft.ingredients.filter(
    (ingredient) => ingredient.group !== "seasoning",
  );
  const seasoningIngredients = [
    ...draft.ingredients.filter(
      (ingredient) => ingredient.group === "seasoning",
    ),
    ...draft.seasonings,
  ];

  return {
    id: slug,
    slug,
    titleZh: draft.titleZh,
    titleEn: draft.titleEn,
    stationId: `station-${inferStationCategory(draft)}`,
    coverType: "ticket",
    timeMinutes: draft.timeMinutes,
    difficulty: draft.difficulty,
    flavor: draft.flavor,
    mainIngredient: draft.mainIngredient,
    primaryCategory: normalizeRecipeCategory(draft.primaryCategory),
    primaryIngredient: draft.primaryIngredient || draft.mainIngredient,
    classificationConfidence:
      typeof draft.classificationConfidence === "number"
        ? draft.classificationConfidence
        : 0,
    classificationReason:
      draft.classificationReason || "旧菜谱尚未完成分类，暂归入待整理",
    classificationSource: draft.classificationSource || "rule",
    tags: draft.tags,
    description: draft.description,
    ingredients: foodIngredients.map((ingredient, index) => ({
      id: `local-ingredient-${index + 1}`,
      name: ingredient.name,
      amount: ingredient.amount,
      group: ingredient.group,
      note: ingredient.note,
    })),
    seasonings: seasoningIngredients.map((ingredient, index) => ({
      id: `local-seasoning-${index + 1}`,
      name: ingredient.name,
      amount: ingredient.amount,
      group: "seasoning",
      note: ingredient.note,
    })),
    steps: draft.steps.map((step, index) => ({
      id: `local-step-${index + 1}`,
      title: step.title,
      description: step.description,
      duration: step.duration,
      icon: stepIcons[index % stepIcons.length],
      tips:
        step.heat && step.heat !== "未说明"
          ? `火候：${step.heat}${step.tips ? `；${step.tips}` : ""}`
          : step.tips,
    })),
    savedCount: 0,
  };
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function readStoredLocalRecipes(): StoredLocalRecipe[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const rawRecipes = window.localStorage.getItem(LOCAL_GENERATED_RECIPES_KEY);
    const recipes = rawRecipes ? (JSON.parse(rawRecipes) as unknown) : [];

    if (!Array.isArray(recipes)) {
      return [];
    }

    return recipes.filter(
      (recipe): recipe is StoredLocalRecipe =>
        Boolean(recipe) &&
        typeof recipe === "object" &&
        typeof (recipe as StoredLocalRecipe).slug === "string" &&
        typeof (recipe as StoredLocalRecipe).createdAt === "string" &&
        Boolean((recipe as StoredLocalRecipe).draft),
    );
  } catch {
    return [];
  }
}

function createLocalRecipeSlug() {
  return `${LOCAL_GENERATED_RECIPE_PREFIX}${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function isLocalGeneratedRecipeSlug(slug: string) {
  return (
    slug === LOCAL_GENERATED_RECIPE_SLUG ||
    slug.startsWith(LOCAL_GENERATED_RECIPE_PREFIX)
  );
}

export function saveLocalGeneratedRecipe(draft: ParsedRecipeDraft): Recipe {
  const slug = createLocalRecipeSlug();

  if (canUseLocalStorage()) {
    try {
      const recipes = readStoredLocalRecipes();
      window.localStorage.setItem(
        LOCAL_GENERATED_RECIPES_KEY,
        JSON.stringify(
          [{ createdAt: new Date().toISOString(), draft, slug }, ...recipes].slice(
            0,
            MAX_LOCAL_GENERATED_RECIPES,
          ),
        ),
      );
    } catch {
      return mapParsedDraftToLocalRecipe(draft, slug);
    }
  }

  return mapParsedDraftToLocalRecipe(draft, slug);
}

export function getLocalGeneratedDraftBySlug(
  slug: string,
): ParsedRecipeDraft | null {
  const storedRecipe = readStoredLocalRecipes().find(
    (recipe) => recipe.slug === slug,
  );

  if (storedRecipe) {
    return storedRecipe.draft;
  }

  return slug === LOCAL_GENERATED_RECIPE_SLUG
    ? getLatestParsedDraft()
    : null;
}

export function getLocalGeneratedRecipeBySlug(slug: string): Recipe | null {
  const draft = getLocalGeneratedDraftBySlug(slug);
  return draft ? mapParsedDraftToLocalRecipe(draft, slug) : null;
}

export function getLocalGeneratedRecipes(): Recipe[] {
  const recipes = readStoredLocalRecipes().map((recipe) =>
    mapParsedDraftToLocalRecipe(recipe.draft, recipe.slug),
  );

  if (recipes.length > 0) {
    return recipes;
  }

  const legacyRecipe = getLatestLocalGeneratedRecipe();
  return legacyRecipe ? [legacyRecipe] : [];
}

export function getLatestLocalGeneratedRecipe(): Recipe | null {
  const latestStoredRecipe = readStoredLocalRecipes()[0];

  if (latestStoredRecipe) {
    return mapParsedDraftToLocalRecipe(
      latestStoredRecipe.draft,
      latestStoredRecipe.slug,
    );
  }

  const draft = getLatestParsedDraft();
  return draft
    ? mapParsedDraftToLocalRecipe(draft, LOCAL_GENERATED_RECIPE_SLUG)
    : null;
}

export function updateLocalGeneratedRecipeCategory(
  slug: string,
  category: RecipeCategoryId,
) {
  if (!canUseLocalStorage()) {
    return false;
  }

  const recipes = readStoredLocalRecipes();
  const recipeIndex = recipes.findIndex((recipe) => recipe.slug === slug);

  if (recipeIndex < 0) {
    return false;
  }

  const current = recipes[recipeIndex];
  recipes[recipeIndex] = {
    ...current,
    draft: {
      ...current.draft,
      primaryCategory: category,
      classificationConfidence: 1,
      classificationReason: `用户手动修正为${recipeCategoryLabels[category]}`,
      classificationSource: "user",
    },
  };
  window.localStorage.setItem(
    LOCAL_GENERATED_RECIPES_KEY,
    JSON.stringify(recipes),
  );

  return true;
}
