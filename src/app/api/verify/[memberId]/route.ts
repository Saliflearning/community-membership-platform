import { NextResponse } from "next/server";
import { toPublicVerificationPayloadAsync } from "@/services/card-service";
import { findMemberByVerificationToken } from "@/services/member-service";
import { assertRateLimit, isRateLimitError } from "@/services/abuse-protection-service";

export async function GET(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    assertRateLimit(`verify:${request.headers.get("x-forwarded-for") ?? "local"}`, 30, 60_000);
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { status: "rate_limited" },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } }
      );
    }
    throw error;
  }

  const { memberId: verificationToken } = await params;
  const member = await findMemberByVerificationToken(verificationToken);

  if (!member) {
    return NextResponse.json({ status: "invalid" }, { status: 404 });
  }

  return NextResponse.json(await toPublicVerificationPayloadAsync(member));
}
