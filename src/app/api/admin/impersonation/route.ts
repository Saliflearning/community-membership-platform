import { NextResponse } from "next/server";
import { z } from "zod";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { startImpersonation } from "@/services/impersonation-service";

const impersonationSchema = z.object({
  memberId: z.string().min(8),
  reason: z.string().min(5).max(500)
});

export async function POST(request: Request) {
  const auth = await requireAdminApi({ roles: ["super_admin"] });
  if (isNextResponse(auth)) return auth;

  const parsed = impersonationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid impersonation request.", issues: parsed.error.flatten() }, { status: 422 });
  }

  return NextResponse.json(await startImpersonation({ ...parsed.data, adminId: auth.admin.id }), { status: 201 });
}
