export type IngredientCardType = "main" | "side" | "seasoning";
export type IngredientCardLayoutMode = "compact" | "balanced" | "dense";

export type IngredientCardItem = {
  amount: string;
  name: string;
};

const thresholds: Record<
  IngredientCardType,
  { compactMax: number; balancedMax: number }
> = {
  main: { compactMax: 2, balancedMax: 3 },
  side: { compactMax: 3, balancedMax: 5 },
  seasoning: { compactMax: 3, balancedMax: 6 },
};

const modeOrder: IngredientCardLayoutMode[] = [
  "compact",
  "balanced",
  "dense",
];

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeIngredientCardItems<
  T extends IngredientCardItem,
>(items: readonly T[]): T[] {
  return items
    .map((item) => ({
      ...item,
      amount: normalizeWhitespace(item.amount),
      name: normalizeWhitespace(item.name),
    }))
    .filter((item) => item.name.length > 0);
}

export function getIngredientCardLayoutMode({
  items,
  type,
}: {
  items: readonly IngredientCardItem[];
  type: IngredientCardType;
}): IngredientCardLayoutMode {
  const normalizedItems = normalizeIngredientCardItems(items);
  const { balancedMax, compactMax } = thresholds[type];
  const baseMode: IngredientCardLayoutMode =
    normalizedItems.length <= compactMax
      ? "compact"
      : normalizedItems.length <= balancedMax
        ? "balanced"
        : "dense";
  const containsLongItem = normalizedItems.some(
    (item) =>
      `${item.name}${item.amount}`.replace(/\s/g, "").length > 12,
  );

  if (!containsLongItem || baseMode === "dense") {
    return baseMode;
  }

  return modeOrder[modeOrder.indexOf(baseMode) + 1]!;
}

const legacyRightBiasedHeroPositions = new Set([
  "68% 50%",
  "70% 50%",
]);

export function resolveHeroObjectPosition(objectPosition?: string) {
  if (
    !objectPosition ||
    legacyRightBiasedHeroPositions.has(objectPosition)
  ) {
    return "center center";
  }

  return objectPosition;
}
