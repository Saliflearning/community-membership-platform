import type { MembershipDurationYears } from "@/lib/config/membership";

export type MembershipTerm = {
  startsAt: Date;
  expiresAt: Date;
};

export function calculateMembershipTerm(startDate: Date, durationYears: MembershipDurationYears): MembershipTerm {
  const startsAt = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const expiresAt = new Date(startsAt);
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + durationYears);
  expiresAt.setUTCDate(expiresAt.getUTCDate() - 1);

  return { startsAt, expiresAt };
}

export function getRenewalStatus(expiresAt: Date, now = new Date()): "current" | "renewal_due" | "expired" {
  const millisUntilExpiration = expiresAt.getTime() - now.getTime();
  const daysUntilExpiration = Math.ceil(millisUntilExpiration / 86_400_000);

  if (daysUntilExpiration < 0) {
    return "expired";
  }

  if (daysUntilExpiration <= 30) {
    return "renewal_due";
  }

  return "current";
}
