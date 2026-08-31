import type { MembershipDurationYears, MembershipTierCode } from "@/lib/config/membership";

export type MembershipStatus = "pending" | "active" | "expired" | "invalid" | "suspended";
export type PreferredLanguage = "fr" | "en";
export type AdminRole = "super_admin" | "country_admin" | "zone_admin" | "region_admin" | "community_admin";
export type AdminScopeType = "global" | "country" | "zone" | "region" | "community";

export type CountrySetting = {
  code: string;
  name: string;
  demonym: string;
  flagDataUrl?: string;
  defaultLanguage: PreferredLanguage;
  supportedLanguages: PreferredLanguage[];
  currencyCode: string;
  active: boolean;
};

export type RegionSetting = {
  code: string;
  name: string;
  countryCode: string;
  flagDataUrl?: string;
  active: boolean;
};

export type ZoneSetting = {
  code: string;
  name: string;
  countryCode: string;
  regionCodes: string[];
  badgeColor: string;
  active: boolean;
};

export type Member = {
  id: string;
  memberId: string;
  verificationToken: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhotoUrl?: string;
  profilePhotoDataUrl?: string;
  countryCode: string;
  regionCode: string;
  zoneCode: string;
  state: string;
  zone: string;
  communityCode: string;
  tier: string;
  durationYears: MembershipDurationYears;
  preferredLanguage: PreferredLanguage;
  status: MembershipStatus;
  consentAcceptedAt: string;
  consentVersion: string;
  startsAt?: string;
  expiresAt?: string;
  autopayEnabled: boolean;
  physicalCardRequest?: MemberPhysicalCardSelection;
  createdAt: string;
  updatedAt: string;
};

export type MembershipTierSetting = {
  code: string;
  countryCode: string;
  name: string;
  priceUsd: number;
  durationYears: 1 | 2 | 3;
  description: string;
  benefits: string[];
  renewalRules: string;
  addOns?: MembershipAddOnSetting[];
  active: boolean;
};

export type MembershipAddOnSetting = {
  code: string;
  name: string;
  description: string;
  priceUsd: number;
  active: boolean;
};

export type CommunitySetting = {
  officialName: string;
  code: string;
  countryCode: string;
  regionCode: string;
  zoneCode: string;
  state: string;
  zone: string;
  logoDataUrl?: string;
  bannerDataUrl?: string;
  description?: string;
  contactEmail?: string;
  supportEmail?: string;
  phone?: string;
  socialLinks?: Array<{ label: string; url: string }>;
  adminUserId?: string;
  stateAssetDataUrl?: string;
  countryAssetDataUrl?: string;
  active: boolean;
};

export type CardSettings = {
  defaultTemplate: "clean-community";
  accentColor: string;
  primaryColor: string;
  backgroundColor?: string;
  textColor?: string;
  dangerColor?: string;
  logoSelection: "platform" | "community" | "both";
  displayedFields: Array<"photo" | "name" | "memberId" | "country" | "community" | "state" | "region" | "zone" | "tier" | "expiration" | "qr">;
};

export type CommunityCardTemplateStatus = "draft" | "pending_approval" | "approved" | "archived";

export type CommunityCardTemplateSetting = {
  id: string;
  communityCode: string;
  status: CommunityCardTemplateStatus;
  templateName: string;
  accentColor: string;
  primaryColor: string;
  backgroundStyle: "light" | "deep-green" | "cream" | "white";
  logoSelection: "community" | "platform" | "both";
  frontLayout: "badge-vertical" | "badge-horizontal";
  backLayout: "details" | "minimal";
  displayedFields: CardSettings["displayedFields"];
  fieldOrder: CardSettings["displayedFields"];
  showCountryFlag: boolean;
  showRegionFlag: boolean;
  showSignatureArea: boolean;
  signatureTitle?: string;
  contactInfo?: string;
  approvedAt?: string;
  approvedBy?: string;
  updatedAt: string;
};

export type PhysicalCardOptionSetting = {
  id: string;
  name: string;
  description: string;
  extraPriceUsd: number;
  material: "standard_pvc" | "premium_pvc" | "laminated";
  deliveryMethods: Array<"pickup" | "mail">;
  active: boolean;
};

export type PhysicalCardSettings = {
  offered: boolean;
  pickupEnabled: boolean;
  mailEnabled: boolean;
  shippingPriceUsd: number;
  deliveryInstructions: string;
  options: PhysicalCardOptionSetting[];
};

export type MemberPhysicalCardSelection = {
  requested: boolean;
  optionId?: string;
  optionName?: string;
  deliveryMethod: "digital_only" | "pickup" | "mail";
  material?: string;
  addOnPriceUsd: number;
  shippingPriceUsd: number;
  totalExtraUsd: number;
  mailingAddress?: MailingAddress;
};

