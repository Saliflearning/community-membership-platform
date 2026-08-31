import { randomUUID } from "crypto";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Member, PhysicalCardPrintRequest } from "@/types/domain";

const printRequests = new Map<string, PhysicalCardPrintRequest>();

export async function createPhysicalCardPrintRequest(member: Member, cardVersion: number): Promise<PhysicalCardPrintRequest | null> {
  const selection = member.physicalCardRequest;

  if (!selection?.requested || selection.deliveryMethod === "digital_only") {
    return null;
  }

  const now = new Date().toISOString();
  const request: PhysicalCardPrintRequest = {
    id: randomUUID(),
    memberId: member.memberId,
    communityCode: member.communityCode,
    cardVersion,
    optionName: selection.optionName ?? "Physical membership card",
    material: selection.material ?? "standard_pvc",
    deliveryMethod: selection.deliveryMethod,
    paymentStatus: "paid",
    printStatus: "ready_to_print",
    shippingStatus: selection.deliveryMethod === "mail" ? "pending" : "not_required",
    deliveryStatus: "requested",
    createdAt: now,
    updatedAt: now
  };

  printRequests.set(request.id, request);

  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("physical_card_print_requests").insert(toRow(request));

    if (error) {
      throw new Error(error.message);
    }
  }

  return request;
}

export async function listPhysicalCardPrintRequests(communityCode?: string): Promise<PhysicalCardPrintRequest[]> {
  if (shouldUseSupabase()) {
    const supabase = createSupabaseAdminClient();
    let query = supabase.from("physical_card_print_requests").select("*").order("created_at", { ascending: false });

    if (communityCode) {
      query = query.eq("community_code", communityCode);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message.includes("physical_card_print_requests")) {
        return [];
      }

      throw new Error(error.message);
    }

    return (data ?? []).map(fromRow);
  }

  const all = Array.from(printRequests.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return communityCode ? all.filter((request) => request.communityCode === communityCode) : all;
}

function shouldUseSupabase() {
  return env.dataBackend === "supabase" && isSupabaseConfigured();
}

function toRow(request: PhysicalCardPrintRequest) {
  return {
    id: request.id,
    member_id: request.memberId,
    community_code: request.communityCode,
    card_version: request.cardVersion,
    option_name: request.optionName,
    material: request.material,
    delivery_method: request.deliveryMethod,
    payment_status: request.paymentStatus,
    print_status: request.printStatus,
    shipping_status: request.shippingStatus,
    delivery_status: request.deliveryStatus,
    created_at: request.createdAt,
    updated_at: request.updatedAt
  };
}

function fromRow(row: Record<string, string | number>): PhysicalCardPrintRequest {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    communityCode: String(row.community_code),
    cardVersion: Number(row.card_version),
    optionName: String(row.option_name),
    material: String(row.material),
    deliveryMethod: row.delivery_method as PhysicalCardPrintRequest["deliveryMethod"],
    paymentStatus: row.payment_status as PhysicalCardPrintRequest["paymentStatus"],
    printStatus: row.print_status as PhysicalCardPrintRequest["printStatus"],
    shippingStatus: row.shipping_status as PhysicalCardPrintRequest["shippingStatus"],
    deliveryStatus: row.delivery_status as PhysicalCardPrintRequest["deliveryStatus"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
