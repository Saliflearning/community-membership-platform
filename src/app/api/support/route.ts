import { NextResponse } from "next/server";
import { z } from "zod";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { createSupportTicket, listSupportTickets } from "@/services/support-service";
import { filterTicketsForAdmin } from "@/services/admin-service";
import { assertRateLimit, isRateLimitError } from "@/services/abuse-protection-service";
import { env } from "@/lib/env";

const ticketSchema = z.object({
  memberName: z.string().min(2).max(120),
  email: z.string().email(),
  issueCategory: z.enum(["registration", "payment", "card", "renewal", "reassignment", "profile", "other"]),
  message: z.string().min(5).max(1000),
  communityCode: z.string().min(2).max(16),
  priority: z.enum(["normal", "urgent"]).optional()
});

export async function GET() {
  const auth = await requireAdminApi();
  if (isNextResponse(auth)) return auth;

  return NextResponse.json(filterTicketsForAdmin(auth.admin, await listSupportTickets()));
}

export async function POST(request: Request) {
  if (env.showcaseMode) {
    return NextResponse.json({ error: "Submissions are disabled in portfolio demo mode." }, { status: 503 });
  }

  try {
    assertRateLimit(`support:${request.headers.get("x-forwarded-for") ?? "local"}`, 5, 60_000);
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json(
        { error: "Too many support requests. Please try again later." },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } }
      );
    }
    throw error;
  }
  const parsed = ticketSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid support request.", issues: parsed.error.flatten() }, { status: 422 });
  }

  return NextResponse.json(await createSupportTicket(parsed.data), { status: 201 });
}
