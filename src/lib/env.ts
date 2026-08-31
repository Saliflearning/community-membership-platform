export const env = {
  showcaseMode: process.env.SHOWCASE_MODE === "true" || !process.env.SUPABASE_SERVICE_ROLE_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  deploymentEnv: process.env.DEPLOYMENT_ENV ?? process.env.NODE_ENV ?? "development",
  dataBackend: process.env.DATA_BACKEND ?? "memory",
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  publicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  publicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  cardAccessSecret: process.env.CARD_ACCESS_SECRET,
  supabaseMemberPhotosBucket: process.env.SUPABASE_MEMBER_PHOTOS_BUCKET ?? "member-photos",
  supabaseCommunityAssetsBucket: process.env.SUPABASE_COMMUNITY_ASSETS_BUCKET ?? "community-assets",
  supabaseCardsBucket: process.env.SUPABASE_CARDS_BUCKET ?? "cards",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM ?? "Community Platform <cards@example.org>",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  superAdminEmails: (process.env.SUPER_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
};

const productionRequiredEnv = [
  "NEXT_PUBLIC_APP_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
  "CARD_ACCESS_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SUPER_ADMIN_EMAILS"
];

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);
}

export function validateRuntimeEnv(mode = env.deploymentEnv): { ok: true; issues: [] } | { ok: false; issues: string[] } {
  const issues: string[] = [];

  if (mode !== "development") {
    for (const key of productionRequiredEnv) {
      if (!process.env[key]) {
        issues.push(key);
      }
    }

    if (env.dataBackend !== "supabase") {
      issues.push("DATA_BACKEND must be supabase for staging/production");
    }

    if ((env.cardAccessSecret?.length ?? 0) < 32) {
      issues.push("CARD_ACCESS_SECRET must contain at least 32 characters");
    }

    try {
      const appUrl = new URL(env.appUrl);
      if (appUrl.protocol !== "https:" || appUrl.hostname === "localhost") {
        issues.push("NEXT_PUBLIC_APP_URL must be a public HTTPS URL");
      }
    } catch {
      issues.push("NEXT_PUBLIC_APP_URL must be a valid URL");
    }
  }

  return issues.length ? { ok: false, issues } : { ok: true, issues: [] };
}

export function getCardAccessSecret() {
  if (env.cardAccessSecret && env.cardAccessSecret.length >= 32) {
    return env.cardAccessSecret;
  }

  if (env.deploymentEnv === "development") {
    return "development-only-card-secret-32-chars";
  }

  throw new Error("Card access is not configured.");
}
