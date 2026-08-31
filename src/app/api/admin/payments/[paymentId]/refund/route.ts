import { NextResponse } from "next/server";
import { z } from "zod";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { markPaymentRefunded } from "@/services/payment-record-service";

const refundSchema = z.object({
  status: z.enum(["refunded", "canceled"]),
  notes: z.string().max(500).optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const auth = await requireAdminApi({ roles: ["super_admin"] });
  if (isNextResponse(auth)) return auth;

  const parsed = refundSchema.safeParse(await request.json());
  const { paymentId } = await params;

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid refund payload.", issues: parsed.error.flatten() }, { status: 422 });
  }

  return NextResponse.json(await markPaymentRefunded({ paymentId, ...parsed.data, adminId: auth.admin.id, adminRole: auth.admin.role }));
}
