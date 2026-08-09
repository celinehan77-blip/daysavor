import { stationVisualManifest } from "@/lib/station-visual/manifest";
import { deriveHeroVisualTags } from "@/lib/recipe-visual/deriveHeroVisualTags";
import type {
  StationVisualAsset,
  StationVisualCategory,
  StationVisualMatchLevel,
  StationVisualSelection,
} from "@/lib/station-visual/types";
import type { SerializableRecipe } from "@/types";
import type { RecipeCategoryId } from "@/types/classification";

export { stationVisualManifest };

const cookingMethodAliases: Record<string, string[]> = {
  "stir-fry": ["stir-fry", "stir-frying", "翻炒", "炒", "爆炒"],
  braise: ["braise", "braising", "红烧", "焖", "烧"],
  stew: ["stew", "simmering", "炖", "煨"],
  steam: ["steam", "steaming", "清蒸", "蒸"],
  fry: ["fry", "frying", "煎", "炸"],
  boil: ["boil", "boiling", "水煮", "汆"],
  poach: ["poach", "poaching", "白切", "浸熟"],
};

const ingredientFormAliases: Record<string, string[]> = {
  diced: ["diced", "dice", "鸡丁", "肉丁", "切丁"],
  chunks: ["chunks", "chunk", "鸡块", "肉块", "切块"],
  wings: ["wings", "鸡翅", "翅中"],
  sliced: ["sliced", "slices", "片", "切片"],
  strips: ["strips", "丝", "牛柳"],
  whole: ["whole", "整条", "整只", "开背"],
  ribs: ["ribs", "排骨", "小排"],
  fillets: ["fillets", "鱼片", "片鱼"],
};

const ingredientAliases: Record<string, string[]> = {
  chicken: ["chicken", "鸡", "鸡肉", "鸡腿", "鸡翅"],
  duck: ["duck", "鸭", "鸭肉"],
  beef: ["beef", "牛肉", "牛腩", "牛柳"],
  pork: ["pork", "猪肉", "五花肉", "排骨", "肉丝"],
  fish: ["fish", "鱼", "鱼片", "带鱼"],
  shrimp: ["shrimp", "虾", "鲜虾"],
  crab: ["crab", "蟹", "螃蟹"],
  seafood: ["seafood", "海鲜", "鱿鱼"],
  "dried-chili": ["dried-chili", "干辣椒", "辣椒段"],
  "red-chili": ["red-chili", "红辣椒", "红椒"],
  peanut: ["peanut", "花生"],
  peppercorn: ["peppercorn", "花椒", "青花椒"],
  scallion: ["scallion", "葱", "葱段", "葱花"],
  ginger: ["ginger", "姜", "姜片"],
  garlic: ["garlic", "蒜", "蒜瓣", "蒜蓉"],
  mushroom: ["mushroom", "香菇", "蘑菇"],
  "green-pepper": ["green-pepper", "青椒", "尖椒"],
  "red-pepper": ["red-pepper", "红椒", "彩椒"],
  potato: ["potato", "土豆"],
  carrot: ["carrot", "胡萝卜"],
  onion: ["onion", "洋葱"],
  tomato: ["tomato", "番茄", "西红柿"],
  "star-anise": ["star-anise", "八角"],
  "black-pepper": ["black-pepper", "黑胡椒", "黑椒"],
  vermicelli: ["vermicelli", "粉丝"],
  cilantro: ["cilantro", "香菜"],
  sesame: ["sesame", "芝麻"],
  "soy-sauce": ["soy-sauce", "酱油", "生抽", "老抽"],
  vinegar: ["vinegar", "醋"],
  sugar: ["sugar", "糖", "冰糖"],
  "rock-sugar": ["rock-sugar", "冰糖"],
  "bean-sprout": ["bean-sprout", "豆芽"],
  "bamboo-shoot": ["bamboo-shoot", "笋"],
  fungus: ["fungus", "木耳"],
};

const flavorAliases: Record<string, string[]> = {
  spicy: ["spicy", "香辣", "麻辣", "辣"],
  "sweet-sour": ["sweet-sour", "糖醋", "酸甜"],
  sweet: ["sweet", "甜"],
  savory: ["savory", "咸鲜", "家常"],
  fresh: ["fresh", "鲜", "清鲜"],
  numbing: ["numbing", "麻"],
  peppery: ["peppery", "黑椒", "胡椒"],
  garlicky: ["garlicky", "蒜香", "蒜蓉"],
};

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\s·•—_()[\]（）【】"'’]+/g, "");
}

