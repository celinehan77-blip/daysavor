import { spawn, type ChildProcess } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, mkdir, readFile, rm, stat } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { PublicSourcePlatform } from "@/lib/source/types";
import {
  resolveAlapiMedia,
  validatePublicMediaUrl,
} from "@/lib/media/alapiMedia";
import {
  AudioExtractionError,
  type AudioExtractionErrorCode,
} from "@/lib/media/errors";
import { extractHttpUrlFromSharedText } from "@/lib/source/sharedInput";
import {
  sanitizeSourceUrl,
  upgradeInitialPlatformUrl,
  validateSourceUrl,
} from "@/lib/source/urlSafety";

const MAX_MEDIA_DURATION_SECONDS = 5 * 60;
const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const PROCESS_TIMEOUT_MS = 60_000;

export { AudioExtractionError } from "@/lib/media/errors";
export type { AudioExtractionErrorCode } from "@/lib/media/errors";

export type ExtractedAudio = {
  audio: Buffer;
  canonicalUrl: string;
  durationSeconds: number;
  sourceHash: string;
  title: string | null;
  platform: PublicSourcePlatform;
};

export type MediaMetadata = {
  duration?: number;
  filesize?: number;
  filesize_approx?: number;
  title?: string;
  webpage_url?: string;
};

function resolveYtDlpPath() {
  if (process.env.YT_DLP_PATH) {
    return process.env.YT_DLP_PATH;
  }

  const macUserInstall = path.join(
    homedir(),
    "Library",
    "Python",
    "3.9",
    "bin",
    "yt-dlp",
  );

  if (process.platform === "darwin") {
    return macUserInstall;
  }

  return path.join(process.cwd(), "runtime-tools", "yt-dlp");
}

function resolveFfmpegPath() {
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  if (process.platform === "darwin") {
    return "/opt/homebrew/bin/ffmpeg";
  }

  return path.join(process.cwd(), "runtime-tools", "ffmpeg");
}

function safeProcessError(value: string) {
  return value
    .replace(/https?:\/\/\S+/gi, "[media-url]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[redacted]")
    .trim()
    .slice(0, 300);
}

function waitForProcess(
  child: ChildProcess,
  timeoutMs: number,
  captureStdout = true,
  spawnErrorCode: AudioExtractionErrorCode = "media_unavailable",
): Promise<{ code: number | null; stderr: string; stdout: Buffer }> {
  return new Promise((resolve, reject) => {
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new AudioExtractionError("process_timeout", "Media process timed out."));
    }, timeoutMs);

    if (captureStdout) {
      child.stdout?.on("data", (chunk: Buffer) => stdout.push(chunk));
    }
    child.stderr?.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", () => {
      clearTimeout(timer);
      reject(
        new AudioExtractionError(
          spawnErrorCode,
          spawnErrorCode === "yt_dlp_unavailable"
            ? "yt-dlp is unavailable in the server runtime."
            : "Media process could not start.",
        ),
      );
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stderr: Buffer.concat(stderr).toString("utf8"),
        stdout: Buffer.concat(stdout),
      });
    });
  });
}

export function normalizeShareUrl(sharedValue: string) {
  const extracted = extractHttpUrlFromSharedText(sharedValue) ?? sharedValue.trim();
  const validated = validateSourceUrl(upgradeInitialPlatformUrl(extracted));

  if (!validated) {
    throw new AudioExtractionError(
      "unsupported_url",
      "Only public Xiaohongshu and Douyin links are supported.",
    );
  }

  const canonicalUrl = sanitizeSourceUrl(validated.url);

  return {
    canonicalUrl,
    platform: validated.platform,
    sourceHash: createHash("sha256").update(canonicalUrl).digest("hex"),
  };
}

