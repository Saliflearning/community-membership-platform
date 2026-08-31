import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Member, MembershipStatus } from "@/types/domain";

type MemberRow = {
  id: string;
  member_id: string;
  verification_token: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_photo_url: string | null;
  country_code: string;
  region_code: string;
  zone_code_global: string;
  state_code: Member["state"];
  zone_code: Member["zone"];
  community_code: string;
  tier: string;
  duration_years: Member["durationYears"];
  preferred_language: Member["preferredLanguage"];
  status: MembershipStatus;
  consent_accepted_at: string;
  consent_version: string;
  starts_at: string | null;
  expires_at: string | null;
  autopay_enabled: boolean;
  physical_card_request: unknown | null;
  created_at: string;
  updated_at: string;
};

export async function insertSupabaseMember(member: Member) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("members").insert(toRow(member));

  if (error) {
    throw new Error(error.message);
  }

  return member;
}

export async function getNextSupabaseMemberSequence(prefix: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("members").select("member_id").like("member_id", `${prefix}%`);

  if (error) {
    throw new Error(error.message);
  }

  const maxSequence = ((data ?? []) as Pick<MemberRow, "member_id">[]).reduce((currentMax, row) => {
    const suffix = row.member_id.split("-").at(-1);
    const sequence = suffix ? Number.parseInt(suffix, 10) : Number.NaN;
    return Number.isFinite(sequence) ? Math.max(currentMax, sequence) : currentMax;
  }, 0);

  return maxSequence + 1;
}

export function isDuplicateMemberIdError(error: unknown) {
  return error instanceof Error && error.message.includes("members_member_id_key");
}

export async function findSupabaseMemberByPublicId(memberId: string): Promise<Member | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("members").select("*").eq("member_id", memberId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromRow(data as MemberRow) : null;
}

export async function findSupabaseMemberByVerificationToken(verificationToken: string): Promise<Member | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("verification_token", verificationToken)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromRow(data as MemberRow) : null;
}

export async function updateSupabaseMember(member: Member) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("members").update(toRow(member)).eq("member_id", member.memberId);

  if (error) {
    throw new Error(error.message);
  }

  return member;
}

export async function listSupabaseMembers(): Promise<Member[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as MemberRow[]).map(fromRow);
}

export async function listSupabaseMembersByEmail(email: string): Promise<Member[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("email", email.toLowerCase())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as MemberRow[]).map(fromRow);
}

function toRow(member: Member): MemberRow {
  return {
    id: member.id,
    member_id: member.memberId,
    verification_token: member.verificationToken,
    first_name: member.firstName,
    last_name: member.lastName,
    email: member.email,
    phone: member.phone,
    profile_photo_url: member.profilePhotoUrl ?? member.profilePhotoDataUrl ?? null,
    country_code: member.countryCode,
    region_code: member.regionCode,
    zone_code_global: member.zoneCode,
    state_code: member.state,
    zone_code: member.zone,
    community_code: member.communityCode,
    tier: member.tier,
    duration_years: member.durationYears,
    preferred_language: member.preferredLanguage,
    status: member.status,
    consent_accepted_at: member.consentAcceptedAt,
    consent_version: member.consentVersion,
    starts_at: member.startsAt ?? null,
    expires_at: member.expiresAt ?? null,
    autopay_enabled: member.autopayEnabled,
    physical_card_request: member.physicalCardRequest ?? null,
    created_at: member.createdAt,
    updated_at: member.updatedAt
  };
}

function fromRow(row: MemberRow): Member {
  return {
    id: row.id,
    memberId: row.member_id,
    verificationToken: row.verification_token,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    profilePhotoUrl: row.profile_photo_url ?? undefined,
    countryCode: row.country_code,
    regionCode: row.region_code,
    zoneCode: row.zone_code_global,
    state: row.state_code,
    zone: row.zone_code,
    communityCode: row.community_code,
    tier: row.tier,
    durationYears: row.duration_years,
    preferredLanguage: row.preferred_language,
    status: row.status,
    consentAcceptedAt: row.consent_accepted_at,
    consentVersion: row.consent_version,
    startsAt: row.starts_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    autopayEnabled: row.autopay_enabled,
    physicalCardRequest: row.physical_card_request
      ? row.physical_card_request as Member["physicalCardRequest"]
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
