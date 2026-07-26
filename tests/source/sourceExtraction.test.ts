import assert from "node:assert/strict";
import test from "node:test";
import {
  extractPublicTextFromHtml,
  parseSafeEmbeddedState,
} from "../../src/lib/source/extractHtml";
import { extractPublicSource } from "../../src/lib/source/extractSource";
import {
  extractHttpUrlFromSharedText,
  sanitizeSharedSourceForStorage,
} from "../../src/lib/source/sharedInput";
import {
  AudioExtractionError,
  normalizeShareUrl,
} from "../../src/lib/media/extractAudio";
import {
  identifySourcePlatform,
  isPublicIpAddress,
  validateSourceUrl,
} from "../../src/lib/source/urlSafety";

const publicLookup = async () => [{ address: "8.8.8.8", family: 4 }];

const recipeHtml = `<!doctype html>
<html>
  <head>
    <title>番茄炒蛋</title>
    <meta property="og:title" content="番茄炒蛋" />
    <meta property="og:description" content="番茄切块，鸡蛋打散，热锅炒熟。" />
    <script type="application/ld+json">
      {"@type":"Recipe","description":"加入盐和少量糖调味。"}
    </script>
    <script id="__NEXT_DATA__" type="application/json">
      {"props":{"pageProps":{"note":{"desc":"最后倒回鸡蛋翻炒均匀。"}}}}
    </script>
  </head>
  <body><main>番茄切块，鸡蛋打散，热锅炒熟。</main></body>
</html>`;

test("identifies supported platform hosts without accepting lookalikes", () => {
  assert.equal(identifySourcePlatform("www.xiaohongshu.com"), "xiaohongshu");
  assert.equal(identifySourcePlatform("xhslink.com"), "xiaohongshu");
  assert.equal(identifySourcePlatform("xhslink.cn"), "xiaohongshu");
  assert.equal(identifySourcePlatform("v.douyin.com"), "douyin");
  assert.equal(identifySourcePlatform("www.iesdouyin.com"), "douyin");
  assert.equal(identifySourcePlatform("douyin.com.evil.test"), null);
  assert.equal(identifySourcePlatform("evildouyin.com"), null);
  assert.equal(identifySourcePlatform("iesdouyin.com.evil.test"), null);
});

test("accepts only safe HTTPS platform URLs", () => {
  assert.equal(
    validateSourceUrl("https://www.xiaohongshu.com/explore/abc")?.platform,
    "xiaohongshu",
  );
  assert.equal(validateSourceUrl("http://www.xiaohongshu.com/explore/abc"), null);
  assert.equal(validateSourceUrl("https://user@v.douyin.com/abc"), null);
  assert.equal(validateSourceUrl("https://v.douyin.com:444/abc"), null);
  assert.equal(validateSourceUrl("https://example.com/abc"), null);
});

test("upgrades an initial official HTTP share link before fetching", async () => {
  let requestedUrl = "";
  const result = await extractPublicSource("http://xhslink.com/o/abc", {
    fetchImpl: async (input) => {
      requestedUrl = String(input);
      return new Response(recipeHtml);
    },
    lookupHost: publicLookup,
  });

  assert.equal(result.ok, true);
  assert.equal(requestedUrl, "https://xhslink.com/o/abc");
});

test("rejects private and reserved network addresses", () => {
  assert.equal(isPublicIpAddress("8.8.8.8"), true);
  assert.equal(isPublicIpAddress("10.0.0.1"), false);
  assert.equal(isPublicIpAddress("127.0.0.1"), false);
  assert.equal(isPublicIpAddress("169.254.169.254"), false);
  assert.equal(isPublicIpAddress("192.168.1.10"), false);
  assert.equal(isPublicIpAddress("198.51.100.10"), false);
  assert.equal(isPublicIpAddress("203.0.113.10"), false);
  assert.equal(isPublicIpAddress("::1"), false);
  assert.equal(isPublicIpAddress("fd00::1"), false);
});

test("extracts a clean URL from copied share text", () => {
  assert.equal(
    extractHttpUrlFromSharedText(
      "分享一道菜谱 https://v.douyin.com/abc123/，复制链接打开抖音。",
    ),
    "https://v.douyin.com/abc123/",
  );
  assert.equal(extractHttpUrlFromSharedText("只有普通菜谱正文"), null);
  assert.equal(
    extractHttpUrlFromSharedText(
      "「番茄干焗牛肉」10min解锁无水牛肉新吃法🥘 所需食材... http://xhslink.cn/o/2pHowO3XXDJ 拷走这段，去【小红书】围观好内容~",
    ),
    "http://xhslink.cn/o/2pHowO3XXDJ",
  );
});

test("normalizes a copied xhslink.cn share command", () => {
  const normalized = normalizeShareUrl(
    "「番茄干焗牛肉」10min解锁无水牛肉新吃法🥘 http://xhslink.cn/o/2pHowO3XXDJ 拷走这段",
  );

  assert.equal(normalized.platform, "xiaohongshu");
  assert.equal(normalized.canonicalUrl, "https://xhslink.cn/o/2pHowO3XXDJ");
});

test("does not persist share query tokens in pending browser state", () => {
  assert.equal(
    sanitizeSharedSourceForStorage(
      "菜谱链接 https://xhslink.com/o/abc?share_token=private#fragment",
    ),
    "https://xhslink.com/o/abc",
  );
  assert.equal(
    sanitizeSharedSourceForStorage("鸡腿切块后加入生抽腌制"),
    "鸡腿切块后加入生抽腌制",
  );
});

