import { NextResponse } from "next/server";
import { z } from "zod";
import { forbiddenResponse, isNextResponse, requireAdminApi } from "@/lib/security/authz";
import { getReassignmentRequestById, reviewReassignmentRequest } from "@/services/reassignment-service";

const reviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(500).optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const auth = await requireAdminApi();
  if (isNextResponse(auth)) return auth;

  const parsed = reviewSchema.safeParse(await request.json());
  const { requestId } = await params;
  const reassignment = await getReassignmentRequestById(requestId);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review payload.", issues: parsed.error.flatten() }, { status: 422 });
  }

  if (!reassignment) {
    return NextResponse.json({ error: "Pending reassignment request not found." }, { status: 404 });
  }

  if (
    auth.admin.role !== "super_admin" &&
    auth.admin.scopeType !== "global" &&
    !(
      (auth.admin.scopeType === "country" && (auth.admin.scopeId === reassignment.previousCountryCode || auth.admin.scopeId === reassignment.requestedCountryCode)) ||
      (auth.admin.scopeType === "zone" && (auth.admin.scopeId === reassignment.previousZoneCode || auth.admin.scopeId === reassignment.requestedZoneCode)) ||
      (auth.admin.scopeType === "region" && (auth.admin.scopeId === reassignment.previousRegionCode || auth.admin.scopeId === reassignment.requestedRegionCode)) ||
      (auth.admin.scopeType === "community" && (auth.admin.scopeId === reassignment.previousCommunityCode || auth.admin.scopeId === reassignment.requestedCommunityCode))
    )
  ) {
    return forbiddenResponse("This admin cannot review reassignment requests outside their scope.");
  }

  return NextResponse.json(
    await reviewReassignmentRequest({
      requestId,
      ...parsed.data,
      reviewedBy: auth.user.email
    })
  );
}
