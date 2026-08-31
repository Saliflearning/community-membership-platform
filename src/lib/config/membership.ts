export type MembershipTierCode = "standard" | "family" | "supporter";

export type MembershipTier = {
  code: MembershipTierCode;
  name: string;
  amountUsd: number;
  description: string;
};

export const membershipTiers: MembershipTier[] = [
  {
    code: "standard",
    name: "Standard",
    amountUsd: 50,
    description: "Individual annual membership"
  },
  {
    code: "family",
    name: "Family",
    amountUsd: 90,
    description: "Household membership"
  },
  {
    code: "supporter",
    name: "Supporter",
    amountUsd: 150,
    description: "Member plus community support contribution"
  }
];

export const membershipDurations = [1, 2, 3] as const;

export type MembershipDurationYears = (typeof membershipDurations)[number];
