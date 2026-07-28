import { getCurrentUser } from "@/lib/auth/session";
import {
  buildCategoryStats,
  filterRecipesByCategory,
  getChefCategoryDisplayContent,
  isRecipeCategoryId,
} from "@/lib/classification/recipeCategories";
import { getFavoriteRecipes } from "@/lib/data/favorites";
import {
  isLocalGeneratedRecipeSlug,
  updateLocalGeneratedRecipeCategory,
} from "@/lib/data/localGeneratedRecipe";
import { getMyRecipes } from "@/lib/data/recipes";
import { updateRecipeClassificationInSupabase } from "@/lib/data/supabase/recipes";
import type { Recipe } from "@/types";
import {
  RECIPE_CATEGORY_IDS,
  type ChefCategoryViewModel,
  type RecipeCategoryId,
} from "@/types/classification";

function deduplicateRecipes(recipes: Recipe[]) {
  const seen = new Set<string>();

  return recipes.filter((recipe) => {
    if (seen.has(recipe.slug)) return false;
    seen.add(recipe.slug);
    return true;
  });
}

export async function getPersonalRecipes() {
  const [generatedRecipes, favoriteRecipes] = await Promise.all([
    getMyRecipes(),
    getFavoriteRecipes(),
  ]);

  return deduplicateRecipes([...generatedRecipes, ...favoriteRecipes]);
}

export async function getPersonalRecipesByCategory(
  category: RecipeCategoryId,
) {
  return filterRecipesByCategory(await getPersonalRecipes(), category);
}

export async function getPersonalCategoryStats() {
  return buildCategoryStats(await getPersonalRecipes());
}

/**
 * Maps personal recipes into a complete, fixed-order category list for UI use.
 * It is deliberately pure so a visual component never needs to know data-source
 * or Supabase details.
 */
export function buildChefCategoryViewModels(
  recipes: Recipe[],
): ChefCategoryViewModel[] {
  return RECIPE_CATEGORY_IDS.map((category) => {
    const categoryRecipes = filterRecipesByCategory(recipes, category);
    const content = getChefCategoryDisplayContent(category);

    return {
      id: category,
      ...content,
      recipeCount: categoryRecipes.length,
      latestRecipeName: categoryRecipes[0]?.titleZh ?? null,
      href: `/chef/${category}`,
      isEmpty: categoryRecipes.length === 0,
    };
  });
}

/** Returns all nine categories for the active user or the current local demo. */
export async function getChefCategories(): Promise<ChefCategoryViewModel[]> {
  return buildChefCategoryViewModels(await getPersonalRecipes());
}

/**
 * Explicit-user variant for callers that already hold an authenticated user id.
 * It refuses mismatched identities instead of exposing another user's categories.
 */
export async function getChefCategoriesForUser(
  userId: string,
): Promise<ChefCategoryViewModel[]> {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.id !== userId) {
    return buildChefCategoryViewModels([]);
  }

  return getChefCategories();
}

export async function updateRecipeClassification(
  recipeSlug: string,
  categoryValue: string,
) {
  if (!isRecipeCategoryId(categoryValue)) {
    return { error: "无效的分类。", ok: false };
  }

  if (isLocalGeneratedRecipeSlug(recipeSlug)) {
    const ok = updateLocalGeneratedRecipeCategory(recipeSlug, categoryValue);
    return {
      error: ok ? null : "没有找到这道本地菜谱。",
      ok,
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "请先登录后再修改云端菜谱分类。", ok: false };
  }

  return updateRecipeClassificationInSupabase({
    category: categoryValue,
    recipeSlug,
    userId: user.id,
  });
}
