"use client";

import {
  clearLatestParsedDraft,
  isParsedRecipeDraft,
  saveLatestParsedDraft,
} from "@/lib/data/parsedDrafts";
import {
  completeMockGenerationTask,
  createMockGenerationTask,
  failGenerationTask,
  getCompletedGeneratedRecipeSlugBySource,
  type GenerationTaskDiagnostics,
  type GenerationTaskFailureCode,
} from "@/lib/data/generationTasks";
import { createRecipeFromParsedDraft } from "@/lib/data/recipes";
import {
  getCachedGeneratedRecipeSlug,
  saveGeneratedRecipeSourceCache,
} from "@/lib/data/sourceGenerationCache";
import {
  extractHttpUrlFromSharedText,
  sanitizeSharedSourceForStorage,
} from "@/lib/source/sharedInput";
import type {
  ParsedRecipeDraft,
  RecipeParseResult,
  RecipeParseSourcePlatform,
} from "@/types/ai";
import { scoreParsedRecipeDraft } from "@/lib/ai/scoreParsedRecipe";

const PENDING_GENERATION_KEY = "recipe-ticket:pending-recipe-generation";
const GENERATION_ERROR_KEY = "recipe-ticket:pending-generation-error";
const PARSE_TIMEOUT_MS = 120_000;
const PENDING_GENERATION_STALE_MS = 15 * 60 * 1000;

export type PendingRecipeGeneration = {
  jobId: string;
  message?: string;
  recipeSlug?: string;
  sourcePlatform: RecipeParseSourcePlatform;
  sourceValue: string;
  startedAt: string;
  status: "processing" | "completed" | "failed";
  taskId?: string;
};

export type PendingRecipeGenerationResult =
  | { ok: true; slug: string }
  | { ok: false; message: string };

type ParsedSourceResult =
  | {
      ok: true;
      draft: ParsedRecipeDraft;
      sourcePlatform: RecipeParseSourcePlatform;
      sourceUrl?: string;
      usedFallback: boolean;
      diagnostics: GenerationTaskDiagnostics;
    }
  | {
      ok: false;
      message: string;
      shouldContinueWithFallback: boolean;
      taskErrorCode: GenerationTaskFailureCode;
    };

type BackgroundGenerationStatus = {
  errorCode?: string;
  result?: RecipeParseResult;
  status: "pending" | "processing" | "completed" | "failed";
};

type BackgroundGenerationAttempt = {
  available: boolean;
  result: RecipeParseResult | null;
};

const activeJobs = new Map<string, Promise<PendingRecipeGenerationResult>>();

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function isLikelyRecipeUrl(value: string) {
  const normalized = value.toLowerCase();
  return (
    /^https?:\/\//.test(normalized) ||
    normalized.startsWith("www.") ||
    normalized.includes("xiaohongshu") ||
    normalized.includes("xhs") ||
    normalized.includes("douyin") ||
    normalized.includes(".com") ||
    normalized.includes(".cn")
  );
}

export function getRecipeSourcePlatform(
  value: string,
): RecipeParseSourcePlatform {
  const normalized = value.toLowerCase();
  if (normalized.includes("xiaohongshu") || normalized.includes("xhs")) {
    return "xiaohongshu";
  }
  if (normalized.includes("douyin")) {
    return "douyin";
  }
  return isLikelyRecipeUrl(value) ? "mock" : "manual";
}

function savePendingGeneration(pending: PendingRecipeGeneration) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(PENDING_GENERATION_KEY, JSON.stringify(pending));
  } catch {
    return;
  }
}

export function getPendingRecipeGeneration(): PendingRecipeGeneration | null {
  if (!canUseLocalStorage()) return null;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(PENDING_GENERATION_KEY) || "null",
    ) as PendingRecipeGeneration | null;
    return value && typeof value.jobId === "string" ? value : null;
  } catch {
    return null;
  }
}

export function clearPendingRecipeGeneration() {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(PENDING_GENERATION_KEY);
  } catch {
    return;
  }
}

export function consumePendingGenerationError() {
  if (!canUseLocalStorage()) return "";
  try {
    const message = window.localStorage.getItem(GENERATION_ERROR_KEY) || "";
    window.localStorage.removeItem(GENERATION_ERROR_KEY);
    return message;
  } catch {
    return "";
  }
}

function saveGenerationError(message: string) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(GENERATION_ERROR_KEY, message);
  } catch {
    return;
  }
}

function waitForPoll(delayMs: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, delayMs);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Generation aborted.", "AbortError"));
      },
      { once: true },
    );
  });
}

