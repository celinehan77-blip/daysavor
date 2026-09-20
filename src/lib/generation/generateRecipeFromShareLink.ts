import { parseRecipeWithDeepSeek } from "@/lib/ai/providers/deepseek";
import { scoreParsedRecipeDraft } from "@/lib/ai/scoreParsedRecipe";
import {
  transcribeAudio,
  transcribeRemoteAudioUrl,
  type TranscriptionResult,
} from "@/lib/asr/transcribeAudio";
import { resolveAlapiMedia } from "@/lib/media/alapiMedia";
import { AudioExtractionError } from "@/lib/media/errors";
import { extractAudioFromShareLink } from "@/lib/media/extractAudio";
import { normalizeShareUrl } from "@/lib/media/extractAudio";
import { extractRecipeTextFromVideo } from "@/lib/vision/extractRecipeTextFromVideo";
import type { ParsedRecipeDraft } from "@/types/ai";
import type { RecipeParseResult } from "@/types/ai";

export type GenerationStage =
  | "resolving_link"
  | "extracting_audio"
  | "transcribing"
  | "parsing"
  | "validating"
  | "completed";

export type ShareLinkGenerationErrorCode =
  | "deepseek_parse_failed"
  | "recipe_quality_failed";

export class ShareLinkGenerationError extends Error {
  constructor(public readonly code: ShareLinkGenerationErrorCode) {
    super(code);
    this.name = "ShareLinkGenerationError";
  }
}

export type ShareLinkGenerationResult = {
  asr: TranscriptionResult;
  canonicalUrl: string;
  draft: ParsedRecipeDraft;
  durationSeconds: number;
  sourceHash: string;
  stages: Array<{ stage: GenerationStage; completedAtMs: number }>;
  title: string | null;
  transcript: string;
  platform: "xiaohongshu" | "douyin";
  diagnostics: RecipeParseResult["diagnostics"];
};

export type ShareLinkTranscriptionResult = Omit<
  ShareLinkGenerationResult,
  "diagnostics" | "draft"
>;

type RemoteTranscriptionDependencies = {
  extractVisibleRecipeText: typeof extractRecipeTextFromVideo;
  resolveProviderMedia: typeof resolveAlapiMedia;
  transcribeRemoteMedia: typeof transcribeRemoteAudioUrl;
};

export function isLikelyRecipeTranscript(transcript: string) {
  const normalized = transcript.trim();
  const cookingSignals = [
    /切|剁|拍|洗|焯|腌|抓匀/,
    /加入|放入|倒入|下锅/,
    /炒|煎|炸|蒸|煮|炖|焖|烤/,
    /盐|糖|酱油|生抽|老抽|料酒|淀粉/,
    /分钟|小时|火候|大火|小火|中火/,
    /鸡|鸭|猪|排骨|牛|羊|鱼|虾|蛋|豆腐|蔬菜/,
  ].filter((pattern) => pattern.test(normalized)).length;
  const chineseCharacters = normalized.match(/[\u3400-\u9fff]/g)?.length ?? 0;

  return normalized.length >= 12 && chineseCharacters >= 10 && cookingSignals >= 2;
}

export function isGroundedShareRecipeUsable(
  draft: ParsedRecipeDraft,
  sourceText: string,
) {
  const quality = scoreParsedRecipeDraft(draft);
  const namedItems = [...draft.ingredients, ...draft.seasonings].filter((item) =>
    sourceText.includes(item.name),
  );
  const repeatedTitleSteps = draft.steps.filter(
    (step) => step.description.trim() === draft.titleZh.trim(),
  );
  const ingredientCount = draft.ingredients.length + draft.seasonings.length;

  return !(
    sourceText.trim().length < 30 ||
    ingredientCount < 2 ||
    draft.steps.length < 3 ||
    namedItems.length < 2 ||
    repeatedTitleSteps.length > 0 ||
    quality.score < 55
  );
}

