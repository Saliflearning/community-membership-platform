import { randomUUID } from "crypto";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/services/audit-service";
import type { AdminRole, PaymentRecord } from "@/types/domain";

const payments = new Map<string, PaymentRecord>();

type PaymentRow = {
  id: string;
  member_id: string;
  provider: PaymentRecord["provider"];
  provider_transaction_id: string;
  provider_event_id: string | null;
  amount_usd: number | string;
  status: PaymentRecord["status"];
  notes: string | null;
  recorded_by_admin_id: string | null;
  retry_url: string | null;
  paid_at: string | null;
};

export async function recordManualPayment(input: {
  memberId: string;
  amountUsd: number;
  method: "cash" | "zelle" | "check" | "event";
  notes: string;
  recordedByAdminId: string;
  recordedByAdminRole?: AdminRole;
}) {
  const payment: PaymentRecord = {
    id: randomUUID(),
    memberId: input.memberId,
    provider: "manual",
    providerTransactionId: `manual_${input.method}_${Date.now()}`,
    amountUsd: input.amountUsd,
    status: "succeeded",
    notes: `${input.method}: ${input.notes}`,
    recordedByAdminId: input.recordedByAdminId,
    paidAt: new Date().toISOString()
  };

  payments.set(payment.id, payment);

  if (shouldUseSupabase()) {
    await insertPayment(payment);
  }

  await logAdminAction({
    adminId: input.recordedByAdminId,
    adminRole: input.recordedByAdminRole ?? "community_admin",
    action: "manual_payment_recorded",
    affectedRecordType: "payment",
    affectedRecordId: payment.id,
    newValue: payment
  });

  return payment;
}

export async function recordStripeCheckoutPayment(input: {
  memberId: string;
  transactionId: string;
  eventId: string;
  amountUsd: number;
}) {
  const payment: PaymentRecord = {
    id: randomUUID(),
    memberId: input.memberId,
    provider: "stripe",
    providerTransactionId: input.transactionId,
    amountUsd: input.amountUsd,
    status: "succeeded",
    paidAt: new Date().toISOString(),
    rawEventId: input.eventId
  };

  if (shouldUseSupabase()) {
    try {
      const inserted = await insertPayment(payment);
      payments.set(inserted.id, inserted);
      return { payment: inserted, duplicate: false };
    } catch (error) {
      if (error instanceof DuplicatePaymentError) {
        return { payment, duplicate: true };
      }

      throw error;
    }
  }

  const duplicate = Array.from(payments.values()).some(
    (existing) => existing.provider === "stripe" && existing.rawEventId === input.eventId
  );

  if (!duplicate) {
    payments.set(payment.id, payment);
  }

  return { payment, duplicate };
}

export async function markPaymentRefunded(input: {
  paymentId: string;
  adminId: string;
  adminRole?: AdminRole;
  status: "refunded" | "canceled";
  notes?: string;
}) {
  const payment = shouldUseSupabase() ? await findSupabasePaymentById(input.paymentId) : payments.get(input.paymentId);

  if (!payment) {
    throw new Error("Payment not found.");
  }

  const updated: PaymentRecord = {
    ...payment,
    status: input.status,
    notes: input.notes ?? payment.notes
  };

  payments.set(updated.id, updated);

  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("payments")
      .update({
        status: updated.status,
        notes: updated.notes ?? null
      })
      .eq("id", updated.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  await logAdminAction({
    adminId: input.adminId,
    adminRole: input.adminRole ?? "community_admin",
    action: `payment_${input.status}`,
    affectedRecordType: "payment",
    affectedRecordId: updated.id,
    previousValue: payment,
    newValue: updated
  });

  return updated;
}

export async function recordFailedPayment(input: { memberId: string; provider: "stripe"; transactionId: string; amountUsd: number }) {
  const payment: PaymentRecord = {
    id: randomUUID(),
    memberId: input.memberId,
    provider: input.provider,
    providerTransactionId: input.transactionId,
    amountUsd: input.amountUsd,
    status: "failed",
    retryUrl: `${env.appUrl}/payment/retry?memberId=${encodeURIComponent(input.memberId)}`
  };

  payments.set(payment.id, payment);
  if (shouldUseSupabase()) {
    await insertPayment(payment);
  }

  return payment;
}

export async function listPayments() {
  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => fromPaymentRow(row as PaymentRow));
  }

  return Array.from(payments.values());
}

async function insertPayment(payment: PaymentRecord) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .insert(toPaymentRow(payment))
    .select("*")
    .single();

  if (error) {
    if (isDuplicatePaymentError(error.message)) {
      throw new DuplicatePaymentError(error.message);
    }

    throw new Error(error.message);
  }

  return fromPaymentRow(data as PaymentRow);
}

function toPaymentRow(payment: PaymentRecord) {
  return {
    id: payment.id,
    member_id: payment.memberId,
    provider: payment.provider,
    provider_transaction_id: payment.providerTransactionId,
    provider_event_id: payment.rawEventId ?? null,
    amount_usd: payment.amountUsd,
    status: payment.status,
    notes: payment.notes ?? null,
    recorded_by_admin_id: payment.recordedByAdminId ?? null,
    retry_url: payment.retryUrl ?? null,
    paid_at: payment.paidAt ?? null
  };
}

function fromPaymentRow(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    provider: row.provider,
    providerTransactionId: row.provider_transaction_id,
    amountUsd: Number(row.amount_usd),
    status: row.status,
    notes: row.notes ?? undefined,
    recordedByAdminId: row.recorded_by_admin_id ?? undefined,
    retryUrl: row.retry_url ?? undefined,
    paidAt: row.paid_at ?? undefined,
    rawEventId: row.provider_event_id ?? undefined
  };
}

export class DuplicatePaymentError extends Error {}

export function isDuplicatePaymentError(message: string) {
  return message.includes("payments_provider_transaction_id_key") || message.includes("payments_provider_event_id_key");
}

function shouldUseSupabase() {
  return env.dataBackend === "supabase" && isSupabaseConfigured();
}

async function findSupabasePaymentById(paymentId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromPaymentRow(data as PaymentRow) : null;
}
