import { load } from "cheerio";
import type { AlapiMedia } from "@/lib/media/alapiMedia";
import { validatePublicMediaUrl } from "@/lib/media/alapiMedia";
import { AudioExtractionError } from "@/lib/media/errors";
import { parseSafeEmbeddedState } from "@/lib/source/extractHtml";
import type { HostLookup } from "@/lib/source/urlSafety";
import {
  defaultHostLookup,
  hasOnlyPublicAddresses,
  sanitizeSourceUrl,
  upgradeInitialPlatformUrl,
  validateSourceUrl,
} from "@/lib/source/urlSafety";

const FETCH_TIMEOUT_MS = 20_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) " +
  "AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function getRecord(value: unknown, key: string) {
  return asRecord(asRecord(value)?.[key]);
}

function findVideoNote(value: unknown, depth = 0): UnknownRecord | null {
  if (depth > 10) return null;
  const record = asRecord(value);
  if (!record) return null;
  if (getRecord(getRecord(record, "video"), "media")) {
    const stream = getRecord(getRecord(getRecord(record, "video"), "media"), "stream");
    if (stream) return record;
  }
  for (const child of Object.values(record).slice(0, 200)) {
    const children = Array.isArray(child) ? child.slice(0, 50) : [child];
    for (const item of children) {
      const found = findVideoNote(item, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function getStreamCandidates(note: UnknownRecord) {
  const stream = getRecord(getRecord(getRecord(note, "video"), "media"), "stream");
  const candidates: string[] = [];
  for (const codec of ["h264", "h265", "av1"]) {
    const formats = stream?.[codec];
    if (!Array.isArray(formats)) continue;
    for (const format of formats.slice(0, 10)) {
      const item = asRecord(format);
      if (!item) continue;
      if (typeof item.masterUrl === "string") candidates.push(item.masterUrl);
      if (Array.isArray(item.backupUrls)) {
        candidates.push(...item.backupUrls.filter((url): url is string => typeof url === "string"));
      }
    }
  }
  return candidates;
}

function getDurationSeconds(note: UnknownRecord) {
  const video = getRecord(note, "video");
  const media = getRecord(video, "media");
  const direct = Number(getRecord(media, "video")?.duration ?? getRecord(video, "capa")?.duration ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct > 10_000 ? direct / 1_000 : direct;
  const stream = getRecord(media, "stream");
  for (const codec of ["h264", "h265", "av1"]) {
    const first = Array.isArray(stream?.[codec]) ? asRecord(stream?.[codec][0]) : null;
    const duration = Number(first?.duration ?? 0);
    if (Number.isFinite(duration) && duration > 0) return duration > 10_000 ? duration / 1_000 : duration;
  }
  return 0;
}

function parsePublicNote(html: string) {
  const $ = load(html);
  let state: unknown | null = null;
  $("script").each((_, element) => {
    if (state) return;
    const script = $(element).text();
    if (script.includes("window.__INITIAL_STATE__=")) state = parseSafeEmbeddedState(script);
  });
  const note = findVideoNote(state);
  if (!note) throw new AudioExtractionError("media_unavailable", "Xiaohongshu public page did not contain video metadata.");
  const title = typeof note.title === "string" ? note.title.trim() : "";
  const description = typeof note.desc === "string" ? note.desc.trim() : "";
  return {
    description: (title || description).slice(0, 300) || null,
    durationSeconds: getDurationSeconds(note),
    mediaCandidates: getStreamCandidates(note),
  };
}

function isXiaohongshuMediaHost(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return normalized === "xhscdn.com" || normalized.endsWith(".xhscdn.com");
}

async function getSafeMediaUrls(candidates: string[], lookupHost: HostLookup) {
  for (const candidate of candidates) {
    try {
      const rawUrl = new URL(candidate);
      if (!isXiaohongshuMediaHost(rawUrl.hostname)) continue;
      const fallbackMediaUrl = rawUrl.protocol === "http:" && await validatePublicMediaUrl(rawUrl.toString(), lookupHost)
        ? rawUrl.toString()
        : null;
      if (rawUrl.protocol === "http:") {
        rawUrl.protocol = "https:";
        rawUrl.port = "";
      }
      const safeUrl = await validatePublicMediaUrl(rawUrl.toString(), lookupHost);
      if (safeUrl) return { fallbackMediaUrl, mediaUrl: safeUrl.toString() };
    } catch {
      continue;
    }
  }
  return null;
}

export async function resolveXiaohongshuMedia(
  sharedValue: string,
  options: { fetchImpl?: typeof fetch; lookupHost?: HostLookup } = {},
): Promise<AlapiMedia> {
  const initial = validateSourceUrl(upgradeInitialPlatformUrl(sharedValue), "xiaohongshu");
  if (!initial) throw new AudioExtractionError("unsupported_url", "Unsupported Xiaohongshu URL.");
  const fetchImpl = options.fetchImpl ?? fetch;
  const lookupHost = options.lookupHost ?? defaultHostLookup;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let currentUrl = initial.url;
  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      const validated = validateSourceUrl(currentUrl.toString(), "xiaohongshu");
      if (!validated || !(await hasOnlyPublicAddresses(validated.url.hostname, lookupHost))) {
        throw new AudioExtractionError("media_unavailable", "Unsafe Xiaohongshu redirect.");
      }
      const response = await fetchImpl(validated.url, {
        headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "zh-CN,zh;q=0.9", "User-Agent": MOBILE_USER_AGENT },
        redirect: "manual",
        signal: controller.signal,
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location || redirects === MAX_REDIRECTS) throw new AudioExtractionError("media_unavailable", "Xiaohongshu redirect could not be resolved.");
        currentUrl = new URL(location, validated.url);
        continue;
      }
      if (!response.ok) throw new AudioExtractionError("media_unavailable", "Xiaohongshu public page was unavailable.");
      const declaredBytes = Number(response.headers.get("content-length") ?? 0);
      if (declaredBytes > MAX_HTML_BYTES) throw new AudioExtractionError("media_unavailable", "Xiaohongshu page was too large.");
      const html = await response.text();
      if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) throw new AudioExtractionError("media_unavailable", "Xiaohongshu page was too large.");
      const parsed = parsePublicNote(html);
      const urls = await getSafeMediaUrls(parsed.mediaCandidates, lookupHost);
      if (!urls) throw new AudioExtractionError("media_unavailable", "Xiaohongshu public video URL was unavailable.");
      return {
        canonicalUrl: sanitizeSourceUrl(validated.url),
        description: parsed.description,
        durationSeconds: parsed.durationSeconds,
        fallbackMediaUrl: urls.fallbackMediaUrl,
        imageUrls: [],
        mediaType: "video",
        mediaUrl: urls.mediaUrl,
      };
    }
  } catch (error) {
    if (error instanceof AudioExtractionError) throw error;
    throw new AudioExtractionError("media_unavailable", "Xiaohongshu public page lookup failed.");
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
  throw new AudioExtractionError("media_unavailable", "Xiaohongshu media was unavailable.");
}
