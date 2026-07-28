export const RECIPE_CATEGORY_IDS = [
  "chicken",
  "duck",
  "pork",
  "beef",
  "lamb",
  "fish",
  "shrimp",
  "crab",
  "other",
] as const;

export type RecipeCategoryId = (typeof RECIPE_CATEGORY_IDS)[number];

export type ClassificationSource = "ai" | "user" | "rule";

/**
 * Stable, visual-layer-safe summary for one personal recipe category.
 * UI components must consume this rather than querying Supabase directly.
 */
export type ChefCategoryViewModel = {
  id: RecipeCategoryId;
  displayName: string;
  englishName: string;
  description: string;
  recipeCount: number;
  latestRecipeName: string | null;
  href: string;
  isEmpty: boolean;
};
