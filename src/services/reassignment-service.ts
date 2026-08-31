import { randomUUID } from "crypto";
import { getCommunitySettingByCode } from "@/services/config-service";
import { findMemberByPublicId, updateMemberLocation } from "@/services/member-service";
import { logAdminAction } from "@/services/audit-service";
import { createCardVersion } from "@/services/card-version-service";
import type { ReassignmentRecord, ReassignmentRequest } from "@/types/domain";

const reassignmentRequests = new Map<string, ReassignmentRequest>();
const reassignmentHistory: ReassignmentRecord[] = [];

export async function createReassignmentRequest(input: {
  memberId: string;
  requestedState: ReassignmentRequest["requestedState"];
  requestedCommunityCode: string;
  reason?: string;
}) {
  const member = await findMemberByPublicId(input.memberId);
  const community = await getCommunitySettingByCode(input.requestedCommunityCode);

  if (!member || community.state !== input.requestedState) {
    throw new Error("Invalid member or requested community.");
  }

  const request: ReassignmentRequest = {
    id: randomUUID(),
    memberId: member.memberId,
    previousState: member.state,
    previousZone: member.zone,
    previousCountryCode: member.countryCode,
    previousRegionCode: member.regionCode,
    previousZoneCode: member.zoneCode,
    previousCommunityCode: member.communityCode,
    requestedState: input.requestedState,
    requestedZone: community.zone,
    requestedCountryCode: community.countryCode,
    requestedRegionCode: community.regionCode,
    requestedZoneCode: community.zoneCode,
    requestedCommunityCode: input.requestedCommunityCode,
    status: "pending",
    reason: input.reason,
    requestedAt: new Date().toISOString()
  };

  reassignmentRequests.set(request.id, request);
  return request;
}

export async function listReassignmentRequests() {
  return Array.from(reassignmentRequests.values()).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function getReassignmentRequestById(requestId: string) {
  return reassignmentRequests.get(requestId) ?? null;
}

export async function listReassignmentHistory() {
  return reassignmentHistory;
}

export async function reviewReassignmentRequest(input: {
  requestId: string;
  decision: "approved" | "rejected";
  reviewedBy: string;
  adminNotes?: string;
}) {
  const request = reassignmentRequests.get(input.requestId);

  if (!request || request.status !== "pending") {
    throw new Error("Pending reassignment request not found.");
  }

  const reviewed: ReassignmentRequest = {
    ...request,
    status: input.decision,
    reviewedAt: new Date().toISOString(),
    reviewedBy: input.reviewedBy,
    adminNotes: input.adminNotes
  };

  reassignmentRequests.set(reviewed.id, reviewed);

  if (input.decision === "approved") {
    await updateMemberLocation(reviewed.memberId, {
      state: reviewed.requestedState,
      communityCode: reviewed.requestedCommunityCode
    });

    reassignmentHistory.push({
      id: randomUUID(),
      memberId: reviewed.memberId,
      previousState: reviewed.previousState,
      previousZone: reviewed.previousZone,
      previousCountryCode: reviewed.previousCountryCode,
      previousRegionCode: reviewed.previousRegionCode,
      previousZoneCode: reviewed.previousZoneCode,
      previousCommunityCode: reviewed.previousCommunityCode,
      newState: reviewed.requestedState,
      newZone: reviewed.requestedZone,
      newCountryCode: reviewed.requestedCountryCode,
      newRegionCode: reviewed.requestedRegionCode,
      newZoneCode: reviewed.requestedZoneCode,
      newCommunityCode: reviewed.requestedCommunityCode,
      changedAt: reviewed.reviewedAt!,
      changedBy: input.reviewedBy,
      reason: reviewed.reason,
      adminNotes: input.adminNotes
    });

    await createCardVersion({
      memberId: reviewed.memberId,
      generatedBy: "system",
      reason: "reassignment"
    });

    await logAdminAction({
      adminId: input.reviewedBy,
      adminRole: "community_admin",
      action: "reassignment_approved",
      affectedRecordType: "member",
      affectedRecordId: reviewed.memberId,
      previousValue: {
        countryCode: reviewed.previousCountryCode,
        regionCode: reviewed.previousRegionCode,
        zoneCode: reviewed.previousZoneCode,
        communityCode: reviewed.previousCommunityCode
      },
      newValue: {
        countryCode: reviewed.requestedCountryCode,
        regionCode: reviewed.requestedRegionCode,
        zoneCode: reviewed.requestedZoneCode,
        communityCode: reviewed.requestedCommunityCode
      }
    });
  }

  return reviewed;
}
