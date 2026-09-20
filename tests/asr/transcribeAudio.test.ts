import assert from "node:assert/strict";
import test from "node:test";
import {
  transcribeAudio,
  transcribeRemoteAudioUrl,
} from "../../src/lib/asr/transcribeAudio";

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

function restore() {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
}

test.afterEach(restore);

test("uses Volcengine once when the primary provider succeeds", async () => {
  process.env.ASR_PROVIDER = "volcengine";
  process.env.VOLC_ASR_API_KEY = "test-key";
  let calls = 0;

  global.fetch = async (_input, init) => {
    calls += 1;
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers["X-Api-Key"], "test-key");
    assert.equal(headers["X-Api-Resource-Id"], "volc.bigasr.auc_turbo");
    return new Response(JSON.stringify({ result: { text: "鸡肉切块后下锅翻炒。" } }), {
      headers: { "X-Api-Status-Code": "20000000" },
    });
  };

  const result = await transcribeAudio(Buffer.from("audio"));

  assert.equal(calls, 1);
  assert.equal(result.provider, "volcengine");
  assert.equal(result.usedFallback, false);
  assert.match(result.transcript, /鸡肉/);
});

test("lets Volcengine fetch a validated remote media URL", async () => {
  process.env.VOLC_ASR_API_KEY = "test-key";
  let requestBody: Record<string, unknown> = {};

  const result = await transcribeRemoteAudioUrl(
    "http://sns-video-qc.xhscdn.com/stream/video.mp4",
    {
      fetchImpl: async (_input, init) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ result: { text: "番茄炒出汤汁后加入鸡蛋。" } }),
          { headers: { "X-Api-Status-Code": "20000000" } },
        );
      },
    },
  );

  assert.deepEqual(requestBody.audio, {
    url: "http://sns-video-qc.xhscdn.com/stream/video.mp4",
  });
  assert.equal(result.provider, "volcengine");
  assert.match(result.transcript, /番茄/);
});

test("rejects unsafe remote media URL credentials before ASR", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      transcribeRemoteAudioUrl("https://user:pass@example.com/video.mp4", {
        fetchImpl: async () => {
          calls += 1;
          return new Response();
        },
      }),
    { code: "invalid_audio" },
  );
  assert.equal(calls, 0);
});

test("calls Qwen only after Volcengine explicitly fails", async () => {
  process.env.ASR_PROVIDER = "volcengine";
  process.env.VOLC_ASR_API_KEY = "test-key";
  process.env.ALIBABA_ASR_API_KEY = "test-qwen-key";
  process.env.ALIBABA_ASR_BASE_URL = "https://example.com/compatible-mode/v1";
  const requestedUrls: string[] = [];

  global.fetch = async (input) => {
    requestedUrls.push(String(input));
    if (requestedUrls.length === 1) {
      return new Response("{}", { status: 503 });
    }
    return new Response(
      JSON.stringify({
        model: "qwen3-asr-flash",
        choices: [{ message: { content: "鸡肉切块后加入调料翻炒。" } }],
      }),
    );
  };

  const result = await transcribeAudio(Buffer.from("audio"));

  assert.equal(requestedUrls.length, 2);
  assert.match(requestedUrls[1] ?? "", /chat\/completions$/);
  assert.equal(result.provider, "aliyun_qwen");
  assert.equal(result.usedFallback, true);
  assert.match(result.warnings[0] ?? "", /provider_unavailable/);
});

test("does not call a fallback after a configured Qwen primary fails", async () => {
  process.env.ASR_PROVIDER = "aliyun_qwen";
  process.env.ALIBABA_ASR_API_KEY = "test-qwen-key";
  process.env.ALIBABA_ASR_BASE_URL = "https://example.com/compatible-mode/v1";
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return new Response("{}", { status: 401 });
  };

  await assert.rejects(() => transcribeAudio(Buffer.from("audio")), {
    code: "authentication_failed",
  });
  assert.equal(calls, 1);
});