async function waitForBackgroundGeneration(
  jobId: string,
  sourceUrl: string,
  signal: AbortSignal,
): Promise<BackgroundGenerationAttempt> {
  const startResponse = await fetch("/api/generate-recipe-background", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, sourceUrl }),
    signal,
  });

  if (isBackgroundGenerationRouteUnavailable(startResponse.status)) {
    return { available: false, result: null };
  }

  if (!startResponse.ok) {
    return { available: true, result: null };
  }

  while (!signal.aborted) {
    await waitForPoll(1500, signal);
    const statusResponse = await fetch(`/api/generation-status/${jobId}`, {
      cache: "no-store",
      signal,
    });

    if (isBackgroundGenerationRouteUnavailable(statusResponse.status)) {
      return { available: false, result: null };
    }
    if (!statusResponse.ok) {
      return { available: true, result: null };
    }

    const status = (await statusResponse.json()) as BackgroundGenerationStatus;

    if (status.status === "completed" && status.result) {
      return { available: true, result: status.result };
    }
    if (status.status === "failed") {
      return { available: true, result: null };
    }
  }

  return { available: true, result: null };
}

export function isBackgroundGenerationRouteUnavailable(status: number) {
  return status === 404 || status === 405;
}

export function pickReusableRecipeSlug(
  localSlug: string | null,
  cloudSlug: string | null,
) {
  return localSlug ?? cloudSlug;
}

export function getGenerationStartRoute(pending: PendingRecipeGeneration) {
  return pending.status === "completed" && pending.recipeSlug
    ? `/recipe/${pending.recipeSlug}`
    : "/loading";
}

export function isPendingGenerationStale(
  pending: PendingRecipeGeneration,
  now = Date.now(),
) {
  const startedAt = Date.parse(pending.startedAt);

  return (
    pending.status === "processing" &&
    (!Number.isFinite(startedAt) || now - startedAt > PENDING_GENERATION_STALE_MS)
  );
}

export function buildGenerationDiagnostics(
  result: RecipeParseResult,
  draft: ParsedRecipeDraft,
): GenerationTaskDiagnostics {
  const quality = scoreParsedRecipeDraft(draft);

  return {
    asrModel: result.generation?.asrModel ?? null,
    asrProvider: result.generation?.asrProvider ?? null,
    model: result.model ?? result.diagnostics?.model ?? null,
    processingTimeMs:
      result.generation?.processingTimeMs ?? result.diagnostics?.durationMs ?? 0,
    provider: result.provider,
    qualityScore: quality.score,
    totalTokens: result.diagnostics?.usage?.totalTokens ?? null,
    usedAsrFallback: result.generation?.usedAsrFallback ?? false,
    usedFallback: result.usedFallback,
  };
}

