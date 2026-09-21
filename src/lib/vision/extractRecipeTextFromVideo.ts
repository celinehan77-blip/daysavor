import {
  getQwenApiKey,
  getQwenCompatibleEndpoint,
} from "@/lib/ai/providers/qwenConfig";

const DEFAULT_VISION_MODEL = "qwen-vl-plus";
const VISION_TIMEOUT_MS = 45_000;
const VISION_MAX_ATTEMPTS = 2;

export class VideoVisionError extends Error {
  constructor(
    public readonly code:
      | "not_configured"
      | "provider_failed"
      | "empty_result",
    message: string,
  ) {
    super(message);
    this.name = "VideoVisionError";
  }
}

export type VideoRecipeTextResult = {
  model: string;
  processingTimeMs: number;
  text: string;
};

export type RecipeVisualMedia =
  | { mediaType: "video"; mediaUrl: string }
  | { imageUrls: string[]; mediaType: "image" };

function readMessageText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const text = (item as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .join("\n")
    .trim();
}

function parsePublicVisualUrl(value: string) {
  try {
    const parsedUrl = new URL(value);
    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return null;
    }
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export async function extractRecipeTextFromMedia(
  media: RecipeVisualMedia,
  title: string | null,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<VideoRecipeTextResult> {
  const apiKey = getQwenApiKey();
  const endpoint = getQwenCompatibleEndpoint();
  if (!apiKey || !endpoint) {
    throw new VideoVisionError(
      "not_configured",
      "Qwen video vision is not configured.",
    );
  }

  const visualContent =
    media.mediaType === "video"
      ? (() => {
          const mediaUrl = parsePublicVisualUrl(media.mediaUrl);
          if (!mediaUrl) {
            throw new VideoVisionError(
              "provider_failed",
              "Video URL was invalid.",
            );
          }
          return [
            {
              type: "video_url",
              video_url: { url: mediaUrl, fps: 1 },
            },
          ];
        })()
      : media.imageUrls
          .slice(0, 10)
          .map(parsePublicVisualUrl)
          .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
          .map((imageUrl) => ({
            type: "image_url",
            image_url: { url: imageUrl },
          }));

  if (visualContent.length === 0) {
    throw new VideoVisionError(
      "provider_failed",
      "Visual media URL was invalid.",
    );
  }

  const model = process.env.QWEN_VISION_MODEL || DEFAULT_VISION_MODEL;
  const startedAt = Date.now();
  const fetchImpl = options.fetchImpl ?? fetch;

  for (let attempt = 1; attempt <= VISION_MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImpl(endpoint, {
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
                ...visualContent,
                {
                  type: "text",
                  text: [
                    media.mediaType === "video"
                      ? "请逐帧读取视频画面中真实可见的中文字幕和菜谱信息。"
                      : "请按图片顺序读取图文作品中真实可见的文字和菜谱信息。",
                    "只输出画面中明确出现的食材、用量、处理动作、烹饪步骤、时间和火候。",
                    "不要根据标题、菜名或常识补充画面中没有的信息。",
                    title?.trim()
                      ? `作品标题（仅用于定位内容，不可作为菜谱事实）：${title.trim()}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join("\n"),
                },
              ],
            },
          ],
          temperature: 0,
          max_tokens: 1800,
        }),
        signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut =
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError");
      if (attempt < VISION_MAX_ATTEMPTS && !timedOut) {
        continue;
      }
      throw new VideoVisionError(
        "provider_failed",
        "Qwen video vision request failed.",
      );
    }

    let payload: {
      choices?: Array<{ message?: { content?: unknown } }>;
      model?: string;
    };
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      if (attempt < VISION_MAX_ATTEMPTS) {
        continue;
      }
      throw new VideoVisionError(
        "provider_failed",
        "Qwen video vision returned invalid JSON.",
      );
    }

    if (!response.ok) {
      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;
      if (attempt < VISION_MAX_ATTEMPTS && retryable) {
        continue;
      }
      throw new VideoVisionError(
        "provider_failed",
        `Qwen video vision failed (${response.status}).`,
      );
    }

    const text = readMessageText(payload.choices?.[0]?.message?.content);
    if (text.length < 30) {
      if (attempt < VISION_MAX_ATTEMPTS) {
        continue;
      }
      throw new VideoVisionError(
        "empty_result",
        "Qwen video vision found no usable recipe text.",
      );
    }

    return {
      model: payload.model || model,
      processingTimeMs: Date.now() - startedAt,
      text,
    };
  }

  throw new VideoVisionError(
    "provider_failed",
    "Qwen video vision request failed.",
  );
}

export function extractRecipeTextFromVideo(
  mediaUrl: string,
  title: string | null,
  options: { fetchImpl?: typeof fetch } = {},
) {
  return extractRecipeTextFromMedia(
    { mediaType: "video", mediaUrl },
    title,
    options,
  );
}
