import { NextResponse } from "next/server";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { getPlatformConfig, updateConfigSection } from "@/services/config-service";
import { logAdminAction } from "@/services/audit-service";
import type { PlatformConfig } from "@/types/domain";

export async function GET() {
  const auth = await requireAdminApi({ roles: ["super_admin"] });
  if (isNextResponse(auth)) return auth;

  return NextResponse.json(await getPlatformConfig());
}

export async function POST(request: Request) {
  const auth = await requireAdminApi({ roles: ["super_admin"] });
  if (isNextResponse(auth)) return auth;

  const payload = (await request.json()) as {
    section?: keyof PlatformConfig;
    value?: PlatformConfig[keyof PlatformConfig];
  };

  if (!payload.section || payload.value === undefined) {
    return NextResponse.json({ error: "Missing config section or value." }, { status: 422 });
  }

  const before = await getPlatformConfig();
  const updated = await updateConfigSection(payload.section, payload.value);
  await logAdminAction({
    adminId: auth.admin.id,
    adminRole: auth.admin.role,
    action: "platform_config_updated",
    affectedRecordType: "platform_config",
    affectedRecordId: payload.section,
    previousValue: before[payload.section],
    newValue: updated[payload.section]
  });

  return NextResponse.json(updated);
}
