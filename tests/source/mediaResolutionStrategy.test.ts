import assert from "node:assert/strict";
import test from "node:test";
import { AudioExtractionError } from "@/lib/media/errors";
import {
  normalizeShareUrl,
  resolveShareMedia,
} from "@/lib/media/extractAudio";

const providerMedia = {
  canonicalUrl: "https://xhslink.cn/o/example",
  description: "醋蒸鸡",
  durationSeconds: 0,
  imageUrls: [],
  mediaType: "video" as const,
  mediaUrl: "https://media.example.com/video.mp4",
};

test("Xiaohongshu uses the mainland media provider before yt-dlp", async () => {
  let metadataCalls = 0;
  const result = await resolveShareMedia(
    normalizeShareUrl("https://xhslink.cn/o/example"),
    {
      resolveProviderMedia: async () => providerMedia,
      readYtDlpMetadata: async () => {
        metadataCalls += 1;
        return { duration: 30 };
      },
    },
  );

  assert.equal(result.resolvedMedia, providerMedia);
  assert.equal(result.metadata, null);
  assert.equal(metadataCalls, 0);
});

test("Xiaohongshu falls back to yt-dlp when the provider is unavailable", async () => {
  const metadata = { duration: 42, title: "清炖牛肉" };
  const result = await resolveShareMedia(
    normalizeShareUrl("https://xhslink.cn/o/example"),
    {
      resolveProviderMedia: async () => {
        throw new AudioExtractionError(
          "media_provider_unavailable",
          "provider unavailable",
        );
      },
      readYtDlpMetadata: async () => metadata,
    },
  );

  assert.equal(result.resolvedMedia, null);
  assert.equal(result.metadata, metadata);
});

test("Xiaohongshu image posts remain unsupported instead of falling back", async () => {
  let metadataCalls = 0;

  await assert.rejects(
    () =>
      resolveShareMedia(normalizeShareUrl("https://xhslink.cn/o/example"), {
        resolveProviderMedia: async () => {
          throw new AudioExtractionError(
            "image_post_unsupported",
            "image post",
          );
        },
        readYtDlpMetadata: async () => {
          metadataCalls += 1;
          return { duration: 30 };
        },
      }),
    (error: unknown) =>
      error instanceof AudioExtractionError &&
      error.code === "image_post_unsupported",
  );

  assert.equal(metadataCalls, 0);
});

test("Douyin keeps the provider-only resolution path", async () => {
  let metadataCalls = 0;

  await assert.rejects(
    () =>
      resolveShareMedia(normalizeShareUrl("https://v.douyin.com/example/"), {
        resolveProviderMedia: async () => {
          throw new AudioExtractionError("media_unavailable", "provider failed");
        },
        readYtDlpMetadata: async () => {
          metadataCalls += 1;
          return { duration: 30 };
        },
      }),
    AudioExtractionError,
  );

  assert.equal(metadataCalls, 0);
});
