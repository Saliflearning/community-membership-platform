import { NextResponse } from "next/server";
import { z } from "zod";
import { isNextResponse, requireAdminApi, requireMemberOwnerOrAdminApi } from "@/lib/security/authz";
import { createReassignmentRequest, listReassignmentRequests } from "@/services/reassignment-service";
import type { UsStateCode } from "@/lib/config/states";
import { findMemberByPublicId } from "@/services/member-service";

const reassignmentSchema = z.object({
  memberId: z.string().min(8),
  requestedState: z.string().length(2),
  requestedCommunityCode: z.string().min(2).max(16),
  reason: z.string().max(500).optional()
});

export async function GET() {
  const auth = await requireAdminApi();
  if (isNextResponse(auth)) return auth;

  const requests = await listReassignmentRequests();

  if (auth.admin.role === "super_admin" || auth.admin.scopeType === "global") {
    return NextResponse.json(requests);
  }

  return NextResponse.json(
    requests.filter((request) => {
      if (auth.admin.scopeType === "country") {
        return request.previousCountryCode === auth.admin.scopeId || request.requestedCountryCode === auth.admin.scopeId;
      }

      if (auth.admin.scopeType === "zone") {
        return request.previousZoneCode === auth.admin.scopeId || request.requestedZoneCode === auth.admin.scopeId;
      }

      if (auth.admin.scopeType === "region") {
        return request.previousRegionCode === auth.admin.scopeId || request.requestedRegionCode === auth.admin.scopeId;
      }

      if (auth.admin.scopeType === "community") {
        return request.previousCommunityCode === auth.admin.scopeId || request.requestedCommunityCode === auth.admin.scopeId;
      }

      return false;
    })
  );
}

export async function POST(request: Request) {
  const parsed = reassignmentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reassignment request.", issues: parsed.error.flatten() }, { status: 422 });
  }

  const member = await findMemberByPublicId(parsed.data.memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const auth = await requireMemberOwnerOrAdminApi(member);
  if (isNextResponse(auth)) return auth;

  return NextResponse.json(
    await createReassignmentRequest({
      ...parsed.data,
      requestedState: parsed.data.requestedState as UsStateCode
    }),
    { status: 201 }
  );
}
