import { NextResponse } from "next/server";
import { isNextResponse, requireMemberOwnerOrAdminApi } from "@/lib/security/authz";
import { generateCardMetadata } from "@/services/card-service";
import { findMemberByPublicId } from "@/services/member-service";

export async function GET(_: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const member = await findMemberByPublicId(memberId);

  if (!member || member.status !== "active") {
    return NextResponse.json({ error: "Active member card not found." }, { status: 404 });
  }

  const auth = await requireMemberOwnerOrAdminApi(member);
  if (isNextResponse(auth)) return auth;

  const card = await generateCardMetadata(member);
  return new NextResponse(card.cardSvg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "private, no-store"
    }
  });
}
