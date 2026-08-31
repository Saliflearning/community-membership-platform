import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { communities } from "../src/lib/config/communities";
import { getZoneByState } from "../src/lib/config/zones";
import { calculateMembershipTerm, getRenewalStatus } from "../src/lib/membership/dates";
import { generateMembershipId } from "../src/lib/membership/id";
import { signCardAccessToken, verifyCardAccessToken } from "../src/lib/security/card-access";
import { detectPhotoType } from "../src/lib/uploads/photo";
import { assertRateLimit, RateLimitError } from "../src/services/abuse-protection-service";
import { getPlatformConfig } from "../src/services/config-service";

test("maps states to configured electoral zones", () => {
  assert.equal(getZoneByState("IN").code, "ZE");
  assert.equal(getZoneByState("MD").code, "ZA");
  assert.equal(getZoneByState("TX").code, "ZC");
  assert.equal(getZoneByState("CA").code, "ZF");
});

test("community zones are derived from centralized state mapping", () => {
  const indiana = communities.find((community) => community.code === "INCN");

  assert.equal(indiana?.state, "IN");
  assert.equal(indiana?.zone, "ZE");
});

test("generates the expected public membership ID format", () => {
  const memberId = generateMembershipId({
    year: 2026,
    zoneCode: "ZE",
    stateCode: "IN",
    communityCode: "INCN",
    sequence: 123
  });

  assert.equal(memberId, "CMP-USA-2026-ZE-IN-INCN-000123");
});

test("calculates inclusive membership expiration date", () => {
  const term = calculateMembershipTerm(new Date("2026-01-15T12:00:00.000Z"), 1);

  assert.equal(term.startsAt.toISOString(), "2026-01-15T00:00:00.000Z");
  assert.equal(term.expiresAt.toISOString(), "2027-01-14T00:00:00.000Z");
});

test("marks memberships due when expiration is within 30 days", () => {
  const status = getRenewalStatus(new Date("2026-06-01T00:00:00.000Z"), new Date("2026-05-15T00:00:00.000Z"));

  assert.equal(status, "renewal_due");
});

test("platform config supports global country-region-zone-community hierarchy", async () => {
  const config = await getPlatformConfig();
  const indiana = config.communities.find((community) => community.code === "INCN");

  assert.equal(config.countries.some((country) => country.code === "US"), true);
  assert.equal(config.regions.some((region) => region.code === "US-IN"), true);
  assert.equal(config.zones.some((zone) => zone.code === "US-ZE"), true);
  assert.equal(indiana?.countryCode, "US");
  assert.equal(indiana?.regionCode, "US-IN");
  assert.equal(indiana?.zoneCode, "US-ZE");
});

test("card access token authorizes only the matching member before expiry", () => {
  const token = signCardAccessToken("CMP-US-2026-ZE-IN-INCN-0001");

  assert.equal(verifyCardAccessToken(token, "CMP-US-2026-ZE-IN-INCN-0001"), true);
  assert.equal(verifyCardAccessToken(token, "CMP-US-2026-ZE-IN-INCN-0002"), false);
  assert.equal(verifyCardAccessToken(undefined, "CMP-US-2026-ZE-IN-INCN-0001"), false);
  assert.equal(verifyCardAccessToken("tampered.signature", "CMP-US-2026-ZE-IN-INCN-0001"), false);
  assert.equal(verifyCardAccessToken(signCardAccessToken("CMP-US-2026-ZE-IN-INCN-0001", -1), "CMP-US-2026-ZE-IN-INCN-0001"), false);
  assert.equal(verifyCardAccessToken("x".repeat(2049), "CMP-US-2026-ZE-IN-INCN-0001"), false);
});

test("detects image content independently of the declared MIME type", () => {
  assert.equal(detectPhotoType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(detectPhotoType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(detectPhotoType(Uint8Array.from([0x47, 0x49, 0x46, 0x38])), null);
});

test("rate limiting returns a typed error after the configured threshold", () => {
  const key = `test:${randomUUID()}`;
  assertRateLimit(key, 2, 60_000);
  assertRateLimit(key, 2, 60_000);
  assert.throws(() => assertRateLimit(key, 2, 60_000), RateLimitError);
});
