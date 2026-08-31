const attempts = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 10_000;

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many requests. Please try again later.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const normalizedKey = key.slice(0, 160);
  const recent = (attempts.get(normalizedKey) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    const retryAfterMs = windowMs - (now - recent[0]);
    throw new RateLimitError(Math.max(1, Math.ceil(retryAfterMs / 1000)));
  }

  if (!attempts.has(normalizedKey) && attempts.size >= MAX_TRACKED_KEYS) {
    throw new RateLimitError(Math.max(1, Math.ceil(windowMs / 1000)));
  }

  attempts.set(normalizedKey, [...recent, now]);
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}
