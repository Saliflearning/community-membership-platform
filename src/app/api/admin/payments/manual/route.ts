import { NextResponse } from "next/server";
import { z } from "zod";
import { adminCanAccessMember, forbiddenResponse, isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { recordManualPayment } from "@/services/payment-record-service";
import { findMemberByPublicId } from "@/services/member-service";

const manualPaymentSchema = z.object({
  memberId: z.string().min(8),
  amountUsd: z.coerce.number().positive(),
  method: z.enum(["cash", "zelle", "check", "event"]),
  notes: z.string().min(2).max(500)
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (isNextResponse(auth)) return auth;

  const parsed = manualPaymentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid manual payment.", issues: parsed.error.flatten() }, { status: 422 });
  }

  const member = await findMemberByPublicId(parsed.data.memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (!adminCanAccessMember(auth.admin, member)) {
    return forbiddenResponse("This admin cannot record payments outside their scope.");
  }

  return NextResponse.json(
    await recordManualPayment({
      ...parsed.data,
      recordedByAdminId: auth.admin.id,
      recordedByAdminRole: auth.admin.role
    }),
    { status: 201 }
  );
}