async function requestDirectRecipeParse(
  body: Record<string, string>,
  signal: AbortSignal,
) {
  const response = await fetch("/api/parse-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const result = (await response.json()) as RecipeParseResult;

  return result;
}

export function getGenerationFailureCode(
  result: RecipeParseResult | null,
  looksLikeUrl: boolean,
): GenerationTaskFailureCode {
  if (result?.pipelineErrorCode === "deepseek_parse_failed") {
    return "deepseek_parse_failed";
  }
  if (result?.pipelineErrorCode === "recipe_quality_failed") {
    return "recipe_quality_failed";
  }
  if (looksLikeUrl && result?.sourceErrorCode) {
    return "source_extraction_failed";
  }
  return looksLikeUrl ? "source_extraction_failed" : "ai_provider_failed";
}

async function parseRecipeSource(
  sourceValue: string,
  jobId: string,
): Promise<ParsedSourceResult> {
  const extractedUrl = extractHttpUrlFromSharedText(sourceValue);
  const looksLikeUrl = Boolean(extractedUrl) || isLikelyRecipeUrl(sourceValue);
  const sourcePlatform = getRecipeSourcePlatform(sourceValue);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS);

  try {
    let result: RecipeParseResult | null;

    if (looksLikeUrl) {
      const background = await waitForBackgroundGeneration(
        jobId,
        extractedUrl ?? sourceValue,
        controller.signal,
      );

      result = background.available
        ? background.result
        : await requestDirectRecipeParse(
            {
              sourcePlatform,
              sourceUrl: extractedUrl ?? sourceValue,
            },
            controller.signal,
          );
    } else {
      result = await requestDirectRecipeParse(
        { rawText: sourceValue, sourcePlatform },
        controller.signal,
      );
    }

    if (!result?.ok || !isParsedRecipeDraft(result.draft)) {
      return {
        ok: false,
        message:
          result?.error ??
          (looksLikeUrl
            ? "暂时无法读取这条分享链接，请粘贴正文或字幕。"
            : "菜谱解析请求失败，请稍后重试。"),
        shouldContinueWithFallback: !looksLikeUrl,
        taskErrorCode: getGenerationFailureCode(result, looksLikeUrl),
      };
    }

    const generation = result.generation;

    saveLatestParsedDraft(result.draft, {
      generation: generation
        ? {
            asrModel: generation.asrModel,
            asrProvider: generation.asrProvider,
            processingTimeMs: generation.processingTimeMs,
            stages: generation.stages,
            usedAsrFallback: generation.usedAsrFallback,
          }
        : undefined,
      model: result.model ?? result.diagnostics?.model ?? null,
      provider: result.provider,
      usedFallback: result.usedFallback,
    });

    return {
      ok: true,
      draft: result.draft,
      diagnostics: buildGenerationDiagnostics(result, result.draft),
      sourcePlatform,
      sourceUrl: looksLikeUrl
        ? result.source?.canonicalUrl ?? extractedUrl ?? sourceValue
        : undefined,
      usedFallback: result.usedFallback,
    };
  } catch {
    return {
      ok: false,
      message: looksLikeUrl
        ? "暂时无法读取这条分享链接，请粘贴正文或字幕。"
        : "菜谱解析超时或网络异常，请稍后重试。",
      shouldContinueWithFallback: !looksLikeUrl,
      taskErrorCode: looksLikeUrl
        ? "source_extraction_failed"
        : "ai_provider_failed",
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function runPendingGeneration(
  pending: PendingRecipeGeneration,
  requestSourceValue = pending.sourceValue,
): Promise<PendingRecipeGenerationResult> {
  const parsed = await parseRecipeSource(requestSourceValue, pending.jobId);

  if (!parsed.ok) {
    clearLatestParsedDraft();
    await failGenerationTask(
      parsed.taskErrorCode,
      "kung-pao-chicken",
      pending.taskId,
    );
    const failed = { ...pending, message: parsed.message, status: "failed" as const };
    savePendingGeneration(failed);
    saveGenerationError(parsed.message);
    return { ok: false, message: parsed.message };
  }

  const createdRecipe = await createRecipeFromParsedDraft({
    draft: parsed.draft,
    preferLocal: parsed.usedFallback,
    sourcePlatform: parsed.sourcePlatform,
    sourceUrl: parsed.sourceUrl,
  });

  if (parsed.usedFallback) {
    await failGenerationTask("ai_fallback_used", createdRecipe.slug, pending.taskId);
  } else if (createdRecipe.usedFallback) {
    await failGenerationTask("recipe_save_failed", createdRecipe.slug, pending.taskId);
  } else {
    await completeMockGenerationTask(
      createdRecipe.slug,
      pending.taskId,
      parsed.diagnostics,
    );
  }

  if (parsed.sourceUrl) {
    await saveGeneratedRecipeSourceCache(parsed.sourceUrl, createdRecipe.slug);
    await saveGeneratedRecipeSourceCache(pending.sourceValue, createdRecipe.slug);
  }

  savePendingGeneration({
    ...pending,
    recipeSlug: createdRecipe.slug,
    status: "completed",
  });
  return { ok: true, slug: createdRecipe.slug };
}

export async function beginPendingRecipeGeneration(sourceValue: string) {
  const sourcePlatform = getRecipeSourcePlatform(sourceValue);
  const persistedSourceValue = sanitizeSharedSourceForStorage(sourceValue);
  const localCachedSlug = isLikelyRecipeUrl(sourceValue)
    ? await getCachedGeneratedRecipeSlug(sourceValue)
    : null;
  const cloudCachedSlug = localCachedSlug
    ? null
    : await getCompletedGeneratedRecipeSlugBySource(persistedSourceValue);
  const cachedSlug = pickReusableRecipeSlug(localCachedSlug, cloudCachedSlug);

  const pending: PendingRecipeGeneration = {
    jobId: window.crypto.randomUUID(),
    recipeSlug: cachedSlug ?? undefined,
    sourcePlatform,
    sourceValue: persistedSourceValue,
    startedAt: new Date().toISOString(),
    status: cachedSlug ? "completed" : "processing",
  };

  savePendingGeneration(pending);

  if (cachedSlug) {
    activeJobs.set(pending.jobId, Promise.resolve({ ok: true, slug: cachedSlug }));
  } else {
    const task = await createMockGenerationTask(
      persistedSourceValue,
      sourcePlatform,
    );
    const pendingWithTask = { ...pending, taskId: task.id };
    savePendingGeneration(pendingWithTask);
    activeJobs.set(
      pending.jobId,
      runPendingGeneration(pendingWithTask, sourceValue),
    );
    return pendingWithTask;
  }

  return pending;
}

export function resumePendingRecipeGeneration(
  pending: PendingRecipeGeneration,
): Promise<PendingRecipeGenerationResult> {
  if (pending.status === "completed" && pending.recipeSlug) {
    return Promise.resolve({ ok: true, slug: pending.recipeSlug });
  }
  if (pending.status === "failed") {
    return Promise.resolve({
      ok: false,
      message: pending.message || "生成失败，请稍后重试。",
    });
  }

  if (isPendingGenerationStale(pending)) {
    const message = "上一次生成已中断，请重新提交。";
    const failed = { ...pending, message, status: "failed" as const };

    savePendingGeneration(failed);
    saveGenerationError(message);
    return failGenerationTask(
      "generation_interrupted",
      "kung-pao-chicken",
      pending.taskId,
    ).then(() => ({ ok: false, message }));
  }

  const active = activeJobs.get(pending.jobId);
  if (active) return active;

  const resumed = runPendingGeneration(pending);
  activeJobs.set(pending.jobId, resumed);
  return resumed;
}
