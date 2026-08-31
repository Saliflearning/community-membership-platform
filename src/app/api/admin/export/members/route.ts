import { NextResponse } from "next/server";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { filterMembersForAdmin } from "@/services/admin-service";
import { logAdminAction } from "@/services/audit-service";
import { listMembers } from "@/services/member-service";

export async function GET() {
  const auth = await requireAdminApi();
  if (isNextResponse(auth)) return auth;

  const members = filterMembersForAdmin(auth.admin, await listMembers());
  await logAdminAction({
    adminId: auth.admin.id,
    adminRole: auth.admin.role,
    action: "members_exported",
    affectedRecordType: "member_export",
    affectedRecordId: "members-export",
    newValue: { count: members.length }
  });
  const header = ["memberId", "firstName", "lastName", "email", "countryCode", "regionCode", "zoneCode", "communityCode", "status"].join(",");
  const rows = members.map((member) =>
    [
      member.memberId,
      member.firstName,
      member.lastName,
      member.email,
      member.countryCode,
      member.regionCode,
      member.zoneCode,
      member.communityCode,
      member.status
    ]
      .map((value) => {
        const text = String(value);
        const neutralized = /^[=+\-@]/.test(text) ? `'${text}` : text;
        return `"${neutralized.replaceAll("\"", "\"\"")}"`;
      })
      .join(",")
  );

  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=members-export.csv"
    }
  });
}
