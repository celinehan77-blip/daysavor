import { recipeVisualManifest } from "@/lib/recipe-visual/manifest";
import {
  scoreRecipeVisualAsset,
  selectAssetBySeed,
} from "@/lib/recipe-visual/scoring";
import { deriveHeroVisualTags } from "@/lib/recipe-visual/deriveHeroVisualTags";
import { selectHeroAsset } from "@/lib/recipe-visual/heroMatcher";
import type {
  Ingredient,
  SerializableRecipe,
  SerializableRecipeStep,
} from "@/types";
import type {
  RecipeVisualAsset,
  RecipeVisualAssetType,
  RecipeVisualPresentation,
} from "@/types/recipeVisual";

export const RECIPE_VISUAL_FALLBACK =
  "/images/recipe-library/fallback/neutral-food.webp";

function recipeText(recipe: SerializableRecipe) {
  return [
    recipe.slug,
    recipe.titleZh,
    recipe.titleEn,
    recipe.mainIngredient,
    recipe.primaryIngredient,
    recipe.flavor,
    ...recipe.tags,
    ...recipe.ingredients.flatMap((item) => [item.name, item.note]),
    ...recipe.seasonings.flatMap((item) => [item.name, item.note]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

function ingredientText(items: Ingredient[]) {
  return items
    .flatMap((item) => [item.name, item.note])
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

type RecipePrepVisual = {
  presentation: RecipeVisualPresentation;
  src: string;
};

function chooseVisualAsset({
  action,
  category,
  key,
  tags,
  text,
  type,
}: {
  action?: string;
  category?: string;
  key: string;
  tags: string[];
  text: string;
  type: RecipeVisualAssetType;
}) {
  const candidates = recipeVisualManifest.filter((asset) => asset.type === type);
  const scored = candidates.map((asset) => ({
    asset,
    score: scoreRecipeVisualAsset(asset, {
      action,
      category,
      ingredientTags: tags,
      text,
    }),
  }));
  const bestScore = Math.max(...scored.map((candidate) => candidate.score));
  const best = scored
    .filter((candidate) => candidate.score === bestScore)
    .map((candidate) => candidate.asset);

  if (bestScore === 0) {
    const fallbackCandidates = recipeVisualManifest.filter(
      (asset) =>
        asset.type === "fallback" &&
        asset.tags.includes(`type:${type}`) &&
        (asset.category === category || asset.category === "other"),
    );
    if (fallbackCandidates.length > 0) {
      return selectAssetBySeed(fallbackCandidates, key);
    }
  }

  return best.length > 0
    ? selectAssetBySeed(best, key)
    : undefined;
}

function toPrepVisual(
  asset: RecipeVisualAsset | undefined,
  fallback = RECIPE_VISUAL_FALLBACK,
): RecipePrepVisual {
  return {
    presentation: asset?.presentation ?? "photographic",
    src: asset?.src ?? fallback,
  };
}

function persistedPrepVisual(src: string): RecipePrepVisual {
  const manifestAsset = recipeVisualManifest.find((asset) => asset.src === src);
  return {
    presentation: manifestAsset?.presentation ?? "photographic",
    src,
  };
}

export function getProteinVisual(recipe: SerializableRecipe) {
  if (recipe.visualAssets?.proteinImageUrl) {
    return persistedPrepVisual(recipe.visualAssets.proteinImageUrl);
  }

  return toPrepVisual(chooseVisualAsset({
    category: recipe.primaryCategory,
    key: `${recipe.id}:protein:${recipe.primaryCategory ?? "other"}`,
    tags: recipe.primaryIngredientTags ?? [],
    text: recipeText(recipe),
    type: "protein",
  }));
}

export function getProteinImage(recipe: SerializableRecipe) {
  return getProteinVisual(recipe).src;
}

export function getIngredientVisual(recipe: SerializableRecipe) {
  if (recipe.visualAssets?.ingredientImageUrl) {
    return persistedPrepVisual(recipe.visualAssets.ingredientImageUrl);
  }

  const sideIngredients = recipe.ingredients.filter(
    (ingredient) => ingredient.group === "side",
  );

  return toPrepVisual(chooseVisualAsset({
    key: `${recipe.id}:ingredient:${recipe.primaryCategory ?? "other"}`,
    tags: recipe.ingredientImageTags ?? [],
    text: ingredientText(sideIngredients),
    type: "ingredient",
  }));
}

export function getIngredientImage(recipe: SerializableRecipe) {
  return getIngredientVisual(recipe).src;
}

export function getSeasoningVisual(recipe: SerializableRecipe) {
  if (recipe.visualAssets?.seasoningImageUrl) {
    return persistedPrepVisual(recipe.visualAssets.seasoningImageUrl);
  }

  return toPrepVisual(chooseVisualAsset({
    key: `${recipe.id}:seasoning:${recipe.primaryCategory ?? "other"}`,
    tags: recipe.seasoningImageTags ?? [],
    text: ingredientText(recipe.seasonings),
    type: "seasoning",
  }));
}

export function getSeasoningImage(recipe: SerializableRecipe) {
  return getSeasoningVisual(recipe).src;
}

function inferStepAction(text: string) {
  const rules = [
    { action: "marinating", pattern: /腌|抓匀|上浆/ },
    { action: "mixing-sauce", pattern: /调.*汁|碗汁|调味汁|搅匀/ },
    { action: "frying-aromatics", pattern: /爆香|炒香|激香/ },
    { action: "reducing-sauce", pattern: /收汁|浓缩|收浓/ },
    { action: "simmering", pattern: /慢炖|炖|焖|煮/ },
    { action: "stir-frying", pattern: /翻炒|合炒|炒/ },
    { action: "preparing", pattern: /处理|开背|去虾线|鱼身/ },
    { action: "cutting", pattern: /切|改刀/ },
    { action: "plating", pattern: /出锅|装盘|盛出|收汁/ },
    { action: "steaming", pattern: /蒸/ },
  ] as const;

  return rules.find((rule) => rule.pattern.test(text))?.action ?? "preparing";
}

const semanticActions = [
  "frying-aromatics",
  "mixing-sauce",
  "thickening-sauce",
  "reducing-sauce",
  "adding-ingredients",
  "stir-frying",
  "pan-frying",
  "deep-frying",
  "marinating",
  "blanching",
  "preparing",
  "simmering",
  "braising",
  "steaming",
  "boiling",
  "cutting",
  "slicing",
  "dicing",
  "shredding",
  "plating",
] as const;

function semanticAction(tag: string | undefined, fallbackText: string) {
  if (!tag) {
    return inferStepAction(fallbackText);
  }
  return (
    semanticActions.find(
      (action) => tag === action || tag.startsWith(`${action}-`),
    ) ?? inferStepAction(fallbackText)
  );
}

function inferVisualSubject(recipe: SerializableRecipe, stepText: string) {
  if (recipe.primaryCategory) {
    return recipe.primaryCategory;
  }

  const text = `${stepText} ${recipeText(recipe)}`;
  const subjectRules = [
    { subject: "chicken", pattern: /鸡|chicken/ },
    { subject: "duck", pattern: /鸭|duck/ },
    { subject: "pork", pattern: /猪|肉丝|排骨|pork/ },
    { subject: "beef", pattern: /牛|beef/ },
    { subject: "lamb", pattern: /羊|lamb|mutton/ },
    { subject: "shrimp", pattern: /虾|shrimp|prawn/ },
    { subject: "crab", pattern: /蟹|螃蟹|crab/ },
    { subject: "fish", pattern: /鱼|fish/ },
  ] as const;

  return subjectRules.find((rule) => rule.pattern.test(text))?.subject ?? "";
}

export function getStepImage(
  recipe: SerializableRecipe,
  step: SerializableRecipeStep,
  stepIndex: number,
) {
  const savedStepImage = recipe.visualAssets?.stepImageUrls[stepIndex];

  if (savedStepImage) {
    return savedStepImage;
  }

  const text = `${step.title} ${step.description} ${step.tips}`.toLocaleLowerCase();
  const semanticTag = recipe.stepActionTags?.[stepIndex];
  const action = semanticAction(semanticTag, text);
  const subjectTag = semanticTag?.startsWith(`${action}-`)
    ? semanticTag.slice(action.length + 1)
    : "";
  const visualSubject = subjectTag || inferVisualSubject(recipe, text);
  const actionSubjectTag = visualSubject
    ? `${action}-${visualSubject}`
    : "";

  return chooseVisualAsset({
    action,
    category: action,
    key: `${recipe.id}:step:${stepIndex}:${action}:${visualSubject || "other"}`,
    tags: [semanticTag ?? "", actionSubjectTag].filter(Boolean),
    text,
    type: "step",
  })?.src ?? RECIPE_VISUAL_FALLBACK;
}

export function getHeroVisualSelection(recipe: SerializableRecipe) {
  if (recipe.visualAssets?.heroImageUrl) {
    return {
      assetId: recipe.visualAssets.heroAssetId,
      level: recipe.visualAssets.heroMatchLevel,
      objectPosition: recipe.visualAssets.heroObjectPosition,
      score: Number.POSITIVE_INFINITY,
      src: recipe.visualAssets.heroImageUrl,
    };
  }

  if (recipe.heroImageUrl) {
    return {
      assetId: "persisted-hero",
      level: "persisted" as const,
      objectPosition: "68% 50%" as const,
      score: Number.POSITIVE_INFINITY,
      src: recipe.heroImageUrl,
    };
  }

  return selectHeroAsset({
    recipeId: recipe.id,
    tags: recipe.heroVisualTags ?? deriveHeroVisualTags(recipe),
  });
}

export function getHeroImage(recipe: SerializableRecipe) {
  return getHeroVisualSelection(recipe).src;
}
