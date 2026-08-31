import { randomUUID } from "crypto";
import { logAdminAction } from "@/services/audit-service";
import type { ImpersonationSession } from "@/types/domain";

const impersonationSessions = new Map<string, ImpersonationSession>();

export async function startImpersonation(input: { adminId: string; memberId: string; reason: string }) {
  const session: ImpersonationSession = {
    id: randomUUID(),
    ...input,
    startedAt: new Date().toISOString()
  };

  impersonationSessions.set(session.id, session);
  await logAdminAction({
    adminId: input.adminId,
    adminRole: "super_admin",
    action: "member_impersonation_started",
    affectedRecordType: "member",
    affectedRecordId: input.memberId,
    newValue: { reason: input.reason, sessionId: session.id }
  });

  return session;
}
