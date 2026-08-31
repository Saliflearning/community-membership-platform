import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseSessionClient } from "@/lib/supabase/session";
import type { AdminRole, AdminScopeType, AdminUser, Member } from "@/types/domain";

type AdminRoleRow = {
  id: string;
  auth_user_id: string | null;
  email: string;
  role: AdminRole;
  scope_type: AdminScopeType;
  scope_id: string | null;
  active: boolean;
  mfa_required: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  assuranceLevel: "aal1" | "aal2" | null;
};

export type AuthenticatedAdmin = {
  user: AuthenticatedUser;
  admin: AdminUser;
};

export function unauthorizedResponse(message = "Authentication required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "You do not have permission to access this resource.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return null;
  }

  const supabase = await createSupabaseSessionClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) {
    return null;
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = assurance?.currentLevel;
  const assuranceLevel: AuthenticatedUser["assuranceLevel"] =
    currentLevel === "aal1" ? "aal1" : currentLevel === "aal2" ? "aal2" : null;

  return {
    id: data.user.id,
    email: data.user.email.toLowerCase(),
    assuranceLevel
  };
}

export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const admin = await getAdminForUser(user);

  if (!admin || (admin.mfaEnabled && user.assuranceLevel !== "aal2")) {
    return null;
  }

  return { user, admin };
}

export async function requireAdminApi(options?: {
  roles?: AdminRole[];
  scope?: { type: AdminScopeType; id: string };
}): Promise<AuthenticatedAdmin | NextResponse> {
  const context = await getAuthenticatedAdmin();

  if (!context) {
    return unauthorizedResponse("Authenticated admin access required.");
  }

  if (options?.roles && !options.roles.includes(context.admin.role)) {
    return forbiddenResponse("This admin role cannot perform that action.");
  }

  if (options?.scope && !adminCanAccessScope(context.admin, options.scope.type, options.scope.id)) {
    return forbiddenResponse("This admin account is outside the requested scope.");
  }

  return context;
}

export async function requireMemberOwnerOrAdminApi(member: Member): Promise<AuthenticatedUser | AuthenticatedAdmin | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorizedResponse("Authenticated member portal access required.");
  }

  const admin = await getAdminForUser(user);

  if (admin && adminCanAccessMember(admin, member)) {
    return { user, admin };
  }

  if (member.email.toLowerCase() === user.email) {
    return user;
  }

  return forbiddenResponse("This member record does not belong to the authenticated user.");
}

export async function requireAdminPage(options?: { roles?: AdminRole[] }) {
  const context = await getAuthenticatedAdmin();

  if (!context) {
    return null;
  }

  if (options?.roles && !options.roles.includes(context.admin.role)) {
    return null;
  }

  return context;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function adminCanAccessMember(admin: AdminUser, member: Member) {
  if (admin.role === "super_admin" || admin.scopeType === "global") {
    return true;
  }

  if (admin.scopeType === "country") return admin.scopeId === member.countryCode;
  if (admin.scopeType === "zone") return admin.scopeId === member.zoneCode || admin.scopeId === member.zone;
  if (admin.scopeType === "region") return admin.scopeId === member.regionCode || admin.scopeId === member.state;
  if (admin.scopeType === "community") return admin.scopeId === member.communityCode;
  return false;
}

function adminCanAccessScope(admin: AdminUser, scopeType: AdminScopeType, scopeId: string) {
  if (admin.role === "super_admin" || admin.scopeType === "global") {
    return true;
  }

  return admin.scopeType === scopeType && admin.scopeId === scopeId;
}

async function getAdminForUser(user: AuthenticatedUser): Promise<AdminUser | null> {
  if (env.superAdminEmails.includes(user.email)) {
    const timestamp = new Date().toISOString();
    return {
      id: user.id,
      email: user.email,
      name: user.email,
      role: "super_admin",
      scopeType: "global",
      active: true,
      mfaEnabled: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: byUserId, error: userIdError } = await supabase
    .from("admin_roles")
    .select("*")
    .eq("active", true)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (userIdError) {
    return null;
  }

  if (byUserId) {
    return fromAdminRoleRow(byUserId as AdminRoleRow);
  }

  const { data: byEmail, error: emailError } = await supabase
    .from("admin_roles")
    .select("*")
    .eq("active", true)
    .eq("email", user.email)
    .maybeSingle();

  if (emailError || !byEmail) {
    return null;
  }

  return fromAdminRoleRow(byEmail as AdminRoleRow);
}

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