function validateGroundedRecipe(draft: ParsedRecipeDraft, transcript: string) {
  if (!isGroundedShareRecipeUsable(draft, transcript)) {
    throw new ShareLinkGenerationError("recipe_quality_failed");
  }
}

export function buildShareRecipeSource(title: string | null, transcript: string) {
  return [
    title?.trim() ? `视频标题：${title.trim()}` : null,
    `视频语音转写：${transcript.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const globalCache = globalThis as typeof globalThis & {
  __recipeTicketShareJobs?: Map<string, Promise<ShareLinkGenerationResult>>;
  __recipeTicketTranscriptionJobs?: Map<
    string,
    Promise<ShareLinkTranscriptionResult>
  >;
};
const shareJobs =
  globalCache.__recipeTicketShareJobs ??
  (globalCache.__recipeTicketShareJobs = new Map());
const transcriptionJobs =
  globalCache.__recipeTicketTranscriptionJobs ??
  (globalCache.__recipeTicketTranscriptionJobs = new Map());

export async function transcribeRemoteXiaohongshuMedia(
  sourceUrl: string,
  dependencies: RemoteTranscriptionDependencies = {
    extractVisibleRecipeText: extractRecipeTextFromVideo,
    resolveProviderMedia: resolveAlapiMedia,
    transcribeRemoteMedia: transcribeRemoteAudioUrl,
  },
): Promise<ShareLinkTranscriptionResult | null> {
  const startedAt = Date.now();
  const normalized = normalizeShareUrl(sourceUrl);
  if (normalized.platform !== "xiaohongshu") return null;

  let media: Awaited<ReturnType<typeof resolveAlapiMedia>>;
  try {
    media = await dependencies.resolveProviderMedia(sourceUrl);
  } catch (error) {
    if (
      error instanceof AudioExtractionError &&
      error.code === "image_post_unsupported"
    ) {
      throw error;
    }
    return null;
  }

  const resolvedAtMs = Date.now() - startedAt;
  let asr: TranscriptionResult | null = null;
  try {
    asr = await dependencies.transcribeRemoteMedia(
      media.fallbackMediaUrl ?? media.mediaUrl,
    );
  } catch {
    asr = null;
  }

  if (!asr || !isLikelyRecipeTranscript(asr.transcript)) {
    try {
      const vision = await dependencies.extractVisibleRecipeText(
        media.mediaUrl,
        media.description,
      );
      asr = {
        model: vision.model,
        processingTimeMs: vision.processingTimeMs,
        provider: "aliyun_qwen_vision",
        transcript: vision.text,
        usedFallback: true,
        warnings: ["视频语音不足，已读取画面中的真实菜谱文字。"],
      };
    } catch {
      return null;
    }
  }

  const completedAtMs = Date.now() - startedAt;
  return {
    asr,
    canonicalUrl: media.canonicalUrl,
    durationSeconds: media.durationSeconds,
    platform: normalized.platform,
    sourceHash: normalized.sourceHash,
    stages: [
      { stage: "resolving_link", completedAtMs: 0 },
      { stage: "extracting_audio", completedAtMs: resolvedAtMs },
      { stage: "transcribing", completedAtMs },
    ],
    title: media.description,
    transcript: asr.transcript,
  };
}

async function transcribeUncachedShareLink(
  sourceUrl: string,
): Promise<ShareLinkTranscriptionResult> {
  const remote = await transcribeRemoteXiaohongshuMedia(sourceUrl);
  if (remote) {
    console.info("[recipe-pipeline]", {
      elapsedMs: remote.stages.at(-1)?.completedAtMs,
      provider: remote.asr.provider,
      stage: "transcribing_remote_media",
      usedFallback: remote.asr.usedFallback,
    });
    return remote;
  }

  const startedAt = Date.now();
  const stages: ShareLinkGenerationResult["stages"] = [
    { stage: "resolving_link", completedAtMs: 0 },
  ];
  const audio = await extractAudioFromShareLink(sourceUrl);
  stages.push({ stage: "extracting_audio", completedAtMs: Date.now() - startedAt });
  console.info("[recipe-pipeline]", {
    elapsedMs: stages.at(-1)?.completedAtMs,
    stage: "extracting_audio",
  });

  const asr = await transcribeAudio(audio.audio);
  stages.push({ stage: "transcribing", completedAtMs: Date.now() - startedAt });
  console.info("[recipe-pipeline]", {
    elapsedMs: stages.at(-1)?.completedAtMs,
    provider: asr.provider,
    stage: "transcribing",
    usedFallback: asr.usedFallback,
  });

  return {
    asr,
    canonicalUrl: audio.canonicalUrl,
    durationSeconds: audio.durationSeconds,
    sourceHash: audio.sourceHash,
    stages,
    title: audio.title,
    transcript: asr.transcript,
    platform: audio.platform,
  };
}

export async function transcribeShareLink(sourceUrl: string) {
  const { sourceHash } = normalizeShareUrl(sourceUrl);
  const existing = transcriptionJobs.get(sourceHash);

  if (existing) {
    return existing;
  }

  const transcription = transcribeUncachedShareLink(sourceUrl);
  if (transcriptionJobs.size >= 20) {
    const oldestKey = transcriptionJobs.keys().next().value;
    if (oldestKey) {
      transcriptionJobs.delete(oldestKey);
    }
  }
  transcriptionJobs.set(sourceHash, transcription);

  try {
    return await transcription;
  } catch (error) {
    transcriptionJobs.delete(sourceHash);
    throw error;
  }
}

async function generateUncachedRecipeFromShareLink(
  sourceUrl: string,
): Promise<ShareLinkGenerationResult> {
  const transcribed = await transcribeShareLink(sourceUrl);
  const startedAt = Date.now() - (transcribed.stages.at(-1)?.completedAtMs ?? 0);
  const stages = [...transcribed.stages];

  const recipeSource = buildShareRecipeSource(
    transcribed.title,
    transcribed.transcript,
  );
  const parsed = await parseRecipeWithDeepSeek({
    rawText: recipeSource,
    sourcePlatform: transcribed.platform,
    sourceUrl: transcribed.canonicalUrl,
    userId: null,
  });
  stages.push({ stage: "parsing", completedAtMs: Date.now() - startedAt });

  if (!parsed.ok || !parsed.draft) {
    throw new ShareLinkGenerationError("deepseek_parse_failed");
  }

  validateGroundedRecipe(parsed.draft, recipeSource);
  stages.push({ stage: "validating", completedAtMs: Date.now() - startedAt });
  stages.push({ stage: "completed", completedAtMs: Date.now() - startedAt });

  return {
    asr: transcribed.asr,
    canonicalUrl: transcribed.canonicalUrl,
    draft: parsed.draft,
    durationSeconds: transcribed.durationSeconds,
    sourceHash: transcribed.sourceHash,
    stages,
    title: transcribed.title,
    transcript: transcribed.transcript,
    platform: transcribed.platform,
    diagnostics: parsed.diagnostics,
  };
}

export async function generateRecipeFromShareLink(sourceUrl: string) {
  const { sourceHash } = normalizeShareUrl(sourceUrl);
  const existing = shareJobs.get(sourceHash);

  if (existing) {
    return existing;
  }

  const generation = generateUncachedRecipeFromShareLink(sourceUrl);
  if (shareJobs.size >= 20) {
    const oldestKey = shareJobs.keys().next().value;
    if (oldestKey) {
      shareJobs.delete(oldestKey);
    }
  }
  shareJobs.set(sourceHash, generation);

  try {
    return await generation;
  } catch (error) {
    shareJobs.delete(sourceHash);
    throw error;
  }
}