async function streamRemoteMediaAudio(mediaUrl: string, outputPath: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROCESS_TIMEOUT_MS);
  const ffmpeg = spawn(
    resolveFfmpegPath(),
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "32k",
      outputPath,
    ],
    { stdio: ["pipe", "pipe", "pipe"] },
  );

  try {
    let currentUrl = mediaUrl;
    let response: Response | null = null;
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      const safeUrl = await validatePublicMediaUrl(currentUrl);
      if (!safeUrl) {
        throw new AudioExtractionError("media_unavailable", "Douyin media URL was unsafe.");
      }
      response = await fetch(safeUrl, { redirect: "manual", signal: controller.signal });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location || redirects === 3) {
        throw new AudioExtractionError("media_unavailable", "Douyin media redirect failed.");
      }
      currentUrl = new URL(location, safeUrl).toString();
    }
    if (!response) {
      throw new AudioExtractionError("media_unavailable", "Douyin media download failed.");
    }
    const declaredBytes = Number(response.headers.get("content-length") ?? 0);
    if (!response.ok || !response.body) {
      throw new AudioExtractionError("media_unavailable", "Douyin media download failed.");
    }
    if (declaredBytes > MAX_MEDIA_BYTES) {
      throw new AudioExtractionError("media_too_large", "Media exceeds 100 MB.");
    }

    let streamedBytes = 0;
    const input = Readable.fromWeb(response.body as never);
    const limiter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        streamedBytes += chunk.length;
        callback(
          streamedBytes > MAX_MEDIA_BYTES
            ? new AudioExtractionError("media_too_large", "Media exceeds 100 MB.")
            : null,
          chunk,
        );
      },
    });

    const [, ffmpegResult] = await Promise.all([
      pipeline(input, limiter, ffmpeg.stdin),
      waitForProcess(ffmpeg, PROCESS_TIMEOUT_MS, false, "ffmpeg_failed"),
    ]);
    if (streamedBytes > MAX_MEDIA_BYTES) {
      throw new AudioExtractionError("media_too_large", "Media exceeds 100 MB.");
    }
    if (ffmpegResult.code !== 0) {
      throw new AudioExtractionError(
        "ffmpeg_failed",
        safeProcessError(ffmpegResult.stderr) || "FFmpeg audio extraction failed.",
      );
    }
  } catch (error) {
    if (error instanceof AudioExtractionError) throw error;
    throw new AudioExtractionError("media_unavailable", "Douyin media stream failed.");
  } finally {
    clearTimeout(timer);
    controller.abort();
    if (!ffmpeg.killed) ffmpeg.kill("SIGKILL");
  }
}

