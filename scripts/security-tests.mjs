import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const env = read("src/lib/env.ts");
const authz = read("src/lib/security/authz.ts");
const callback = read("src/app/auth/callback/route.ts");
const webhook = read("src/app/api/payments/stripe/webhook/route.ts");
const registration = read("src/app/api/registrations/route.ts");
const photo = read("src/services/photo-service.ts");
const verification = read("src/services/card-service.ts");
const reassignment = read("src/app/api/reassignments/route.ts");
const logoStorage = read("src/services/storage-service.ts");
const logoUpload = logoStorage.slice(
  logoStorage.indexOf("export async function storeCommunityLogo"),
  logoStorage.indexOf("export async function createSignedStorageUrl")
);
const memberExport = read("src/app/api/admin/export/members/route.ts");
const refund = read("src/app/api/admin/payments/[paymentId]/refund/route.ts");
const rls = read("supabase/migrations/202605110003_storage_rls.sql");
const headers = read("next.config.mjs");

assert.match(env, /CARD_ACCESS_SECRET/);
assert.doesNotMatch(env, /CARD_ACCESS_SECRET\s*\?\?[\s\S]{0,120}SUPABASE_(?:JWT_SECRET|SERVICE_ROLE_KEY)/);
assert.match(env, /at least 32 characters/);
assert.match(authz, /currentLevel/);
assert.match(authz, /assuranceLevel !== "aal2"/);
assert.doesNotMatch(authz, /\.or\(`/);
assert.match(callback, /authError=callback_failed/);
assert.doesNotMatch(callback, /error\.message/);
assert.match(webhook, /MAX_WEBHOOK_BYTES/);
assert.match(webhook, /payment_status === "paid"/);
assert.match(webhook, /amount_total === expectedAmount/);
assert.match(registration, /Registration could not be completed\./);
assert.doesNotMatch(registration, /error instanceof Error \? error\.message/);
assert.match(registration, /env\.showcaseMode/);
assert.match(photo, /detectPhotoType/);
assert.match(verification, /verificationToken/);
assert.match(reassignment, /requireMemberOwnerOrAdminApi/);
assert.match(logoUpload, /detectPhotoType/);
assert.doesNotMatch(logoUpload, /image\/svg\+xml/);
assert.match(memberExport, /\^\[=\+\\-@\]/);
assert.match(refund, /roles: \["super_admin"\]/);
assert.doesNotMatch(rls, /member-photos' and auth\.role\(\) = 'authenticated'/);
assert.match(headers, /Content-Security-Policy/);
assert.match(headers, /Strict-Transport-Security/);

console.log("Security architecture assertions passed (23 checks).");
