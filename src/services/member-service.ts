import { randomUUID } from "crypto";
import { generateMembershipId } from "@/lib/membership/id";
import type { RegistrationInput } from "@/lib/validation/registration";
import type { Member, MemberPhysicalCardSelection, MembershipStatus } from "@/types/domain";
import { getActiveMembershipTiers, getCommunitySettingByCode, getPlatformConfig } from "@/services/config-service";
import { env, isSupabaseConfigured } from "@/lib/env";
import {
  findSupabaseMemberByPublicId,
  findSupabaseMemberByVerificationToken,
  getNextSupabaseMemberSequence,
  insertSupabaseMember,
  isDuplicateMemberIdError,
  listSupabaseMembers,
  listSupabaseMembersByEmail,
  updateSupabaseMember
} from "@/services/member-repository";

const members = new Map<string, Member>();
const memberIdIndex = new Map<string, string>();
const verificationTokenIndex = new Map<string, string>();

export async function createPendingMember(input: RegistrationInput, profilePhotoDataUrl?: string): Promise<Member> {
  const community = await getCommunitySettingByCode(input.communityCode);
  const [config, tiers] = await Promise.all([getPlatformConfig(), getActiveMembershipTiers()]);
  const tier = tiers.find((candidate) => candidate.code === input.tier);

  if (!tier) {
    throw new Error("Selected membership tier is inactive or unsupported.");
  }

  if (community.state !== input.state) {
    throw new Error("Selected community does not belong to the selected state.");
  }

  const countryCode = community.countryCode;
  const physicalCardRequest = buildPhysicalCardSelection(input, config.physicalCards);
  const zone = community.zone;
  const year = new Date().getUTCFullYear();
  const now = new Date().toISOString();
  const regionCode = community.regionCode;
  const zoneCode = community.zoneCode;
  const idPrefix = ["CMP", countryCode, year, zone, input.state, input.communityCode].join("-");
  const firstSequence = shouldUseSupabase() ? await getNextSupabaseMemberSequence(`${idPrefix}-`) : members.size + 1;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const sequence = firstSequence + attempt;
    const memberId = generateMembershipId({
      year,
      countryCode,
      zoneCode: zone,
      stateCode: input.state,
      communityCode: input.communityCode,
      sequence
    });

    const member: Member = {
      id: randomUUID(),
      memberId,
      verificationToken: randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      profilePhotoDataUrl,
      countryCode,
      regionCode,
      zoneCode,
      state: input.state,
      zone,
      communityCode: input.communityCode,
      tier: input.tier,
      durationYears: tier.durationYears,
      preferredLanguage: input.preferredLanguage,
      status: "pending",
      consentAcceptedAt: now,
      consentVersion: "2026-05-terms-v1",
      autopayEnabled: false,
      physicalCardRequest,
      createdAt: now,
      updatedAt: now
    };

    members.set(member.id, member);
    memberIdIndex.set(member.memberId, member.id);
    verificationTokenIndex.set(member.verificationToken, member.id);

    if (!shouldUseSupabase()) {
      return member;
    }

    try {
      await insertSupabaseMember(member);
      return member;
    } catch (error) {
      members.delete(member.id);
      memberIdIndex.delete(member.memberId);
      verificationTokenIndex.delete(member.verificationToken);
      if (!isDuplicateMemberIdError(error) || attempt === 4) {
        throw error;
      }
    }
  }

  throw new Error("Unable to allocate a unique membership ID.");
}

function buildPhysicalCardSelection(
  input: RegistrationInput,
  settings: Awaited<ReturnType<typeof getPlatformConfig>>["physicalCards"]
): MemberPhysicalCardSelection | undefined {
  if (!settings.offered || input.physicalCardChoice === "digital_only") {
    return {
      requested: false,
      deliveryMethod: "digital_only",
      addOnPriceUsd: 0,
      shippingPriceUsd: 0,
      totalExtraUsd: 0
    };
  }

  if (input.physicalCardChoice === "pickup" && !settings.pickupEnabled) {
    throw new Error("Physical card pickup is not enabled.");
  }

  if (input.physicalCardChoice === "mail" && !settings.mailEnabled) {
    throw new Error("Physical card mailing is not enabled.");
  }

  const option = settings.options.find((candidate) => candidate.id === input.physicalCardOptionId && candidate.active);

  if (!option || !option.deliveryMethods.includes(input.physicalCardChoice)) {
    throw new Error("Selected physical card option is unavailable.");
  }

  const mailingAddress =
    input.physicalCardChoice === "mail"
      ? {
          fullName: required(input.mailingFullName, "Mailing full name"),
          street: required(input.mailingStreet, "Mailing street address"),
          unit: input.mailingUnit || undefined,
          city: required(input.mailingCity, "Mailing city"),
          region: required(input.mailingRegion, "Mailing state/region"),
          postalCode: required(input.mailingPostalCode, "Mailing postal code"),
          country: required(input.mailingCountry, "Mailing country"),
          phone: input.mailingPhone || undefined
        }
      : undefined;

  const shippingPriceUsd = input.physicalCardChoice === "mail" ? settings.shippingPriceUsd : 0;

  return {
    requested: true,
    optionId: option.id,
    optionName: option.name,
    deliveryMethod: input.physicalCardChoice,
    material: option.material,
    addOnPriceUsd: option.extraPriceUsd,
    shippingPriceUsd,
    totalExtraUsd: option.extraPriceUsd + shippingPriceUsd,
    mailingAddress
  };
}

