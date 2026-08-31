import type { UsStateCode } from "./states";

export type ZoneCode = "ZA" | "ZB" | "ZC" | "ZD" | "ZE" | "ZF";

export type ElectoralZone = {
  code: ZoneCode;
  name: string;
  region: string;
  states: UsStateCode[];
};

export const zones: ElectoralZone[] = [
  { code: "ZA", name: "Zone A", region: "East", states: ["DC", "DE", "MD", "VA", "WV"] },
  { code: "ZB", name: "Zone B", region: "Southeast", states: ["AL", "FL", "GA", "MS", "NC", "SC", "TN", "PR", "VI"] },
  { code: "ZC", name: "Zone C", region: "South", states: ["AR", "LA", "OK", "TX"] },
  { code: "ZD", name: "Zone D", region: "Northeast", states: ["CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"] },
  { code: "ZE", name: "Zone E", region: "Midwest", states: ["IN", "IL", "IA", "KS", "KY", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"] },
  { code: "ZF", name: "Zone F", region: "West", states: ["AK", "AZ", "CA", "CO", "HI", "ID", "MT", "NV", "NM", "OR", "UT", "WA", "WY"] }
];

export function getZoneByState(stateCode: string): ElectoralZone {
  const zone = zones.find((candidate) => candidate.states.includes(stateCode as UsStateCode));

  if (!zone) {
    throw new Error(`Unsupported state code: ${stateCode}`);
  }

  return zone;
}
