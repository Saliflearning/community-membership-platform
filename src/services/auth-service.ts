import { env } from "@/lib/env";

export type Role = "member" | "community_admin" | "platform_admin";

export function getAuthStrategySummary() {
  return {
    publicPagesRequireLogin: false,
    memberAuth: "email_otp_or_magic_link",
    adminAuth: "email_password_mfa_rbac"
  };
}

export function assertAdminEmail(email: string) {
  if (!env.adminEmails.includes(email.toLowerCase())) {
    throw new Error("Admin access denied.");
  }
}
