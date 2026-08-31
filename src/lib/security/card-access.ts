import { createHmac, timingSafeEqual } from "crypto";
import { getCardAccessSecret } from "@/lib/env";

// Short-lived, signed proof that the bearer just completed payment for a specific
// member. Lets a freshly paid member open and download their private card without a
// full portal login, while keeping the card page unreadable to anyone who merely
// guesses a member ID.
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type CardAccessPayload = {
  m: string;
  exp: number;
};

function sign(body: string) {
  return createHmac("sha256", getCardAccessSecret()).update(body).digest("base64url");
}

export function signCardAccessToken(memberId: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const payload: CardAccessPayload = {
    m: memberId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyCardAccessToken(token: string | undefined | null, memberId: string): boolean {
  if (!token || token.length > 2048) {
    return false;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return false;
  }

  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<CardAccessPayload>;
    if (payload.m !== memberId) {
      return false;
    }

    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
