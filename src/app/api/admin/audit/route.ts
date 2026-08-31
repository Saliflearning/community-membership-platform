import { NextResponse } from "next/server";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { listAuditLogs } from "@/services/audit-service";

export async function GET() {
  const auth = await requireAdminApi({ roles: ["super_admin"] });
  if (isNextResponse(auth)) return auth;

  return NextResponse.json(await listAuditLogs());
}
