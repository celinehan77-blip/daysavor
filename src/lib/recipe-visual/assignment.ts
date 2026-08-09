import { deriveHeroVisualTags } from "@/lib/recipe-visual/deriveHeroVisualTags";
import {
  getHeroVisualSelection,
  getIngredientImage,
  getProteinImage,
  getSeasoningImage,
  getStepImage,
} from "@/lib/recipe-visual/matcher";
import type { SerializableRecipe } from "@/types";
import type { ParsedRecipeDraft } from "@/types/ai";
import type { RecipeVisualAssets } from "@/types/recipeVisual";

export function assignRecipeVisualAssets(
  recipe: SerializableRecipe,
): RecipeVisualAssets {
  if (recipe.visualAssets) {
    return recipe.visualAssets;
  }

  const hero = getHeroVisualSelection(recipe);

  return {
    heroAssetId: hero.assetId,
    heroImageUrl: hero.src,
    heroMatchLevel: hero.level,
    heroObjectPosition: hero.objectPosition,
    proteinImageUrl: getProteinImage(recipe),
    ingredientImageUrl: getIngredientImage(recipe),
    seasoningImageUrl: getSeasoningImage(recipe),
    stepImageUrls: recipe.steps.map((step, index) =>
      getStepImage(recipe, step, index),
    ),
  };
}

export function enrichRecipeVisuals<T extends SerializableRecipe>(
  recipe: T,
): T {
  if (
    recipe.heroVisualTags &&
    recipe.visualAssets &&
    recipe.heroImageUrl === recipe.visualAssets.heroImageUrl
  ) {
    return recipe;
  }

  const heroVisualTags =
    recipe.heroVisualTags ?? deriveHeroVisualTags(recipe);
  const recipeWithTags = {
    ...recipe,
    heroVisualTags,
  };
  const visualAssets = assignRecipeVisualAssets(recipeWithTags);

  return {
    ...recipeWithTags,
    heroImageUrl: visualAssets.heroImageUrl,
    visualAssets,
  };
}

function mapDraftToVisualRecipe(
  draft: ParsedRecipeDraft,
  recipeId: string,
): SerializableRecipe {
  return {
    id: recipeId,
    slug: recipeId,
    titleZh: draft.titleZh,
    titleEn: draft.titleEn,
    stationId: `station-${draft.primaryCategory}`,
    coverType: "ticket",
    timeMinutes: draft.timeMinutes,
    difficulty: draft.difficulty,
    flavor: draft.flavor,
    mainIngredient: draft.mainIngredient,
    primaryCategory: draft.primaryCategory,
    primaryIngredient: draft.primaryIngredient,
    classificationConfidence: draft.classificationConfidence,
    classificationReason: draft.classificationReason,
    classificationSource: draft.classificationSource,
    primaryIngredientTags: draft.primaryIngredientTags,
    ingredientImageTags: draft.ingredientImageTags,
    seasoningImageTags: draft.seasoningImageTags,
    stepActionTags: draft.stepActionTags,
    heroImagePromptData: draft.heroImagePromptData,
    heroVisualTags: draft.heroVisualTags,
    tags: draft.tags,
    description: draft.description,
    ingredients: draft.ingredients
      .filter((ingredient) => ingredient.group !== "seasoning")
      .map((ingredient, index) => ({
        id: `visual-ingredient-${index + 1}`,
        name: ingredient.name,
        amount: ingredient.amount,
        group: ingredient.group,
        note: ingredient.note,
      })),
    seasonings: [
      ...draft.ingredients.filter(
        (ingredient) => ingredient.group === "seasoning",
      ),
      ...draft.seasonings,
    ].map((ingredient, index) => ({
      id: `visual-seasoning-${index + 1}`,
      name: ingredient.name,
      amount: ingredient.amount,
      group: "seasoning",
      note: ingredient.note,
    })),
    steps: draft.steps.map((step, index) => ({
      id: `visual-step-${index + 1}`,
      title: step.title,
      description: step.description,
      duration: step.duration,
      tips: step.tips,
    })),
    savedCount: 0,
  };
}

export function enrichParsedRecipeDraftVisuals(
  draft: ParsedRecipeDraft,
  recipeId: string,
): ParsedRecipeDraft {
  if (
    draft.heroVisualTags &&
    draft.visualAssets &&
    draft.heroImageUrl === draft.visualAssets.heroImageUrl
  ) {
    return draft;
  }

  const heroVisualTags =
    draft.heroVisualTags ?? deriveHeroVisualTags(draft);
  const recipe = mapDraftToVisualRecipe(
    { ...draft, heroVisualTags },
    recipeId,
  );
  const enrichedRecipe = enrichRecipeVisuals(recipe);
  const visualAssets = enrichedRecipe.visualAssets!;

  return {
    ...draft,
    heroImageUrl: visualAssets.heroImageUrl,
    heroVisualTags,
    visualAssets,
  };
}
