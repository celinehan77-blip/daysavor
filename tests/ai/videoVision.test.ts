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

test("retries one transient provider failure before succeeding", async () => {
  process.env.ALIBABA_ASR_API_KEY = "test-key";
  process.env.ALIBABA_ASR_BASE_URL = "https://example.com/compatible-mode/v1";
  let requests = 0;

  const result = await extractRecipeTextFromVideo(
    "https://example.com/video.mp4",
    "盐葱猪排",
    {
      fetchImpl: async () => {
        requests += 1;
        if (requests === 1) {
          return new Response(JSON.stringify({ error: "busy" }), {
            status: 503,
          });
        }

        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content:
                    "猪排加入盐和胡椒腌制，放入锅中煎至两面金黄，再加入葱段焖熟。",
                },
              },
            ],
          }),
        );
      },
    },
  );

  assert.equal(requests, 2);
  assert.match(result.text, /猪排/);
});

test("does not retry a permanent authentication failure", async () => {
  process.env.ALIBABA_ASR_API_KEY = "test-key";
  process.env.ALIBABA_ASR_BASE_URL = "https://example.com/compatible-mode/v1";
  let requests = 0;

  await assert.rejects(
    () =>
      extractRecipeTextFromVideo("https://example.com/video.mp4", null, {
        fetchImpl: async () => {
          requests += 1;
          return new Response(JSON.stringify({ error: "invalid key" }), {
            status: 401,
          });
        },
      }),
    { code: "provider_failed" },
  );

  assert.equal(requests, 1);
});
