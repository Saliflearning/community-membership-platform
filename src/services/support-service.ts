import { randomUUID } from "crypto";
import { getCommunitySettingByCode } from "@/services/config-service";
import { listAdmins } from "@/services/admin-service";
import { logAdminAction } from "@/services/audit-service";
import type { SupportTicket } from "@/types/domain";

const supportTickets = new Map<string, SupportTicket>();

export async function routeSupportAdmin(communityCode: string) {
  const admins = await listAdmins();
  return (
    admins.find((admin) => admin.active && admin.scopeType === "community" && admin.scopeId === communityCode) ??
    admins.find((admin) => admin.active && admin.role === "super_admin") ??
    null
  );
}

export async function createSupportTicket(input: {
  memberName: string;
  email: string;
  issueCategory: SupportTicket["issueCategory"];
  message: string;
  communityCode: string;
  priority?: SupportTicket["priority"];
}) {
  const community = await getCommunitySettingByCode(input.communityCode);
  const assignedAdmin = await routeSupportAdmin(input.communityCode);
  const timestamp = new Date().toISOString();
  const ticket: SupportTicket = {
    id: randomUUID(),
    memberName: input.memberName,
    email: input.email.toLowerCase(),
    issueCategory: input.issueCategory,
    message: input.message,
    countryCode: community.countryCode,
    regionCode: community.regionCode,
    zoneCode: community.zoneCode,
    communityCode: community.code,
    assignedAdminId: assignedAdmin?.id,
    status: "open",
    priority: input.priority ?? "normal",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  supportTickets.set(ticket.id, ticket);
  return ticket;
}

export async function listSupportTickets() {
  return Array.from(supportTickets.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateSupportTicket(input: {
  ticketId: string;
  status: SupportTicket["status"];
  adminId: string;
  adminRole: "super_admin" | "country_admin" | "zone_admin" | "region_admin" | "community_admin";
}) {
  const ticket = supportTickets.get(input.ticketId);

  if (!ticket) {
    throw new Error("Support ticket not found.");
  }

  const updated: SupportTicket = {
    ...ticket,
    status: input.status,
    updatedAt: new Date().toISOString()
  };

  supportTickets.set(updated.id, updated);
  await logAdminAction({
    adminId: input.adminId,
    adminRole: input.adminRole,
    action: "support_ticket_status_changed",
    affectedRecordType: "support_ticket",
    affectedRecordId: updated.id,
    previousValue: { status: ticket.status },
    newValue: { status: updated.status }
  });

  return updated;
}
