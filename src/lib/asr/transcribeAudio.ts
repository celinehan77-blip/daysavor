import { randomUUID } from "node:crypto";
import {
  getQwenApiKey,
  getQwenCompatibleEndpoint,
} from "@/lib/ai/providers/qwenConfig";

const VOLC_ENDPOINT =
  "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash";
const VOLC_RESOURCE_ID = "volc.bigasr.auc_turbo";
const DEFAULT_TIMEOUT_MS = 35_000;
const DEFAULT_QWEN_MODEL = "qwen3-asr-flash";

export type AsrProvider =
  | "volcengine"
  | "aliyun_qwen"
  | "aliyun_qwen_vision";
export type AsrErrorCode =
  | "not_configured"
  | "authentication_failed"
  | "rate_limited"
  | "timeout"
  | "invalid_audio"
  | "empty_transcript"
  | "provider_unavailable";

export class AsrProviderError extends Error {
  constructor(
    public readonly provider: AsrProvider,
    public readonly code: AsrErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AsrProviderError";
  }
}

export type TranscriptionResult = {
  transcript: string;
  provider: AsrProvider;
  model: string;
  processingTimeMs: number;
  usedFallback: boolean;
  warnings: string[];
};

type ProviderResult = Omit<TranscriptionResult, "usedFallback" | "warnings">;
type VolcAudioInput = { data: string } | { url: string };

function getTimeoutSignal() {
  return AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
}

function classifyHttpError(provider: AsrProvider, status: number) {
  if (status === 401 || status === 403) {
    return new AsrProviderError(provider, "authentication_failed", "ASR authentication failed.");
  }
  if (status === 429) {
    return new AsrProviderError(provider, "rate_limited", "ASR rate limit exceeded.");
  }
  return new AsrProviderError(provider, "provider_unavailable", `ASR request failed (${status}).`);
}

async function transcribeWithVolcengineInput(
  audio: VolcAudioInput,
  fetchImpl: typeof fetch = fetch,
): Promise<ProviderResult> {
  const apiKey = process.env.VOLC_ASR_API_KEY;
  const appId = process.env.VOLC_ASR_APP_ID;
  const legacyAccessToken = process.env.VOLC_ACCESS_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Api-Request-Id": randomUUID(),
    "X-Api-Resource-Id": VOLC_RESOURCE_ID,
    "X-Api-Sequence": "-1",
  };

  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  } else if (appId && legacyAccessToken) {
    headers["X-Api-App-Key"] = appId;
    headers["X-Api-Access-Key"] = legacyAccessToken;
  } else {
    throw new AsrProviderError("volcengine", "not_configured", "Volcengine ASR is not configured.");
  }

  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetchImpl(VOLC_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user: { uid: appId || "recipe-ticket" },
        audio,
        request: {
          model_name: "bigmodel",
          enable_itn: true,
          enable_punc: true,
          enable_ddc: true,
        },
      }),
      signal: getTimeoutSignal(),
    });
  } catch (error) {
    throw new AsrProviderError(
      "volcengine",
      error instanceof Error && error.name === "TimeoutError" ? "timeout" : "provider_unavailable",
      "Volcengine ASR request failed.",
    );
  }

  if (!response.ok) {
    throw classifyHttpError("volcengine", response.status);
  }

  const statusCode = response.headers.get("X-Api-Status-Code");
  if (statusCode && statusCode !== "20000000") {
    const code = statusCode === "20000003" || statusCode === "45000002"
      ? "empty_transcript"
      : statusCode === "45000151"
        ? "invalid_audio"
        : "provider_unavailable";
    throw new AsrProviderError("volcengine", code, `Volcengine ASR failed (${statusCode}).`);
  }

  const result = (await response.json()) as {
    result?: { text?: string };
  };
  const transcript = result.result?.text?.trim();
  if (!transcript) {
    throw new AsrProviderError("volcengine", "empty_transcript", "Volcengine returned no transcript.");
  }

  return {
    transcript,
    provider: "volcengine",
    model: "seed-asr-2.0-turbo",
    processingTimeMs: Date.now() - startedAt,
  };
}

async function transcribeWithVolcengine(audio: Buffer) {
  return transcribeWithVolcengineInput({ data: audio.toString("base64") });
}

export async function transcribeRemoteAudioUrl(
  mediaUrl: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<TranscriptionResult> {
  let url: URL;
  try {
    url = new URL(mediaUrl);
  } catch {
    throw new AsrProviderError(
      "volcengine",
      "invalid_audio",
      "Remote media URL was invalid.",
    );
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new AsrProviderError(
      "volcengine",
      "invalid_audio",
      "Remote media URL was invalid.",
    );
  }

  const result = await transcribeWithVolcengineInput(
    { url: url.toString() },
    options.fetchImpl,
  );
  return { ...result, usedFallback: false, warnings: [] };
}

async function transcribeWithQwen(audio: Buffer): Promise<ProviderResult> {
  const apiKey = getQwenApiKey();
  const endpoint = getQwenCompatibleEndpoint();
  const model = process.env.ALIBABA_ASR_MODEL || DEFAULT_QWEN_MODEL;

  if (!apiKey || !endpoint) {
    throw new AsrProviderError("aliyun_qwen", "not_configured", "Qwen ASR is not configured.");
  }

  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: {
                  data: `data:audio/mpeg;base64,${audio.toString("base64")}`,
                },
              },
            ],
          },
        ],
        asr_options: { language: "zh", enable_itn: true },
        stream: false,
      }),
      signal: getTimeoutSignal(),
    });
  } catch (error) {
    throw new AsrProviderError(
      "aliyun_qwen",
      error instanceof Error && error.name === "TimeoutError" ? "timeout" : "provider_unavailable",
      "Qwen ASR request failed.",
    );
  }

  if (!response.ok) {
    throw classifyHttpError("aliyun_qwen", response.status);
  }

  const result = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const transcript = result.choices?.[0]?.message?.content?.trim();
  if (!transcript) {
    throw new AsrProviderError("aliyun_qwen", "empty_transcript", "Qwen returned no transcript.");
  }

  return {
    transcript,
    provider: "aliyun_qwen",
    model: result.model || model,
    processingTimeMs: Date.now() - startedAt,
  };
}

export async function transcribeAudio(audio: Buffer): Promise<TranscriptionResult> {
  const configured = process.env.ASR_PROVIDER;
  const primary = configured === "aliyun_qwen" ? "aliyun_qwen" : "volcengine";
  const primaryCall = primary === "volcengine" ? transcribeWithVolcengine : transcribeWithQwen;

  try {
    const result = await primaryCall(audio);
    return { ...result, usedFallback: false, warnings: [] };
  } catch (error) {
    const primaryError = error instanceof AsrProviderError
      ? error
      : new AsrProviderError(primary, "provider_unavailable", "Primary ASR failed.");

    if (primary !== "volcengine") {
      throw primaryError;
    }

    const fallback = await transcribeWithQwen(audio);
    return {
      ...fallback,
      usedFallback: true,
      warnings: [`Volcengine ASR fallback: ${primaryError.code}`],
    };
  }
}
