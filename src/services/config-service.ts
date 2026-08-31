import { communities as defaultCommunities } from "@/lib/config/communities";
import { membershipTiers as defaultTiers } from "@/lib/config/membership";
import { getZoneByState, zones } from "@/lib/config/zones";
import { env, isSupabaseConfigured } from "@/lib/env";
import type { CommunitySetting, PlatformConfig } from "@/types/domain";
import { getSupabaseCommunityAssets } from "@/services/community-repository";
import { getSupabasePlatformConfig, upsertSupabasePlatformConfig } from "@/services/platform-config-repository";

const usaFlag =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='72'%3E%3Crect width='120' height='72' fill='%23fff'/%3E%3Cg fill='%23b22234'%3E%3Crect width='120' height='5.5'/%3E%3Crect y='11' width='120' height='5.5'/%3E%3Crect y='22' width='120' height='5.5'/%3E%3Crect y='33' width='120' height='5.5'/%3E%3Crect y='44' width='120' height='5.5'/%3E%3Crect y='55' width='120' height='5.5'/%3E%3Crect y='66' width='120' height='6'/%3E%3C/g%3E%3Crect width='52' height='39' fill='%233c3b6e'/%3E%3C/svg%3E";

const indianaFlag =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='72'%3E%3Crect width='120' height='72' fill='%230b2f6b'/%3E%3Ccircle cx='60' cy='42' r='16' fill='%23f2c94c'/%3E%3Cpath d='M60 12l5 22H55z' fill='%23f2c94c'/%3E%3C/svg%3E";

const defaultRegions = [
  { code: "US-IN", name: "Indiana", countryCode: "US", flagDataUrl: indianaFlag, active: true },
  { code: "US-MD", name: "Maryland", countryCode: "US", active: true },
  { code: "US-TX", name: "Texas", countryCode: "US", active: true },
  { code: "US-NY", name: "New York", countryCode: "US", active: true },
  { code: "US-CA", name: "California", countryCode: "US", active: true }
];

const defaultGlobalZones = zones.map((zone) => ({
  code: `US-${zone.code}`,
  name: `${zone.name} (${zone.region})`,
  countryCode: "US",
  regionCodes: zone.states.map((state) => `US-${state}`),
  badgeColor: zone.code === "ZE" ? "#0f7a3b" : "#c7352f",
  active: true
}));

let platformConfig: PlatformConfig = {
  countries: [
    {
      code: "US",
      name: "United States Community Network",
      demonym: "United States",
      flagDataUrl: usaFlag,
      defaultLanguage: "fr",
      supportedLanguages: ["fr", "en"],
      currencyCode: "USD",
      active: true
    },
    {
      code: "FR",
      name: "France Community Network",
      demonym: "France",
      defaultLanguage: "fr",
      supportedLanguages: ["fr", "en"],
      currencyCode: "EUR",
      active: false
    },
    {
      code: "CA",
      name: "Canada Community Network",
      demonym: "Canada",
      defaultLanguage: "fr",
      supportedLanguages: ["fr", "en"],
      currencyCode: "CAD",
      active: false
    }
  ],
  regions: defaultRegions,
  zones: defaultGlobalZones,
  membershipTiers: defaultTiers.map((tier) => ({
    code: tier.code,
    countryCode: "US",
    name: tier.name,
    priceUsd: tier.amountUsd,
    durationYears: 1,
    description: tier.description,
    benefits: ["Digital membership card", "QR verification", "Renewal reminders"],
    renewalRules: "Standard renewal extends membership from current expiration when active.",
    addOns: [],
    active: true
  })),
  communities: defaultCommunities.map((community) => ({
    officialName: community.officialName,
    code: community.code,
    countryCode: "US",
    regionCode: `US-${community.state}`,
    zoneCode: `US-${community.zone}`,
    state: community.state,
    zone: community.zone,
    description: `${community.officialName} local membership community.`,
    contactEmail: community.contactEmail,
    supportEmail: community.contactEmail,
    socialLinks: [],
    active: true
  })),
  card: {
    defaultTemplate: "clean-community",
    accentColor: "#f2c94c",
    primaryColor: "#0f7a3b",
    backgroundColor: "#f8faf7",
    textColor: "#17211c",
    dangerColor: "#c7352f",
    logoSelection: "community",
    displayedFields: ["photo", "name", "memberId", "country", "community", "region", "zone", "tier", "expiration", "qr"]
  },
  communityCardTemplates: defaultCommunities.map((community) => ({
    id: `${community.code.toLowerCase()}-default-card`,
    communityCode: community.code,
    status: "approved",
    templateName: `${community.code} official badge`,
    accentColor: "#f2c94c",
    primaryColor: "#0f7a3b",
    backgroundStyle: "light",
    logoSelection: "community",
    frontLayout: "badge-horizontal",
    backLayout: "details",
    displayedFields: ["photo", "name", "memberId", "community", "qr"],
    fieldOrder: ["photo", "name", "memberId", "community", "qr", "country", "region", "zone", "tier", "expiration"],
    showCountryFlag: true,
    showRegionFlag: true,
    showSignatureArea: false,
    signatureTitle: "Community administrator",
    contactInfo: community.contactEmail ?? "",
    approvedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    approvedBy: "system",
    updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
  })),
  physicalCards: {
    offered: true,
    pickupEnabled: true,
    mailEnabled: true,
    shippingPriceUsd: 5,
    deliveryInstructions: "Pickup availability and mailing times are managed by the local community admin.",
    options: [
      {
        id: "standard-pvc",
        name: "Standard PVC card",
        description: "Durable standard physical membership card.",
        extraPriceUsd: 10,
        material: "standard_pvc",
        deliveryMethods: ["pickup", "mail"],
        active: true
      },
      {
        id: "premium-pvc",
        name: "Premium PVC card",
        description: "Higher quality card stock for official events.",
        extraPriceUsd: 15,
        material: "premium_pvc",
        deliveryMethods: ["pickup", "mail"],
        active: true
      }
    ]
  },
  registrationFields: [
    { field: "photo", visibility: "required" },
    { field: "phone", visibility: "required" },
    { field: "address", visibility: "hidden" },
    { field: "dateOfBirth", visibility: "hidden" },
    { field: "state", visibility: "required" },
    { field: "community", visibility: "required" },
    { field: "membershipTier", visibility: "required" },
    { field: "languagePreference", visibility: "optional" }
  ],
  branding: {
    platformName: "Community Membership Platform",
    primaryColor: "#0f7a3b",
    accentColor: "#f2c94c",
    footerText: "Privacy-first community membership platform",
    supportEmail: "support@example.org",
    associationContactDetails: "Contact your local community administrator for membership support."
  },
  notifications: {
    renewalReminderDays: [30, 14, 7, 0, -7],
    confirmationEmailText: "Votre inscription a la plateforme communautaire a ete recue.",
    cardDeliveryEmailText: "Votre carte digitale communautaire est disponible.",
    expirationNoticeText: "Votre adhesion communautaire arrive a expiration."
  },
  publicContent: {
    homepageHeadline: "Secure digital membership for community organizations",
    homepageBody:
      "Register, verify payment, generate a secure member ID card, and support renewals through one clean mobile-first workflow.",
    heroMediaType: "image",
    heroMediaUrl: "",
    about: "A configurable membership platform for regional and local community organizations.",
    faq: "Members can register, renew, verify status, and access a digital membership card.",
    communityInstructions: "Choose your country, region, zone, and local association during registration.",
    paymentInstructions: "Payments are confirmed server-side before membership activation.",
    supportContact: "support@example.org"
  }
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  if (shouldUseSupabaseConfig()) {
    const persisted = await getSupabasePlatformConfig();

    if (persisted) {
      platformConfig = normalizeConfig(persisted);
      return structuredClone(platformConfig);
    }
  }

  return structuredClone(platformConfig);
}