function recipeText(recipe: SerializableRecipe) {
  return [
    recipe.slug,
    recipe.titleZh,
    recipe.titleEn,
    recipe.mainIngredient,
    recipe.primaryIngredient,
    recipe.flavor,
    recipe.description,
    ...recipe.tags,
    ...(recipe.primaryIngredientTags ?? []),
    ...(recipe.ingredientImageTags ?? []),
    ...(recipe.seasoningImageTags ?? []),
    ...(recipe.stepActionTags ?? []),
    ...recipe.ingredients.flatMap((item) => [item.name, item.note]),
    ...recipe.seasonings.flatMap((item) => [item.name, item.note]),
    ...recipe.steps.flatMap((step) => [step.title, step.description]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

function inferTags(text: string, aliases: Record<string, string[]>) {
  return new Set(
    Object.entries(aliases)
      .filter(([, values]) =>
        values.some((value) => text.includes(value.toLocaleLowerCase())),
      )
      .map(([tag]) => tag),
  );
}

function intersects(left: Set<string>, right: string[]) {
  return right.some((value) => left.has(value));
}

function hashSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function stablePick(
  candidates: StationVisualAsset[],
  recipe: SerializableRecipe,
  category: RecipeCategoryId,
) {
  const ordered = [...candidates].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  const seed = `${recipe.id}:${recipe.titleZh}:${category}`;

  return ordered[hashSeed(seed) % ordered.length]!;
}

function selection(
  asset: StationVisualAsset,
  matchLevel: StationVisualMatchLevel,
  score: number,
): StationVisualSelection {
  return {
    assetId: asset.id,
    matchLevel,
    objectPosition: asset.objectPosition,
    primaryCategory: asset.primaryCategory,
    score,
    src: asset.src,
  };
}

function bestByIngredientOverlap(
  candidates: StationVisualAsset[],
  ingredients: Set<string>,
) {
  const scored = candidates.map((asset) => ({
    asset,
    overlap: asset.keyIngredients.filter((item) => ingredients.has(item))
      .length,
  }));
  const bestOverlap = Math.max(...scored.map((item) => item.overlap));

  return scored
    .filter((item) => item.overlap === bestOverlap)
    .map((item) => item.asset);
}

function toStationVisualCategory(
  category: SerializableRecipe["primaryCategory"],
): StationVisualCategory {
  if (category === "shrimp" || category === "crab") {
    return "seafood";
  }

  return category ?? "other";
}

export function getStationVisual(
  recipe: SerializableRecipe,
): StationVisualSelection {
  const unifiedTags =
    recipe.heroVisualTags ?? deriveHeroVisualTags(recipe);
  const primaryCategory =
    recipe.classificationSource === "user"
      ? (recipe.primaryCategory ?? unifiedTags.primaryCategory)
      : recipe.primaryCategory && recipe.primaryCategory !== "other"
        ? recipe.primaryCategory
        : unifiedTags.primaryCategory;
  const candidates = stationVisualManifest.filter((asset) =>
    asset.compatibleCategories.includes(primaryCategory),
  );

  if (candidates.length === 0) {
    return {
      assetId: `station-${primaryCategory}-css-fallback`,
      matchLevel: "category-fallback",
      objectPosition: "50% 55%",
      primaryCategory: toStationVisualCategory(primaryCategory),
      score: 0,
      src: "",
    };
  }

  const normalizedTitles = new Set(
    [recipe.titleZh, recipe.titleEn].map(normalize),
  );
  const exact = candidates.filter((asset) =>
    asset.dishNames.some((name) => normalizedTitles.has(normalize(name))),
  );
  if (exact.length > 0) {
    return selection(stablePick(exact, recipe, primaryCategory), "exact", 200);
  }

  const alias = candidates.filter((asset) =>
    asset.aliases.some((name) => normalizedTitles.has(normalize(name))),
  );
  if (alias.length > 0) {
    return selection(stablePick(alias, recipe, primaryCategory), "alias", 180);
  }

  const text = recipeText(recipe);
  const methods = inferTags(text, cookingMethodAliases);
  const forms = inferTags(text, ingredientFormAliases);
  const ingredients = inferTags(text, ingredientAliases);
  const flavors = inferTags(text, flavorAliases);
  methods.add(unifiedTags.cookingMethod);
  forms.add(unifiedTags.ingredientForm);
  unifiedTags.keyIngredients.forEach((ingredient) =>
    ingredients.add(ingredient),
  );
  unifiedTags.flavorTags.forEach((flavor) => flavors.add(flavor));
  const methodCandidates = candidates.filter((asset) =>
    intersects(methods, asset.cookingMethods),
  );
  const ingredientMethodCandidates = methodCandidates.filter((asset) =>
    intersects(ingredients, asset.keyIngredients),
  );

  if (ingredientMethodCandidates.length > 0) {
    const best = bestByIngredientOverlap(
      ingredientMethodCandidates,
      ingredients,
    );
    const asset = stablePick(best, recipe, primaryCategory);
    const ingredientScore =
      asset.keyIngredients.filter((item) => ingredients.has(item)).length * 18;
    const flavorScore =
      asset.flavorTags.filter((item) => flavors.has(item)).length * 8;
    return selection(
      asset,
      "category-method-ingredients",
      90 + 60 + ingredientScore + flavorScore,
    );
  }

  const formCandidates = candidates.filter((asset) =>
    intersects(forms, asset.ingredientForms),
  );
  if (formCandidates.length > 0) {
    return selection(
      stablePick(formCandidates, recipe, primaryCategory),
      "category-form",
      135,
    );
  }

  if (methodCandidates.length > 0) {
    return selection(
      stablePick(methodCandidates, recipe, primaryCategory),
      "category-method",
      150,
    );
  }

  const categoryCandidates = candidates.filter(
    (asset) => !asset.isCategoryFallback,
  );
  if (categoryCandidates.length > 0) {
    return selection(
      stablePick(categoryCandidates, recipe, primaryCategory),
      "category",
      90,
    );
  }

  const fallback = candidates.find((asset) => asset.isCategoryFallback)!;
  return selection(fallback, "category-fallback", 90);
}
