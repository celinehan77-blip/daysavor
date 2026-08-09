import type { RecipeVisualAsset } from "@/types/recipeVisual";

export type RecipeVisualMatchContext = {
  action?: string;
  category?: string;
  ingredientTags: string[];
  text: string;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function matchesTag(asset: RecipeVisualAsset, value: string) {
  const target = normalize(value);
  return asset.tags.some((tag) => normalize(tag) === target);
}

function includesTag(asset: RecipeVisualAsset, value: string) {
  const target = normalize(value);
  return asset.tags.some((tag) => {
    const normalizedTag = normalize(tag);
    return (
      normalizedTag.includes(target) ||
      target.includes(normalizedTag)
    );
  });
}

export function scoreRecipeVisualAsset(
  asset: RecipeVisualAsset,
  context: RecipeVisualMatchContext,
) {
  if (asset.type === "fallback") {
    return 0;
  }

  const action = context.action ? normalize(context.action) : "";
  const text = normalize(context.text);
  const meaningfulTextMatch = asset.tags.some((tag) => {
    const normalizedTag = normalize(tag);
    return normalizedTag.length >= 2 && text.includes(normalizedTag);
  });
  const ingredientMatches = context.ingredientTags.filter(
    (tag) => matchesTag(asset, tag) || includesTag(asset, tag),
  ).length;
  const actionMatch =
    Boolean(action) &&
    (asset.compatibleActions.some(
      (compatibleAction) => normalize(compatibleAction) === action,
    ) ||
      matchesTag(asset, action) ||
      asset.tags.some((tag) => normalize(tag).startsWith(`${action}-`)));

  if (ingredientMatches > 0 && actionMatch) {
    return 100;
  }

  if (asset.type === "ingredient") {
    if (ingredientMatches >= 2) {
      return 60;
    }
    if (ingredientMatches === 1 || meaningfulTextMatch) {
      return 30;
    }
  } else if (ingredientMatches > 0) {
    return 70;
  }

  if (actionMatch) {
    return 55;
  }

  if (
    context.category &&
    normalize(asset.category) === normalize(context.category)
  ) {
    return 20;
  }

  if (meaningfulTextMatch) {
    return 15;
  }

  return 0;
}

export function stableAssetHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectAssetBySeed<T extends RecipeVisualAsset>(
  assets: readonly T[],
  seed: string,
) {
  if (assets.length === 0) {
    throw new Error("selectAssetBySeed requires at least one asset");
  }

  return assets[stableAssetHash(seed) % assets.length]!;
}
