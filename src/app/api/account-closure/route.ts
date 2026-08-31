import { NextResponse } from "next/server";
import { z } from "zod";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { createAccountClosureRequest, listAccountClosureRequests } from "@/services/account-closure-service";
import { assertRateLimit, isRateLimitError } from "@/services/abuse-protection-service";
import { env } from "@/lib/env";

const closureSchema = z.object({
  email: z.string().email(),
  memberId: z.string().optional(),
  requestType: z.enum(["delete_data", "close_account"]),
  reason: z.string().max(500).optional()
});

export async function GET() {
  const auth = await requireAdminApi({ roles: ["super_admin"] });
  if (isNextResponse(auth)) return auth;

  return NextResponse.json(await listAccountClosureRequests());
}

export async function POST(request: Request) {
  if (env.showcaseMode) {
    return NextResponse.json({ error: "Submissions are disabled in portfolio demo mode." }, { status: 503 });
  }

  try {
    assertRateLimit(`account-closure:${request.headers.get("x-forwarded-for") ?? "local"}`, 3, 60_000);
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } }
      );
    }
    throw error;
  }
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());
  const parsed = closureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid closure request.", issues: parsed.error.flatten() }, { status: 422 });
  }

  const closure = await createAccountClosureRequest(parsed.data);

  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL("/account/closure?submitted=1", request.url), 303);
  }

  return NextResponse.json(closure, { status: 201 });
}
