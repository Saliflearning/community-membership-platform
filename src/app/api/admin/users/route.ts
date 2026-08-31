import { NextResponse } from "next/server";
import { z } from "zod";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { createAdmin, listAdmins } from "@/services/admin-service";
import { logAdminAction } from "@/services/audit-service";

const adminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["super_admin", "country_admin", "zone_admin", "region_admin", "community_admin"]),
  scopeType: z.enum(["global", "country", "zone", "region", "community"]),
  scopeId: z.string().optional()
});

export async function GET() {
  const auth = await requireAdminApi({ roles: ["super_admin"] });
  if (isNextResponse(auth)) return auth;

  return NextResponse.json(await listAdmins());
}

export async function POST(request: Request) {
  const auth = await requireAdminApi({ roles: ["super_admin"] });
  if (isNextResponse(auth)) return auth;

  const parsed = adminSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid admin payload.", issues: parsed.error.flatten() }, { status: 422 });
  }

  const admin = await createAdmin(parsed.data);
  await logAdminAction({
    adminId: auth.admin.id,
    adminRole: auth.admin.role,
    action: "admin_created",
    affectedRecordType: "admin_user",
    affectedRecordId: admin.id,
    newValue: admin
  });

  return NextResponse.json(admin, { status: 201 });
}
