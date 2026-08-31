import { randomUUID } from "crypto";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminRole, AuditLogEntry } from "@/types/domain";

const auditLogs: AuditLogEntry[] = [];

export async function logAdminAction(input: {
  adminId: string;
  adminRole: AdminRole;
  action: string;
  affectedRecordType: string;
  affectedRecordId: string;
  previousValue?: unknown;
  newValue?: unknown;
}) {
  const entry: AuditLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...input
  };

  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      id: entry.id,
      actor_id: entry.adminId,
      actor_role: entry.adminRole,
      action: entry.action,
      entity_type: entry.affectedRecordType,
      entity_id: entry.affectedRecordId,
      previous_value: entry.previousValue ?? null,
      new_value: entry.newValue ?? null,
      created_at: entry.timestamp
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  auditLogs.unshift(entry);
  return entry;
}

export async function listAuditLogs() {
  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      adminId: row.actor_id ?? "system",
      adminRole: (row.actor_role ?? "super_admin") as AdminRole,
      action: row.action,
      affectedRecordType: row.entity_type,
      affectedRecordId: row.entity_id ?? "",
      timestamp: row.created_at,
      previousValue: row.previous_value,
      newValue: row.new_value
    }));
  }

  return auditLogs;
}

function shouldUseSupabase() {
  return env.dataBackend === "supabase" && isSupabaseConfigured();
}
