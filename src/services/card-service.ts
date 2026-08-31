import QRCode from "qrcode";
import { env } from "@/lib/env";
import type { Member } from "@/types/domain";
import { getActiveMembershipTiers, getCommunitySettingByCode, getPlatformConfig } from "@/services/config-service";
import { getLatestCardVersion } from "@/services/card-version-service";
import { createStorageDataUrl } from "@/services/storage-service";

export type CardMetadata = {
  memberId: string;
  verificationUrl: string;
  qrCodeDataUrl: string;
  cardSvg: string;
  version: number;
  generatedAt: string;
};

export async function generateCardMetadata(member: Member): Promise<CardMetadata> {
  const verificationUrl = `${env.appUrl}/verify/${encodeURIComponent(member.verificationToken)}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256
  });

  const version = await getLatestCardVersion(member.memberId);

  return {
    memberId: member.memberId,
    verificationUrl,
    qrCodeDataUrl,
    cardSvg: await generateMembershipCardSvg(member, qrCodeDataUrl, version.version),
    version: version.version,
    generatedAt: new Date().toISOString()
  };
}

export function toPublicVerificationPayload(member: Member) {
  return {
    name: `${member.firstName} ${member.lastName.slice(0, 1)}.`,
    community: member.communityCode,
    status: member.status,
    expirationDate: member.expiresAt ?? null
  };
}

export async function toPublicVerificationPayloadAsync(member: Member) {
  const community = await getCommunitySettingByCode(member.communityCode);

  return {
    ...toPublicVerificationPayload(member),
    community: community.officialName
  };
}

export async function generateMembershipCardSvg(member: Member, qrCodeDataUrl?: string, cardVersion = 1): Promise<string> {
  const [config, community, tiers] = await Promise.all([
    getPlatformConfig(),
    getCommunitySettingByCode(member.communityCode),
    getActiveMembershipTiers()
  ]);
  const tier = tiers.find((candidate) => candidate.code === member.tier);
  const country = config.countries.find((candidate) => candidate.code === member.countryCode);
  const region = config.regions.find((candidate) => candidate.code === member.regionCode);
  const globalZone = config.zones.find((candidate) => candidate.code === member.zoneCode);
  const approvedTemplate =
    config.communityCardTemplates.find((template) => template.communityCode === member.communityCode && template.status === "approved") ??
    config.communityCardTemplates.find((template) => template.status === "approved");
  const qr = qrCodeDataUrl ?? (await QRCode.toDataURL(`${env.appUrl}/verify/${encodeURIComponent(member.verificationToken)}`));
  const expiresAt = member.expiresAt ? new Date(member.expiresAt).toLocaleDateString("en-US") : "Pending payment";
  const logoSelection = approvedTemplate?.logoSelection ?? config.card.logoSelection;
  const logo = logoSelection !== "platform" ? community.logoDataUrl : config.branding.logoDataUrl;
  const photo = await createStorageDataUrl(env.supabaseMemberPhotosBucket, member.profilePhotoDataUrl ?? member.profilePhotoUrl);
  const primary = approvedTemplate?.primaryColor || config.card.primaryColor || config.branding.primaryColor;
  const accent = approvedTemplate?.accentColor || config.card.accentColor || config.branding.accentColor;
  const background = templateBackground(approvedTemplate?.backgroundStyle, config.card.backgroundColor);
  const textColor = config.card.textColor ?? "#17211c";
  const danger = config.card.dangerColor ?? "#c7352f";
  const contactInfo = approvedTemplate?.contactInfo ?? community.supportEmail ?? community.contactEmail ?? "";
  const labels =
    member.preferredLanguage === "en"
      ? { title: "MEMBER CREDENTIAL", community: "COMMUNITY", country: "COUNTRY", region: "REGION", zone: "ZONE", tier: "TIER", expires: "EXPIRES", verify: "Verify at", front: "FRONT", back: "BACK", issue: "ISSUED", support: "SUPPORT", note: "Scan QR to verify live membership status. Public verification never exposes private photo or address." }
      : { title: "CREDENTIAL MEMBRE", community: "COMMUNAUTE", country: "PAYS", region: "REGION", zone: "ZONE", tier: "FORMULE", expires: "EXPIRE", verify: "Verifier sur", front: "RECTO", back: "VERSO", issue: "EMISE", support: "SUPPORT", note: "Scannez le QR pour verifier le statut membre. La verification publique n'expose pas la photo privee ni l'adresse." };

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="1340" viewBox="0 0 1050 1340">
  <defs>
    <clipPath id="photoClip"><rect x="72" y="170" width="246" height="318" rx="30"/></clipPath>
    <linearGradient id="frontBand" x1="0" x2="1"><stop offset="0" stop-color="${escapeXml(primary)}"/><stop offset="0.72" stop-color="#145f3a"/><stop offset="1" stop-color="${escapeXml(danger)}"/></linearGradient>
    <linearGradient id="cardWash" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${escapeXml(background)}"/></linearGradient>
    <filter id="softShadow" x="-5%" y="-8%" width="110%" height="116%"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#0f1f17" flood-opacity="0.12"/></filter>
  </defs>
  <rect width="1050" height="1340" fill="#e9eee7"/>
  <text x="54" y="48" fill="#647067" font-family="Arial" font-size="15" font-weight="900">${escapeXml(labels.front)}</text>
  <rect x="24" y="24" width="1002" height="612" rx="30" fill="url(#cardWash)" stroke="#d7e0d7" filter="url(#softShadow)"/>
  <rect x="24" y="24" width="1002" height="108" rx="30" fill="url(#frontBand)"/>
  <rect x="24" y="122" width="1002" height="10" fill="${escapeXml(accent)}"/>
  <text x="72" y="74" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="900">${escapeXml(config.branding.platformName)}</text>
  <text x="72" y="102" fill="#fff7d6" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="800">${escapeXml(labels.title)}</text>
  <text x="978" y="72" text-anchor="end" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900">${escapeXml(country?.demonym ?? member.countryCode)}</text>
  <text x="978" y="102" text-anchor="end" fill="#fff7d6" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="900">${escapeXml(region?.name ?? member.state)} / ${escapeXml(member.zone)}</text>
  <rect x="56" y="150" width="278" height="364" rx="34" fill="#ffffff" stroke="#d8ded6"/>
  ${
    photo
      ? `<image href="${escapeXml(photo)}" x="72" y="170" width="246" height="318" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`
      : `<rect x="72" y="170" width="246" height="318" rx="30" fill="#dfe6dc"/><text x="195" y="334" text-anchor="middle" fill="#647067" font-size="22">PHOTO</text>`
  }
  <rect x="86" y="496" width="218" height="40" rx="20" fill="#102118"/>
  <text x="195" y="522" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="16" font-weight="900">${escapeXml(community.code)}</text>
  <text x="370" y="216" fill="${escapeXml(textColor)}" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900">${escapeXml(truncate(`${member.firstName} ${member.lastName}`, 24))}</text>
  <text x="372" y="262" fill="#526056" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="900">${escapeXml(member.memberId)}</text>
  <rect x="370" y="306" width="390" height="78" rx="18" fill="#ffffff" stroke="#d8ded6"/>
  <text x="394" y="336" fill="#647067" font-family="Arial" font-size="13" font-weight="900">${escapeXml(labels.community)}</text>
  <text x="394" y="364" fill="${escapeXml(textColor)}" font-family="Arial" font-size="23" font-weight="900">${escapeXml(truncate(community.officialName, 28))}</text>
  <rect x="370" y="414" width="164" height="74" rx="18" fill="#102118"/>
  <text x="452" y="442" text-anchor="middle" fill="#fff7d6" font-family="Arial" font-size="13" font-weight="900">${escapeXml(labels.tier)}</text>
  <text x="452" y="470" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="21" font-weight="900">${escapeXml(truncate(tier?.name ?? member.tier, 12))}</text>
  <rect x="554" y="414" width="206" height="74" rx="18" fill="#ffffff" stroke="#d8ded6"/>
  <text x="657" y="442" text-anchor="middle" fill="#647067" font-family="Arial" font-size="13" font-weight="900">${escapeXml(labels.expires)}</text>
  <text x="657" y="470" text-anchor="middle" fill="#17211c" font-family="Arial" font-size="22" font-weight="900">${escapeXml(expiresAt)}</text>
  <rect x="798" y="162" width="178" height="318" rx="28" fill="#ffffff" stroke="#d8ded6"/>
  <circle cx="887" cy="224" r="48" fill="#f8faf7" stroke="#d8ded6"/>
  ${
    logo
      ? `<image href="${escapeXml(logo)}" x="847" y="184" width="80" height="80" preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="887" y="233" text-anchor="middle" fill="${escapeXml(primary)}" font-family="Arial" font-size="23" font-weight="900">${escapeXml(community.code)}</text>`
  }
  <rect x="824" y="304" width="126" height="44" rx="22" fill="${escapeXml(primary)}"/>
  <text x="887" y="332" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="18" font-weight="900">${escapeXml(member.zone)}</text>
  ${country?.flagDataUrl ? `<image href="${country.flagDataUrl}" x="828" y="374" width="52" height="32" preserveAspectRatio="xMidYMid meet"/>` : ""}
  ${region?.flagDataUrl ? `<image href="${region.flagDataUrl}" x="894" y="374" width="52" height="32" preserveAspectRatio="xMidYMid meet"/>` : ""}
  <text x="887" y="448" text-anchor="middle" fill="#526056" font-family="Arial" font-size="12" font-weight="900">CARD v${cardVersion}</text>
  <rect x="56" y="558" width="920" height="42" rx="21" fill="#102118"/>
  <text x="82" y="585" fill="#ffffff" font-family="Arial" font-size="14" font-weight="800">${escapeXml(truncate(community.officialName, 72))}</text>
  <circle cx="944" cy="579" r="8" fill="${escapeXml(danger)}"/><circle cx="918" cy="579" r="8" fill="${escapeXml(accent)}"/><circle cx="892" cy="579" r="8" fill="${escapeXml(primary)}"/>
  <text x="54" y="704" fill="#647067" font-family="Arial" font-size="15" font-weight="900">${escapeXml(labels.back)}</text>
  <rect x="24" y="680" width="1002" height="612" rx="30" fill="#ffffff" stroke="#d7e0d7" filter="url(#softShadow)"/>
  <rect x="24" y="680" width="1002" height="108" rx="30" fill="url(#frontBand)"/>
  <rect x="24" y="778" width="1002" height="10" fill="${escapeXml(accent)}"/>
  <text x="72" y="730" fill="#ffffff" font-family="Arial" font-size="31" font-weight="900">SECURE VERIFICATION</text>
  <text x="72" y="760" fill="#fff7d6" font-family="Arial" font-size="14" font-weight="900">${escapeXml(member.memberId)}</text>
  <rect x="70" y="836" width="310" height="310" rx="28" fill="#ffffff" stroke="#d8ded6"/>
  <image href="${qr}" x="92" y="858" width="266" height="266"/>
  <text x="225" y="1186" text-anchor="middle" fill="#526056" font-family="Arial" font-size="13" font-weight="900">SCAN TO VERIFY STATUS</text>
  <rect x="430" y="840" width="520" height="72" rx="18" fill="#f8faf7" stroke="#d8ded6"/>
  <text x="454" y="870" fill="#647067" font-family="Arial" font-size="13" font-weight="900">${escapeXml(labels.verify)}</text>
  <text x="454" y="898" fill="#17211c" font-family="Arial" font-size="20" font-weight="900">${escapeXml(truncate(`${env.appUrl.replace(/^https?:\/\//, "")}/verify/${member.memberId}`, 50))}</text>
  <g font-family="Arial, Helvetica, sans-serif">
    ${fieldCard(430, 948, 240, labels.country, country?.demonym ?? member.countryCode)}
    ${fieldCard(710, 948, 240, labels.region, region?.name ?? member.state)}
    ${fieldCard(430, 1040, 240, labels.zone, globalZone?.name ?? member.zone)}
    ${fieldCard(710, 1040, 240, labels.tier, tier?.name ?? member.tier)}
  </g>
  <rect x="430" y="1148" width="520" height="74" rx="18" fill="#102118"/>
  <text x="454" y="1178" fill="#fff7d6" font-family="Arial" font-size="13" font-weight="900">${escapeXml(labels.support)}</text>
  <text x="454" y="1206" fill="#ffffff" font-family="Arial" font-size="18" font-weight="900">${escapeXml(truncate(contactInfo || config.branding.supportEmail, 44))}</text>
  <text x="72" y="1248" fill="#526056" font-family="Arial" font-size="13" font-weight="700">${escapeXml(truncate(labels.note, 110))}</text>
  ${approvedTemplate?.showSignatureArea ? `<line x1="682" y1="1260" x2="950" y2="1260" stroke="#aab5ad"/><text x="682" y="1280" fill="#526056" font-family="Arial" font-size="13" font-weight="900">${escapeXml(approvedTemplate.signatureTitle ?? "Community administrator")}</text>` : ""}
</svg>`.trim();
}

function templateBackground(style: string | undefined, fallback?: string) {
  if (style === "deep-green") {
    return "#eef7ef";
  }

  if (style === "cream") {
    return "#fff8e1";
  }

  if (style === "white") {
    return "#ffffff";
  }

  return fallback ?? "#f8faf7";
}

function fieldCard(x: number, y: number, width: number, label: string, value: string) {
  const maxCharacters = Math.max(8, Math.floor(width / 9));
  return `<rect x="${x}" y="${y}" width="${width}" height="66" rx="14" fill="#ffffff" stroke="#d8ded6"/><text x="${x + 16}" y="${y + 25}" fill="#647067" font-size="13" font-weight="800">${escapeXml(label)}</text><text x="${x + 16}" y="${y + 50}" fill="#17211c" font-size="20" font-weight="800">${escapeXml(truncate(value, maxCharacters))}</text>`;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 3))}...` : value;
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    switch (character) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "\"":
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}