export async function getActiveMembershipTiers() {
  return (await getPlatformConfig()).membershipTiers.filter((tier) => tier.active);
}

export async function getActiveCommunities() {
  return (await getPlatformConfig()).communities.filter((community) => community.active);
}

export async function getActiveCountries() {
  return (await getPlatformConfig()).countries.filter((country) => country.active);
}

export async function getActiveRegions(countryCode?: string) {
  return (await getPlatformConfig()).regions.filter((region) => region.active && (!countryCode || region.countryCode === countryCode));
}

export async function getActiveZones(countryCode?: string) {
  return (await getPlatformConfig()).zones.filter((zone) => zone.active && (!countryCode || zone.countryCode === countryCode));
}

export async function getCommunitySettingByCode(code: string): Promise<CommunitySetting> {
  const community = (await getPlatformConfig()).communities.find((candidate) => candidate.code === code && candidate.active);

  if (!community) {
    throw new Error(`Unsupported or inactive community code: ${code}`);
  }

  if (env.dataBackend === "supabase" && isSupabaseConfigured()) {
    const persisted = await getSupabaseCommunityAssets(code);

    if (persisted?.logo_url) {
      return {
        ...community,
        logoDataUrl: persisted.logo_url
      };
    }
  }

  return community;
}

export async function updateConfigSection(section: keyof PlatformConfig, value: PlatformConfig[keyof PlatformConfig]) {
  const current = await getPlatformConfig();
  platformConfig = {
    ...current,
    [section]: value
  };

  platformConfig = normalizeConfig(platformConfig);

  if (shouldUseSupabaseConfig()) {
    await upsertSupabasePlatformConfig(platformConfig);
  }

  return getPlatformConfig();
}

function normalizeConfig(config: PlatformConfig): PlatformConfig {
  const next = {
    ...platformConfig,
    ...config,
    card: {
      ...platformConfig.card,
      ...config.card
    },
    communityCardTemplates: config.communityCardTemplates ?? platformConfig.communityCardTemplates,
    physicalCards: {
      ...platformConfig.physicalCards,
      ...config.physicalCards,
      options: config.physicalCards?.options ?? platformConfig.physicalCards.options
    },
    publicContent: {
      ...platformConfig.publicContent,
      ...config.publicContent
    }
  };

  next.communities = next.communities.map((community) => {
    let zone = community.zone;
    let zoneCode = community.zoneCode;

    try {
      zone = community.zone ?? getZoneByState(community.state).code;
      zoneCode = community.zoneCode ?? `${community.countryCode ?? "US"}-${zone}`;
    } catch {
      zone = community.zone ?? "";
      zoneCode = community.zoneCode ?? "";
    }

    return {
      ...community,
      countryCode: community.countryCode ?? "US",
      regionCode: community.regionCode ?? `US-${community.state}`,
      zone,
      zoneCode
    };
  });

  return next;
}

function shouldUseSupabaseConfig() {
  return env.dataBackend === "supabase" && isSupabaseConfigured();
}
