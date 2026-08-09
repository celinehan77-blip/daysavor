import {
  getRecipeBySlug as getMockRecipeBySlug,
  getRecipeDetailBySlug as getMockRecipeDetailBySlug,
  getRecipesByStationSlug as getMockRecipesByStationSlug,
  recipes,
} from "@/lib/mockData";
import {
  createRecipeFromParsedDraftInSupabase,
  getAllRecipesFromSupabase,
  getMyRecipesFromSupabase,
  getRecipeBySlugFromSupabase,
  getRecipeDetailBySlugFromSupabase,
  getRecipesByStationSlugFromSupabase,
} from "@/lib/data/supabase/recipes";
import { getCurrentUser } from "@/lib/auth/session";
import {
  mapSupabaseRecipeDetailToRecipe,
  mapSupabaseRecipeToRecipe,
} from "@/lib/data/supabase/mappers";
import type { Recipe } from "@/types";
import type { ParsedRecipeDraft, RecipeParseSourcePlatform } from "@/types/ai";
import {
  getLocalGeneratedRecipeBySlug,
  getLocalGeneratedRecipes,
  saveLocalGeneratedRecipe,
} from "@/lib/data/localGeneratedRecipe";
import { enrichRecipeVisuals } from "@/lib/recipe-visual/assignment";

export type RecipeCardData = Pick<
  Recipe,
  | "titleZh"
  | "titleEn"
  | "timeMinutes"
  | "difficulty"
  | "flavor"
  | "mainIngredient"
  | "description"
  | "tags"
  | "slug"
>;

export type CreateRecipeFromParsedDraftInput = {
  preferLocal?: boolean;
  draft: ParsedRecipeDraft;
  sourcePlatform?: RecipeParseSourcePlatform;
  sourceUrl?: string;
  stationSlug?: string;
};

export type CreateRecipeFromParsedDraftResult = {
  error: string | null;
  fallbackSlug: string;
  id: string | null;
  ok: boolean;
  slug: string;
  usedFallback: boolean;
};

const DEFAULT_GENERATED_RECIPE_SLUG = "kung-pao-chicken";

function sortRecipesByMockOrder(nextRecipes: Recipe[]): Recipe[] {
  return [...nextRecipes].sort((left, right) => {
    const leftIndex = recipes.findIndex((recipe) => recipe.slug === left.slug);
    const rightIndex = recipes.findIndex((recipe) => recipe.slug === right.slug);

    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });
}

export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const supabaseRecipes = (await getAllRecipesFromSupabase())
      .map(mapSupabaseRecipeToRecipe)
      .filter((recipe): recipe is Recipe => Boolean(recipe));

    if (supabaseRecipes.length > 0) {
      return sortRecipesByMockOrder(supabaseRecipes);
    }
  } catch {
    return recipes;
  }

  return recipes;
}

export async function getMyRecipes(): Promise<Recipe[]> {
  const user = await getCurrentUser();

  if (!user) {
    return getLocalGeneratedRecipes();
  }

  try {
    return (await getMyRecipesFromSupabase(user.id))
      .map(mapSupabaseRecipeToRecipe)
      .filter((recipe): recipe is Recipe => Boolean(recipe));
  } catch {
    return [];
  }
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const localRecipe = getLocalGeneratedRecipeBySlug(slug);

  if (localRecipe) {
    return localRecipe;
  }

  try {
    const supabaseRecipe = await getRecipeBySlugFromSupabase(slug);
    const recipe = supabaseRecipe
      ? mapSupabaseRecipeToRecipe(supabaseRecipe)
      : null;

    if (recipe) {
      return enrichRecipeVisuals(recipe);
    }
  } catch {
    const recipe = getMockRecipeBySlug(slug);
    return recipe ? enrichRecipeVisuals(recipe) : null;
  }

  const recipe = getMockRecipeBySlug(slug);
  return recipe ? enrichRecipeVisuals(recipe) : null;
}

export async function getRecipesByStationId(stationId: string): Promise<Recipe[]> {
  const allRecipes = await getAllRecipes();

  return allRecipes.filter((recipe) => recipe.stationId === stationId);
}

export async function getRecipesByStationSlug(
  stationSlug: string,
): Promise<Recipe[]> {
  try {
    const supabaseRecipes = (await getRecipesByStationSlugFromSupabase(stationSlug))
      .map(mapSupabaseRecipeToRecipe)
      .filter((recipe): recipe is Recipe => Boolean(recipe));

    if (supabaseRecipes.length > 0) {
      return sortRecipesByMockOrder(supabaseRecipes);
    }
  } catch {
    return getMockRecipesByStationSlug(stationSlug);
  }

  return getMockRecipesByStationSlug(stationSlug);
}

export async function getRecipeDetailBySlug(
  slug: string,
): Promise<Recipe | null> {
  try {
    const supabaseRecipeDetail = await getRecipeDetailBySlugFromSupabase(slug);
    const recipe = supabaseRecipeDetail
      ? mapSupabaseRecipeDetailToRecipe(supabaseRecipeDetail)
      : null;

    if (recipe) {
      return enrichRecipeVisuals(recipe);
    }
  } catch {
    const recipe = getMockRecipeDetailBySlug(slug);
    return recipe ? enrichRecipeVisuals(recipe) : null;
  }

  const recipe = getMockRecipeDetailBySlug(slug);
  return recipe ? enrichRecipeVisuals(recipe) : null;
}

export async function getRecipeCardData(
  slug: string,
): Promise<RecipeCardData | null> {
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    return null;
  }

  return {
    titleZh: recipe.titleZh,
    titleEn: recipe.titleEn,
    timeMinutes: recipe.timeMinutes,
    difficulty: recipe.difficulty,
    flavor: recipe.flavor,
    mainIngredient: recipe.mainIngredient,
    description: recipe.description,
    tags: recipe.tags,
    slug: recipe.slug,
  };
}

export async function createRecipeFromParsedDraft({
  preferLocal = false,
  draft,
  sourcePlatform = "mock",
  sourceUrl,
  stationSlug,
}: CreateRecipeFromParsedDraftInput): Promise<CreateRecipeFromParsedDraftResult> {
  try {
    const user = await getCurrentUser();

    if (!user || preferLocal) {
      const localRecipe = saveLocalGeneratedRecipe(draft);

      return {
        error: null,
        fallbackSlug: DEFAULT_GENERATED_RECIPE_SLUG,
        id: null,
        ok: true,
        slug: localRecipe.slug,
        usedFallback: preferLocal,
      };
    }

    const result = await createRecipeFromParsedDraftInSupabase({
      draft,
      sourcePlatform,
      sourceUrl,
      stationSlug,
      userId: user.id,
    });

    if (!result.ok || !result.slug) {
      const localRecipe = saveLocalGeneratedRecipe(draft);

      return {
        error: result.error,
        fallbackSlug: DEFAULT_GENERATED_RECIPE_SLUG,
        id: result.id,
        ok: true,
        slug: localRecipe.slug,
        usedFallback: true,
      };
    }

    return {
      error: null,
      fallbackSlug: DEFAULT_GENERATED_RECIPE_SLUG,
      id: result.id,
      ok: true,
      slug: result.slug,
      usedFallback: false,
    };
  } catch (error) {
    const localRecipe = saveLocalGeneratedRecipe(draft);

    return {
      error: error instanceof Error ? error.message : "Recipe creation failed.",
      fallbackSlug: DEFAULT_GENERATED_RECIPE_SLUG,
      id: null,
      ok: true,
      slug: localRecipe.slug,
      usedFallback: true,
    };
  }
}
