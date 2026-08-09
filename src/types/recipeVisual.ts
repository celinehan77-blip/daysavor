import type { RecipeCategoryId } from "@/types/classification";

export type RecipeVisualTextSafeArea = "left" | "right" | "none";

export type HeroImagePromptData = {
  dishName: string;
  englishName: string;
  primaryIngredient: string;
  keyIngredients: string[];
  flavor: string;
  cuisine: string;
  composition: string;
  textSafeArea: RecipeVisualTextSafeArea;
};

export type RecipeVisualAssetType =
  | "protein"
  | "ingredient"
  | "seasoning"
  | "step"
  | "fallback";

export type RecipeVisualPresentation = "isolated" | "photographic";

export type RecipeVisualAsset = {
  id: string;
  presentation?: RecipeVisualPresentation;
  src: string;
  type: RecipeVisualAssetType;
  category: string;
  tags: string[];
  compatibleActions: string[];
  aspectRatio: `${number}:${number}`;
  visualWeight: number;
};

export type HeroPrimaryCategory = RecipeCategoryId | "seafood";

export type HeroVisualTags = {
  aliases: string[];
  cookingMethod: string;
  dishForm: string;
  dishName: string;
  flavorTags: string[];
  ingredientForm: string;
  keyIngredients: string[];
  primaryCategory: RecipeCategoryId;
};

export type HeroVisualAsset = {
  aliases: string[];
  cookingMethods: string[];
  dishForm: string;
  dishNames: string[];
  flavorTags: string[];
  id: string;
  ingredientForms: string[];
  isCategoryFallback?: boolean;
  keyIngredients: string[];
  objectPosition: `${number}% ${number}%`;
  primaryCategory: HeroPrimaryCategory;
  src: string;
};

export type HeroMatchLevel =
  | "exact"
  | "alias"
  | "similar"
  | "category"
  | "global"
  | "persisted";

export type HeroVisualSelection = {
  assetId: string;
  level: HeroMatchLevel;
  objectPosition: `${number}% ${number}%`;
  score: number;
  src: string;
};

export type RecipeVisualAssets = {
  heroAssetId: string;
  heroImageUrl: string;
  heroMatchLevel: HeroMatchLevel;
  heroObjectPosition: `${number}% ${number}%`;
  ingredientImageUrl: string;
  proteinImageUrl: string;
  seasoningImageUrl: string;
  stepImageUrls: string[];
};
