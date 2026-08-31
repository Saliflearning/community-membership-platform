import { NextResponse } from "next/server";
import { isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { getCommunitySettingByCode } from "@/services/config-service";
import { upsertSupabaseCommunityLogo } from "@/services/community-repository";
import { storeCommunityLogo } from "@/services/storage-service";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const community = await getCommunitySettingByCode(code);
  const auth = await requireAdminApi({ scope: { type: "community", id: community.code } });
  if (isNextResponse(auth)) return auth;

  const formData = await request.formData();
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Community logo is required." }, { status: 422 });
  }

  const logoUrl = await storeCommunityLogo(community.code, file);
  await upsertSupabaseCommunityLogo({
    code: community.code,
    officialName: community.officialName,
    logoUrl
  });

  return NextResponse.json({ code: community.code, logoDataUrl: logoUrl });
}
