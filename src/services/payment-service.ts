import { env } from "@/lib/env";
import type { Member } from "@/types/domain";
import { getActiveMembershipTiers } from "@/services/config-service";
import Stripe from "stripe";

export type CheckoutSession = {
  provider: "stripe";
  checkoutUrl: string;
  referenceId: string;
};

export async function createStripeCheckoutSession(member: Member): Promise<CheckoutSession> {
  const tier = (await getActiveMembershipTiers()).find((candidate) => candidate.code === member.tier);

  if (!tier) {
    throw new Error(`Unknown membership tier: ${member.tier}`);
  }

  if (!env.stripeSecretKey) {
    return {
      provider: "stripe",
      checkoutUrl: `/payment/dev-success?memberId=${encodeURIComponent(member.memberId)}`,
      referenceId: `dev_${member.memberId}`
    };
  }

  const stripe = new Stripe(env.stripeSecretKey);
  const physical = member.physicalCardRequest;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(tier.priceUsd * 100),
        product_data: {
          name: `Community membership - ${tier.name}`,
          description: `${tier.durationYears} year membership for ${member.communityCode}`
        }
      }
    }
  ];

  if (physical?.requested && physical.addOnPriceUsd > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(physical.addOnPriceUsd * 100),
        product_data: {
          name: `Physical card - ${physical.optionName ?? "membership card"}`,
          description: `${physical.material ?? "card"} / ${physical.deliveryMethod}`
        }
      }
    });
  }

  if (physical?.requested && physical.shippingPriceUsd > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(physical.shippingPriceUsd * 100),
        product_data: {
          name: "Physical card shipping",
          description: "Mail delivery fee"
        }
      }
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: member.memberId,
    customer_email: member.email,
    line_items: lineItems,
    metadata: {
      memberId: member.memberId,
      memberInternalId: member.id,
      tier: member.tier,
      durationYears: String(member.durationYears),
      communityCode: member.communityCode,
      physicalCardRequested: physical?.requested ? "true" : "false",
      physicalCardDelivery: physical?.deliveryMethod ?? "digital_only",
      physicalCardOption: physical?.optionId ?? ""
    },
    success_url: `${env.appUrl}/payment/success?memberId=${encodeURIComponent(member.memberId)}&lang=${member.preferredLanguage}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/payment/retry?memberId=${encodeURIComponent(member.memberId)}`
  });

  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }

  return {
    provider: "stripe",
    checkoutUrl: session.url,
    referenceId: session.id
  };
}

// Confirms with Stripe that a Checkout session was actually paid and belongs to the
// given member, so the success page can safely grant that member access to their card
// even if the asynchronous webhook has not activated the record yet.
export async function isCheckoutSessionPaidForMember(sessionId: string, memberId: string): Promise<boolean> {
  if (!env.stripeSecretKey || !sessionId) {
    return false;
  }

  const stripe = new Stripe(env.stripeSecretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const reference = session.client_reference_id ?? session.metadata?.memberId;
    return session.payment_status === "paid" && reference === memberId;
  } catch {
    return false;
  }
}

export async function expectedCheckoutAmountCents(member: Member): Promise<number> {
  const tier = (await getActiveMembershipTiers()).find((candidate) => candidate.code === member.tier);

  if (!tier) {
    throw new Error("Membership tier is unavailable.");
  }

  const physicalTotal = member.physicalCardRequest?.requested
    ? member.physicalCardRequest.addOnPriceUsd + member.physicalCardRequest.shippingPriceUsd
    : 0;

  return Math.round((tier.priceUsd + physicalTotal) * 100);
}

export function assertUniqueProviderTransaction(transactionId: string, seenTransactions: Set<string>) {
  if (seenTransactions.has(transactionId)) {
    throw new Error("Duplicate payment transaction.");
  }

  seenTransactions.add(transactionId);
}