export type MailingAddress = {
  fullName: string;
  street: string;
  unit?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export type RegistrationFieldSetting = {
  field: "photo" | "phone" | "address" | "dateOfBirth" | "state" | "community" | "membershipTier" | "languagePreference" | string;
  visibility: "required" | "optional" | "hidden";
  label?: string;
};

export type BrandingSettings = {
  platformName: string;
  logoDataUrl?: string;
  primaryColor: string;
  accentColor: string;
  footerText: string;
  supportEmail: string;
  associationContactDetails: string;
};

export type NotificationSettings = {
  renewalReminderDays: number[];
  confirmationEmailText: string;
  cardDeliveryEmailText: string;
  expirationNoticeText: string;
};

export type PublicContentSettings = {
  homepageHeadline: string;
  homepageBody: string;
  heroMediaUrl?: string;
  heroMediaType?: "image" | "video" | "animation";
  about: string;
  faq: string;
  communityInstructions: string;
  paymentInstructions: string;
  supportContact: string;
};

export type PlatformConfig = {
  countries: CountrySetting[];
  regions: RegionSetting[];
  zones: ZoneSetting[];
  membershipTiers: MembershipTierSetting[];
  communities: CommunitySetting[];
  card: CardSettings;
  communityCardTemplates: CommunityCardTemplateSetting[];
  physicalCards: PhysicalCardSettings;
  registrationFields: RegistrationFieldSetting[];
  branding: BrandingSettings;
  notifications: NotificationSettings;
  publicContent: PublicContentSettings;
};

export type PhysicalCardPrintRequest = {
  id: string;
  memberId: string;
  communityCode: string;
  cardVersion: number;
  optionName: string;
  material: string;
  deliveryMethod: "pickup" | "mail";
  paymentStatus: "pending" | "paid" | "refunded" | "canceled";
  printStatus: "requested" | "paid" | "ready_to_print" | "printed" | "canceled";
  shippingStatus: "not_required" | "pending" | "shipped" | "delivered" | "picked_up" | "canceled";
  deliveryStatus: "requested" | "shipped" | "delivered" | "picked_up" | "canceled";
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  scopeType: AdminScopeType;
  scopeId?: string;
  active: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogEntry = {
  id: string;
  adminId: string;
  adminRole: AdminRole;
  action: string;
  affectedRecordType: string;
  affectedRecordId: string;
  timestamp: string;
  previousValue?: unknown;
  newValue?: unknown;
};

export type PaymentRecord = {
  id: string;
  memberId: string;
  provider: "stripe" | "manual";
  providerTransactionId: string;
  amountUsd: number;
  status: "pending" | "succeeded" | "failed" | "refunded" | "canceled";
  notes?: string;
  recordedByAdminId?: string;
  retryUrl?: string;
  paidAt?: string;
  rawEventId?: string;
};

export type AccountClosureRequest = {
  id: string;
  memberId?: string;
  email: string;
  reason?: string;
  requestType: "delete_data" | "close_account";
  status: "open" | "verified" | "completed" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type CardVersionRecord = {
  id: string;
  memberId: string;
  version: number;
  generatedAt: string;
  generatedBy: "system" | "admin";
  reason: "payment_activation" | "reassignment" | "admin_regeneration" | "profile_update";
};

export type ImpersonationSession = {
  id: string;
  adminId: string;
  memberId: string;
  reason: string;
  startedAt: string;
  endedAt?: string;
};

export type ReassignmentRecord = {
  id: string;
  memberId: string;
  previousState: string;
  previousZone: string;
  previousCountryCode: string;
  previousRegionCode: string;
  previousZoneCode: string;
  previousCommunityCode: string;
  newState: string;
  newZone: string;
  newCountryCode: string;
  newRegionCode: string;
  newZoneCode: string;
  newCommunityCode: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
  adminNotes?: string;
};

export type ReassignmentRequest = {
  id: string;
  memberId: string;
  previousState: string;
  previousZone: string;
  previousCountryCode: string;
  previousRegionCode: string;
  previousZoneCode: string;
  previousCommunityCode: string;
  requestedState: string;
  requestedZone: string;
  requestedCountryCode: string;
  requestedRegionCode: string;
  requestedZoneCode: string;
  requestedCommunityCode: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  adminNotes?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type SupportTicket = {
  id: string;
  memberName: string;
  email: string;
  issueCategory: "registration" | "payment" | "card" | "renewal" | "reassignment" | "profile" | "other";
  message: string;
  countryCode: string;
  regionCode: string;
  zoneCode: string;
  communityCode: string;
  assignedAdminId?: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "normal" | "urgent";
  createdAt: string;
  updatedAt: string;
};