test("normalizes copied Xiaohongshu share text to a stable source hash", () => {
  const fromHttp = normalizeShareUrl(
    "一个神秘调料 http://xhslink.com/o/abc?share_token=private#fragment",
  );
  const fromHttps = normalizeShareUrl("https://xhslink.com/o/abc");

  assert.equal(fromHttp.canonicalUrl, "https://xhslink.com/o/abc");
  assert.equal(fromHttp.sourceHash, fromHttps.sourceHash);
});

test("media extraction accepts Douyin and rejects lookalike hosts", () => {
  const douyin = normalizeShareUrl("抖音分享 https://v.douyin.com/abc/?token=private");
  assert.equal(douyin.platform, "douyin");
  assert.equal(douyin.canonicalUrl, "https://v.douyin.com/abc/");
  assert.throws(
    () => normalizeShareUrl("https://xhslink.com.evil.test/o/abc"),
    (error: unknown) =>
      error instanceof AudioExtractionError && error.code === "unsupported_url",
  );
});

test("normalizes the six Douyin MVP samples without retaining share noise", () => {
  const samples = [
    "https://v.douyin.com/3MPyusYaM8s/",
    "https://v.douyin.com/61MfaxPVOqo/",
    "https://v.douyin.com/29Zba-mo3Ng/",
    "https://v.douyin.com/DXgCz5OFyMc/",
    "https://v.douyin.com/WmuRtJV1Ubs/",
    "https://v.douyin.com/XKc1oxiuiAU/",
  ];

  for (const sample of samples) {
    const normalized = normalizeShareUrl(`复制打开抖音 ${sample} share-token`);
    assert.equal(normalized.platform, "douyin");
    assert.equal(normalized.canonicalUrl, sample);
  }
});

test("extracts and deduplicates metadata, JSON-LD and embedded JSON", () => {
  const result = extractPublicTextFromHtml(recipeHtml);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.title, "番茄炒蛋");
  assert.match(result.text, /番茄切块/);
  assert.match(result.text, /少量糖/);
  assert.match(result.text, /倒回鸡蛋/);
  assert.equal(result.extractor, "combined");
  assert.equal(result.text.match(/番茄切块/g)?.length, 1);
});

test("safely parses Xiaohongshu initial state without executing JavaScript", () => {
  const parsed = parseSafeEmbeddedState(
    'window.__INITIAL_STATE__={"note":{"desc":"undefined flavor","subtitle":"切块后翻炒"},"prompt":undefined};',
  ) as { note: { desc: string; subtitle: string }; prompt: null } | null;

  assert.equal(parsed?.prompt, null);
  assert.equal(parsed?.note.desc, "undefined flavor");
  assert.equal(parsed?.note.subtitle, "切块后翻炒");
});

test("classifies empty and blocked pages safely", () => {
  const empty = extractPublicTextFromHtml("<html><body>首页</body></html>");
  const blocked = extractPublicTextFromHtml(
    "<html><body>访问过于频繁，请完成验证码</body></html>",
  );

  assert.equal(empty.ok, false);
  assert.equal(!empty.ok && empty.errorCode, "no_text");
  assert.equal(blocked.ok, false);
  assert.equal(!blocked.ok && blocked.errorCode, "fetch_blocked");
});

test("resolves an allowed short link and strips query data from storage URL", async () => {
  const requestedUrls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    requestedUrls.push(url);

    if (url.includes("xhslink.com")) {
      return new Response(null, {
        headers: {
          location:
            "https://www.xiaohongshu.com/explore/abc?share_token=secret",
        },
        status: 302,
      });
    }

    return new Response(recipeHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
      status: 200,
    });
  };

  const result = await extractPublicSource("https://xhslink.com/a1b2", {
    fetchImpl,
    lookupHost: publicLookup,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(requestedUrls.length, 2);
  assert.equal(result.platform, "xiaohongshu");
  assert.equal(result.canonicalUrl, "https://www.xiaohongshu.com/explore/abc");
  assert.match(result.text, /番茄炒蛋/);
});

test("blocks cross-platform and non-platform redirects", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(null, {
      headers: { location: "https://example.com/private" },
      status: 302,
    });

  const result = await extractPublicSource("https://v.douyin.com/abc", {
    fetchImpl,
    lookupHost: publicLookup,
  });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.errorCode, "unsafe_redirect");
});

test("blocks platform hosts that resolve to private addresses", async () => {
  const result = await extractPublicSource("https://v.douyin.com/abc", {
    fetchImpl: async () => new Response(recipeHtml),
    lookupHost: async () => [{ address: "127.0.0.1", family: 4 }],
  });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.errorCode, "unsafe_redirect");
});

test("rejects oversized responses before reading the body", async () => {
  const result = await extractPublicSource("https://www.douyin.com/video/abc", {
    fetchImpl: async () =>
      new Response(recipeHtml, {
        headers: { "content-length": String(3 * 1024 * 1024) },
      }),
    lookupHost: publicLookup,
  });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.errorCode, "response_too_large");
});

test("times out without retrying indefinitely", async () => {
  const fetchImpl: typeof fetch = async (_input, init) =>
    new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    });

  const result = await extractPublicSource("https://v.douyin.com/abc", {
    fetchImpl,
    lookupHost: publicLookup,
    timeoutMs: 5,
  });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.errorCode, "timeout");
});
