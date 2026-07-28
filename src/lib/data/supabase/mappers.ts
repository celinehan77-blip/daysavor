import {
  Beef,
  Bird,
  ChefHat,
  CookingPot,
  Fish,
  Flame,
  Soup,
  Star,
} from "lucide-react";
import {
  getRecipeBySlug as getMockRecipeBySlug,
  getRecipeDetailBySlug as getMockRecipeDetailBySlug,
  getStationBySlug as getMockStationBySlug,
} from "@/lib/mockData";
import type {
  Ingredient,
  IngredientGroup,
  Recipe,
  RecipeCoverType,
  RecipeStep,
  Station,
  StationAccentColor,
  StationCategoryType,
} from "@/types";
import type {
  ClassificationSource,
  RecipeCategoryId,
} from "@/types/classification";
import { normalizeRecipeCategory } from "@/lib/classification/recipeCategories";

export type SupabaseStationRow = {
  id?: unknown;
  slug?: unknown;
  name_zh?: unknown;
  name_en?: unknown;
  description?: unknown;
  category_type?: unknown;
  icon?: unknown;
  accent_color?: unknown;
  recipe_count?: unknown;
  average_time?: unknown;
  difficulty?: unknown;
};

export type SupabaseRecipeRow = {
  id?: unknown;
  slug?: unknown;
  station_id?: unknown;
  title_zh?: unknown;
  title_en?: unknown;
  description?: unknown;
  time_minutes?: unknown;
  difficulty?: unknown;
  flavor?: unknown;
  main_ingredient?: unknown;
  primary_category?: unknown;
  primary_ingredient?: unknown;
  classification_confidence?: unknown;
  classification_reason?: unknown;
  classification_source?: unknown;
  saved_count?: unknown;
  cover_type?: unknown;
  stations?: unknown;
};

export type SupabaseIngredientRow = {
  id?: unknown;
  name?: unknown;
  amount?: unknown;
  group_type?: unknown;
  note?: unknown;
};

export type SupabaseRecipeStepRow = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  duration?: unknown;
  tips?: unknown;
};

const stationIconMap = {
  poultry: Bird,
  pasture: Beef,
  seafood: Fish,
} satisfies Record<StationCategoryType, Station["icon"]>;

const stepIcons = [ChefHat, Soup, Flame, CookingPot, Star];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asCategoryType(
  value: unknown,
  fallback: StationCategoryType,
): StationCategoryType {
  return value === "poultry" || value === "pasture" || value === "seafood"
    ? value
    : fallback;
}

function asAccentColor(
  value: unknown,
  fallback: StationAccentColor,
): StationAccentColor {
  return value === "sage" || value === "caramel" || value === "blue"
    ? value
    : fallback;
}

function asIngredientGroup(value: unknown): IngredientGroup {
  return value === "main" || value === "side" || value === "seasoning"
    ? value
    : "side";
}

function asCoverType(value: unknown, fallback: RecipeCoverType): RecipeCoverType {
  return value === "illustration" || value === "photo" || value === "ticket"
    ? value
    : fallback;
}

function asClassificationSource(value: unknown): ClassificationSource {
  return value === "ai" || value === "user" || value === "rule"
    ? value
    : "rule";
}

function categoryStationId(category: RecipeCategoryId) {
  if (category === "chicken" || category === "duck") return "station-chicken";
  if (category === "pork" || category === "beef" || category === "lamb") {
    return "station-pasture";
  }
  if (category === "fish" || category === "shrimp" || category === "crab") {
    return "station-seafood";
  }
  return "station-other";
}

function getJoinedStationSlug(row: SupabaseRecipeRow): string {
  const joinedStation = row.stations;

  if (Array.isArray(joinedStation)) {
    return asString(joinedStation[0]?.slug);
  }

  if (
    joinedStation &&
    typeof joinedStation === "object" &&
    "slug" in joinedStation
  ) {
    return asString(joinedStation.slug);
  }

  return "";
}

function getFallbackTags(recipe: Recipe | null, row: SupabaseRecipeRow): string[] {
  if (recipe?.tags.length) {
    return recipe.tags;
  }

  return [
    asString(row.flavor),
    asString(row.main_ingredient).split(" · ")[0],
    `${asNumber(row.time_minutes)} 分钟`,
  ].filter(Boolean);
}

export function mapSupabaseStationToStation(
  row: SupabaseStationRow,
): Station | null {
  const slug = asString(row.slug);

  if (!slug) {
    return null;
  }

  const fallback = getMockStationBySlug(slug);
  const categoryType = asCategoryType(
    row.category_type,
    fallback?.categoryType ?? "poultry",
  );
  const accentColor = asAccentColor(
    row.accent_color,
    fallback?.accentColor ?? "sage",
  );
  const averageTime = asNumber(row.average_time);

  return {
    id: fallback?.id ?? `station-${slug}`,
    slug,
    nameZh: asString(row.name_zh, fallback?.nameZh ?? slug),
    nameEn: asString(row.name_en, fallback?.nameEn ?? "Station"),
    description: asString(row.description, fallback?.description ?? ""),
    recipeCount: asNumber(row.recipe_count, fallback?.recipeCount ?? 0),
    averageTime:
      averageTime > 0 ? `${averageTime} 分钟` : fallback?.averageTime ?? "暂无",
    difficulty: asString(row.difficulty, fallback?.difficulty ?? "暂无"),
    categoryType,
    accentColor,
    route: `/station/${slug}`,
    icon: stationIconMap[categoryType],
  };
}

