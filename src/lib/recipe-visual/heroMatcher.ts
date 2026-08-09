import { heroAssetManifest } from "@/lib/recipe-visual/heroManifest";
import { stableAssetHash } from "@/lib/recipe-visual/scoring";
import type {
  HeroPrimaryCategory,
  HeroVisualAsset,
  HeroVisualSelection,
  HeroVisualTags,
} from "@/types/recipeVisual";

const SIMILAR_HERO_MIN_SCORE = 120;

function normalizeName(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s\-—_·,，.。'’"“”()（）]/g, "");
}

function categoriesMatch(
  recipeCategory: HeroVisualTags["primaryCategory"],
  assetCategory: HeroPrimaryCategory,
) {
  if (recipeCategory === assetCategory) {
    return true;
  }

  return (
    assetCategory === "seafood" &&
    (recipeCategory === "shrimp" || recipeCategory === "crab")
  );
}

function hasOverlap(left: string[], right: string[]) {
  const values = new Set(left);
  return right.some((value) => values.has(value));
}

function namesFor(tags: HeroVisualTags) {
  return [tags.dishName, ...tags.aliases]
    .map(normalizeName)
    .filter(Boolean);
}

function matchesDishName(asset: HeroVisualAsset, tags: HeroVisualTags) {
  const names = new Set(namesFor(tags));
  return asset.dishNames.some((name) => names.has(normalizeName(name)));
}

function matchesAlias(asset: HeroVisualAsset, tags: HeroVisualTags) {
  const names = new Set(namesFor(tags));
  return asset.aliases.some((name) => names.has(normalizeName(name)));
}

function createsMethodConflict(asset: HeroVisualAsset, tags: HeroVisualTags) {
  return (
    tags.cookingMethod !== "prepared" &&
    asset.cookingMethods.length > 0 &&
    !asset.cookingMethods.includes(tags.cookingMethod)
  );
}

function createsDishFormConflict(asset: HeroVisualAsset, tags: HeroVisualTags) {
  return (
    tags.dishForm !== "plated-dish" &&
    asset.dishForm !== "category-fallback" &&
    asset.dishForm !== tags.dishForm
  );
}

export function scoreHeroCandidate(
  asset: HeroVisualAsset,
  tags: HeroVisualTags,
) {
  if (!categoriesMatch(tags.primaryCategory, asset.primaryCategory)) {
    return -300;
  }

  let score = 80;

  if (matchesDishName(asset, tags)) {
    score += 200;
  } else if (matchesAlias(asset, tags)) {
    score += 180;
  }

  if (asset.cookingMethods.includes(tags.cookingMethod)) {
    score += 60;
  } else if (createsMethodConflict(asset, tags)) {
    score -= 100;
  }

  if (asset.ingredientForms.includes(tags.ingredientForm)) {
    score += 40;
  }

  if (asset.dishForm === tags.dishForm) {
    score += 40;
  } else if (createsDishFormConflict(asset, tags)) {
    score -= 80;
  }

  score += asset.keyIngredients.filter((ingredient) =>
    tags.keyIngredients.includes(ingredient),
  ).length * 15;
  score += asset.flavorTags.filter((flavor) =>
    tags.flavorTags.includes(flavor),
  ).length * 8;

  return score;
}

function toSelection(
  asset: HeroVisualAsset,
  level: HeroVisualSelection["level"],
  score: number,
): HeroVisualSelection & { asset: HeroVisualAsset } {
  return {
    asset,
    assetId: asset.id,
    level,
    objectPosition: asset.objectPosition,
    score,
    src: asset.src,
  };
}

function stablePick(
  assets: HeroVisualAsset[],
  recipeId: string,
  dishName: string,
  group: string,
) {
  const seed = `${recipeId}:${dishName}:hero:${group}`;
  return assets[stableAssetHash(seed) % assets.length]!;
}

export function selectHeroAsset({
  manifest = heroAssetManifest,
  recipeId,
  tags,
}: {
  manifest?: HeroVisualAsset[];
  recipeId: string;
  tags: HeroVisualTags;
}): HeroVisualSelection & { asset: HeroVisualAsset } {
  const safeCandidates =
    tags.primaryCategory === "other"
      ? []
      : manifest.filter(
          (asset) =>
            !asset.isCategoryFallback &&
            categoriesMatch(tags.primaryCategory, asset.primaryCategory),
        );
  const exactCandidates = safeCandidates.filter((asset) =>
    matchesDishName(asset, tags),
  );

  if (exactCandidates.length > 0) {
    const asset = stablePick(
      exactCandidates,
      recipeId,
      tags.dishName,
      "exact",
    );
    return toSelection(asset, "exact", scoreHeroCandidate(asset, tags));
  }

  const aliasCandidates = safeCandidates.filter((asset) =>
    matchesAlias(asset, tags),
  );

  if (aliasCandidates.length > 0) {
    const asset = stablePick(
      aliasCandidates,
      recipeId,
      tags.dishName,
      "alias",
    );
    return toSelection(asset, "alias", scoreHeroCandidate(asset, tags));
  }

  const scored = safeCandidates.map((asset) => ({
    asset,
    score: scoreHeroCandidate(asset, tags),
  }));
  const bestScore =
    scored.length > 0
      ? Math.max(...scored.map((candidate) => candidate.score))
      : Number.NEGATIVE_INFINITY;

  if (bestScore >= SIMILAR_HERO_MIN_SCORE) {
    const topCandidates = scored
      .filter((candidate) => candidate.score === bestScore)
      .map((candidate) => candidate.asset);
    const asset = stablePick(
      topCandidates,
      recipeId,
      tags.dishName,
      `similar:${bestScore}`,
    );
    return toSelection(asset, "similar", bestScore);
  }

  const categoryFallbacks = manifest.filter(
    (asset) =>
      asset.isCategoryFallback &&
      asset.primaryCategory !== "other" &&
      categoriesMatch(tags.primaryCategory, asset.primaryCategory),
  );

  if (categoryFallbacks.length > 0) {
    const asset = stablePick(
      categoryFallbacks,
      recipeId,
      tags.dishName,
      "category",
    );
    return toSelection(asset, "category", 80);
  }

  const globalFallback =
    manifest.find(
      (asset) =>
        asset.isCategoryFallback && asset.primaryCategory === "other",
    ) ??
    heroAssetManifest.find(
      (asset) =>
        asset.isCategoryFallback && asset.primaryCategory === "other",
    );

  if (!globalFallback) {
    throw new Error("Hero manifest requires a global fallback asset.");
  }

  return toSelection(globalFallback, "global", 0);
}

export function heroCandidatesShareAnySemanticSignal(
  asset: HeroVisualAsset,
  tags: HeroVisualTags,
) {
  return (
    categoriesMatch(tags.primaryCategory, asset.primaryCategory) &&
    (asset.cookingMethods.includes(tags.cookingMethod) ||
      asset.ingredientForms.includes(tags.ingredientForm) ||
      asset.dishForm === tags.dishForm ||
      hasOverlap(asset.keyIngredients, tags.keyIngredients))
  );
}
