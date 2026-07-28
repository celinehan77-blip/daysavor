import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  completeMockGenerationTaskWithSlug,
  failMockGenerationTaskWithSlug,
  readLatestGeneratedRecipeSlug,
  readMockGenerationTask,
  saveMockGenerationTask,
} from "../../src/lib/mockGenerationTask";
import {
  getLocalGeneratedRecipeBySlug,
  getLocalGeneratedDraftBySlug,
  mapParsedDraftToLocalRecipe,
  saveLocalGeneratedRecipe,
  updateLocalGeneratedRecipeCategory,
} from "../../src/lib/data/localGeneratedRecipe";
import type { ParsedRecipeDraft } from "../../src/types/ai";
import {
  buildGenerationDiagnostics,
  getGenerationFailureCode,
  getGenerationStartRoute,
  isBackgroundGenerationRouteUnavailable,
  isPendingGenerationStale,
  pickReusableRecipeSlug,
} from "../../src/lib/data/pendingRecipeGeneration";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const draft: ParsedRecipeDraft = {
  titleZh: "番茄炒蛋",
  titleEn: "Tomato Eggs",
  description: "家常快手菜",
  timeMinutes: 15,
  difficulty: "简单",
  flavor: "酸甜",
  mainIngredient: "番茄 · 鸡蛋",
  primaryCategory: "other",
  primaryIngredient: "番茄",
  classificationConfidence: 0.55,
  classificationReason: "番茄和鸡蛋共同构成主体，暂归入待整理",
  classificationSource: "rule",
  tags: ["家常菜"],
  ingredients: [
    { name: "番茄", amount: "2 个", group: "main", note: "切块" },
    { name: "盐", amount: "2 克", group: "seasoning", note: "" },
  ],
  seasonings: [
    { name: "白糖", amount: "3 克", group: "seasoning", note: "" },
  ],
  steps: [
    {
      title: "炒制",
      description: "鸡蛋和番茄炒匀",
      duration: "5 分钟",
      heat: "中火",
      tips: "",
    },
  ],
  confidence: 0.9,
  warnings: [],
};

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: new MemoryStorage() },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

test("failed generation keeps a usable fallback slug and safe error code", () => {
  saveMockGenerationTask("番茄炒蛋", "manual");
  failMockGenerationTaskWithSlug("my-generated-recipe", "recipe_save_failed");

  const task = readMockGenerationTask();

  assert.equal(task?.status, "failed");
  assert.equal(task?.errorCode, "recipe_save_failed");
  assert.equal(task?.generatedRecipeSlug, "my-generated-recipe");
  assert.equal(readLatestGeneratedRecipeSlug(), "my-generated-recipe");
});

test("completed generation persists the exact generated slug", () => {
  saveMockGenerationTask("番茄炒蛋", "manual");
  completeMockGenerationTaskWithSlug("tomato-eggs-2");

  const task = readMockGenerationTask();

  assert.equal(task?.status, "completed");
  assert.equal(task?.generatedRecipeSlug, "tomato-eggs-2");
  assert.equal(readLatestGeneratedRecipeSlug(), "tomato-eggs-2");
});

test("starting a second generation replaces the previous active task", () => {
  saveMockGenerationTask("番茄炒蛋", "manual");
  completeMockGenerationTaskWithSlug("tomato-eggs-2");
  saveMockGenerationTask("青椒肉丝", "manual");

  const task = readMockGenerationTask();

  assert.equal(task?.status, "processing");
  assert.equal(task?.sourceUrl, "青椒肉丝");
  assert.equal(task?.generatedRecipeSlug, "kung-pao-chicken");
});

test("parsed draft becomes a complete local recipe", () => {
  const recipe = mapParsedDraftToLocalRecipe(draft);

  assert.equal(recipe.slug, "my-generated-recipe");
  assert.equal(recipe.titleZh, "番茄炒蛋");
  assert.ok(recipe.ingredients.some((item) => item.name === "番茄"));
  assert.ok(recipe.seasonings.some((item) => item.name === "盐"));
  assert.ok(recipe.seasonings.some((item) => item.name === "白糖"));
  assert.ok(recipe.steps.length >= 1);
});

test("each saved local recipe keeps a unique slug and its own draft", () => {
  const firstRecipe = saveLocalGeneratedRecipe(draft);
  const secondRecipe = saveLocalGeneratedRecipe({
    ...draft,
    titleZh: "青椒肉丝",
    titleEn: "Shredded Pork with Peppers",
  });

  assert.notEqual(firstRecipe.slug, secondRecipe.slug);
  assert.equal(
    getLocalGeneratedRecipeBySlug(firstRecipe.slug)?.titleZh,
    "番茄炒蛋",
  );
  assert.equal(
    getLocalGeneratedRecipeBySlug(secondRecipe.slug)?.titleZh,
    "青椒肉丝",
  );
});

