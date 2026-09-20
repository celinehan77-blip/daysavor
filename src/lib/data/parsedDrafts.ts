import type {
  ParsedRecipeDraft,
  RecipeParseProvider,
} from "@/types/ai";

const LATEST_PARSED_DRAFT_KEY = "recipe-ticket:latest-parsed-draft";
const LATEST_PARSED_DRAFT_METADATA_KEY =
  "recipe-ticket:latest-parsed-draft-metadata";

export type ParsedDraftMetadata = {
  generation?: {
    asrModel: string;
    asrProvider: "volcengine" | "aliyun_qwen" | "aliyun_qwen_vision";
    processingTimeMs: number;
    stages: Array<{ stage: string; completedAtMs: number }>;
    usedAsrFallback: boolean;
  };
  model: string | null;
  provider: RecipeParseProvider;
  savedAt: string;
  usedFallback: boolean;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasParsedDraftShape(value: unknown): value is ParsedRecipeDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<ParsedRecipeDraft>;

  return (
    typeof draft.titleZh === "string" &&
    typeof draft.titleEn === "string" &&
    typeof draft.description === "string" &&
    typeof draft.timeMinutes === "number" &&
    typeof draft.difficulty === "string" &&
    typeof draft.flavor === "string" &&
    typeof draft.mainIngredient === "string" &&
    isStringArray(draft.tags) &&
    Array.isArray(draft.ingredients) &&
    Array.isArray(draft.seasonings) &&
    Array.isArray(draft.steps) &&
    typeof draft.confidence === "number" &&
    isStringArray(draft.warnings)
  );
}

export function saveLatestParsedDraft(
  draft: ParsedRecipeDraft,
  metadata?: Omit<ParsedDraftMetadata, "savedAt">,
): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(LATEST_PARSED_DRAFT_KEY, JSON.stringify(draft));

    if (metadata) {
      window.localStorage.setItem(
        LATEST_PARSED_DRAFT_METADATA_KEY,
        JSON.stringify({ ...metadata, savedAt: new Date().toISOString() }),
      );
    }

    return true;
  } catch {
    return false;
  }
}

export function getLatestParsedDraftMetadata(): ParsedDraftMetadata | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawMetadata = window.localStorage.getItem(
      LATEST_PARSED_DRAFT_METADATA_KEY,
    );

    if (!rawMetadata) {
      return null;
    }

    const metadata = JSON.parse(rawMetadata) as Partial<ParsedDraftMetadata>;

    if (
      (metadata.provider === "mock" ||
        metadata.provider === "deepseek" ||
        metadata.provider === "openai" ||
        metadata.provider === "qwen") &&
      typeof metadata.usedFallback === "boolean" &&
      typeof metadata.savedAt === "string" &&
      (metadata.model === null || typeof metadata.model === "string")
    ) {
      return metadata as ParsedDraftMetadata;
    }

    return null;
  } catch {
    return null;
  }
}

export function getLatestParsedDraft(): ParsedRecipeDraft | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(LATEST_PARSED_DRAFT_KEY);

    if (!rawDraft) {
      return null;
    }

    const draft = JSON.parse(rawDraft) as unknown;

    return hasParsedDraftShape(draft) ? draft : null;
  } catch {
    return null;
  }
}

export function clearLatestParsedDraft(): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.removeItem(LATEST_PARSED_DRAFT_KEY);
    window.localStorage.removeItem(LATEST_PARSED_DRAFT_METADATA_KEY);
    return true;
  } catch {
    return false;
  }
}

export function isParsedRecipeDraft(value: unknown): value is ParsedRecipeDraft {
  return hasParsedDraftShape(value);
}