export function mapSupabaseRecipeToRecipe(row: SupabaseRecipeRow): Recipe | null {
  const slug = asString(row.slug);

  if (!slug) {
    return null;
  }

  const fallback = getMockRecipeDetailBySlug(slug) ?? getMockRecipeBySlug(slug);
  const stationSlug = getJoinedStationSlug(row);
  const primaryCategory = normalizeRecipeCategory(row.primary_category);

  return {
    id: fallback?.id ?? `recipe-${slug}`,
    slug,
    titleZh: asString(row.title_zh, fallback?.titleZh ?? slug),
    titleEn: asString(row.title_en, fallback?.titleEn ?? ""),
    stationId:
      categoryStationId(primaryCategory) ??
      fallback?.stationId ??
      (stationSlug ? `station-${stationSlug}` : asString(row.station_id)),
    coverType: asCoverType(row.cover_type, fallback?.coverType ?? "illustration"),
    timeMinutes: asNumber(row.time_minutes, fallback?.timeMinutes ?? 0),
    difficulty: asString(row.difficulty, fallback?.difficulty ?? "暂无"),
    flavor: asString(row.flavor, fallback?.flavor ?? "暂无"),
    mainIngredient: asString(
      row.main_ingredient,
      fallback?.mainIngredient ?? "主食材",
    ),
    primaryCategory,
    primaryIngredient: asString(
      row.primary_ingredient,
      asString(row.main_ingredient, fallback?.mainIngredient ?? "待确认"),
    ),
    classificationConfidence: Math.min(
      1,
      Math.max(0, asNumber(row.classification_confidence, 0)),
    ),
    classificationReason: asString(
      row.classification_reason,
      "旧菜谱尚未完成分类，暂归入待整理",
    ),
    classificationSource: asClassificationSource(row.classification_source),
    tags: getFallbackTags(fallback, row),
    description: asString(row.description, fallback?.description ?? ""),
    ingredients: fallback?.ingredients ?? [],
    seasonings: fallback?.seasonings ?? [],
    steps: fallback?.steps ?? [],
    savedCount: asNumber(row.saved_count, fallback?.savedCount ?? 0),
  };
}

export function mapSupabaseIngredientToIngredient(
  row: SupabaseIngredientRow,
): Ingredient | null {
  const name = asString(row.name);

  if (!name) {
    return null;
  }

  return {
    id: asString(row.id, `ingredient-${name}`),
    name,
    amount: asString(row.amount, "适量"),
    group: asIngredientGroup(row.group_type),
    note: asString(row.note, ""),
  };
}

export function mapSupabaseStepToRecipeStep(
  row: SupabaseRecipeStepRow,
  index: number,
  fallback?: RecipeStep,
): RecipeStep | null {
  const title = asString(row.title);

  if (!title) {
    return null;
  }

  return {
    id: asString(row.id, fallback?.id ?? `step-${index + 1}`),
    title,
    description: asString(row.description, fallback?.description ?? ""),
    duration: asString(row.duration, fallback?.duration ?? "暂无"),
    icon: fallback?.icon ?? stepIcons[index % stepIcons.length],
    tips: asString(row.tips, fallback?.tips ?? ""),
  };
}

export function mapSupabaseRecipeDetailToRecipe({
  recipe,
  ingredients,
  steps,
}: {
  recipe: SupabaseRecipeRow;
  ingredients: SupabaseIngredientRow[];
  steps: SupabaseRecipeStepRow[];
}): Recipe | null {
  const baseRecipe = mapSupabaseRecipeToRecipe(recipe);

  if (!baseRecipe) {
    return null;
  }

  const fallback = getMockRecipeDetailBySlug(baseRecipe.slug);
  const mappedIngredients = ingredients
    .map(mapSupabaseIngredientToIngredient)
    .filter((ingredient): ingredient is Ingredient => Boolean(ingredient));
  const mappedSteps = steps
    .map((step, index) =>
      mapSupabaseStepToRecipeStep(step, index, fallback?.steps[index]),
    )
    .filter((step): step is RecipeStep => Boolean(step));

  return {
    ...baseRecipe,
    ingredients:
      mappedIngredients.filter((ingredient) => ingredient.group !== "seasoning")
        .length > 0
        ? mappedIngredients.filter(
            (ingredient) => ingredient.group !== "seasoning",
          )
        : baseRecipe.ingredients,
    seasonings:
      mappedIngredients.filter((ingredient) => ingredient.group === "seasoning")
        .length > 0
        ? mappedIngredients.filter(
            (ingredient) => ingredient.group === "seasoning",
          )
        : baseRecipe.seasonings,
    steps: mappedSteps.length > 0 ? mappedSteps : baseRecipe.steps,
  };
}
