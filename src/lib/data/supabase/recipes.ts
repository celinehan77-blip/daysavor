import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  SupabaseIngredientRow,
  SupabaseRecipeRow,
  SupabaseRecipeStepRow,
} from "@/lib/data/supabase/mappers";
import type { IngredientGroup } from "@/types";
import type {
  ParsedIngredient,
  ParsedRecipeDraft,
  RecipeParseSourcePlatform,
} from "@/types/ai";
import type { RecipeCategoryId } from "@/types/classification";

export type SupabaseRecipeDetail = {
  recipe: SupabaseRecipeRow;
  ingredients: SupabaseIngredientRow[];
  steps: SupabaseRecipeStepRow[];
};

export type CreateRecipeFromParsedDraftInput = {
  draft: ParsedRecipeDraft;
  sourcePlatform?: RecipeParseSourcePlatform;
  sourceUrl?: string;
  stationSlug?: string;
  userId?: string | null;
};

export type CreateRecipeFromParsedDraftResult = {
  error: string | null;
  id: string | null;
  ok: boolean;
  recipe: SupabaseRecipeRow | null;
  slug: string | null;
};

const knownTitleSlugMap = new Map<string, string>([
  ["宫保鸡丁", "kung-pao-chicken"],
  ["土豆炖牛肉", "beef-stew"],
  ["清蒸鱼", "steamed-fish"],
]);

