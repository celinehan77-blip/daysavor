import assert from "node:assert/strict";
import test from "node:test";

import { extractRecipeTextFromVideo } from "../../src/lib/vision/extractRecipeTextFromVideo";

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test("extracts grounded recipe text from a remote video", async () => {
  process.env.ALIBABA_ASR_API_KEY = "test-key";
  process.env.ALIBABA_ASR_BASE_URL = "https://example.com/compatible-mode/v1";
  let requestBody: Record<string, unknown> = {};

  const result = await extractRecipeTextFromVideo(
    "https://sns-video-qc.xhscdn.com/video.mp4",
    "苹果炖猪排",
    {
      fetchImpl: async (_input, init) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            model: "qwen-vl-plus",
            choices: [
              {
                message: {
                  content:
                    "梅花肉切块，苹果和洋葱切片。猪肉煎至金黄后加入苹果、洋葱、生抽和料酒，炖煮三十分钟。",
                },
              },
            ],
          }),
        );
      },
    },
  );

  const messages = requestBody.messages as Array<{
    content: Array<Record<string, unknown>>;
  }>;
  assert.equal(requestBody.model, "qwen-vl-plus");
  assert.deepEqual(messages[0]?.content[0], {
    type: "video_url",
    video_url: {
      fps: 1,
      url: "https://sns-video-qc.xhscdn.com/video.mp4",
    },
  });
  assert.match(result.text, /梅花肉/);
});

test("rejects empty vision output instead of inventing a recipe", async () => {
  process.env.ALIBABA_ASR_API_KEY = "test-key";
  process.env.ALIBABA_ASR_BASE_URL = "https://example.com/compatible-mode/v1";

  await assert.rejects(
    () =>
      extractRecipeTextFromVideo("https://example.com/video.mp4", null, {
        fetchImpl: async () =>
          new Response(JSON.stringify({ choices: [{ message: { content: "" } }] })),
      }),
    { code: "empty_result" },
  );
});
