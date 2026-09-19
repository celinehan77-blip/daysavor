import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveAlapiMedia,
  validatePublicMediaUrl,
} from "@/lib/media/alapiMedia";
import { AudioExtractionError } from "@/lib/media/errors";

const publicLookup = async () => [{ address: "8.8.8.8", family: 4 }];

test("calls ALAPI with POST JSON and a server-only token header", async () => {
  let requestUrl = "";
  let method = "";
  let token = "";
  let requestBody = "";
  const result = await resolveAlapiMedia("https://v.douyin.com/sample/", {
    token: "test-only-token",
    fetchImpl: async (input, init) => {
      requestUrl = String(input);
      method = init?.method ?? "";
      token = new Headers(init?.headers).get("token") ?? "";
      requestBody = String(init?.body ?? "");
      return Response.json({
        code: 200,
        data: {
          audio: "https://media.example.com/audio.mp3?signature=test",
          title: "可乐鸡翅",
          type: 1,
          video_url: "https://media.example.com/video.mp4",
        },
      });
    },
    lookupHost: publicLookup,
  });

  assert.equal(requestUrl, "https://v3.alapi.cn/api/video/url");
  assert.equal(method, "POST");
  assert.equal(token, "test-only-token");
  assert.deepEqual(JSON.parse(requestBody), { url: "https://v.douyin.com/sample/" });
  assert.equal(result.mediaType, "video");
  assert.equal(result.description, "可乐鸡翅");
  assert.match(result.mediaUrl, /audio\.mp3/);
});

test("accepts Xiaohongshu share links in the ALAPI adapter", async () => {
  const result = await resolveAlapiMedia("https://xhslink.com/o/sample", {
    token: "test-only-token",
    fetchImpl: async () =>
      Response.json({
        code: 200,
        data: {
          title: "农家一碗香",
          type: "1",
          video_url: "https://media.example.com/xhs.mp4",
        },
      }),
    lookupHost: publicLookup,
  });

  assert.equal(result.canonicalUrl, "https://xhslink.com/o/sample");
  assert.match(result.mediaUrl, /xhs\.mp4/);
});

test("upgrades official Xiaohongshu CDN media URLs from HTTP to HTTPS", async () => {
  const result = await resolveAlapiMedia("https://xhslink.cn/o/example", {
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          code: 200,
          data: {
            title: "盐水大鸡腿",
            type: 1,
            video_url:
              "http://sns-bak-v1.xhscdn.com/stream/public-video.mp4",
          },
        }),
        { status: 200 },
      ),
    lookupHost: async () => [{ address: "8.8.8.8", family: 4 }],
    token: "test-token",
  });

  assert.equal(
    result.mediaUrl,
    "https://sns-bak-v1.xhscdn.com/stream/public-video.mp4",
  );
});

test("does not upgrade HTTP media URLs from untrusted hosts", async () => {
  await assert.rejects(
    () =>
      resolveAlapiMedia("https://xhslink.cn/o/example", {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              code: 200,
              data: {
                title: "盐水大鸡腿",
                type: 1,
                video_url: "http://media.example.com/video.mp4",
              },
            }),
            { status: 200 },
          ),
        lookupHost: async () => [{ address: "8.8.8.8", family: 4 }],
        token: "test-token",
      }),
    (error: unknown) =>
      error instanceof AudioExtractionError && error.code === "media_unavailable",
  );
});

test("classifies image posts without attempting ASR", async () => {
  await assert.rejects(
    () =>
      resolveAlapiMedia("https://v.douyin.com/image/", {
        token: "test-only-token",
        fetchImpl: async () =>
          Response.json({
            code: 200,
            data: {
              pics: ["https://image.example.com/one.jpg"],
              type: 2,
            },
          }),
        lookupHost: publicLookup,
      }),
    (error: unknown) =>
      error instanceof AudioExtractionError && error.code === "image_post_unsupported",
  );
});

test("classifies ALAPI authentication and balance errors safely", async () => {
  for (const [code, expected] of [
    [10002, "media_provider_auth_failed"],
    [10005, "media_provider_balance"],
    [429, "media_provider_rate_limited"],
  ] as const) {
    await assert.rejects(
      () =>
        resolveAlapiMedia("https://v.douyin.com/sample/", {
          token: "test-only-token",
          fetchImpl: async () => Response.json({ code }, { status: code === 429 ? 429 : 200 }),
        }),
      (error: unknown) =>
        error instanceof AudioExtractionError && error.code === expected,
    );
  }
});

test("requires provider configuration and rejects unsafe media URLs", async () => {
  await assert.rejects(
    () => resolveAlapiMedia("https://v.douyin.com/sample/", { token: "" }),
    (error: unknown) =>
      error instanceof AudioExtractionError && error.code === "media_provider_unavailable",
  );
  assert.equal(await validatePublicMediaUrl("http://media.example.com/video.mp4", publicLookup), null);
  assert.equal(
    await validatePublicMediaUrl("https://127.0.0.1/video.mp4", async () => [
      { address: "127.0.0.1", family: 4 },
    ]),
    null,
  );
});