function inferStationSlug(draft: ParsedRecipeDraft) {
  const value = `${draft.mainIngredient} ${draft.titleZh} ${draft.titleEn}`.toLowerCase();

  if (
    value.includes("鱼") ||
    value.includes("虾") ||
    value.includes("seafood") ||
    value.includes("fish")
  ) {
    return "seafood";
  }

  if (value.includes("牛") || value.includes("beef")) {
    return "pasture";
  }

  if (value.includes("鸡") || value.includes("chicken")) {
    return "chicken";
  }

  return "chicken";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getBaseSlug(draft: ParsedRecipeDraft) {
  return (
    knownTitleSlugMap.get(draft.titleZh) ||
    slugify(draft.titleEn) ||
    slugify(draft.titleZh) ||
    "generated-recipe"
  );
}

function asIngredientGroup(group: unknown, fallback: IngredientGroup) {
  return group === "main" || group === "side" || group === "seasoning"
    ? group
    : fallback;
}

function mapIngredientRows(
  recipeId: string,
  ingredients: ParsedIngredient[],
  seasonings: ParsedIngredient[],
) {
  const mainRows = ingredients.map((ingredient, index) => ({
    recipe_id: recipeId,
    name: ingredient.name,
    amount: ingredient.amount,
    group_type: asIngredientGroup(ingredient.group, index === 0 ? "main" : "side"),
    note: ingredient.note,
    sort_order: index,
  }));
  const seasoningRows = seasonings.map((ingredient, index) => ({
    recipe_id: recipeId,
    name: ingredient.name,
    amount: ingredient.amount,
    group_type: asIngredientGroup(ingredient.group, "seasoning"),
    note: ingredient.note,
    sort_order: mainRows.length + index,
  }));

  return [...mainRows, ...seasoningRows];
}

export function buildRecipeInsertPayload({
  draft,
  slug,
  sourcePlatform,
  sourceUrl,
  stationId,
  userId,
}: {
  draft: ParsedRecipeDraft;
  slug: string;
  sourcePlatform: RecipeParseSourcePlatform;
  sourceUrl?: string;
  stationId: string | null;
  userId: string;
}) {
  return {
    cover_type: "generated",
    description: draft.description,
    difficulty: draft.difficulty,
    flavor: draft.flavor,
    is_generated: true,
    main_ingredient: draft.mainIngredient,
    primary_category: draft.primaryCategory,
    primary_ingredient: draft.primaryIngredient,
    classification_confidence: draft.classificationConfidence,
    classification_reason: draft.classificationReason,
    classification_source: draft.classificationSource,
    saved_count: 0,
    slug,
    source_platform: sourcePlatform,
    source_url: sourceUrl ?? null,
    station_id: stationId,
    time_minutes: draft.timeMinutes,
    title_en: draft.titleEn,
    title_zh: draft.titleZh,
    user_id: userId,
  };
}

async function getStationIdBySlug(stationSlug: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("stations")
    .select("id")
    .eq("slug", stationSlug)
    .maybeSingle<{ id: string }>();

  if (error || !data?.id) {
    return null;
  }

  return data.id;
}

async function recipeSlugExists(slug: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return true;
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();

  return Boolean(!error && data?.id);
}

async function createUniqueRecipeSlug(draft: ParsedRecipeDraft) {
  const baseSlug = getBaseSlug(draft);

  for (let index = 0; index < 30; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;

    if (!(await recipeSlugExists(candidate))) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

async function cleanupCreatedRecipe(recipeId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

  return !error;
}

async function rollbackCreatedRecipe(recipeId: string, reason: string) {
  const cleanedUp = await cleanupCreatedRecipe(recipeId);

  return cleanedUp
    ? `${reason} The incomplete recipe was removed.`
    : `${reason} Cleanup failed; an incomplete recipe may remain.`;
}

export async function getAllRecipesFromSupabase(): Promise<
  SupabaseRecipeRow[]
> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("*, stations(slug)")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getMyRecipesFromSupabase(
  userId: string,
): Promise<SupabaseRecipeRow[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("*, stations(slug)")
    .eq("user_id", userId)
    .eq("is_generated", true)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function updateRecipeClassificationInSupabase({
  category,
  recipeSlug,
  userId,
}: {
  category: RecipeCategoryId;
  recipeSlug: string;
  userId: string;
}) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { error: "Supabase is not configured.", ok: false };
  }

  const { data, error } = await supabase
    .from("recipes")
    .update({
      primary_category: category,
      classification_confidence: 1,
      classification_reason: "用户手动修正主要分类",
      classification_source: "user",
      updated_at: new Date().toISOString(),
    })
    .eq("slug", recipeSlug)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle<{ id: string }>();

  return {
    error: error?.message ?? (data ? null : "Only the recipe owner can update its classification."),
    ok: !error && Boolean(data),
  };
}

export async function getRecipeBySlugFromSupabase(
  slug: string,
): Promise<SupabaseRecipeRow | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("*, stations(slug)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function getRecipesByStationSlugFromSupabase(
  stationSlug: string,
): Promise<SupabaseRecipeRow[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("*, stations!inner(slug)")
    .eq("stations.slug", stationSlug)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getRecipeDetailBySlugFromSupabase(
  slug: string,
): Promise<SupabaseRecipeDetail | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const recipe = await getRecipeBySlugFromSupabase(slug);

  if (!recipe || typeof recipe.id !== "string") {
    return null;
  }

  const [ingredientsResult, stepsResult] = await Promise.all([
    supabase
      .from("ingredients")
      .select("*")
      .eq("recipe_id", recipe.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("recipe_steps")
      .select("*")
      .eq("recipe_id", recipe.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (
    ingredientsResult.error ||
    stepsResult.error ||
    !ingredientsResult.data?.length ||
    !stepsResult.data?.length
  ) {
    return null;
  }

  return {
    recipe,
    ingredients: ingredientsResult.data,
    steps: stepsResult.data,
  };
}

export async function createRecipeFromParsedDraftInSupabase({
  draft,
  sourcePlatform = "mock",
  sourceUrl,
  stationSlug,
  userId,
}: CreateRecipeFromParsedDraftInput): Promise<CreateRecipeFromParsedDraftResult> {
  const supabase = getSupabaseClient();

  if (!supabase || !userId) {
    return {
      error: "Supabase is not configured or user is not signed in.",
      id: null,
      ok: false,
      recipe: null,
      slug: null,
    };
  }

  const resolvedStationSlug = stationSlug ?? inferStationSlug(draft);
  const stationId = await getStationIdBySlug(resolvedStationSlug);
  const slug = await createUniqueRecipeSlug(draft);

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert(
      buildRecipeInsertPayload({
        draft,
        slug,
        sourcePlatform,
        sourceUrl,
        stationId,
        userId,
      }),
    )
    .select("*, stations(slug)")
    .maybeSingle<SupabaseRecipeRow>();

  const recipeId = typeof recipe?.id === "string" ? recipe.id : null;

  if (recipeError || !recipe || !recipeId) {
    return {
      error: recipeError?.message ?? "Recipe insert failed.",
      id: null,
      ok: false,
      recipe: null,
      slug: null,
    };
  }

  const ingredientRows = mapIngredientRows(
    recipeId,
    draft.ingredients,
    draft.seasonings,
  );
  const stepRows = draft.steps.map((step, index) => ({
    recipe_id: recipeId,
    title: step.title,
    description: step.description,
    duration: step.duration,
    tips:
      step.heat && step.heat !== "未说明"
        ? `火候：${step.heat}${step.tips ? `；${step.tips}` : ""}`
        : step.tips,
    sort_order: index,
  }));

  if (ingredientRows.length === 0) {
    return {
      error: await rollbackCreatedRecipe(
        recipeId,
        "Recipe write failed because ingredients were empty.",
      ),
      id: null,
      ok: false,
      recipe: null,
      slug: null,
    };
  }

  if (stepRows.length === 0) {
    return {
      error: await rollbackCreatedRecipe(
        recipeId,
        "Recipe write failed because steps were empty.",
      ),
      id: null,
      ok: false,
      recipe: null,
      slug: null,
    };
  }

  if (ingredientRows.length > 0) {
    const { error } = await supabase.from("ingredients").insert(ingredientRows);

    if (error) {
      return {
        error: await rollbackCreatedRecipe(
          recipeId,
          `Ingredients insert failed: ${error.message}`,
        ),
        id: null,
        ok: false,
        recipe: null,
        slug: null,
      };
    }
  }

  if (stepRows.length > 0) {
    const { error } = await supabase.from("recipe_steps").insert(stepRows);

    if (error) {
      return {
        error: await rollbackCreatedRecipe(
          recipeId,
          `Recipe steps insert failed: ${error.message}`,
        ),
        id: null,
        ok: false,
        recipe: null,
        slug: null,
      };
    }
  }

  return {
    error: null,
    id: recipeId,
    ok: true,
    recipe,
    slug,
  };
}
