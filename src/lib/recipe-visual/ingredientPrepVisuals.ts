import type { RecipeCategoryId } from "@/types/classification";
import type { RecipeVisualPresentation } from "@/types/recipeVisual";

type IngredientPrepArtwork = {
  presentation: RecipeVisualPresentation;
  src: string;
};

type IngredientPrepVisuals = {
  main: IngredientPrepArtwork | null;
  side: IngredientPrepArtwork;
  seasoning: IngredientPrepArtwork;
};

const mainProteinCutouts: Partial<Record<RecipeCategoryId, string>> = {
  chicken:
    "/images/recipe-library/cutouts/proteins/chicken-thigh-cutout.png",
  pork: "/images/recipe-library/cutouts/proteins/pork-cutout.png",
  beef: "/images/recipe-library/cutouts/proteins/beef-cutout.png",
  lamb: "/images/recipe-library/cutouts/proteins/lamb-cutout.png",
  fish: "/images/recipe-library/cutouts/proteins/fish-cutout.png",
};

const sideArtwork: IngredientPrepArtwork = {
  presentation: "isolated",
  src: "/images/recipe-library/cutouts/ingredients/kungpao-garnish-cutout.png",
};

const seasoningArtwork: IngredientPrepArtwork = {
  presentation: "isolated",
  src: "/images/recipe-library/cutouts/seasonings/seasoning-cutout.png",
};

export function getIngredientPrepVisuals(
  primaryCategory: RecipeCategoryId | undefined,
): IngredientPrepVisuals {
  const mainSrc = primaryCategory
    ? mainProteinCutouts[primaryCategory]
    : undefined;

  return {
    main: mainSrc
      ? {
          presentation: "isolated",
          src: mainSrc,
        }
      : null,
    side: sideArtwork,
    seasoning: seasoningArtwork,
  };
}