async function readMetadata(sourceUrl: string) {
  const child = spawn(
    resolveYtDlpPath(),
    ["--no-warnings", "--no-playlist", "--skip-download", "--dump-single-json", sourceUrl],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const result = await waitForProcess(
    child,
    PROCESS_TIMEOUT_MS,
    true,
    "yt_dlp_unavailable",
  );

  if (result.code !== 0) {
    const summary = safeProcessError(result.stderr);
    const unavailable = /ENOENT|not found/i.test(summary);
    throw new AudioExtractionError(
      unavailable ? "yt_dlp_unavailable" : "media_unavailable",
      summary || "yt-dlp could not read this public media.",
    );
  }

  try {
    return JSON.parse(result.stdout.toString("utf8")) as MediaMetadata;
  } catch {
    throw new AudioExtractionError("media_unavailable", "yt-dlp returned invalid metadata.");
  }
}

type NormalizedShareUrl = ReturnType<typeof normalizeShareUrl>;

type ShareMediaResolution = {
  resolvedMedia: Awaited<ReturnType<typeof resolveAlapiMedia>> | null;
  metadata: MediaMetadata | null;
};

type ShareMediaResolutionDependencies = {
  resolveProviderMedia: typeof resolveAlapiMedia;
  readYtDlpMetadata: typeof readMetadata;
};

export async function resolveShareMedia(
  normalized: NormalizedShareUrl,
  dependencies: ShareMediaResolutionDependencies = {
    resolveProviderMedia: resolveAlapiMedia,
    readYtDlpMetadata: readMetadata,
  },
): Promise<ShareMediaResolution> {
  if (normalized.platform === "douyin") {
    return {
      resolvedMedia: await dependencies.resolveProviderMedia(
        normalized.canonicalUrl,
      ),
      metadata: null,
    };
  }

  try {
    return {
      resolvedMedia: await dependencies.resolveProviderMedia(
        normalized.canonicalUrl,
      ),
      metadata: null,
    };
  } catch (error) {
    if (
      error instanceof AudioExtractionError &&
      error.code === "image_post_unsupported"
    ) {
      throw error;
    }

    return {
      resolvedMedia: null,
      metadata: await dependencies.readYtDlpMetadata(normalized.canonicalUrl),
    };
  }
}

async function streamAudio(sourceUrl: string, outputPath: string) {
  const ytDlp = spawn(
    resolveYtDlpPath(),
    [
      "--quiet",
      "--no-warnings",
      "--no-playlist",
      "-f",
      "worstaudio/worst[ext=mp4]/worst",
      "-o",
      "-",
      sourceUrl,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const ffmpeg = spawn(
    resolveFfmpegPath(),
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "32k",
      outputPath,
    ],
    { stdio: ["pipe", "pipe", "pipe"] },
  );

  let streamedBytes = 0;
  ytDlp.stdout.on("data", (chunk: Buffer) => {
    streamedBytes += chunk.length;
    if (streamedBytes > MAX_MEDIA_BYTES) {
      ytDlp.kill("SIGKILL");
      ffmpeg.kill("SIGKILL");
      return;
    }
    if (!ffmpeg.stdin.write(chunk)) {
      ytDlp.stdout.pause();
      ffmpeg.stdin.once("drain", () => ytDlp.stdout.resume());
    }
  });
  ytDlp.stdout.once("end", () => ffmpeg.stdin.end());

  try {
    const [ytDlpResult, ffmpegResult] = await Promise.all([
      waitForProcess(ytDlp, PROCESS_TIMEOUT_MS, false, "yt_dlp_unavailable"),
      waitForProcess(ffmpeg, PROCESS_TIMEOUT_MS, false, "ffmpeg_failed"),
    ]);

    if (streamedBytes > MAX_MEDIA_BYTES) {
      throw new AudioExtractionError("media_too_large", "Media exceeded the MVP size limit.");
    }
    if (ytDlpResult.code !== 0) {
      throw new AudioExtractionError(
        "media_unavailable",
        safeProcessError(ytDlpResult.stderr) || "yt-dlp media stream failed.",
      );
    }
    if (ffmpegResult.code !== 0) {
      throw new AudioExtractionError(
        "ffmpeg_failed",
        safeProcessError(ffmpegResult.stderr) || "FFmpeg audio extraction failed.",
      );
    }
  } finally {
    if (!ytDlp.killed) {
      ytDlp.kill("SIGKILL");
    }
    if (!ffmpeg.killed) {
      ffmpeg.kill("SIGKILL");
    }
  }
}

async function isExecutable(filePath: string) {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getMediaRuntimeDiagnostics() {
  const [ytDlpAvailable, ffmpegAvailable] = await Promise.all([
    isExecutable(resolveYtDlpPath()),
    isExecutable(resolveFfmpegPath()),
  ]);

  return { ffmpegAvailable, ytDlpAvailable };
}

export async function extractAudioFromShareLink(sharedValue: string): Promise<ExtractedAudio> {
  const normalized = normalizeShareUrl(sharedValue);
  const { metadata, resolvedMedia } = await resolveShareMedia(normalized);
  const durationSeconds = resolvedMedia?.durationSeconds ?? Number(metadata?.duration ?? 0);
  const mediaBytes = Number(metadata?.filesize ?? metadata?.filesize_approx ?? 0);

  if ((!resolvedMedia && !durationSeconds) || durationSeconds > MAX_MEDIA_DURATION_SECONDS) {
    throw new AudioExtractionError("media_too_long", "Media duration exceeds 5 minutes.");
  }
  if (mediaBytes > MAX_MEDIA_BYTES) {
    throw new AudioExtractionError("media_too_large", "Media exceeds 100 MB.");
  }

  const tempDirectory = path.join(tmpdir(), `recipe-ticket-${randomUUID()}`);
  const audioPath = path.join(tempDirectory, "audio.mp3");

  await mkdir(tempDirectory, { recursive: true });
  try {
    if (resolvedMedia?.mediaUrl) {
      await streamRemoteMediaAudio(resolvedMedia.mediaUrl, audioPath);
    } else {
      await streamAudio(normalized.canonicalUrl, audioPath);
    }
    const audioStats = await stat(/* turbopackIgnore: true */ audioPath);

    if (!audioStats.size) {
      throw new AudioExtractionError("audio_empty", "Extracted audio was empty.");
    }
    if (audioStats.size > MAX_AUDIO_BYTES) {
      throw new AudioExtractionError("media_too_large", "Extracted audio exceeds 8 MB.");
    }

    const metadataUrl = metadata?.webpage_url
      ? validateSourceUrl(upgradeInitialPlatformUrl(metadata.webpage_url))
      : null;

    return {
      audio: await readFile(/* turbopackIgnore: true */ audioPath),
      canonicalUrl: metadataUrl
        ? sanitizeSourceUrl(metadataUrl.url)
        : resolvedMedia?.canonicalUrl ?? normalized.canonicalUrl,
      durationSeconds,
      sourceHash: normalized.sourceHash,
      title: resolvedMedia?.description ??
        (typeof metadata?.title === "string" ? metadata.title.slice(0, 160) : null),
      platform: normalized.platform,
    };
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}
