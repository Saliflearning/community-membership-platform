import { randomUUID } from "crypto";
import type { CardVersionRecord } from "@/types/domain";

const cardVersions = new Map<string, CardVersionRecord[]>();

export async function createCardVersion(input: Omit<CardVersionRecord, "id" | "version" | "generatedAt">) {
  const existing = cardVersions.get(input.memberId) ?? [];
  const version: CardVersionRecord = {
    id: randomUUID(),
    version: existing.length + 1,
    generatedAt: new Date().toISOString(),
    ...input
  };

  cardVersions.set(input.memberId, [version, ...existing]);
  return version;
}

export async function getLatestCardVersion(memberId: string) {
  return cardVersions.get(memberId)?.[0] ?? createCardVersion({
    memberId,
    generatedBy: "system",
    reason: "payment_activation"
  });
}
