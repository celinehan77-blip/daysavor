import { ChefHat, CookingPot, Flame, Soup, Star } from "lucide-react";
import { getLatestParsedDraft } from "@/lib/data/parsedDrafts";
import type { Recipe, StationCategoryType } from "@/types";
import type { ParsedRecipeDraft } from "@/types/ai";
import type { RecipeCategoryId } from "@/types/classification";
import {
  normalizeRecipeCategory,
  recipeCategoryLabels,
} from "@/lib/classification/recipeCategories";
import { enrichParsedRecipeDraftVisuals } from "@/lib/recipe-visual/assignment";

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
  const visualDraft = enrichParsedRecipeDraftVisuals(draft, slug);
  const foodIngredients = visualDraft.ingredients.filter(
    (ingredient) => ingredient.group !== "seasoning",
  );
  const seasoningIngredients = [
    ...visualDraft.ingredients.filter(
      (ingredient) => ingredient.group === "seasoning",
    ),
    ...visualDraft.seasonings,
  ];

  return {
    id: slug,
    slug,
    titleZh: visualDraft.titleZh,
    titleEn: visualDraft.titleEn,
    stationId: `station-${inferStationCategory(visualDraft)}`,
    coverType: "ticket",
    timeMinutes: visualDraft.timeMinutes,
    difficulty: visualDraft.difficulty,
    flavor: visualDraft.flavor,
    mainIngredient: visualDraft.mainIngredient,
    primaryCategory: normalizeRecipeCategory(visualDraft.primaryCategory),
    primaryIngredient:
      visualDraft.primaryIngredient || visualDraft.mainIngredient,
    classificationConfidence:
      typeof visualDraft.classificationConfidence === "number"
        ? visualDraft.classificationConfidence
        : 0,
    classificationReason:
      visualDraft.classificationReason || "旧菜谱尚未完成分类，暂归入待整理",
    classificationSource: visualDraft.classificationSource || "rule",
    primaryIngredientTags: visualDraft.primaryIngredientTags ?? [],
    ingredientImageTags: visualDraft.ingredientImageTags ?? [],
    seasoningImageTags: visualDraft.seasoningImageTags ?? [],
    stepActionTags: visualDraft.stepActionTags ?? [],
    heroImagePromptData: visualDraft.heroImagePromptData ?? null,
    heroImageUrl: visualDraft.heroImageUrl,
    heroVisualTags: visualDraft.heroVisualTags,
    visualAssets: visualDraft.visualAssets,
    tags: visualDraft.tags,
    description: visualDraft.description,
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
    steps: visualDraft.steps.map((step, index) => ({
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
  const visualDraft = enrichParsedRecipeDraftVisuals(draft, slug);

  if (canUseLocalStorage()) {
    try {
      const recipes = readStoredLocalRecipes();
      window.localStorage.setItem(
        LOCAL_GENERATED_RECIPES_KEY,
        JSON.stringify(
          [
            {
              createdAt: new Date().toISOString(),
              draft: visualDraft,
              slug,
            },
            ...recipes,
          ].slice(0, MAX_LOCAL_GENERATED_RECIPES),
        ),
      );
    } catch {
      return mapParsedDraftToLocalRecipe(visualDraft, slug);
    }
  }

  return mapParsedDraftToLocalRecipe(visualDraft, slug);
}

export function getLocalGeneratedDraftBySlug(
  slug: string,
): ParsedRecipeDraft | null {
  const storedRecipe = readStoredLocalRecipes().find(
    (recipe) => recipe.slug === slug,
  );

  if (storedRecipe) {
    const visualDraft = enrichParsedRecipeDraftVisuals(
      storedRecipe.draft,
      storedRecipe.slug,
    );

    if (
      canUseLocalStorage() &&
      (!storedRecipe.draft.visualAssets ||
        !storedRecipe.draft.heroVisualTags)
    ) {
      const recipes = readStoredLocalRecipes().map((recipe) =>
        recipe.slug === slug ? { ...recipe, draft: visualDraft } : recipe,
      );
      window.localStorage.setItem(
        LOCAL_GENERATED_RECIPES_KEY,
        JSON.stringify(recipes),
      );
    }

    return visualDraft;
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
    draft: enrichParsedRecipeDraftVisuals(
      {
        ...current.draft,
        heroImageUrl: undefined,
        heroVisualTags: undefined,
        visualAssets: undefined,
        primaryCategory: category,
        classificationConfidence: 1,
        classificationReason: `用户手动修正为${recipeCategoryLabels[category]}`,
        classificationSource: "user",
      },
      slug,
    ),
  };
  window.localStorage.setItem(
    LOCAL_GENERATED_RECIPES_KEY,
    JSON.stringify(recipes),
  );

  return true;
}
