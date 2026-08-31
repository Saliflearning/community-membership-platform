import { NextResponse } from "next/server";
import { calculateMembershipTerm } from "@/lib/membership/dates";
import { env } from "@/lib/env";
import { generateCardMetadata } from "@/services/card-service";
import { activateMember, findMemberByPublicId } from "@/services/member-service";
import { sendCardEmail } from "@/services/notification-service";
import { recordStripeCheckoutPayment } from "@/services/payment-record-service";
import { createPhysicalCardPrintRequest } from "@/services/physical-card-service";
import { expectedCheckoutAmountCents } from "@/services/payment-service";
import Stripe from "stripe";

const MAX_WEBHOOK_BYTES = 1024 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const stripe = new Stripe(env.stripeSecretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const memberId = session.client_reference_id ?? session.metadata?.memberId;

  if (!memberId) {
    return NextResponse.json({ error: "Missing member reference." }, { status: 422 });
  }

  const member = await findMemberByPublicId(memberId);

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const expectedAmount = await expectedCheckoutAmountCents(member);
  const checkoutEmail = session.customer_details?.email ?? session.customer_email;
  const isValidCheckout =
    session.mode === "payment" &&
    session.payment_status === "paid" &&
    session.currency?.toLowerCase() === "usd" &&
    session.amount_total === expectedAmount &&
    (!session.metadata?.memberInternalId || session.metadata.memberInternalId === member.id) &&
    (!checkoutEmail || checkoutEmail.toLowerCase() === member.email.toLowerCase());

  if (!isValidCheckout) {
    return NextResponse.json({ error: "Checkout session does not match the membership order." }, { status: 422 });
  }

  const transactionId = typeof session.payment_intent === "string" ? session.payment_intent : session.id;
  const payment = await recordStripeCheckoutPayment({
    memberId,
    transactionId,
    eventId: event.id,
    amountUsd: (session.amount_total ?? 0) / 100
  });

  if (payment.duplicate && member.status === "active") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const term = calculateMembershipTerm(new Date(), member.durationYears);
  const activeMember = await activateMember(member.memberId, term);

  if (!activeMember) {
    return NextResponse.json({ error: "Member activation failed." }, { status: 500 });
  }

  const card = await generateCardMetadata(activeMember);
  await createPhysicalCardPrintRequest(activeMember, card.version);
  await sendCardEmail(activeMember, card);

  return NextResponse.json({ received: true, memberId: activeMember.memberId });
}
