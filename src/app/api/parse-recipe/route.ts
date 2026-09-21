import { parseRecipeInput } from "@/lib/ai";
import type { RecipeParseInput, RecipeParseSourcePlatform } from "@/types/ai";
import { checkParseRecipeRateLimit } from "@/lib/security/parseRecipeRateLimit";
import { extractPublicSource } from "@/lib/source";
import {
  generateRecipeFromShareLink,
  ShareLinkGenerationError,
  transcribeShareLink,
} from "@/lib/generation/generateRecipeFromShareLink";
import { AudioExtractionError } from "@/lib/media/extractAudio";

export const runtime = "nodejs";
export const maxDuration = 60;

const allowedSourcePlatforms = new Set<RecipeParseSourcePlatform>([
  "xiaohongshu",
  "douyin",
  "manual",
  "mock",
]);
const MAX_SOURCE_URL_LENGTH = 2048;
const MAX_RAW_TEXT_LENGTH = 30000;

function getClientKey(request: Request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asSourcePlatform(value: unknown): RecipeParseSourcePlatform | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return allowedSourcePlatforms.has(value as RecipeParseSourcePlatform)
    ? (value as RecipeParseSourcePlatform)
    : undefined;
}

async function shareLinkFailureResponse(error: unknown, sourceUrl: string) {
  if (error instanceof ShareLinkGenerationError) {
    console.info("[recipe-pipeline]", {
      errorCode: error.code,
      stage: error.code === "recipe_quality_failed" ? "validating" : "parsing",
    });
    return Response.json(
      {
        ok: false,
        draft: null,
        error:
          error.code === "recipe_quality_failed"
            ? "视频内容已识别，但菜谱信息不足，请补充正文或字幕。"
            : "视频语音已识别，但菜谱整理失败，请稍后重试。",
        errorCode: "SOURCE_EXTRACTION_FAILED",
        pipelineErrorCode: error.code,
        provider: "deepseek",
        sourceErrorCode: null,
        usedFallback: false,
      },
      { status: 422 },
    );
  }

  const mediaErrorCode =
    error instanceof AudioExtractionError ? error.code : null;
  const extractedSource = await extractPublicSource(sourceUrl);

  if (!extractedSource.ok) {
    return Response.json(
      {
        ok: false,
        draft: null,
        error: "暂时无法读取这条分享链接，请粘贴正文或字幕。",
        errorCode: "SOURCE_EXTRACTION_FAILED",
        provider: "mock",
        sourceErrorCode: mediaErrorCode ?? extractedSource.errorCode,
        usedFallback: false,
      },
      { status: 422 },
    );
  }

  return Response.json(
    {
      ok: false,
      draft: null,
      error: "视频语音暂时无法识别，请粘贴正文或字幕。",
      errorCode: "SOURCE_EXTRACTION_FAILED",
      provider: "mock",
      sourceErrorCode: mediaErrorCode ?? "no_text",
      usedFallback: false,
    },
    { status: 422 },
  );
}

export async function POST(request: Request) {
  const rateLimit = checkParseRecipeRateLimit(getClientKey(request));

  if (!rateLimit.allowed) {
    return Response.json(
      {
        ok: false,
        draft: null,
        error: "解析请求过于频繁，请稍后再试。",
        errorCode: "RATE_LIMITED",
        provider: "mock",
        usedFallback: false,
      },
      {
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
        status: 429,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        draft: null,
        error: "请求 body 必须是 JSON。",
        errorCode: "INVALID_INPUT",
        provider: "mock",
        usedFallback: true,
      },
      { status: 400 },
    );
  }

  const requestBody = body && typeof body === "object" ? body : {};
  const sourceUrl = asOptionalString(
    "sourceUrl" in requestBody ? requestBody.sourceUrl : undefined,
  );
  const rawText = asOptionalString(
    "rawText" in requestBody ? requestBody.rawText : undefined,
  );
  const operation =
    "operation" in requestBody && requestBody.operation === "transcribe"
      ? "transcribe"
      : "parse";

  if (!sourceUrl && !rawText) {
    return Response.json(
      {
        ok: false,
        draft: null,
        error: "sourceUrl 和 rawText 不能同时为空。",
        errorCode: "INVALID_INPUT",
        provider: "mock",
        usedFallback: true,
      },
      { status: 400 },
    );
  }

  if (sourceUrl && sourceUrl.length > MAX_SOURCE_URL_LENGTH) {
    return Response.json(
      {
        ok: false,
        draft: null,
        error: `sourceUrl 不能超过 ${MAX_SOURCE_URL_LENGTH} 个字符。`,
        errorCode: "INVALID_INPUT",
        provider: "mock",
        usedFallback: true,
      },
      { status: 400 },
    );
  }

  if (rawText && rawText.length > MAX_RAW_TEXT_LENGTH) {
    return Response.json(
      {
        ok: false,
        draft: null,
        error: `rawText 不能超过 ${MAX_RAW_TEXT_LENGTH} 个字符。`,
        errorCode: "INVALID_INPUT",
        provider: "mock",
        usedFallback: true,
      },
      { status: 413 },
    );
  }

  if (sourceUrl && !rawText && operation === "transcribe") {
    try {
      const transcribed = await transcribeShareLink(sourceUrl);

      return Response.json({
        ok: true,
        transcript: transcribed.transcript,
        error: null,
        errorCode: null,
        source: {
          canonicalUrl: transcribed.canonicalUrl,
          extractor: "combined",
          platform: transcribed.platform,
          warnings: transcribed.asr.warnings,
        },
        generation: {
          asrModel: transcribed.asr.model,
          asrProvider: transcribed.asr.provider,
          durationSeconds: transcribed.durationSeconds,
          processingTimeMs:
            transcribed.stages.at(-1)?.completedAtMs ??
            transcribed.asr.processingTimeMs,
          sourceHash: transcribed.sourceHash,
          stages: transcribed.stages,
          usedAsrFallback: transcribed.asr.usedFallback,
        },
      });
    } catch (error) {
      return shareLinkFailureResponse(error, sourceUrl);
    }
  }

  if (sourceUrl && !rawText) {
    try {
      const generated = await generateRecipeFromShareLink(sourceUrl);

      return Response.json({
        ok: true,
        draft: generated.draft,
        error: null,
        errorCode: null,
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        provider: "deepseek",
        usedFallback: false,
        diagnostics: generated.diagnostics,
        source: {
          canonicalUrl: generated.canonicalUrl,
          extractor: "combined",
          platform: generated.platform,
          warnings: generated.asr.warnings,
        },
        generation: {
          asrModel: generated.asr.model,
          asrProvider: generated.asr.provider,
          durationSeconds: generated.durationSeconds,
          processingTimeMs:
            generated.stages.at(-1)?.completedAtMs ?? generated.asr.processingTimeMs,
          sourceHash: generated.sourceHash,
          stages: generated.stages,
          usedAsrFallback: generated.asr.usedFallback,
        },
      });
    } catch (error) {
      return shareLinkFailureResponse(error, sourceUrl);
    }
  }

  const input: RecipeParseInput = {
    sourceUrl,
    rawText,
    sourcePlatform: asSourcePlatform(
      "sourcePlatform" in requestBody ? requestBody.sourcePlatform : undefined,
    ),
    userId: null,
  };

  try {
    const result = await parseRecipeInput(input);
    return Response.json(result);
  } catch {
    return Response.json(
      {
        ok: false,
        draft: null,
        error: "解析服务暂时不可用。",
        errorCode: "UNKNOWN",
        provider: "mock",
        usedFallback: true,
      },
      { status: 500 },
    );
  }
}
