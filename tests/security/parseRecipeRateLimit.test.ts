import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { checkParseRecipeRateLimit } from "../../src/lib/security/parseRecipeRateLimit";
import { resetRateLimitForTests } from "../../src/lib/security/rateLimit";

beforeEach(() => {
  resetRateLimitForTests();
});

test("allows five recipe parses in one minute and blocks the sixth", () => {
  for (let index = 0; index < 5; index += 1) {
    assert.equal(checkParseRecipeRateLimit("client-a", 1_000).allowed, true);
  }

  const blocked = checkParseRecipeRateLimit("client-a", 1_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 60);
});

test("allows subsequent batches after the burst window resets", () => {
  for (let minute = 0; minute < 6; minute += 1) {
    const now = 1_000 + minute * 61_000;

    for (let index = 0; index < 5; index += 1) {
      assert.equal(checkParseRecipeRateLimit("client-a", now).allowed, true);
    }
  }
});

test("keeps the sustained limit at thirty recipe parses per hour", () => {
  for (let minute = 0; minute < 6; minute += 1) {
    const now = 1_000 + minute * 61_000;

    for (let index = 0; index < 5; index += 1) {
      assert.equal(checkParseRecipeRateLimit("client-a", now).allowed, true);
    }
  }

  const blocked = checkParseRecipeRateLimit("client-a", 1_000 + 6 * 61_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("tracks clients independently", () => {
  for (let index = 0; index < 5; index += 1) {
    checkParseRecipeRateLimit("client-a", 1_000);
  }

  assert.equal(checkParseRecipeRateLimit("client-a", 1_000).allowed, false);
  assert.equal(checkParseRecipeRateLimit("client-b", 1_000).allowed, true);
});
