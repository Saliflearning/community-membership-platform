import { z } from "zod";

export const registrationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional().default(""),
  countryCode: z.string().trim().min(2).max(8).default("US"),
  regionCode: z.string().trim().min(2).max(24).optional(),
  state: z.string().trim().min(2).max(24),
  communityCode: z.string().trim().min(2).max(16),
  tier: z.string().trim().min(2).max(32),
  durationYears: z.coerce.number().int().min(1).max(3),
  physicalCardChoice: z.enum(["digital_only", "pickup", "mail"]).default("digital_only"),
  physicalCardOptionId: z.string().trim().max(80).optional().default(""),
  mailingFullName: z.string().trim().max(160).optional().default(""),
  mailingStreet: z.string().trim().max(180).optional().default(""),
  mailingUnit: z.string().trim().max(80).optional().default(""),
  mailingCity: z.string().trim().max(120).optional().default(""),
  mailingRegion: z.string().trim().max(120).optional().default(""),
  mailingPostalCode: z.string().trim().max(40).optional().default(""),
  mailingCountry: z.string().trim().max(120).optional().default(""),
  mailingPhone: z.string().trim().max(40).optional().default(""),
  preferredLanguage: z.enum(["fr", "en"]).default("fr"),
  consentAccepted: z.literal("on"),
  privacyAccepted: z.literal("on")
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
