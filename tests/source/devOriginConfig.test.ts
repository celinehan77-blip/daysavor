import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../../next.config";

test("the 127.0.0.1 preview origin can load Next.js development resources", () => {
  assert.ok(nextConfig.allowedDevOrigins?.includes("127.0.0.1"));
});
