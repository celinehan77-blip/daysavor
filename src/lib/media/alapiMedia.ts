import { AudioExtractionError } from "@/lib/media/errors";
import type { HostLookup } from "@/lib/source/urlSafety";
import {
  defaultHostLookup,
  hasOnlyPublicAddresses,
  sanitizeSourceUrl,
  upgradeInitialPlatformUrl,
  validateSourceUrl,
} from "@/lib/source/urlSafety";

const ALAPI_ENDPOINT = "https://v3.alapi.cn/api/video/url";
const ALAPI_TIMEOUT_MS = 20_000;
const MAX_ALAPI_RESPONSE_BYTES = 2 * 1024 * 1024;

type AlapiData = {
  audio?: unknown;
  pics?: unknown;
  title?: unknown;
  type?: unknown;
  video_url?: unknown;
};

type AlapiResponse = {
  code?: unknown;
  data?: unknown;
};

export type AlapiMedia = {
  canonicalUrl: string;
  description: string | null;
  durationSeconds: number;
  fallbackMediaUrl: string | null;
  imageUrls: string[];
  mediaType: "video" | "image";
  mediaUrl: string;
};

function isOfficialXiaohongshuCdn(hostname: string) {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalizedHostname === "xhscdn.com" ||
    normalizedHostname.endsWith(".xhscdn.com")
  );
}

function asHttpsUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.username || url.password) return null;

    if (url.protocol === "http:") {
      if (
        !isOfficialXiaohongshuCdn(url.hostname) ||
        (url.port && url.port !== "80")
      ) {
        return null;
      }
      url.protocol = "https:";
      url.port = "";
    }

    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function getImageUrls(value: unknown): string[] {
  let images = value;
  if (typeof images === "string" && images.trim().startsWith("[")) {
    try {
      images = JSON.parse(images);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(images)) return [];

  return images
    .map((item) => {
      if (typeof item === "string") return asHttpsUrl(item);
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return asHttpsUrl(record.url ?? record.src ?? record.image_url);
    })
    .filter((url): url is string => Boolean(url));
}

function classifyProviderError(code: number) {
  if ([10001, 10002, 10003, 10004, 10006, 10007, 10008, 10009].includes(code)) {
    return "media_provider_auth_failed" as const;
  }
  if ([10005, 10010, 10012].includes(code)) {
    return "media_provider_balance" as const;
  }
  if (code === 429) {
    return "media_provider_rate_limited" as const;
  }
  return "media_unavailable" as const;
}

export async function validatePublicMediaUrl(
  mediaUrl: string,
  lookupHost: HostLookup = defaultHostLookup,
) {
  let url: URL;
  try {
    url = new URL(mediaUrl);
  } catch {
    return null;
  }

  if (
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && isOfficialXiaohongshuCdn(url.hostname))) ||
    url.username ||
    url.password ||
    (url.port &&
      !(
        (url.protocol === "https:" && url.port === "443") ||
        (url.protocol === "http:" && url.port === "80")
      )) ||
    !(await hasOnlyPublicAddresses(url.hostname, lookupHost))
  ) {
    return null;
  }

  return url;
}

export async function resolveAlapiMedia(
  sharedValue: string,
  options: {
    fetchImpl?: typeof fetch;
    lookupHost?: HostLookup;
    token?: string;
  } = {},
): Promise<AlapiMedia> {
  const validated = validateSourceUrl(upgradeInitialPlatformUrl(sharedValue));
  if (!validated) {
    throw new AudioExtractionError("unsupported_url", "Unsupported share URL.");
  }

  const token = options.token ?? process.env.ALAPI_TOKEN;
  if (!token) {
    throw new AudioExtractionError(
      "media_provider_unavailable",
      "ALAPI media provider is not configured.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ALAPI_TIMEOUT_MS);
  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(ALAPI_ENDPOINT, {
      body: JSON.stringify({ url: sanitizeSourceUrl(validated.url) }),
      headers: {
        "Content-Type": "application/json",
        token,
      },
      method: "POST",
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    throw new AudioExtractionError("media_unavailable", "ALAPI media lookup failed.");
  }

  const declaredBytes = Number(response.headers.get("content-length") ?? 0);
  if (declaredBytes > MAX_ALAPI_RESPONSE_BYTES) {
    throw new AudioExtractionError("media_unavailable", "ALAPI response was too large.");
  }

  let payload: AlapiResponse;
  try {
    const responseText = await response.text();
    if (Buffer.byteLength(responseText, "utf8") > MAX_ALAPI_RESPONSE_BYTES) {
      throw new Error("response_too_large");
    }
    payload = JSON.parse(responseText) as AlapiResponse;
  } catch {
    throw new AudioExtractionError("media_unavailable", "ALAPI response was invalid.");
  } finally {
    clearTimeout(timer);
  }

  const code = Number(payload.code ?? response.status);
  if (!response.ok || code !== 200) {
    throw new AudioExtractionError(
      classifyProviderError(code),
      "ALAPI media lookup was rejected.",
    );
  }

  if (!payload.data || typeof payload.data !== "object") {
    throw new AudioExtractionError("media_unavailable", "ALAPI media data was unavailable.");
  }

  const data = payload.data as AlapiData;
  const imageUrls = getImageUrls(data.pics);
  const mediaType = String(data.type) === "2" || imageUrls.length > 0 ? "image" : "video";
  if (mediaType === "image") {
    throw new AudioExtractionError(
      "image_post_unsupported",
      "This image post requires OCR and has no audio track.",
    );
  }

  const rawMediaUrl = [data.audio, data.video_url]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .find((value) => Boolean(asHttpsUrl(value))) ?? "";
  const mediaUrl = asHttpsUrl(rawMediaUrl);
  if (!mediaUrl || !(await validatePublicMediaUrl(mediaUrl, options.lookupHost))) {
    throw new AudioExtractionError("media_unavailable", "ALAPI media URL was unsafe.");
  }

  return {
    canonicalUrl: sanitizeSourceUrl(validated.url),
    description:
      typeof data.title === "string" ? data.title.trim().slice(0, 300) || null : null,
    durationSeconds: 0,
    fallbackMediaUrl:
      rawMediaUrl.startsWith("http://") &&
      (await validatePublicMediaUrl(rawMediaUrl, options.lookupHost))
        ? rawMediaUrl
        : null,
    imageUrls,
    mediaType,
    mediaUrl,
  };
}
