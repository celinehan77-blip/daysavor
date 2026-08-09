import type { RecipeCategoryId } from "@/types/classification";

export type StationVisualCategory =
  | Exclude<RecipeCategoryId, "crab" | "shrimp">
  | "seafood";

export type StationVisualComposition =
  | "balanced"
  | "diagonal"
  | "elliptical"
  | "flow"
  | "half-circle"
  | "radial";

export type StationVisualAsset = {
  aliases: string[];
  compatibleCategories: RecipeCategoryId[];
  cookingMethods: string[];
  dishNames: string[];
  flavorTags: string[];
  id: string;
  ingredientForms: string[];
  isCategoryFallback?: boolean;
  keyIngredients: string[];
  objectPosition: `${number}% ${number}%`;
  primaryCategory: StationVisualCategory;
  src: string;
  type: "station-visual";
  composition: StationVisualComposition;
};

export type StationVisualMatchLevel =
  | "exact"
  | "alias"
  | "category-method-ingredients"
  | "category-form"
  | "category-method"
  | "category"
  | "category-fallback";

export type StationVisualSelection = {
  assetId: string;
  matchLevel: StationVisualMatchLevel;
  objectPosition: `${number}% ${number}%`;
  primaryCategory: StationVisualCategory;
  score: number;
  src: string;
};