function required(value: string | undefined, label: string) {
  if (!value?.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

export async function findMemberByPublicId(memberId: string): Promise<Member | null> {
  if (shouldUseSupabase()) {
    return findSupabaseMemberByPublicId(memberId);
  }

  const internalId = memberIdIndex.get(memberId);
  return internalId ? members.get(internalId) ?? null : null;
}

export async function findMemberByVerificationToken(verificationToken: string): Promise<Member | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verificationToken)) {
    return null;
  }

  if (shouldUseSupabase()) {
    return findSupabaseMemberByVerificationToken(verificationToken);
  }

  const internalId = verificationTokenIndex.get(verificationToken);
  return internalId ? members.get(internalId) ?? null : null;
}

export async function updateMemberStatus(memberId: string, status: MembershipStatus): Promise<Member | null> {
  const member = await findMemberByPublicId(memberId);

  if (!member) {
    return null;
  }

  const updated: Member = {
    ...member,
    status,
    updatedAt: new Date().toISOString()
  };

  members.set(updated.id, updated);
  if (shouldUseSupabase()) {
    await updateSupabaseMember(updated);
  }

  return updated;
}

export async function activateMember(memberId: string, term: { startsAt: Date; expiresAt: Date }): Promise<Member | null> {
  const member = await findMemberByPublicId(memberId);

  if (!member) {
    return null;
  }

  const updated: Member = {
    ...member,
    status: "active",
    startsAt: term.startsAt.toISOString(),
    expiresAt: term.expiresAt.toISOString(),
    updatedAt: new Date().toISOString()
  };

  members.set(updated.id, updated);
  if (shouldUseSupabase()) {
    await updateSupabaseMember(updated);
  }

  return updated;
}

export async function getAdminMetrics() {
  const allMembers = await listMembers();
  const activeMembers = allMembers.filter((member) => member.status === "active");
  const expiringSoon = activeMembers.filter((member) => {
    if (!member.expiresAt) {
      return false;
    }

    const days = Math.ceil((new Date(member.expiresAt).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 30;
  });

  const groupBy = (key: "state" | "zone" | "communityCode") =>
    allMembers.reduce<Record<string, number>>((accumulator, member) => {
      accumulator[member[key]] = (accumulator[member[key]] ?? 0) + 1;
      return accumulator;
    }, {});

  return {
    totalMembers: allMembers.length,
    activeMembers: activeMembers.length,
    pendingMembers: allMembers.filter((member) => member.status === "pending").length,
    expiredMembers: allMembers.filter((member) => member.status === "expired").length,
    suspendedMembers: allMembers.filter((member) => member.status === "suspended").length,
    pendingPayments: allMembers.filter((member) => member.status === "pending").length,
    membersByState: groupBy("state"),
    membersByZone: groupBy("zone"),
    membersByCommunity: groupBy("communityCode"),
    membersByCountry: allMembers.reduce<Record<string, number>>((accumulator, member) => {
      accumulator[member.countryCode] = (accumulator[member.countryCode] ?? 0) + 1;
      return accumulator;
    }, {}),
    revenueSummary: {
      totalUsd: 0,
      successfulPayments: 0
    },
    expiringSoon: expiringSoon.length,
    failedCardGeneration: 0,
    failedEmailDelivery: 0
  };
}

export async function listMembers() {
  if (shouldUseSupabase()) {
    return listSupabaseMembers();
  }

  return Array.from(members.values());
}

export async function listMembersByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();

  if (shouldUseSupabase()) {
    return listSupabaseMembersByEmail(normalizedEmail);
  }

  return Array.from(members.values()).filter((member) => member.email === normalizedEmail);
}

export async function updateMemberLocation(
  memberId: string,
  next: { state: Member["state"]; communityCode: string }
): Promise<Member | null> {
  const member = await findMemberByPublicId(memberId);
  const community = await getCommunitySettingByCode(next.communityCode);

  if (!member || community.state !== next.state) {
    return null;
  }

  const updated: Member = {
    ...member,
    countryCode: community.countryCode,
    regionCode: community.regionCode,
    zoneCode: community.zoneCode,
    state: next.state,
    zone: community.zone,
    communityCode: next.communityCode,
    updatedAt: new Date().toISOString()
  };

  members.set(updated.id, updated);
  if (shouldUseSupabase()) {
    await updateSupabaseMember(updated);
  }

  return updated;
}

function shouldUseSupabase() {
  return env.dataBackend === "supabase" && isSupabaseConfigured();
}
