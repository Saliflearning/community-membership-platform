export type MembershipIdParts = {
  year: number;
  countryCode?: string;
  zoneCode: string;
  stateCode: string;
  communityCode: string;
  sequence: number;
};

export function generateMembershipId(parts: MembershipIdParts): string {
  return [
    "CMP",
    parts.countryCode ?? "USA",
    parts.year,
    parts.zoneCode,
    parts.stateCode,
    parts.communityCode,
    parts.sequence.toString().padStart(6, "0")
  ].join("-");
}
