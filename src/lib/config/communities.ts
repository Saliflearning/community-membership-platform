import type { UsStateCode } from "./states";
import { getZoneByState, type ZoneCode } from "./zones";

export type Community = {
  officialName: string;
  code: string;
  state: UsStateCode;
  zone: ZoneCode;
  logoUrl?: string;
  contactEmail?: string;
  adminUserId?: string;
  stateFlagUrl?: string;
  countryFlagUrl?: string;
};

function community(input: Omit<Community, "zone">): Community {
  return {
    ...input,
    zone: getZoneByState(input.state).code
  };
}

export const communities: Community[] = [
  community({
    officialName: "Indiana Community Network",
    code: "INCN",
    state: "IN",
    contactEmail: "contact@community.example"
  }),
  community({
    officialName: "Maryland Community Alliance",
    code: "MDCA",
    state: "MD"
  }),
  community({
    officialName: "Texas Community Collective",
    code: "TXCC",
    state: "TX"
  }),
  community({
    officialName: "New York Community Network",
    code: "NYCN",
    state: "NY"
  }),
  community({
    officialName: "California Community Alliance",
    code: "CACA",
    state: "CA"
  })
];

export function getCommunityByCode(code: string): Community {
  const communityRecord = communities.find((candidate) => candidate.code === code);

  if (!communityRecord) {
    throw new Error(`Unsupported community code: ${code}`);
  }

  return communityRecord;
}
