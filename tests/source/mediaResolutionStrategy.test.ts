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
  fallbackMediaUrl: null,
  imageUrls: [],
  mediaType: "video" as const,
  mediaUrl: "https://media.example.com/video.mp4",
};

test("Xiaohongshu uses its public mobile page before paid providers", async () => {
  let metadataCalls = 0;
  let providerCalls = 0;
  const result = await resolveShareMedia(
    normalizeShareUrl("https://xhslink.cn/o/example"),
    {
      resolvePublicPageMedia: async () => providerMedia,
      resolveProviderMedia: async () => {
        providerCalls += 1;
        return providerMedia;
      },
      readYtDlpMetadata: async () => {
        metadataCalls += 1;
        return { duration: 30 };
      },
    },
  );

  assert.equal(result.resolvedMedia, providerMedia);
  assert.equal(result.metadata, null);
  assert.equal(metadataCalls, 0);
  assert.equal(providerCalls, 0);
});

test("Xiaohongshu falls back from public page to provider", async () => {
  const result = await resolveShareMedia(
    normalizeShareUrl("https://xhslink.cn/o/example"),
    {
      resolvePublicPageMedia: async () => {
        throw new AudioExtractionError("media_unavailable", "page unavailable");
      },
      resolveProviderMedia: async () => providerMedia,
      readYtDlpMetadata: async () => ({ duration: 30 }),
    },
  );
  assert.equal(result.resolvedMedia, providerMedia);
  assert.equal(result.metadata, null);
});

test("Xiaohongshu falls back to yt-dlp when page and provider are unavailable", async () => {
  const metadata = { duration: 42, title: "清炖牛肉" };
  const result = await resolveShareMedia(
    normalizeShareUrl("https://xhslink.cn/o/example"),
    {
      resolvePublicPageMedia: async () => {
        throw new AudioExtractionError("media_unavailable", "page unavailable");
      },
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

test("Xiaohongshu provider image posts are returned for vision extraction", async () => {
  let metadataCalls = 0;
  const imageMedia = { ...providerMedia, imageUrls: ["https://example.com/1.jpg"], mediaType: "image" as const, mediaUrl: null };
  const result = await resolveShareMedia(
      normalizeShareUrl("https://xhslink.cn/o/example"), {
        resolvePublicPageMedia: async () => {
          throw new AudioExtractionError("media_unavailable", "no video");
        },
        resolveProviderMedia: async () => imageMedia,
        readYtDlpMetadata: async () => {
          metadataCalls += 1;
          return { duration: 30 };
        },
      },
  );
  assert.equal(result.resolvedMedia, imageMedia);
  assert.equal(metadataCalls, 0);
});

test("Douyin keeps the provider-only resolution path", async () => {
  let metadataCalls = 0;

  await assert.rejects(
    () =>
      resolveShareMedia(normalizeShareUrl("https://v.douyin.com/example/"), {
        resolvePublicPageMedia: async () => providerMedia,
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
