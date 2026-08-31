import { randomUUID } from "crypto";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminRole, AdminScopeType, AdminUser, Member, SupportTicket } from "@/types/domain";

const now = new Date().toISOString();

const admins = new Map<string, AdminUser>([
  [
    "admin-super",
    {
      id: "admin-super",
      email: "superadmin@example.org",
      name: "Super Admin",
      role: "super_admin",
      scopeType: "global",
      active: true,
      mfaEnabled: true,
      createdAt: now,
      updatedAt: now
    }
  ],
  [
    "admin-abin",
    {
      id: "admin-abin",
      email: "admin@community.example",
      name: "ABIN Admin",
      role: "community_admin",
      scopeType: "community",
      scopeId: "ABIN",
      active: true,
      mfaEnabled: true,
      createdAt: now,
      updatedAt: now
    }
  ]
]);

export async function listAdmins() {
  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("admin_roles").select("*").order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => fromAdminRoleRow(row as AdminRoleRow));
  }

  return Array.from(admins.values());
}

export async function getAdminById(adminId: string) {
  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("admin_roles").select("*").eq("id", adminId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? fromAdminRoleRow(data as AdminRoleRow) : null;
  }

  return admins.get(adminId) ?? null;
}

export async function createAdmin(input: {
  email: string;
  name: string;
  role: AdminRole;
  scopeType: AdminScopeType;
  scopeId?: string;
}) {
  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_roles")
      .insert({
        email: input.email.toLowerCase(),
        role: input.role,
        scope_type: input.scopeType,
        scope_id: input.scopeId ?? null,
        active: true,
        mfa_required: true
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return fromAdminRoleRow(data as AdminRoleRow);
  }

  const timestamp = new Date().toISOString();
  const admin: AdminUser = {
    id: randomUUID(),
    ...input,
    email: input.email.toLowerCase(),
    active: true,
    mfaEnabled: input.role !== "super_admin" ? false : true,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  admins.set(admin.id, admin);
  return admin;
}

type AdminRoleRow = {
  id: string;
  email: string;
  role: AdminRole;
  scope_type: AdminScopeType;
  scope_id: string | null;
  active: boolean;
  mfa_required: boolean;
  created_at: string;
  updated_at: string;
};

function fromAdminRoleRow(row: AdminRoleRow): AdminUser {
  return {
    id: row.id,
    email: row.email.toLowerCase(),
    name: row.email.toLowerCase(),
    role: row.role,
    scopeType: row.scope_type,
    scopeId: row.scope_id ?? undefined,
    active: row.active,
    mfaEnabled: row.mfa_required,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function shouldUseSupabase() {
  return env.dataBackend === "supabase" && isSupabaseConfigured();
}

export function canAccessCommunity(admin: AdminUser, communityCode: string) {
  if (admin.role === "super_admin" || admin.scopeType === "global") {
    return true;
  }

  return admin.scopeType === "community" && admin.scopeId === communityCode;
}

export function filterMembersForAdmin(admin: AdminUser, members: Member[]) {
  if (admin.role === "super_admin") {
    return members;
  }

  if (admin.scopeType === "community" && admin.scopeId) {
    return members.filter((member) => member.communityCode === admin.scopeId);
  }

  if (admin.scopeType === "country" && admin.scopeId) {
    return members.filter((member) => member.countryCode === admin.scopeId);
  }

  if (admin.scopeType === "zone" && admin.scopeId) {
    return members.filter((member) => member.zoneCode === admin.scopeId);
  }

  if (admin.scopeType === "region" && admin.scopeId) {
    return members.filter((member) => member.regionCode === admin.scopeId);
  }

  return [];
}

export function filterTicketsForAdmin(admin: AdminUser, tickets: SupportTicket[]) {
  if (admin.role === "super_admin") {
    return tickets;
  }

  return tickets.filter((ticket) => {
    if (admin.scopeType === "community") return ticket.communityCode === admin.scopeId;
    if (admin.scopeType === "country") return ticket.countryCode === admin.scopeId;
    if (admin.scopeType === "zone") return ticket.zoneCode === admin.scopeId;
    if (admin.scopeType === "region") return ticket.regionCode === admin.scopeId;
    return false;
  });
}
