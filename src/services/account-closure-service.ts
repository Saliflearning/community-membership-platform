import { randomUUID } from "crypto";
import type { AccountClosureRequest } from "@/types/domain";

const closureRequests = new Map<string, AccountClosureRequest>();

export async function createAccountClosureRequest(input: {
  email: string;
  memberId?: string;
  reason?: string;
  requestType: AccountClosureRequest["requestType"];
}) {
  const timestamp = new Date().toISOString();
  const request: AccountClosureRequest = {
    id: randomUUID(),
    ...input,
    email: input.email.toLowerCase(),
    status: "open",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  closureRequests.set(request.id, request);
  return request;
}

export async function listAccountClosureRequests() {
  return Array.from(closureRequests.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
