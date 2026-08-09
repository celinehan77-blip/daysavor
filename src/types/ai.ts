import type { IngredientGroup } from "@/types";
import type {
  ClassificationSource,
  RecipeCategoryId,
} from "@/types/classification";
import type {
  SourceExtractionErrorCode,
  SourceExtractionMetadata,
} from "@/lib/source/types";
import type {
  HeroImagePromptData,
  HeroVisualTags,
  RecipeVisualAssets,
} from "@/types/recipeVisual";

export type RecipeParseSourcePlatform =
  | "xiaohongshu"
  | "douyin"
  | "manual"
  | "mock";

export type RecipeParseProvider = "mock" | "deepseek" | "openai" | "qwen";

export type RecipeParseInput = {
  sourceUrl?: string;
  rawText?: string;
  sourcePlatform?: RecipeParseSourcePlatform;
  userId?: string | null;
};

export type ParsedIngredient = {
  name: string;
  amount: string;
  group: IngredientGroup;
  note: string;
};

export type ParsedStep = {
  title: string;
  description: string;
  duration: string;
  heat: string;
  tips: string;
};

export type RecipeParseErrorCode =
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "EMPTY_RESPONSE"
  | "TRUNCATED_RESPONSE"
  | "INVALID_RESPONSE"
  | "SOURCE_EXTRACTION_FAILED"
  | "UNKNOWN";

export type ParsedRecipeDraft = {
  titleZh: string;
  titleEn: string;
  description: string;
  timeMinutes: number;
  difficulty: string;
  flavor: string;
  mainIngredient: string;
  primaryCategory: RecipeCategoryId;
  primaryIngredient: string;
  classificationConfidence: number;
  classificationReason: string;
  classificationSource: ClassificationSource;
  primaryIngredientTags?: string[];
  ingredientImageTags?: string[];
  seasoningImageTags?: string[];
  stepActionTags?: string[];
  heroImagePromptData?: HeroImagePromptData | null;
  heroImageUrl?: string;
  heroVisualTags?: HeroVisualTags;
  visualAssets?: RecipeVisualAssets;
  tags: string[];
  ingredients: ParsedIngredient[];
  seasonings: ParsedIngredient[];
  steps: ParsedStep[];
  confidence: number;
  warnings: string[];
};

export type RecipeParseResult = {
  ok: boolean;
  draft: ParsedRecipeDraft | null;
  error: string | null;
  errorCode: RecipeParseErrorCode | null;
  provider: RecipeParseProvider;
  usedFallback: boolean;
  model?: string | null;
  source?: SourceExtractionMetadata;
  sourceErrorCode?: SourceExtractionErrorCode | null;
  pipelineErrorCode?:
    | "deepseek_parse_failed"
    | "recipe_quality_failed"
    | null;
  generation?: {
    asrModel: string;
    asrProvider: "volcengine" | "aliyun_qwen";
    durationSeconds: number;
    processingTimeMs: number;
    sourceHash: string;
    stages: Array<{ stage: string; completedAtMs: number }>;
    usedAsrFallback: boolean;
  };
  diagnostics?: {
    attemptedProvider: RecipeParseProvider;
    model: string | null;
    durationMs: number;
    attemptCount: number;
    finishReason: string | null;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    } | null;
  };
};
