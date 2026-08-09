import type {
  ParsedIngredient,
  ParsedRecipeDraft,
  ParsedStep,
} from "@/types/ai";
import type { IngredientGroup } from "@/types";
import type {
  HeroImagePromptData,
  RecipeVisualTextSafeArea,
} from "@/types/recipeVisual";
import {
  classifyRecipeContent,
  isRecipeCategoryId,
} from "@/lib/classification/recipeCategories";

function asString(value: unknown, fallback = "", maxLength = 240) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

function asStringArray(
  value: unknown,
  maxItems = Number.POSITIVE_INFINITY,
  maxLength = 240,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => asString(item, "", maxLength))
        .filter((item) => item.length > 0),
    ),
  ).slice(0, maxItems);
}

function asTextSafeArea(value: unknown): RecipeVisualTextSafeArea {
  return value === "left" || value === "right" || value === "none"
    ? value
    : "none";
}

function normalizeHeroImagePromptData(
  value: unknown,
): HeroImagePromptData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<HeroImagePromptData>;
  const dishName = asString(data.dishName, "", 80);

  if (!dishName) {
    return null;
  }

  return {
    dishName,
    englishName: asString(data.englishName, "", 120),
    primaryIngredient: asString(data.primaryIngredient, "", 80),
    keyIngredients: asStringArray(data.keyIngredients, 8, 64),
    flavor: asString(data.flavor, "", 64),
    cuisine: asString(data.cuisine, "", 64),
    composition: asString(data.composition, "", 160),
    textSafeArea: asTextSafeArea(data.textSafeArea),
  };
}

function asNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeAmount(value: unknown) {
  const amount = asString(value, "适量", 48)
    .replace(/\s+/g, " ")
    .replace(
      /^(\d+(?:\.\d+)?|\d+\/\d+)\s*(克|千克|公斤|毫升|升|个|只|颗|粒|片|块|根|把|汤匙|茶匙|勺|杯|滴)$/,
      "$1 $2",
    );

  return amount || "适量";
}

function normalizeHeat(value: unknown, context: string) {
  const heat = asString(value, "", 48);

  if (heat) {
    return heat;
  }

  const inferred = context.match(
    /(水开后(?:转)?(?:小火|中火|大火)|中小火|中大火|小火|中火|大火|\d{2,3}\s*(?:°C|℃|度))/,
  );

  return inferred?.[1] ?? "未说明";
}

function asDifficulty(value: unknown) {
  return value === "简单" || value === "中等" || value === "复杂"
    ? value
    : "中等";
}

function asIngredientGroup(value: unknown, fallback: IngredientGroup) {
  return value === "main" || value === "side" || value === "seasoning"
    ? value
    : fallback;
}

function normalizeIngredient(
  value: unknown,
  fallbackGroup: IngredientGroup,
): ParsedIngredient | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<ParsedIngredient>;
  const name = asString(item.name);

  if (!name) {
    return null;
  }

  return {
    name,
    amount: normalizeAmount(item.amount),
    group: asIngredientGroup(item.group, fallbackGroup),
    note: asString(item.note),
  };
}

function normalizeStep(value: unknown): ParsedStep | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<ParsedStep>;
  const title = asString(item.title);
  const description = asString(item.description);

  if (!title && !description) {
    return null;
  }

  const normalizedDescription = description || title;
  const normalizedTips = asString(item.tips, "", 240);

  return {
    title: title || "继续烹饪",
    description: normalizedDescription,
    duration: asString(item.duration, "未说明", 48),
    heat: normalizeHeat(
      "heat" in item ? item.heat : undefined,
      `${normalizedDescription} ${normalizedTips}`,
    ),
    tips: normalizedTips,
  };
}

function deduplicateByName<T extends { name: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.name.toLocaleLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeIngredients(value: unknown, fallbackGroup: IngredientGroup) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeIngredient(item, fallbackGroup))
    .filter((item): item is ParsedIngredient => Boolean(item));
}

function normalizeSteps(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeStep)
    .filter((item): item is ParsedStep => Boolean(item));
}

