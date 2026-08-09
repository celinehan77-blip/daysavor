import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import samples from "../samples/recipe-parser-samples.json";
import { parseRecipeInput } from "../../src/lib/ai/parseRecipe";
import { parseRecipeWithDeepSeek } from "../../src/lib/ai/providers/deepseek";

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  AI_PROVIDER: process.env.AI_PROVIDER,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
  DEEPSEEK_MAX_RETRIES: process.env.DEEPSEEK_MAX_RETRIES,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
};

function restoreEnvironment() {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnvironment();
});

test("DeepSeek success returns normalized draft and diagnostics", async () => {
  const sample = samples[0];
  let requestBody: Record<string, unknown> | null = null;

  process.env.DEEPSEEK_API_KEY = "test-key";
  process.env.DEEPSEEK_MODEL = "deepseek-v4-flash";
  process.env.DEEPSEEK_MAX_RETRIES = "0";
  globalThis.fetch = (async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;

    return Response.json({
      model: "deepseek-v4-flash",
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify(sample?.candidate) },
        },
      ],
      usage: { prompt_tokens: 420, completion_tokens: 380, total_tokens: 800 },
    });
  }) as typeof fetch;

  const result = await parseRecipeWithDeepSeek({
    rawText: sample?.input,
    sourcePlatform: "manual",
  });

  assert.equal(result.ok, true);
  assert.equal(result.errorCode, null);
  assert.equal(result.provider, "deepseek");
  assert.equal(result.usedFallback, false);
  assert.equal(result.diagnostics?.attemptCount, 1);
  assert.equal(result.diagnostics?.usage?.totalTokens, 800);
  assert.equal(result.draft?.steps[0]?.heat, "未说明");
  const sentBody = requestBody as Record<string, unknown> | null;
  assert.ok(sentBody);
  assert.deepEqual(sentBody.response_format, { type: "json_object" });
  assert.deepEqual(sentBody.thinking, { type: "disabled" });
  assert.equal(sentBody.temperature, 0.2);
});

test("DeepSeek retries a truncated response once", async () => {
  const sample = samples[2];
  let calls = 0;

  process.env.DEEPSEEK_API_KEY = "test-key";
  process.env.DEEPSEEK_MAX_RETRIES = "1";
  globalThis.fetch = (async () => {
    calls += 1;

    if (calls === 1) {
      return Response.json({
        choices: [{ finish_reason: "length", message: { content: "{}" } }],
      });
    }

    return Response.json({
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify(sample?.candidate) },
        },
      ],
    });
  }) as typeof fetch;

  const result = await parseRecipeWithDeepSeek({ rawText: sample?.input });

  assert.equal(result.ok, true);
  assert.equal(result.diagnostics?.attemptCount, 2);
  assert.equal(calls, 2);
});

test("parseRecipeInput classifies provider failure and preserves mock fallback", async () => {
  process.env.AI_PROVIDER = "deepseek";
  process.env.DEEPSEEK_API_KEY = "test-key";
  process.env.DEEPSEEK_MAX_RETRIES = "0";
  globalThis.fetch = (async () => {
    throw new TypeError("simulated network failure");
  }) as typeof fetch;

  const result = await parseRecipeInput({
    rawText: "清蒸鱼，水开后大火蒸八分钟。",
    sourcePlatform: "manual",
  });

  assert.equal(result.ok, true);
  assert.equal(result.provider, "mock");
  assert.equal(result.usedFallback, true);
  assert.equal(result.errorCode, "PROVIDER_UNAVAILABLE");
  assert.equal(result.diagnostics?.attemptedProvider, "deepseek");
});

test("missing key is classified without making a request", async () => {
  delete process.env.DEEPSEEK_API_KEY;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return Response.json({});
  }) as typeof fetch;

  const result = await parseRecipeWithDeepSeek({ rawText: "番茄炒蛋" });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "PROVIDER_NOT_CONFIGURED");
  assert.equal(result.diagnostics?.attemptCount, 0);
  assert.equal(called, false);
});
