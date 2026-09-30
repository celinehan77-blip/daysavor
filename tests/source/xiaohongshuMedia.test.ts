import assert from "node:assert/strict";
import test from "node:test";
import { AudioExtractionError } from "@/lib/media/errors";
import { resolveXiaohongshuMedia } from "@/lib/media/xiaohongshuMedia";

const publicLookup = async () => [{ address: "8.8.8.8", family: 4 }];
const publicVideoHtml = `<!doctype html><script>window.__INITIAL_STATE__={"noteData":{"noteData":{"title":"空气炸锅低脂烤鸡腿","video":{"media":{"video":{"duration":193},"stream":{"h264":[{"masterUrl":"http://sns-video-qc.xhscdn.com/stream/chicken.mp4","duration":192818}]}}}}}};</script>`;

test("resolves generic Xiaohongshu public video metadata after a safe redirect", async () => {
  const requestedUrls: string[] = [];
  const result = await resolveXiaohongshuMedia("https://xhslink.cn/o/example?share=token", {
    lookupHost: publicLookup,
    fetchImpl: async (input, init) => {
      requestedUrls.push(String(input));
      assert.match(new Headers(init?.headers).get("user-agent") ?? "", /iPhone/);
      if (String(input).includes("xhslink.cn")) {
        return new Response(null, { status: 302, headers: { location: "https://www.xiaohongshu.com/explore/note-id?xsec_token=temporary" } });
      }
      return new Response(publicVideoHtml);
    },
  });
  assert.equal(requestedUrls.length, 2);
  assert.equal(result.canonicalUrl, "https://www.xiaohongshu.com/explore/note-id");
  assert.equal(result.description, "空气炸锅低脂烤鸡腿");
  assert.equal(result.durationSeconds, 193);
  assert.equal(result.mediaUrl, "https://sns-video-qc.xhscdn.com/stream/chicken.mp4");
  assert.equal(result.fallbackMediaUrl, "http://sns-video-qc.xhscdn.com/stream/chicken.mp4");
});

test("rejects cross-platform redirects and non-Xiaohongshu media hosts", async () => {
  await assert.rejects(
    () => resolveXiaohongshuMedia("https://xhslink.cn/o/example", {
      lookupHost: publicLookup,
      fetchImpl: async () => new Response(null, { status: 302, headers: { location: "https://example.com/private" } }),
    }),
    (error: unknown) => error instanceof AudioExtractionError && error.code === "media_unavailable",
  );
  const unsafeHtml = publicVideoHtml.replace(/sns-video-qc\.xhscdn\.com/g, "media.example.com");
  await assert.rejects(
    () => resolveXiaohongshuMedia("https://www.xiaohongshu.com/explore/example", {
      lookupHost: publicLookup,
      fetchImpl: async () => new Response(unsafeHtml),
    }),
    (error: unknown) => error instanceof AudioExtractionError && error.code === "media_unavailable",
  );
});

test("supports alternate codecs and millisecond duration", async () => {
  const html = publicVideoHtml.replace('"duration":193', '"duration":0').replace('"h264"', '"h265"');
  const result = await resolveXiaohongshuMedia("https://www.xiaohongshu.com/explore/example", {
    lookupHost: publicLookup,
    fetchImpl: async () => new Response(html),
  });
  assert.equal(result.durationSeconds, 192.818);
});