export function validateParsedRecipeDraft(
  data: unknown,
): ParsedRecipeDraft | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const draft = data as Partial<ParsedRecipeDraft>;
  const titleZh = asString(draft.titleZh);
  const mainIngredient = asString(draft.mainIngredient);
  const normalizedIngredients = normalizeIngredients(draft.ingredients, "side");
  const misplacedSeasonings = normalizedIngredients.filter(
    (ingredient) => ingredient.group === "seasoning",
  );
  const ingredients = deduplicateByName(
    normalizedIngredients.filter(
      (ingredient) => ingredient.group !== "seasoning",
    ),
  ).slice(0, 30).map(
    (ingredient, index) => ({
      ...ingredient,
      group:
        ingredient.group === "seasoning"
          ? "side"
          : index === 0
            ? "main"
            : ingredient.group,
    }),
  );
  const seasonings = deduplicateByName([
    ...normalizeIngredients(draft.seasonings, "seasoning"),
    ...misplacedSeasonings,
  ]).slice(0, 30).map((ingredient) => ({
      ...ingredient,
      group: "seasoning" as const,
    }));
  const steps = normalizeSteps(draft.steps).slice(0, 20);

  if (!titleZh || !mainIngredient || ingredients.length === 0 || steps.length === 0) {
    return null;
  }

  const warnings = asStringArray(draft.warnings);

  if (ingredients.length < 3) {
    warnings.push("AI 输出的食材较少，已按可用信息保留。");
  }

  if (steps.length < 3) {
    warnings.push("AI 输出的步骤较少，已按可用信息保留。");
  }

  if (seasonings.length === 0) {
    warnings.push("AI 输出未识别到调料，请根据原始内容复核。");
  }

  const missingHeatCount = steps.filter((step) => step.heat === "未说明").length;

  if (missingHeatCount > 0) {
    warnings.push(`有 ${missingHeatCount} 个步骤未识别到火候。`);
  }

  const aiCategory = isRecipeCategoryId(draft.primaryCategory)
    ? draft.primaryCategory
    : null;
  const aiClassificationConfidence = Math.min(
    1,
    Math.max(0, asNumber(draft.classificationConfidence, 0)),
  );
  const hasCompleteAiClassification =
    aiCategory !== null &&
    (aiCategory === "other" || aiClassificationConfidence >= 0.6) &&
    Boolean(asString(draft.primaryIngredient)) &&
    Boolean(asString(draft.classificationReason));
  const fallbackClassification = classifyRecipeContent({
    titleZh,
    titleEn: asString(draft.titleEn, titleZh),
    mainIngredient,
    ingredients,
    steps,
  });
  const classification = hasCompleteAiClassification
    ? {
        primaryCategory: aiCategory,
        primaryIngredient: asString(draft.primaryIngredient, mainIngredient),
        classificationConfidence: aiClassificationConfidence,
        classificationReason: asString(
          draft.classificationReason,
          "AI 根据菜名、食材和步骤判断主要分类",
        ),
    classificationSource: "ai" as const,
      }
    : fallbackClassification;

  return {
    titleZh,
    titleEn: asString(draft.titleEn, titleZh),
    description: asString(draft.description, `${titleZh} 的结构化菜谱草稿。`),
    timeMinutes: Math.min(1440, Math.max(1, asNumber(draft.timeMinutes, 30))),
    difficulty: asDifficulty(draft.difficulty),
    flavor: asString(draft.flavor, "家常"),
    mainIngredient,
    ...classification,
    primaryIngredientTags: asStringArray(
      draft.primaryIngredientTags,
      12,
      48,
    ),
    ingredientImageTags: asStringArray(draft.ingredientImageTags, 16, 48),
    seasoningImageTags: asStringArray(draft.seasoningImageTags, 16, 48),
    stepActionTags: asStringArray(draft.stepActionTags, 20, 48),
    heroImagePromptData: normalizeHeroImagePromptData(
      draft.heroImagePromptData,
    ),
    tags: Array.from(new Set(asStringArray(draft.tags))).slice(0, 6),
    ingredients,
    seasonings,
    steps,
    confidence: Math.min(1, Math.max(0, asNumber(draft.confidence, 0.72))),
    warnings: Array.from(new Set(warnings)).slice(0, 12),
  };
}
