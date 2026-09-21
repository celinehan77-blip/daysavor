import { checkRateLimit } from "@/lib/security/rateLimit";

const BURST_LIMIT = 5;
const BURST_WINDOW_MS = 60 * 1000;
const HOURLY_LIMIT = 30;
const HOURLY_WINDOW_MS = 60 * 60 * 1000;

export function checkParseRecipeRateLimit(clientKey: string, now = Date.now()) {
  const burst = checkRateLimit(`parse:burst:${clientKey}`, {
    limit: BURST_LIMIT,
    now,
    windowMs: BURST_WINDOW_MS,
  });

  if (!burst.allowed) {
    return burst;
  }

  return checkRateLimit(`parse:hourly:${clientKey}`, {
    limit: HOURLY_LIMIT,
    now,
    windowMs: HOURLY_WINDOW_MS,
  });
}
