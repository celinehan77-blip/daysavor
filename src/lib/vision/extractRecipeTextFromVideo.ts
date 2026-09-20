import {
  getQwenApiKey,
  getQwenCompatibleEndpoint,
} from "@/lib/ai/providers/qwenConfig";

const DEFAULT_VISION_MODEL = "qwen-vl-plus";
const VISION_TIMEOUT_MS = 45_000;

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

export async function extractRecipeTextFromVideo(
  mediaUrl: string,
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

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(mediaUrl);
  } catch {
    throw new VideoVisionError("provider_failed", "Video URL was invalid.");
  }
  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new VideoVisionError("provider_failed", "Video URL was invalid.");
  }

  const model = process.env.QWEN_VISION_MODEL || DEFAULT_VISION_MODEL;
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(endpoint, {
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
                type: "video_url",
                video_url: { url: parsedUrl.toString(), fps: 1 },
              },
              {
                type: "text",
                text: [
                  "请逐帧读取视频画面中真实可见的中文字幕和菜谱信息。",
                  "只输出画面中明确出现的食材、用量、处理动作、烹饪步骤、时间和火候。",
                  "不要根据标题、菜名或常识补充画面中没有的信息。",
                  title?.trim()
                    ? `视频标题（仅用于定位内容，不可作为菜谱事实）：${title.trim()}`
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
  } catch {
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
    throw new VideoVisionError(
      "provider_failed",
      "Qwen video vision returned invalid JSON.",
    );
  }
  if (!response.ok) {
    throw new VideoVisionError(
      "provider_failed",
      `Qwen video vision failed (${response.status}).`,
    );
  }

  const text = readMessageText(payload.choices?.[0]?.message?.content);
  if (text.length < 30) {
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
