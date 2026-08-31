import { env } from "@/lib/env";
import type { CardMetadata } from "@/services/card-service";
import type { Member } from "@/types/domain";

export async function sendCardEmail(member: Member, card: CardMetadata) {
  if (!env.resendApiKey) {
    return {
      skipped: true,
      reason: "RESEND_API_KEY is not configured."
    };
  }

  // Integrate Resend here. The payload stays small and language-aware.
  return {
    skipped: false,
    to: member.email,
    subject: member.preferredLanguage === "fr" ? "Votre carte communautaire" : "Your community membership card",
    verificationUrl: card.verificationUrl
  };
}