test("local user correction persists the category and user source", () => {
  const chickenRecipe = saveLocalGeneratedRecipe({
    ...draft,
    primaryCategory: "chicken",
    primaryIngredient: "鸡腿肉",
    classificationConfidence: 0.95,
    classificationReason: "鸡肉是菜品主体",
    classificationSource: "ai",
  });

  assert.equal(
    updateLocalGeneratedRecipeCategory(chickenRecipe.slug, "beef"),
    true,
  );
  assert.equal(
    getLocalGeneratedDraftBySlug(chickenRecipe.slug)?.primaryCategory,
    "beef",
  );
  assert.equal(
    getLocalGeneratedDraftBySlug(chickenRecipe.slug)?.classificationSource,
    "user",
  );
});

test("Vercel can fall back when Netlify background routes are unavailable", () => {
  assert.equal(isBackgroundGenerationRouteUnavailable(404), true);
  assert.equal(isBackgroundGenerationRouteUnavailable(405), true);
  assert.equal(isBackgroundGenerationRouteUnavailable(500), false);
});

test("completed source generation prefers local cache then cloud cache", () => {
  assert.equal(pickReusableRecipeSlug("local-recipe", "cloud-recipe"), "local-recipe");
  assert.equal(pickReusableRecipeSlug(null, "cloud-recipe"), "cloud-recipe");
  assert.equal(pickReusableRecipeSlug(null, null), null);
});

test("completed cached generation opens the existing recipe without loading", () => {
  assert.equal(
    getGenerationStartRoute({
      jobId: "cached-job",
      recipeSlug: "steamed-egg-with-garlic-shrimp",
      sourcePlatform: "manual",
      sourceValue: "蒜蓉虾仁蒸蛋",
      startedAt: "2026-07-16T00:00:00.000Z",
      status: "completed",
    }),
    "/recipe/steamed-egg-with-garlic-shrimp",
  );
});

test("new generation continues through the loading route", () => {
  assert.equal(
    getGenerationStartRoute({
      jobId: "new-job",
      sourcePlatform: "manual",
      sourceValue: "蒜蓉虾仁蒸蛋",
      startedAt: "2026-07-16T00:00:00.000Z",
      status: "processing",
    }),
    "/loading",
  );
});

test("old interrupted generation is stale and must not restart paid work", () => {
  const now = Date.parse("2026-07-16T12:30:01.000Z");

  assert.equal(
    isPendingGenerationStale(
      {
        jobId: "old-job",
        sourcePlatform: "xiaohongshu",
        sourceValue: "https://www.xiaohongshu.com/explore/example",
        startedAt: "2026-07-16T12:15:00.000Z",
        status: "processing",
      },
      now,
    ),
    true,
  );
});

test("recent or completed generation remains resumable", () => {
  const now = Date.parse("2026-07-16T12:10:00.000Z");
  const pending = {
    jobId: "recent-job",
    sourcePlatform: "manual" as const,
    sourceValue: "番茄炒蛋",
    startedAt: "2026-07-16T12:00:00.000Z",
    status: "processing" as const,
  };

  assert.equal(isPendingGenerationStale(pending, now), false);
  assert.equal(
    isPendingGenerationStale({ ...pending, status: "completed" }, now + 3_600_000),
    false,
  );
});

test("generation diagnostics contain only safe quality and provider metrics", () => {
  const diagnostics = buildGenerationDiagnostics(
    {
      ok: true,
      draft,
      error: null,
      errorCode: null,
      provider: "deepseek",
      usedFallback: false,
      diagnostics: {
        attemptedProvider: "deepseek",
        model: "deepseek-v4-flash",
        durationMs: 1200,
        attemptCount: 1,
        finishReason: "stop",
        usage: { promptTokens: 100, completionTokens: 80, totalTokens: 180 },
      },
    },
    draft,
  );

  assert.equal(diagnostics.provider, "deepseek");
  assert.equal(diagnostics.model, "deepseek-v4-flash");
  assert.equal(diagnostics.processingTimeMs, 1200);
  assert.equal(diagnostics.totalTokens, 180);
  assert.ok(diagnostics.qualityScore >= 0);
  assert.equal("transcript" in diagnostics, false);
  assert.equal("sourceUrl" in diagnostics, false);
});

test("generation failure keeps the exact safe pipeline classification", () => {
  const baseResult = {
    ok: false,
    draft: null,
    error: "safe error",
    errorCode: "SOURCE_EXTRACTION_FAILED" as const,
    provider: "deepseek" as const,
    usedFallback: false,
  };

  assert.equal(
    getGenerationFailureCode(
      { ...baseResult, pipelineErrorCode: "deepseek_parse_failed" },
      true,
    ),
    "deepseek_parse_failed",
  );
  assert.equal(
    getGenerationFailureCode(
      { ...baseResult, pipelineErrorCode: "recipe_quality_failed" },
      true,
    ),
    "recipe_quality_failed",
  );
  assert.equal(
    getGenerationFailureCode(
      { ...baseResult, sourceErrorCode: "fetch_blocked" },
      true,
    ),
    "source_extraction_failed",
  );
});
